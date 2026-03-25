#!/bin/bash
# ============================================================
# NotebookLM Deep Research Seed Script
# Seeds all 5 agent notebooks with authoritative research sources
# Run: bash tasks/seed-notebooklm.sh
# ============================================================

NLM="/Users/adamstyer/.local/bin/notebooklm"
LOG="tasks/seed-notebooklm-log.md"
ERRORS="tasks/seed-notebooklm-errors.md"
DATE=$(date +%Y-%m-%d)

echo "# NotebookLM Seed Log — $DATE" > "$LOG"
echo "# NotebookLM Seed Errors — $DATE" > "$ERRORS"

add_source() {
  local notebook_id="$1"
  local url="$2"
  local label="$3"

  $NLM use "$notebook_id" > /dev/null 2>&1
  result=$($NLM source add "$url" --json 2>&1)
  if echo "$result" | grep -q '"error"'; then
    echo "  ❌ FAILED: $label" | tee -a "$ERRORS"
    echo "     URL: $url" >> "$ERRORS"
    echo "     Error: $result" >> "$ERRORS"
  else
    echo "  ✅ $label"
    echo "- ✅ $label — $url" >> "$LOG"
  fi
  sleep 2
}

# ============================================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "ENTERPRISE (284383e3)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "## Enterprise" >> "$LOG"
ENTERPRISE="284383e3-c395-45de-bc63-d2052809b359"

add_source "$ENTERPRISE" "https://supabase.com/docs/guides/auth/row-level-security" "Supabase RLS docs"
add_source "$ENTERPRISE" "https://supabase.com/docs/guides/database/postgres/row-level-security" "Supabase RLS — Postgres guide"
add_source "$ENTERPRISE" "https://stripe.com/docs/billing/subscriptions/overview" "Stripe Subscriptions overview"
add_source "$ENTERPRISE" "https://stripe.com/docs/billing/subscriptions/webhooks" "Stripe webhook events"
add_source "$ENTERPRISE" "https://nextjs.org/docs/app/building-your-application/routing" "Next.js App Router routing"
add_source "$ENTERPRISE" "https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations" "Next.js Server Actions"
add_source "$ENTERPRISE" "https://www.cfpb.gov/compliance/compliance-resources/mortgage-resources/" "CFPB mortgage compliance resources"
add_source "$ENTERPRISE" "https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac" "Supabase RBAC patterns"
add_source "$ENTERPRISE" "https://supabase.com/blog/multi-tenant-saas-data-isolation" "Supabase multi-tenant data isolation"
add_source "$ENTERPRISE" "https://vercel.com/docs/functions/serverless-functions" "Vercel Serverless Functions"

# ============================================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "CRM (7b40d6c2)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "## CRM" >> "$LOG"
CRM="7b40d6c2-5bed-4151-b25c-1c9e6d8ded6b"

add_source "$CRM" "https://mailchimp.com/developer/marketing/api/lists/" "Mailchimp Lists API"
add_source "$CRM" "https://mailchimp.com/developer/marketing/api/automations/" "Mailchimp Automations API"
add_source "$CRM" "https://developer.salesforce.com/docs/atlas.en-us.object_reference.meta/object_reference/sforce_api_objects_contact.htm" "Salesforce Contact object reference"
add_source "$CRM" "https://supabase.com/docs/guides/database/full-text-search" "Supabase full-text search"
add_source "$CRM" "https://www.consumerfinance.gov/rules-policy/regulations/1003/" "HMDA mortgage data reporting (Reg C)"
add_source "$CRM" "https://n8n.io/integrations/" "n8n integrations library"
add_source "$CRM" "https://mailchimp.com/developer/marketing/api/customer-journeys/" "Mailchimp Customer Journeys API"
add_source "$CRM" "https://supabase.com/docs/guides/realtime" "Supabase Realtime"
add_source "$CRM" "https://www.nar.realtor/research-and-statistics/research-reports/highlights-from-the-profile-of-home-buyers-and-sellers" "NAR buyer/seller profile research"
add_source "$CRM" "https://themortgagereports.com/category/mortgage-news" "The Mortgage Reports — industry news"

# ============================================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "SEO/SEM (7f8a80c5)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "## SEO/SEM" >> "$LOG"
SEOSEM="7f8a80c5-3ffd-442e-880a-f748365a792b"

