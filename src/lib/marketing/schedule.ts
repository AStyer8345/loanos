// Shared daily marketing schedule data
// Imported by both the Marketing Hub page and the Dashboard widget

export type DayTask = { id: string; e: string; label: string; type: string; tracker?: string }
export type DayDef  = { name: string; focus: string; sub: string; tasks: DayTask[] }

export const DAYS: Record<number, DayDef> = {
  1: { name: 'Monday', focus: 'Realtor Nurture', sub: 'Newsletter · Calls · Social', tasks: [
    { id: 'm1', e: '📧', label: 'Send Realtor Newsletter (Mailchimp)',                            type: 'email',  tracker: 'realtor-nl' },
    { id: 'm2', e: '📞', label: 'Realtor call block — 3–5 relationship check-ins',                type: 'call' },
    { id: 'm3', e: '📱', label: 'Post — LinkedIn + Facebook (market insight or rate commentary)', type: 'social', tracker: 'social-post' },
    { id: 'm4', e: '🎥', label: 'Optional: Short video for realtors',                             type: 'video',  tracker: 'video' },
  ]},
  2: { name: 'Tuesday', focus: 'Lead & Past Client', sub: 'Newsletter · Past clients · Social', tasks: [
    { id: 't1', e: '📧', label: 'Send Borrower Newsletter (Mailchimp)',                           type: 'email',  tracker: 'borrower-nl' },
    { id: 't2', e: '📞', label: 'Past client call block — birthday / equity check-in',            type: 'call',   tracker: 'past-client' },
    { id: 't3', e: '📱', label: 'Post — LinkedIn + Facebook (homebuyer tip or testimonial)',      type: 'social', tracker: 'social-post' },
    { id: 't4', e: '📲', label: 'Personal check-in texts — 3–5 warm leads (see Hot Leads)',       type: 'text' },
  ]},
  3: { name: 'Wednesday', focus: 'Loans in Process', sub: 'File updates · No outbound marketing', tasks: [
    { id: 'w1', e: '📞', label: 'Borrower update call — every active file',        type: 'call',  tracker: 'in-process' },
    { id: 'w2', e: '📞', label: "Buyer's agent call — every active file",           type: 'call' },
    { id: 'w3', e: '📞', label: 'Listing agent call — every active file',           type: 'call' },
    { id: 'w4', e: '📋', label: 'Update Salesforce Last Touch on all active files', type: 'admin' },
  ]},
  4: { name: 'Thursday', focus: 'Pre-Approval Pipeline', sub: 'Pre-approvals · Re-engage · Social', tasks: [
    { id: 'h1', e: '📞', label: 'Call every active pre-approval — showings, timeline, offers',      type: 'call',   tracker: 'preapproval' },
    { id: 'h2', e: '📲', label: 'Re-engage text/email to pre-approvals not actively shopping',      type: 'text' },
    { id: 'h3', e: '📱', label: 'Post — LinkedIn + Facebook (first-time buyer or program content)', type: 'social', tracker: 'social-post' },
    { id: 'h4', e: '🎥', label: 'Optional: Video — what happens after your offer is accepted',      type: 'video',  tracker: 'video' },
  ]},
  5: { name: 'Friday', focus: 'Realtor Weekend Push', sub: 'Deal updates · Rate text · Wrap up', tasks: [
    { id: 'f1', e: '📞', label: 'Quick calls to realtors on active deals — weekend heads-up',    type: 'call',   tracker: 'realtor-calls' },
    { id: 'f2', e: '📲', label: 'Rate update text or email to top 10–15 realtor partners',        type: 'text',   tracker: 'rate-update' },
    { id: 'f3', e: '📱', label: 'Post — LinkedIn + Facebook (end of week value-add or personal)', type: 'social', tracker: 'social-post' },
    { id: 'f4', e: '📋', label: 'Log all week activity, prep for Monday',                         type: 'admin' },
  ]},
}

export const TCOLS: Record<string, string> = {
  email: '#5B8FD4', call: '#4CAF82', social: '#9B72CF',
  text: '#C9A84C', video: '#E05252', admin: '#5A5754',
}
