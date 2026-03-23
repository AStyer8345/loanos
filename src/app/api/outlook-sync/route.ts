// src/app/api/outlook-sync/route.ts
// Fetch recent Outlook emails and log them to activity_log
// Triggered by n8n on a schedule (every 15 minutes)

import { NextRequest, NextResponse } from 'next/server';
import { getValidAccessToken } from '@/lib/outlook/refresh';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const LOANOS_SYSTEM_USER_ID = process.env.LOANOS_SYSTEM_USER_ID!;
const SYNC_WINDOW_MINUTES = parseInt(process.env.OUTLOOK_SYNC_WINDOW_MINUTES || '20', 10);

function sbHeaders() {
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  };
}

async function fetchEmails(accessToken: string, folderId = 'inbox') {
  const since = new Date(Date.now() - SYNC_WINDOW_MINUTES * 60 * 1000).toISOString();
  const select =
    'id,internetMessageId,subject,from,toRecipients,ccRecipients,receivedDateTime,bodyPreview,body';
  const filter = encodeURIComponent(`receivedDateTime ge ${since}`);

  let url =
    `https://graph.microsoft.com/v1.0/me/mailFolders/${folderId}/messages` +
    `?$select=${select}&$filter=${filter}&$orderby=receivedDateTime desc&$top=50`;

  const messages: unknown[] = [];

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
    url = data['@odata.nextLink'] || null;
  }

  return messages as Record<string, unknown>[];
}

async function findContactByEmail(emailAddress: string) {
  const encoded = encodeURIComponent(emailAddress.toLowerCase());

  let res = await fetch(
    `${SUPABASE_URL}/rest/v1/contacts?email=ilike.${encoded}&limit=1`,
    { headers: sbHeaders() }
  );
  if (res.ok) {
    const rows = await res.json();
    if (rows.length > 0) return rows[0];
  }

  res = await fetch(
    `${SUPABASE_URL}/rest/v1/contacts?email_secondary=ilike.${encoded}&limit=1`,
    { headers: sbHeaders() }
  );
  if (res.ok) {
    const rows = await res.json();
    if (rows.length > 0) return rows[0];
  }

  return null;
}

async function logEmailActivity(
  contact: Record<string, unknown>,
  message: Record<string, unknown>,
  direction: string
) {
  const from = (message.from as Record<string, Record<string, string>>)?.emailAddress?.address || '';
  const toList = ((message.toRecipients as Record<string, Record<string, string>>[]) || [])
    .map((r) => r.emailAddress?.address)
    .filter(Boolean)
    .join(', ');

  const summary =
    direction === 'email_inbound'
      ? `Email from ${from}: ${message.subject}`
      : `Email to ${toList}: ${message.subject}`;

  const payload = {
    direction,
    from,
    to: toList,
    cc: ((message.ccRecipients as Record<string, Record<string, string>>[]) || [])
      .map((r) => r.emailAddress?.address)
      .filter(Boolean)
      .join(', '),
    subject: message.subject,
    preview: message.bodyPreview,
    received_at: message.receivedDateTime,
    message_id: message.internetMessageId,
  };

  const row = {
    action: direction,
    entity_type: 'contact',
    entity_id: contact.id,
    contact_id: contact.id,
    user_id: LOANOS_SYSTEM_USER_ID,
    organization_id: contact.organization_id ?? null,
    metadata: payload,
    type: direction,
    summary,
    raw_payload: { ...payload, body: (message.body as Record<string, string>)?.content || null },
    external_id: message.internetMessageId,
    // Dedicated columns for Inbox Review queries
    from_address: from,
    subject: message.subject,
    body_snippet: (message.bodyPreview as string) || null,
    occurred_at: message.receivedDateTime,
  };

  const res = await fetch(`${SUPABASE_URL}/rest/v1/activity_log`, {
    method: 'POST',
    headers: {
      ...sbHeaders(),
      Prefer: 'resolution=ignore-duplicates,return=minimal',
    },
    body: JSON.stringify(row),
  });

  if (!res.ok) {
    const body = await res.text();
    if (res.status === 409) return false;
    throw new Error(`Failed to insert activity_log: ${res.status} ${body}`);
  }

  return true;
}

