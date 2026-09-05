import { NextResponse } from 'next/server';
import { operationalContext } from '@/lib/operations/server';
import { collectPages } from '@/lib/command-center-pages';
import { decryptInquiry, type CipherPayload } from '@/lib/intake/inquiry';
import { intakeDb } from '@/lib/intake/server';
export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store' };
export async function GET(req: Request) {
    let ctx: Awaited<ReturnType<typeof operationalContext>>;
    try {
        ctx = await operationalContext(req);
    }
    catch {
        return NextResponse.json({ error: 'Sign in to your LoanOS account.' }, { status: 401, headers });
    }
    const fields: Record<string, [
        string,
        string,
        string?
    ]> = {
        ariveFacts: ['arive_loan_facts', 'arive_loan_id,source_updated_at,checked_at,status,status_date,loan_amount,base_loan_amount,financed_fees,product,purpose,archived,borrower_name,borrower_email,borrower_phone,co_borrower_name,co_borrower_email','arive_loan_id'],
        members: ['profiles', 'id,full_name,email,role'], contacts: ['contacts', 'id,first_name,last_name,email,phone,stage,lead_source,source_page,operational_owner_id,notes,referred_by,referral_type,referred_by_contact_id,referral_source_notes'],
        loans: ['loans', 'id,contact_id,borrower_first_name,borrower_last_name,loan_name,loan_number,arive_loan_id,status,loan_amount,loan_type,loan_purpose,loan_program,estimated_closing_date,closing_date,rate_lock_expiration,operational_owner_id,processor_name,processor_email,synced_at'],
        inquiries: ['inquiries', 'id,contact_id,owner_id,task_id,received_at,source,source_page,referral_partner,purpose,form_name,legitimacy,is_test,match_state,review_reason,parent_inquiry_id,provenance,first_touch'],
        tasks: ['todo_items', 'id,title,text,description,status,is_complete,assigned_to,related_contact_id,related_loan_id,priority,due_at,snoozed_until,follow_up_reason,source,source_key,created_at'],
        milestones: ['opportunity_milestones', 'id,inquiry_id,contact_id,loan_id,milestone,occurred_at,recorded_at,source,source_event_id,source_url,evidence,voided_at,supersedes_id,outcome_reason'],
        compensation: ['loan_compensation', 'loan_id,gross_source,gross_comp,net_comp,payout_status', 'loan_id'],
        preferences: ['lead_desk_preferences', 'id,legacy_key,contact_id,inquiry_id,status,notes,priority_follow_up,amount_note,product_note,hidden,source_updated_at,updated_at,match_state,provenance,reporting_source,referral_name,next_action'],
        activity: ['activity_log', 'id,contact_id,loan_id,type,action,occurred_at,summary,external_id'],
        outbound: ['communication_events', 'id,contact_id,occurred_at,event_key,source,match_state'],
        health: ['communication_source_health', 'source,status,last_success_at,last_event_at,last_attempt_at,detail,inbound,outbound', 'source'],
        delivery: ['inquiry_outbox', 'id,inquiry_id,kind,status,attempts,created_at,accepted_at,delivered_at,last_error'],
        links: ['inquiry_loan_links', 'id,inquiry_id,loan_id,reviewed_at,evidence'],
    };
    try {
        const pairs = await Promise.all(Object.entries(fields).map(async ([key, [table, columns, order]]) => [key, await collectPages(async (from, to) => { const r = await ctx.db.from(table).select(columns).eq('organization_id', ctx.organizationId).order(order || 'id').range(from, to); return { data: r.data, error: r.error }; })]));
        const snapshot = Object.fromEntries(pairs);
        snapshot.activity = [...snapshot.activity, ...snapshot.outbound.filter((r: {contact_id:string|null}) => r.contact_id).map((r: {id:string;contact_id:string;occurred_at:string;event_key:string}) => ({id:r.id,contact_id:r.contact_id,loan_id:null,type:'email_outbound_metadata',action:'Outbound email recorded; authorship unverified',occurred_at:r.occurred_at,summary:null,external_id:r.event_key}))];
        delete snapshot.outbound;
        snapshot.health = snapshot.health.map((h: {source:string;status:string;last_success_at:string|null;last_attempt_at:string|null;detail:string|null}) => {
            if(h.source !== 'thestyerteam_outbound' || !h.last_attempt_at) return h;
            const lag = Date.now() - Date.parse(h.last_success_at || h.last_attempt_at);
            return lag > 90*60*1000 ? {...h,status:'partial',detail:'Sent-mail reconciliation has no verified completed window within 90 minutes. Its saved cursor remains available for recovery. '+(h.detail||'')} : h;
        });
        // Ciphertext is intentionally not selectable by browser roles. First
        // establish the authorized inquiry IDs through RLS, then read only
        // those payloads on the server with an explicit organization filter.
        const payloads = new Map<string, CipherPayload>();
        for (let offset = 0; offset < snapshot.inquiries.length; offset += 500) {
            const ids = snapshot.inquiries.slice(offset, offset + 500).map((r: { id: string }) => r.id);
            const { data, error } = await intakeDb().from('inquiries')
                .select('id,payload_cipher').eq('organization_id', ctx.organizationId).in('id', ids);
            if (error || !data || data.length !== ids.length) throw new Error('Inquiry identities unavailable');
            for (const r of data) payloads.set(r.id, r.payload_cipher as CipherPayload);
        }
        snapshot.inquiries = snapshot.inquiries.map((record: Record<string, unknown>) => {
            const safe = record;
            // Return only contact identity needed to review an unmatched submission.
            // Financial questionnaire answers and ciphertext never enter the client snapshot.
            let identity: Record<string, unknown> = {};
            try {
                identity = decryptInquiry(payloads.get(String(record.id))!);
            }
            catch { /* explicit unknown identity */ }
            const string = (v: unknown) => typeof v === 'string' ? v.slice(0, 254) : '';
            return { ...safe, selfReportedSource: string(identity.referral_source), displayName: string(identity.name || identity.original_name) || [identity.first_name, identity.last_name].filter(Boolean).map(string).join(' '), email: string(identity.email || identity.original_email), phone: string(identity.phone || identity.original_phone) };
        });
        return NextResponse.json({ asOf: new Date().toISOString(), viewerId: ctx.userId, organizationId: ctx.organizationId, ...snapshot }, { headers });
    }
    catch {
        return NextResponse.json({ error: 'The complete operational record could not be loaded. No partial totals are shown.' }, { status: 503, headers });
    }
}
