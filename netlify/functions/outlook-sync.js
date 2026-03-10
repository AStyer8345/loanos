// outlook-sync.js — fetch recent Outlook emails and log them to activity_log
// Triggered by n8n on a schedule (every 15 minutes)
// Also callable directly via GET /.netlify/functions/outlook-sync

const { getValidAccessToken } = require("./outlook-refresh");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const LOANOS_SYSTEM_USER_ID = process.env.LOANOS_SYSTEM_USER_ID;

// How far back to look for emails (in minutes)
const SYNC_WINDOW_MINUTES = parseInt(process.env.OUTLOOK_SYNC_WINDOW_MINUTES || "20", 10);

function sbHeaders() {
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
}

// ── Microsoft Graph helpers ──────────────────────────────────────────────────

/**
 * Fetch emails from a mail folder within the sync window.
 * Returns array of message objects.
 */
async function fetchEmails(accessToken, folderId = "inbox") {
  const since = new Date(Date.now() - SYNC_WINDOW_MINUTES * 60 * 1000).toISOString();
  const select = "id,internetMessageId,subject,from,toRecipients,ccRecipients,receivedDateTime,bodyPreview,body";
  const filter = encodeURIComponent(`receivedDateTime ge ${since}`);

  let url = `https://graph.microsoft.com/v1.0/me/mailFolders/${folderId}/messages` +
    `?$select=${select}&$filter=${filter}&$orderby=receivedDateTime desc&$top=50`;

  const messages = [];

  while (url) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Graph API error (${folderId}): ${res.status} ${body}`);
    }

    const data = await res.json();
    messages.push(...(data.value || []));
    url = data["@odata.nextLink"] || null;
  }

  return messages;
}

// ── Supabase helpers ─────────────────────────────────────────────────────────

/**
 * Look up a contact by email address.
 * Checks both `email` and `email_secondary` fields.
 * Returns contact row or null.
 */
async function findContactByEmail(emailAddress) {
  const encodedEmail = encodeURIComponent(emailAddress.toLowerCase());

  // Try primary email first
  let res = await fetch(
    `${SUPABASE_URL}/rest/v1/contacts?email=ilike.${encodedEmail}&limit=1`,
    { headers: sbHeaders() }
  );

  if (res.ok) {
    const rows = await res.json();
    if (rows.length > 0) return rows[0];
  }

  // Try secondary email
  res = await fetch(
    `${SUPABASE_URL}/rest/v1/contacts?email_secondary=ilike.${encodedEmail}&limit=1`,
    { headers: sbHeaders() }
  );

  if (res.ok) {
    const rows = await res.json();
    if (rows.length > 0) return rows[0];
  }

  return null;
}

/**
 * Insert an activity_log row if it doesn't already exist.
 * Deduplication is handled by the partial unique index: (type, external_id).
 * Returns true if inserted, false if duplicate.
 */
async function logEmailActivity(contact, message, direction, myEmail) {
  const from = message.from?.emailAddress?.address || "";
  const toList = (message.toRecipients || [])
    .map((r) => r.emailAddress?.address)
    .filter(Boolean)
    .join(", ");

  const summary =
    direction === "email_inbound"
      ? `Email from ${from}: ${message.subject}`
      : `Email to ${toList}: ${message.subject}`;

  const payload = {
    direction,
    from,
    to: toList,
    cc: (message.ccRecipients || [])
      .map((r) => r.emailAddress?.address)
      .filter(Boolean)
      .join(", "),
    subject: message.subject,
    preview: message.bodyPreview,
    received_at: message.receivedDateTime,
    message_id: message.internetMessageId,
  };

  const row = {
    // Legacy columns (keep for compatibility)
    action: direction,
    entity_type: "contact",
    entity_id: contact.id,
    contact_id: contact.id,
    user_id: LOANOS_SYSTEM_USER_ID,
    metadata: payload,
    // New columns
    type: direction,
    summary,
    raw_payload: { ...payload, body: message.body?.content || null },
    external_id: message.internetMessageId,
  };

  const res = await fetch(`${SUPABASE_URL}/rest/v1/activity_log`, {
    method: "POST",
    headers: {
      ...sbHeaders(),
      Prefer: "resolution=ignore-duplicates,return=minimal",
    },
    body: JSON.stringify(row),
  });

  if (!res.ok) {
    const body = await res.text();
    // 409 conflict = duplicate (already synced) — not an error
    if (res.status === 409) return false;
    throw new Error(`Failed to insert activity_log: ${res.status} ${body}`);
  }

  return res.status !== 204 || true;
}

// ── Main sync logic ──────────────────────────────────────────────────────────

async function runSync() {
  const { accessToken, email: myEmail } = await getValidAccessToken();

  console.log(`[outlook-sync] Starting sync for ${myEmail}, window: ${SYNC_WINDOW_MINUTES}min`);

  // Fetch inbox and sent items in parallel
  const [inboxMessages, sentMessages] = await Promise.all([
    fetchEmails(accessToken, "inbox"),
    fetchEmails(accessToken, "sentitems"),
  ]);

  console.log(`[outlook-sync] Fetched ${inboxMessages.length} inbox, ${sentMessages.length} sent`);

  const stats = { processed: 0, inserted: 0, skipped: 0, unmatched: 0 };

  // Process inbox (emails TO Adam from contacts)
  for (const msg of inboxMessages) {
    stats.processed++;
    const senderEmail = msg.from?.emailAddress?.address;
    if (!senderEmail) { stats.skipped++; continue; }

    const contact = await findContactByEmail(senderEmail);
    if (!contact) { stats.unmatched++; continue; }

    const inserted = await logEmailActivity(contact, msg, "email_inbound", myEmail);
    inserted ? stats.inserted++ : stats.skipped++;
  }

  // Process sent items (emails FROM Adam to contacts)
  for (const msg of sentMessages) {
    stats.processed++;
    const recipients = msg.toRecipients || [];

    // Match any recipient to a contact
    let matched = false;
    for (const recipient of recipients) {
      const recipientEmail = recipient.emailAddress?.address;
      if (!recipientEmail) continue;

      const contact = await findContactByEmail(recipientEmail);
      if (!contact) continue;

      matched = true;
      // Use the message ID + recipient email as composite external_id for sent items
      // to handle one email sent to multiple contacts
      const compositeMsg = {
        ...msg,
        internetMessageId: `${msg.internetMessageId}::${recipientEmail}`,
      };

      const inserted = await logEmailActivity(contact, compositeMsg, "email_outbound", myEmail);
      inserted ? stats.inserted++ : stats.skipped++;
    }

    if (!matched) stats.unmatched++;
  }

  console.log(`[outlook-sync] Done — ${JSON.stringify(stats)}`);
  return stats;
}

// ── Netlify handler ──────────────────────────────────────────────────────────

exports.handler = async (event) => {
  // Allow GET (manual trigger) and POST (n8n webhook trigger)
  if (!["GET", "POST"].includes(event.httpMethod)) {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // Simple shared-secret check to prevent unauthorized triggers
  const authHeader = event.headers["x-sync-secret"] || "";
  const expectedSecret = process.env.OUTLOOK_SYNC_SECRET || "";

  if (expectedSecret && authHeader !== expectedSecret) {
    return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
  }

  try {
    const stats = await runSync();
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true, stats }),
    };
  } catch (err) {
    console.error("[outlook-sync] Error:", err.message);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, error: err.message }),
    };
  }
};