add_source "$SEOSEM" "https://developers.google.com/search/docs/fundamentals/seo-starter-guide" "Google SEO starter guide"
add_source "$SEOSEM" "https://developers.google.com/search/docs/appearance/structured-data/local-business" "Google local business structured data"
add_source "$SEOSEM" "https://support.google.com/google-ads/answer/6146252" "Google Ads financial services policy"
add_source "$SEOSEM" "https://moz.com/local-seo-guide" "Moz local SEO guide"
add_source "$SEOSEM" "https://backlinko.com/google-ranking-factors" "Backlinko Google ranking factors"
add_source "$SEOSEM" "https://developers.google.com/search/docs/appearance/page-experience" "Google page experience signals"
add_source "$SEOSEM" "https://support.google.com/business/answer/7091" "Google Business Profile optimization"
add_source "$SEOSEM" "https://www.consumerfinance.gov/about-us/newsroom/cfpb-issues-guidance-on-mortgage-advertising/" "CFPB mortgage advertising guidance"
add_source "$SEOSEM" "https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview" "Google sitemaps guide"
add_source "$SEOSEM" "https://web.dev/performance/" "Web.dev Core Web Vitals"

# ============================================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "SOCIAL MEDIA (736e9c60)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "## Social Media" >> "$LOG"
SOCIAL="736e9c60-6cbb-4a20-8d24-f92b13606c30"

add_source "$SOCIAL" "https://www.federalreserve.gov/releases/h15/" "Fed H.15 — interest rate releases"
add_source "$SOCIAL" "https://www.consumerfinance.gov/about-us/newsroom/" "CFPB mortgage newsroom"
add_source "$SOCIAL" "https://developers.facebook.com/docs/marketing-api/reference/ad-creative/" "Facebook Ads creative reference"
add_source "$SOCIAL" "https://help.linkedin.com/app/answers/detail/a_id/527/~/financial-services-advertising-policy" "LinkedIn financial services ad policy"
add_source "$SOCIAL" "https://publer.com/blog/social-media-content-calendar/" "Publer content calendar guide"
add_source "$SOCIAL" "https://blog.hubspot.com/marketing/social-media-marketing-strategy" "HubSpot social media strategy"
add_source "$SOCIAL" "https://www.nar.realtor/research-and-statistics/research-reports/social-media-usage" "NAR social media usage report"
add_source "$SOCIAL" "https://sproutsocial.com/insights/best-times-to-post-on-social-media/" "Best times to post on social media"
add_source "$SOCIAL" "https://www.ffiec.gov/press/pdf/FFIEC_Social_Media_FinalGuidance.pdf" "FFIEC social media guidance for financial institutions"
add_source "$SOCIAL" "https://themortgagereports.com/" "The Mortgage Reports — content inspiration"

# ============================================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "LEAD GEN (4213513c)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "## Lead Gen" >> "$LOG"
LEADGEN="4213513c-22ac-45af-96c1-3365ba3477eb"

add_source "$LEADGEN" "https://mailchimp.com/developer/marketing/api/landing-pages/" "Mailchimp Landing Pages API"
add_source "$LEADGEN" "https://mailchimp.com/developer/marketing/api/automations/" "Mailchimp automation sequences"
add_source "$LEADGEN" "https://www.consumerfinance.gov/rules-policy/regulations/1026/" "TILA/Reg Z — mortgage disclosure rules"
add_source "$LEADGEN" "https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business" "CAN-SPAM compliance guide"
add_source "$LEADGEN" "https://backlinko.com/landing-page-optimization" "Landing page optimization guide"
add_source "$LEADGEN" "https://unbounce.com/landing-page-articles/what-is-a-landing-page/" "Landing page best practices"
add_source "$LEADGEN" "https://developers.google.com/search/docs/appearance/structured-data/faqpage" "FAQ structured data (for lead pages)"
add_source "$LEADGEN" "https://www.tdhca.state.tx.us/homeownership/home.htm" "Texas TDHCA homeownership programs"
add_source "$LEADGEN" "https://www.texasmortgagepros.com/" "Texas mortgage market reference"
add_source "$LEADGEN" "https://mslp.my1003app.com/513013/register" "Adam's loan application (conversion endpoint)"

# ============================================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "DONE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Log saved to: $LOG"
echo "Errors (if any): $ERRORS"
echo ""
echo "## Summary" >> "$LOG"
echo "Run complete: $(date)" >> "$LOG"
