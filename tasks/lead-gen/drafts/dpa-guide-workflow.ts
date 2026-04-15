import { workflow, node, trigger, expr } from '@n8n/workflow-sdk';

const FOOTER = '\n\n—\nAdam Styer | NMLS #513013\nAdam Styer | Mortgage Solutions LP\n(512) 956-6010 | styermortgage.com\n5900 Balcones Drive Suite 100 | Austin, TX 78731\n\nYou\'re receiving this because you downloaded the Austin DPA Guide at styermortgage.com.\nUnsubscribe: {{RESEND_UNSUBSCRIBE_URL}}\nEqual Housing Lender. Not an offer to lend. All loans subject to credit approval. DPA program details are subject to change — verify current terms with program administrators.';

const PDF_URL = 'https://styermortgage.com/austin-dpa-guide.pdf';

const EMAIL1 = 'Hi [First Name],\n\nYour guide is attached — but before you dig in, I want to flag the single most important thing in it.\n\nMost Austin first-time buyers are sitting on the sideline waiting until they have 20% saved. That\'s $80,000+ on a $400K home. It could take years.\n\nHere\'s what most of them don\'t know: there are programs that give eligible Austin buyers up to 5% of the purchase price as a grant. No repayment. No second mortgage payment. A true gift toward your down payment.\n\nOn a $350,000 home, that\'s $17,500 you didn\'t have to save.\n\nThe guide breaks down every major program available in Austin right now, who qualifies, and exactly how the money works.\n\nRead pages 1–3 first — that\'s the program overview and the "Do I Qualify?" checklist.\n\nDownload the Austin DPA Guide: ' + PDF_URL + '\n\nOne question for you: Are you already working with a real estate agent, or are you still in the research phase? Just reply — I read every message.\n\nAdam' + FOOTER;

const EMAIL2 = 'Hi [First Name],\n\nMost buyers believe they need 20% down before they can buy a home. I hear it constantly.\n\nIt\'s wrong — and it\'s costing people years.\n\nNAR data shows 73% of first-time buyers put down 15% or less. The typical first-time buyer puts down 6–9%. FHA requires just 3.5%. Conventional loans start at 3%.\n\nAnd with down payment assistance? Some Austin buyers close with $3,000–$5,000 out of pocket total.\n\nThe 20% myth exists because it was true decades ago and because the internet keeps repeating it. The mortgage market moved on. The myth didn\'t.\n\nHere\'s what matters for Austin in 2026:\n\nThe TSAHC Home Sweet Texas program — the one I lead with in your guide — allows household incomes up to $167,250 in Travis County. That covers the majority of Austin households. And the assistance is a grant. Not a loan. Not a deferred second mortgage. A grant.\n\nEligible buyers can receive up to 5% of their purchase price. On a $400,000 home, that\'s $20,000 you don\'t have to save.\n\nIf you haven\'t looked at the "Do I Qualify?" checklist in the guide yet — now\'s the time.\n\nGet the guide again: ' + PDF_URL + '\n\nAdam' + FOOTER;

const EMAIL3 = 'Hi [First Name],\n\nA lot of buyers assume DPA programs come with a catch: a second mortgage payment on top of your regular payment, making the whole thing unaffordable.\n\nThat\'s not how Texas DPA works.\n\nHere\'s what\'s actually available right now:\n\nTSAHC Home Sweet Texas (the one I recommend most):\nYou choose a grant or a forgivable second lien. If you take the grant — it\'s yours. No repayment. No lien. Gone. On a $350,000 home, you\'re looking at up to $17,500 as a gift.\n\nTDHCA My First Texas Home:\nA 0% interest second mortgage with no monthly payment. It\'s deferred — nothing due until you sell or refinance. Most buyers stay in their home long enough that it essentially disappears.\n\nTravis County Hill Country DPA:\n4–6% of the purchase price, forgiven after 10 years. No payment required during that time.\n\nThe only real "catch" with forgivable programs: if you sell or refinance before the forgiveness period ends, you may owe back a portion. But if you stay in the home — which most buyers do — it costs you nothing.\n\nNone of these programs add a monthly payment.\n\nIf you want to see how the numbers would work for your specific purchase price, reply with your approximate target home price and I\'ll run it for you.\n\nAdam' + FOOTER;

