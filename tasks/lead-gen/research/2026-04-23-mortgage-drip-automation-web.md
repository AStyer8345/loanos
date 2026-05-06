# Web Research — Mortgage Drip Campaigns & Email Automation
Date: 2026-04-23
Source: https://www.mpamag.com/us/mortgage-industry/industry-trends/use-drip-campaigns-and-emarketing-to-increase-mortgage-closings/158784
Topic: Drip campaign best practices for mortgage LOs — relevant to today's drip fix shipped in LoanOS

## Summary

Mortgage-specific drip campaigns are most effective when triggered by borrower behavior and loan status events rather than calendar-based sequences. Industry data suggests Friday and Monday sends perform best because buyers search for homes on weekends and are more responsive when not at work. Personalization (merge fields for name, loan type, local market data) is table stakes — generic drip sequences see open rates under 15%, while personalized sequences can reach 35–45% for warm prospects.

The article highlights that modern platforms (like Aduvo, which connects to a LOS) trigger automated emails from changes in loan status, rate drops, and milestones — exactly the architecture LoanOS is building toward with its Vercel Cron drip runner and n8n webhook stack. CAN-SPAM compliance is emphasized: unsubscribe, physical address, and sender identification are non-negotiable in every sequence.

The LoanOS drip system shipped today (authored-emails.ts with 25 emails across 5 campaigns, hourly cron via /api/drip/run) aligns with the industry's best-practice model: status-driven triggers, authored content, and automated execution with Adam as the human touch at key milestones.

## Why It Matters for This Program

- Validates the drip architecture shipped today (cron-based, LOS-integrated, authored emails)
- Friday/Monday timing recommendation → future enhancement: drip email scheduling by day of week
- Confirms the value of authored content vs. AI-generated placeholders (now fixed with authored-emails.ts)
- Source from MPA Magazine (mortgage industry publication) → authoritative for Lead Gen notebook
