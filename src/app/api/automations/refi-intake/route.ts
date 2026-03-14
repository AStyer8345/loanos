import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('pdf') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No PDF provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64Pdf = Buffer.from(arrayBuffer).toString('base64');

    const prompt = `You are extracting fields from a mortgage Initial Fees Worksheet. Return ONLY valid JSON with these keys:
- borrower_first_name
- borrower_last_name
- loan_amount (number, no commas or dollar signs)
- rate (number, e.g. 6.875)
- pi_payment (number, no commas or dollar signs)
- total_monthly_payment (number, no commas or dollar signs)
- cash_to_close (number, no commas or dollar signs — use the net cash to close figure)
- lock_period (string, e.g. "30 days" or "45 days")
- escrow (exactly "Waived" or "Active")

Return ONLY the JSON object. No explanation, no markdown, no code fences.`;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
    }

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'anthropic-beta': 'pdfs-2024-09-25',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 512,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'document',
                source: {
                  type: 'base64',
                  media_type: 'application/pdf',
                  data: base64Pdf,
                },
              },
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    if (!claudeRes.ok) {
      const err = await claudeRes.text();
      console.error('Claude API error:', err);
      return NextResponse.json({ error: 'Claude extraction failed', detail: err }, { status: 502 });
    }

    const claudeData = await claudeRes.json();
    const rawText = claudeData.content?.[0]?.text ?? '';

    // Parse JSON — strip markdown fences if Claude wraps anyway
    const match = rawText.match(/\{[\s\S]*\}/);
    if (!match) {
      return NextResponse.json({ error: 'Could not parse JSON from Claude response', raw: rawText }, { status: 422 });
    }

    const fields = JSON.parse(match[0]);
    return NextResponse.json({ fields });
  } catch (err) {
    console.error('refi-intake extraction error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