const EMAIL4 = 'Hi [First Name],\n\nI want to tell you about a buyer I helped close last year — I\'ll call her Sarah.\n\nShe was renting in South Austin. Her household income was around $88,000. She had $18,000 saved and thought she needed at least $40,000 before she could buy.\n\nShe was wrong.\n\nWe ran her through the TSAHC Home Sweet Texas program. She qualified for a 5% grant — $16,750 on a $335,000 home. We paired it with a conventional loan and seller concessions for closing costs.\n\nHer total cash out of pocket at closing: $4,100.\n\nShe\'s been in her home for 18 months. No second payment. No repayment on the grant. She owns a home she thought was 3+ years away.\n\nSarah is not unusual. Eligible buyers at her income level are exactly who TSAHC was designed for — working households who earn too much for deep-subsidy programs but not enough to save 10–20% in Austin\'s market.\n\nIf her income and situation sounds close to yours, there\'s a real chance you qualify too.\n\nWhen you\'re ready to find out — that\'s what the next step looks like: a quick 15-minute call where I pull your scenario and we run the actual numbers.\n\nNo credit pull. No obligation. Just your numbers.\n\nBook a free 15-minute call: https://calendly.com/adamstyer/15minutes\n\nAdam' + FOOTER;

const EMAIL5 = 'Hi [First Name],\n\nI get this question a lot: "My credit isn\'t perfect. Will I still qualify?"\n\nFor most Texas DPA programs, the minimum is lower than you probably think.\n\nHere\'s the breakdown:\n\nTSAHC Home Sweet Texas: 620 minimum FICO score\nTDHCA My First Texas Home: 620 minimum (participating lenders typically require 640)\nTravis County Hill Country DPA: 640 minimum\n\nIf your score is 620–680, you\'re in the FHA sweet spot. FHA + DPA is one of the most powerful combinations available for first-time buyers. The rate is slightly higher than conventional, but the lower down payment and grant mean your total cash out of pocket is dramatically lower.\n\nIf your score is above 680, you may qualify for conventional financing paired with DPA — which eliminates FHA\'s mortgage insurance premium and often results in a lower monthly payment.\n\nIf your score is below 620, that doesn\'t close the door forever. It means we spend 3–6 months getting it there first. I\'ve helped buyers do exactly that.\n\nTake 60 seconds and run through these 3 self-qualification questions:\n\n1. Is your credit score 620 or above? (Check Credit Karma — it\'s free)\n2. Is your household income below $167,250?\n3. Have you owned a home in the last 3 years?\n\nIf you answered yes, yes, no — you\'re in range.\n\nReply and tell me where you landed. I\'ll point you to the right program.\n\nAdam' + FOOTER;

const EMAIL6 = 'Hi [First Name],\n\nQuick market update — because a lot of buyers I talk to are still mentally stuck in 2021.\n\nAustin\'s housing market has changed significantly since the peak.\n\nThe metro median sale price dropped from $550,000+ at the 2022 peak to around $412,000–$430,000 in early 2026. Inventory is up. Days on market are longer. Sellers are negotiating again.\n\nThat matters for first-time buyers for two reasons:\n\nReason 1: Prices are lower than they were — which means your down payment assistance goes further. A 5% grant on a $415,000 home is $20,750. On a $550,000 home, the math and eligibility get harder.\n\nReason 2: You can negotiate. In 2021, buyers were waiving inspections and paying $100K over asking. Today, you can ask for seller concessions toward closing costs — which reduces your out-of-pocket even further when stacked with DPA.\n\nWe\'re not in a buyer\'s market. But we\'re closer to one than any time since 2019.\n\nThe buyers who waited for "the crash" mostly got left behind. The buyers who understood their numbers and moved when they qualified — they\'re building equity.\n\nIf you\'ve been watching and waiting, this is worth a real conversation.\n\nBook a 15-minute call: https://calendly.com/adamstyer/15minutes\n\nNo pressure. Just numbers.\n\nAdam' + FOOTER;

const EMAIL7 = 'Hi [First Name],\n\nA lot of people put off getting pre-approved because they don\'t know what they\'re walking into.\n\nHere\'s the entire process, start to finish:\n\nStep 1 — 15-minute application\nYou fill out a short form online. Basic info: income, employment, assets, the type of home you\'re looking for. No documents yet — just numbers.\n\nApply here: https://mslp.my1003app.com/513013/register\n\nStep 2 — Soft credit pull (no score impact)\nI pull a soft inquiry first to review your credit profile. Your score does not change.\n\nStep 3 — I run your DPA eligibility\nOnce I have your numbers, I check every program you qualify for — TSAHC, TDHCA, Travis County, City of Austin if applicable — and show you exactly what each program means for your monthly payment and cash to close.\n\nStep 4 — You get a real pre-approval letter\nIf you qualify, you get a pre-approval letter for your specific purchase price and loan type. Takes 24–48 hours after your application.\n\nThat\'s it. No obligation. No cost. No sales pitch at the end.\n\nThe pre-approval doesn\'t lock you in. It just tells you exactly where you stand — which means when the right house comes up, you can move fast.\n\nIf you have a question before you start, just reply. I\'m here.\n\nAdam' + FOOTER;

