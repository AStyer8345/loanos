# Google Sheets — Testimonials Template

## Tab name: `Testimonials`

## Column headers (Row 1)

| Column | Header | Notes |
|--------|--------|-------|
| A | `id` | Unique row ID — use sequential numbers: 1, 2, 3... |
| B | `borrower_name` | Full name, e.g. "Sarah Johnson" |
| C | `testimonial_text` | Full testimonial quote — copy verbatim from Google/Zillow |
| D | `source` | `Google` or `Zillow` |
| E | `date` | Date received — YYYY-MM-DD format |
| F | `used` | `FALSE` when new, `TRUE` after posted — n8n updates this automatically |

## Sample rows

| id | borrower_name | testimonial_text | source | date | used |
|----|--------------|-----------------|--------|------|------|
| 1 | Sarah Johnson | Adam made the entire process seamless. As a first-time buyer I was terrified, but he walked me through every step and got us a rate I didn't think was possible. Couldn't recommend him more. | Google | 2025-11-14 | FALSE |
| 2 | Marcus & Tiffany Webb | We've worked with three loan officers over the years and Adam is in a different class. Responsive, honest, no surprises at closing. We'll never use anyone else. | Zillow | 2025-12-02 | FALSE |
| 3 | Derek Holman | Closed in 21 days on a competitive offer. Adam locked a great rate and kept us calm the whole time. He genuinely cares about his clients. | Google | 2026-01-18 | FALSE |

## Notes

- Add new testimonials manually after receiving them on Google or Zillow
- Never edit the `used` column manually — n8n manages it
- Keep `id` values unique and sequential
- Longer testimonials generate better captions — don't truncate when entering
- Sheet ID goes in the `TESTIMONIALS_SHEET_ID` env var in n8n