async function logUnmatchedEmail(message: Record<string, unknown>) {
  const from = (message.from as Record<string, Record<string, string>>)?.emailAddress?.address || '';
  const fromName = (message.from as Record<string, Record<string, string>>)?.emailAddress?.name || '';

  const row = {
    action: 'email_inbound',
    type: 'email_inbound',
    entity_type: 'email',
    user_id: LOANOS_SYSTEM_USER_ID,
    summary: `Email from ${fromName || from}: ${message.subject}`,
    from_address: from,
    subject: message.subject,
    body_snippet: (message.bodyPreview as string) || null,
    occurred_at: message.receivedDateTime,
    external_id: message.internetMessageId,
    metadata: {
      from,
      from_name: fromName,
      subject: message.subject,
      preview: message.bodyPreview,
      received_at: message.receivedDateTime,
      message_id: message.internetMessageId,
    },
    raw_payload: {
      from,
      subject: message.subject,
      preview: message.bodyPreview,
      body: (message.body as Record<string, string>)?.content || null,
    },
  };

  const res = await fetch(`${SUPABASE_URL}/rest/v1/activity_log`, {
    method: 'POST',
    headers: {
      ...sbHeaders(),
      Prefer: 'resolution=ignore-duplicates,return=minimal',
    },
    body: JSON.stringify(row),
  });

  if (!res.ok) {
    const body = await res.text();
    if (res.status === 409) return false;
    throw new Error(`Failed to insert unmatched email: ${res.status} ${body}`);
  }

  return true;
}

async function runSync() {
  const { accessToken } = await getValidAccessToken();

  const [inboxMessages, sentMessages] = await Promise.all([
    fetchEmails(accessToken, 'inbox'),
    fetchEmails(accessToken, 'sentitems'),
  ]);

  const stats = { processed: 0, inserted: 0, skipped: 0, unmatched: 0 };

  for (const msg of inboxMessages) {
    stats.processed++;
    const senderEmail = (msg.from as Record<string, Record<string, string>>)?.emailAddress?.address;
    if (!senderEmail) { stats.skipped++; continue; }

    const contact = await findContactByEmail(senderEmail);
    if (!contact) {
      stats.unmatched++;
      await logUnmatchedEmail(msg);
      continue;
    }

    const inserted = await logEmailActivity(contact, msg, 'email_inbound');
    if (inserted) { stats.inserted++; } else { stats.skipped++; }
  }

  for (const msg of sentMessages) {
    stats.processed++;
    const recipients = (msg.toRecipients as Record<string, Record<string, string>>[]) || [];
    let matched = false;

    for (const recipient of recipients) {
      const recipientEmail = recipient.emailAddress?.address;
      if (!recipientEmail) continue;

      const contact = await findContactByEmail(recipientEmail);
      if (!contact) continue;

      matched = true;
      const compositeMsg = {
        ...msg,
        internetMessageId: `${msg.internetMessageId}::${recipientEmail}`,
      };

      const inserted = await logEmailActivity(contact, compositeMsg, 'email_outbound');
      if (inserted) { stats.inserted++; } else { stats.skipped++; }
    }

    if (!matched) stats.unmatched++;
  }

  return stats;
}

export async function GET(request: NextRequest) {
  return handleRequest(request);
}

export async function POST(request: NextRequest) {
  return handleRequest(request);
}

async function handleRequest(request: NextRequest) {
  const authHeader = request.headers.get('x-sync-secret') || '';
  const expectedSecret = process.env.OUTLOOK_SYNC_SECRET || '';

  if (expectedSecret && authHeader !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const stats = await runSync();
    return NextResponse.json({ ok: true, stats });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[outlook-sync] Error:', msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