const EMAIL8 = 'Hi [First Name],\n\nYou downloaded the Austin DPA guide about 7 weeks ago.\n\nI want to ask you a direct question: what\'s keeping you from taking the next step?\n\nIf it\'s "I\'m not sure I qualify" — that\'s exactly what the call is for.\nIf it\'s "I don\'t feel financially ready" — I\'ll tell you honestly whether you are or not.\nIf it\'s "I\'m not in a rush" — fair. But Austin inventory doesn\'t stay put, and DPA programs are funded on a first-come basis.\n\nHere\'s what I\'m offering: one free 15-minute call. I\'ll look at your income, credit range, and purchase price target. I\'ll tell you which programs you likely qualify for, how much assistance you\'d receive, and what your monthly payment would look like.\n\nNo credit pull. No commitment. No sales pressure.\n\nIf the numbers work, great — we move forward together. If they don\'t work yet, I\'ll tell you what to do differently and when to come back.\n\nEither way, you stop guessing.\n\nBook your free 15-minute call: https://calendly.com/adamstyer/15minutes\nOr apply directly: https://mslp.my1003app.com/513013/register\n\nIf neither of those fits, just reply to this email. We\'ll figure it out.\n\nAdam' + FOOTER;

const SUBJ1 = 'Your Austin DPA guide is here (read this first)';
const SUBJ2 = "The myth that's kept Austin buyers renting for years";
const SUBJ3 = "DPA is not a second payment. Here's what it actually is.";
const SUBJ4 = 'How a buyer closed their Austin home with $4,100 out of pocket';
const SUBJ5 = "Does your credit score qualify for DPA? (Here's the threshold)";
const SUBJ6 = "What's changed in Austin's market (and why FTBs are moving)";
const SUBJ7 = "It takes 15 minutes. Here's exactly what happens when you get pre-approved.";
const SUBJ8 = "Still renting? Let's run your actual numbers for free.";

const HDR = '={{ JSON.stringify({ from: \'Adam Styer <adam@mail.thestyerteam.com>\', reply_to: \'adam@thestyerteam.com\', to: [$(\'Normalize Lead\').item.json.email], subject: ';
const MID = ', text: ';
const TAIL = ".split('[First Name]').join($('Normalize Lead').item.json.first_name || 'there') }) }}";

const RESEND_URL = 'https://api.resend.com/emails';

const webhook = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'DPA Nurture Webhook',
    parameters: { httpMethod: 'POST', path: 'dpa-nurture' },
    position: [100, 300],
  },
  output: [{ body: { first_name: 'Test', last_name: 'User', email: 'test@example.com' } }],
});

const normalize = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Normalize Lead',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: "const body = $('DPA Nurture Webhook').first().json.body || {};\nreturn [{ json: {\n  first_name: body.first_name || 'there',\n  last_name: body.last_name || '',\n  email: body.email || '',\n  phone: body.phone || '',\n  submitted_at: new Date().toISOString(),\n} }];",
    },
    position: [300, 300],
  },
  output: [{ first_name: 'Test', email: 'test@example.com' }],
});

const email1 = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Email 1 — Day 0 Guide Delivery',
    parameters: {
      method: 'POST',
      url: RESEND_URL,
      sendBody: true,
      specifyBody: 'string',
      contentType: 'raw',
      rawContentType: 'application/json',
      body: expr(HDR + JSON.stringify(SUBJ1) + MID + JSON.stringify(EMAIL1) + TAIL),
    },
    position: [500, 300],
  },
  output: [{ id: 'resend-id' }],
});

const wait1 = node({
  type: 'n8n-nodes-base.wait',
  version: 1.1,
  config: { name: 'Wait 2 Days', parameters: { resume: 'timeInterval', amount: 2, unit: 'days' }, position: [700, 300] },
});

const email2 = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Email 2 — Day 2 20% Myth',
    parameters: {
      method: 'POST',
      url: RESEND_URL,
      sendBody: true,
      specifyBody: 'string',
      contentType: 'raw',
      rawContentType: 'application/json',
      body: expr(HDR + JSON.stringify(SUBJ2) + MID + JSON.stringify(EMAIL2) + TAIL),
    },
    position: [900, 300],
  },
  output: [{ id: 'resend-id' }],
});

const wait2 = node({
  type: 'n8n-nodes-base.wait',
  version: 1.1,
  config: { name: 'Wait 3 Days', parameters: { resume: 'timeInterval', amount: 3, unit: 'days' }, position: [1100, 300] },
});

