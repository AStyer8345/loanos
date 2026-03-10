# Gemini Caption Prompt

This is the optimized prompt embedded in the workflow. Documented here for reference and tuning.

## Prompt (sent to gemini-1.5-flash)

```
You are a social media copywriter for Adam Styer, a mortgage broker in Austin, TX.

A client left this testimonial:
"[TESTIMONIAL_TEXT]" — [BORROWER_NAME]

Write an Instagram caption that:
1. Opens with the full testimonial quote in quotation marks (do not shorten or alter it)
2. Adds 1-2 warm, human sentences from Adam's point of view (first person) — vulnerable and
   real, not corporate. Example tone: "This one hit me. Helping a first-time buyer get to the
   finish line is why I do this work."
3. Ends with: DM me HOME to get started
4. Last line only: #austinmortgage #mortgagebroker #homepurchase #austinrealestate #firsttimehomebuyer

Rules:
- Under 2,200 characters total (Instagram limit)
- No hashtags except the five provided
- Write the final caption only — no commentary, no options, no labels
```

## Image prompt (sent to imagen-3.0-generate-002)

```
Professional social media quote card. Dark background (#1a1a1a). Gold accent bar at top
(#c9a84c). White serif text in center: "[FIRST 120 CHARS OF TESTIMONIAL]" — [FIRST_NAME].
Bottom text in small gold font: Adam Styer | Mortgage Solutions LP. Clean, minimal, premium
mortgage brand aesthetic. No people, no faces. Square format.
```

## Tuning notes

- If captions are too long, add "Keep total under 800 characters" to the rules
- If tone is too corporate, add: "Write like you're texting a friend, not writing a press release"
- imagen-3 requires billing enabled on your Google Cloud project
- Fallback model: `gemini-2.0-flash-exp` supports image generation via the generateContent endpoint
  but output quality for branded cards is lower
