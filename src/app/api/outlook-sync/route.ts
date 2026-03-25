// src/app/api/outlook-sync/route.ts
// Fetch recent Outlook emails and log them to activity_log
// Triggered by n8n on a schedule (every 15 minutes)

import { NextRequest, NextResponse } from 'next/server';
import { getValidAccessToken } from '@/lib/outlook/refresh';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const LOANOS_SYSTEM_USER_ID = process.env.LOANOS_SYSTEM_USER_ID!;
const SYNC_WINDOW_MINUTES = parseInt(process.env.OUTLOOK_SYNC_WINDOW_MINUTES || '20', 10);

// Domains whose emails should be silently dropped — never logged, never shown in inbox review.
// Uses suffix matching so subdomains like mail.zillow.com are also caught.
const BLOCKED_SENDER_DOMAINS = [
  'zillow.com',
  'zillowgroup.com',
  'realtor.com',
  'marketinganimals.com',
  'themarketinganimals.com',
];

// Prefix patterns to block (noreply, automated mailers, etc.)
const BLOCKED_SENDER_PREFIXES = [
  'noreply@', 'no-reply@', 'donotreply@', 'do-not-reply@',
  'mailer-daemon@', 'instant-updates@',
];

function isSenderBlocked(email: string): boolean {
  const lower = email.toLowerCase();
  if (BLOCKED_SENDER_PREFIXES.some(p => lower.startsWith(p))) return true;
  const domain = lower.split('@')[1] ?? '';
  return BLOCKED_SENDER_DOMAINS.some(d => domain === d || domain.endsWith('.' + d));
}

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

// Find the most recent active loan for a contact, or by subject-line matching
async function findLoanForContact(contactId: string | null, subject: string | null) {
  // 1. If we have a contact, find their most recent active loan
  if (contactId) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/loans?contact_id=eq.${contactId}&order=updated_at.desc&limit=1`,
      { headers: sbHeaders() }
    );
    if (res.ok) {
      const rows = await res.json();
      if (rows.length > 0) return rows[0].id as string;
    }
  }

  // 2. Try matching by subject line — extract address or borrower name
  if (subject) {
    const subj = String(subject);

    // Try to find a property address pattern (e.g. "1234 Main St" or "1234 Elm")
    const addrMatch = subj.match(/\b(\d{2,5}\s+[A-Z][a-z]+(?:\s+(?:St|Ave|Dr|Rd|Blvd|Ln|Way|Ct|Cir|Pl|Trail|Trl|Loop|Run|Pass|Pkwy|Pike|Bend))?)\b/);
    if (addrMatch) {
      const addr = addrMatch[1].replace(/'/g, "''");
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/loans?property_address=ilike.*${encodeURIComponent(addr)}*&order=updated_at.desc&limit=1`,
        { headers: sbHeaders() }
      );
      if (res.ok) {
        const rows = await res.json();
        if (rows.length > 0) return rows[0].id as string;
      }
    }

    // Try borrower name matching — extract potential names (filter out mortgage/email vocabulary)
    const skipWords = new Set([
      // Email prefixes
      're', 'fw', 'fwd', 'external',
      // Common email/subject words
      'email', 'message', 'notification', 'reminder', 'alert', 'confirmation',
      'verification', 'request', 'response', 'reply', 'sent', 'received',
      'updated', 'assigned', 'ready', 'pick', 'new', 'your', 'the', 'for',
      'and', 'from', 'with', 'are', 'has', 'was', 'been', 'will', 'can',
      // Mortgage/loan vocabulary
      'loan', 'disclosure', 'document', 'documents', 'appraisal', 'title',
      'closing', 'close', 'funding', 'funded', 'escrow', 'underwriting',
      'approval', 'approved', 'application', 'update', 'status', 'review',
      'signing', 'appointment', 'refi', 'refinance', 'refinancing',
      'preliminary', 'prelim', 'compliance', 'hold', 'final', 'clear',
      'conditions', 'condition', 'submit', 'submission', 'submitted',
      'mortgage', 'rate', 'lock', 'locked', 'tasks', 'task', 'need',
      'attention', 'steps', 'next', 'analysis', 'call', 'summary',
      'touchbase', 'officer', 'assistant',
    ]);
    const words = subj.replace(/[^a-zA-Z\s]/g, '').split(/\s+/).filter(w => w.length > 2 && !skipWords.has(w.toLowerCase()));
    for (const word of words) {
      if (word[0] === word[0].toUpperCase()) {
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/loans?or=(borrower_last_name.ilike.*${encodeURIComponent(word)}*,borrower_name.ilike.*${encodeURIComponent(word)}*,loan_name.ilike.*${encodeURIComponent(word)}*)&order=updated_at.desc&limit=1`,
          { headers: sbHeaders() }
        );
        if (res.ok) {
          const rows = await res.json();
          if (rows.length > 0) return rows[0].id as string;
        }
      }
    }

    // Try matching by loan number (7+ digit sequences in subject)
    const loanNumMatch = subj.match(/\b(\d{7,})\b/);
    if (loanNumMatch) {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/loans?loan_name=ilike.*${encodeURIComponent(loanNumMatch[1])}*&order=updated_at.desc&limit=1`,
        { headers: sbHeaders() }
      );
      if (res.ok) {
        const rows = await res.json();
        if (rows.length > 0) return rows[0].id as string;
      }
    }
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

  // Auto-link to loan via contact's active loans or subject-line matching
  const loanId = await findLoanForContact(
    contact.id as string,
    message.subject as string | null
  );

  const row = {
    action: direction,
    entity_type: 'contact',
    entity_id: contact.id,
    contact_id: contact.id,
    loan_id: loanId ?? null,
    user_id: LOANOS_SYSTEM_USER_ID,
    organization_id: contact.organization_id ?? null,
    metadata: { ...payload, activity_type: 'email' },
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

    // Drop emails from blocked domains/prefixes (Zillow, realtor.com, marketing lists, etc.)
    if (isSenderBlocked(senderEmail)) { stats.skipped++; continue; }

    const contact = await findContactByEmail(senderEmail);
    if (!contact) {
      // Try subject-line matching to a loan even without a contact match
      const loanId = await findLoanForContact(null, msg.subject as string | null);
      if (loanId) {
        // We found a loan — log with loan_id but no contact_id
        const from = senderEmail;
        const fromName = (msg.from as Record<string, Record<string, string>>)?.emailAddress?.name || '';
        await fetch(`${SUPABASE_URL}/rest/v1/activity_log`, {
          method: 'POST',
          headers: { ...sbHeaders(), Prefer: 'resolution=ignore-duplicates,return=minimal' },
          body: JSON.stringify({
            action: 'email_inbound', type: 'email_inbound', entity_type: 'email',
            loan_id: loanId, user_id: LOANOS_SYSTEM_USER_ID,
            summary: `Email from ${fromName || from}: ${msg.subject}`,
            from_address: from, subject: msg.subject,
            body_snippet: (msg.bodyPreview as string) || null,
            occurred_at: msg.receivedDateTime,
            external_id: msg.internetMessageId,
            metadata: { from, from_name: fromName, subject: msg.subject, preview: msg.bodyPreview, received_at: msg.receivedDateTime, activity_type: 'email' },
          }),
        });
        stats.inserted++;
        continue;
      }
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