const email3 = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Email 3 — Day 5 Not A Second Payment',
    parameters: {
      method: 'POST',
      url: RESEND_URL,
      sendBody: true,
      specifyBody: 'string',
      contentType: 'raw',
      rawContentType: 'application/json',
      body: expr(HDR + JSON.stringify(SUBJ3) + MID + JSON.stringify(EMAIL3) + TAIL),
    },
    position: [1300, 300],
  },
  output: [{ id: 'resend-id' }],
});

const wait3 = node({
  type: 'n8n-nodes-base.wait',
  version: 1.1,
  config: { name: 'Wait 5 Days', parameters: { resume: 'timeInterval', amount: 5, unit: 'days' }, position: [1500, 300] },
});

const email4 = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Email 4 — Day 10 Sarah Story',
    parameters: {
      method: 'POST',
      url: RESEND_URL,
      sendBody: true,
      specifyBody: 'string',
      contentType: 'raw',
      rawContentType: 'application/json',
      body: expr(HDR + JSON.stringify(SUBJ4) + MID + JSON.stringify(EMAIL4) + TAIL),
    },
    position: [1700, 300],
  },
  output: [{ id: 'resend-id' }],
});

const wait4 = node({
  type: 'n8n-nodes-base.wait',
  version: 1.1,
  config: { name: 'Wait 7 Days', parameters: { resume: 'timeInterval', amount: 7, unit: 'days' }, position: [1900, 300] },
});

const email5 = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Email 5 — Day 17 Credit Score',
    parameters: {
      method: 'POST',
      url: RESEND_URL,
      sendBody: true,
      specifyBody: 'string',
      contentType: 'raw',
      rawContentType: 'application/json',
      body: expr(HDR + JSON.stringify(SUBJ5) + MID + JSON.stringify(EMAIL5) + TAIL),
    },
    position: [2100, 300],
  },
  output: [{ id: 'resend-id' }],
});

const wait5 = node({
  type: 'n8n-nodes-base.wait',
  version: 1.1,
  config: { name: 'Wait 8 Days', parameters: { resume: 'timeInterval', amount: 8, unit: 'days' }, position: [2300, 300] },
});

const email6 = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Email 6 — Day 25 Market Update',
    parameters: {
      method: 'POST',
      url: RESEND_URL,
      sendBody: true,
      specifyBody: 'string',
      contentType: 'raw',
      rawContentType: 'application/json',
      body: expr(HDR + JSON.stringify(SUBJ6) + MID + JSON.stringify(EMAIL6) + TAIL),
    },
    position: [2500, 300],
  },
  output: [{ id: 'resend-id' }],
});

const wait6 = node({
  type: 'n8n-nodes-base.wait',
  version: 1.1,
  config: { name: 'Wait 13 Days', parameters: { resume: 'timeInterval', amount: 13, unit: 'days' }, position: [2700, 300] },
});

const email7 = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Email 7 — Day 38 PA Walkthrough',
    parameters: {
      method: 'POST',
      url: RESEND_URL,
      sendBody: true,
      specifyBody: 'string',
      contentType: 'raw',
      rawContentType: 'application/json',
      body: expr(HDR + JSON.stringify(SUBJ7) + MID + JSON.stringify(EMAIL7) + TAIL),
    },
    position: [2900, 300],
  },
  output: [{ id: 'resend-id' }],
});

const wait7 = node({
  type: 'n8n-nodes-base.wait',
  version: 1.1,
  config: { name: 'Wait 14 Days', parameters: { resume: 'timeInterval', amount: 14, unit: 'days' }, position: [3100, 300] },
});

const email8 = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Email 8 — Day 52 Final Push',
    parameters: {
      method: 'POST',
      url: RESEND_URL,
      sendBody: true,
      specifyBody: 'string',
      contentType: 'raw',
      rawContentType: 'application/json',
      body: expr(HDR + JSON.stringify(SUBJ8) + MID + JSON.stringify(EMAIL8) + TAIL),
    },
    position: [3300, 300],
  },
  output: [{ id: 'resend-id' }],
});

export default workflow('dpa-guide-nurture', 'LoanOS — DPA Guide Nurture (8 emails, 52 days)')
  .add(webhook)
  .to(normalize)
  .to(email1)
  .to(wait1)
  .to(email2)
  .to(wait2)
  .to(email3)
  .to(wait3)
  .to(email4)
  .to(wait4)
  .to(email5)
  .to(wait5)
  .to(email6)
  .to(wait6)
  .to(email7)
  .to(wait7)
  .to(email8);
