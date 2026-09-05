export const REVIEW_FIELDS = ['purchase_price', 'sales_price', 'loan_amount', 'interest_rate', 'down_payment', 'earnest_money', 'option_fee', 'seller_concessions', 'property_address', 'property_city', 'property_state', 'property_zip', 'closing_date', 'estimated_closing_date', 'sales_contract_date', 'option_expiration', 'loan_type', 'loan_purpose', 'occupancy'] as const;
export type ReviewField = typeof REVIEW_FIELDS[number];
export type Citation = {
    page: number | null;
    quote: string;
};
export type Proposal = {
    fields: {
        field: ReviewField;
        value: string | number | null;
        confidence: number | null;
        source: Citation;
    }[];
    conditions: {
        text: string;
        route: string;
        confidence: number | null;
        source: Citation;
    }[];
};
export const CONDITION_ROUTES = ['borrower', 'team', 'title', 'insurance', 'appraisal', 'loan_officer'] as const;
const object = (x: unknown): Record<string, unknown> => x && typeof x === 'object' && !Array.isArray(x) ? x as Record<string, unknown> : {};
const text = (x: unknown, max: number) => typeof x === 'string' ? x.trim().slice(0, max) : '';
const confidence = (x: unknown) => typeof x === 'number' && Number.isFinite(x) && x >= 0 && x <= 1 ? x : null;
const citation = (x: unknown): Citation => { const o = object(x); return { page: Number.isInteger(o.page) && Number(o.page) > 0 && Number(o.page) <= 1000 ? Number(o.page) : null, quote: text(o.quote, 400) }; };
export function normalizeProposal(input: unknown): Proposal {
    const raw = object(input);
    if (!Array.isArray(raw.fields) || !Array.isArray(raw.conditions))
        throw Error('Extraction must include fields and conditions arrays');
    if (raw.fields.length > 50 || raw.conditions.length > 100)
        throw Error('Extraction is too large');
    const seen = new Set<string>();
    const fields = raw.fields.map(v => { const o = object(v), field = String(o.field); if (!REVIEW_FIELDS.includes(field as ReviewField) || seen.has(field))
        throw Error('Invalid or repeated proposed field'); seen.add(field); if (o.value !== null && typeof o.value !== 'string' && !(typeof o.value === 'number' && Number.isFinite(o.value)))
        throw Error('Invalid proposed value'); return { field: field as ReviewField, value: typeof o.value === 'string' ? o.value.slice(0, 1000) : o.value as number | null, confidence: confidence(o.confidence), source: citation(o.source) }; });
    const conditions = raw.conditions.map(v => { const o = object(v); const content = text(o.text, 1500); if (!content)
        throw Error('A condition needs source text'); return { text: content, route: CONDITION_ROUTES.includes(o.route as typeof CONDITION_ROUTES[number]) ? String(o.route) : 'team', confidence: confidence(o.confidence), source: citation(o.source) }; });
    return { fields, conditions };
}
export type ConditionTask = {
    title: string;
    citation: string;
    route: string;
    owner_id: string | null;
    due_at: string | null;
};
export function parseConditionTasks(input: unknown): ConditionTask[] {
    if (!Array.isArray(input) || input.length > 50)
        throw Error('Review up to 50 conditions at a time');
    return input.map(v => {
        const o = object(v), title = text(o.title, 241), source = text(o.citation, 1001), owner = o.owner_id || null, due = o.due_at || null;
        if (title.length < 3 || title.length > 240 || source.length < 3 || source.length > 1000 || !CONDITION_ROUTES.includes(o.route as typeof CONDITION_ROUTES[number]))
            throw Error('Each condition needs a short task, route and source citation');
        if (/\b\d{3}-\d{2}-\d{4}\b/.test(title + ' ' + source))
            throw Error('Keep identity numbers out of task summaries');
        if (owner && (typeof owner !== 'string' || !/^[a-f0-9-]{36}$/i.test(owner)))
            throw Error('Invalid owner');
        if (due && (typeof due !== 'string' || !Number.isFinite(Date.parse(due))))
            throw Error('Invalid due date');
        return { title, citation: source, route: String(o.route), owner_id: owner as string | null, due_at: due ? new Date(String(due)).toISOString() : null };
    });
}
