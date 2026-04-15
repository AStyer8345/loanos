import { workflow, node, trigger, newCredential, expr } from '@n8n/workflow-sdk';

const FOOTER = '\n\n—\nAdam Styer | NMLS #513013\nAdam Styer | Mortgage Solutions LP\n(512) 956-6010 | styermortgage.com\n5900 Balcones Drive Suite 100 | Austin, TX 78731\n\nYou\'re receiving this because you requested a pre-approval at styermortgage.com.\nUnsubscribe: {{RESEND_UNSUBSCRIBE_URL}}\nEqual Housing Lender. Not an offer to lend. All loans subject to credit approval.';

const EMAIL1 = 'Hi [First Name],\n\nGot it. Your request is in front of me right now.\n\nHere\'s what happens next:\n\nI\'ll personally review your info today — no call center, no handoff. If I have a quick question, I\'ll call or text you at the number you provided. If everything looks good, you\'ll have a pre-approval letter in 24–48 hours.\n\nA few things worth knowing while you wait:\n\nI work for you, not a bank. I\'m an independent broker with access to 40+ wholesale lenders. That means I shop your loan across all of them and bring you the best rate and terms — not whatever one bank happens to offer that day.\n\nYour credit isn\'t getting hammered. A mortgage pre-approval generates one soft inquiry. Multiple mortgage inquiries inside a 45-day window count as one hit on your score. You\'re not going to walk away from this penalized.\n\nAsk me anything. Reply to this email or grab 15 minutes on my calendar. Both go straight to me.\n\nBook a 15-min call: https://calendly.com/adamstyer/15minutes\n\nTalk soon,\nAdam' + FOOTER;

const EMAIL2 = 'Hi [First Name],\n\nQuick thing worth understanding before you start making offers.\n\nPre-qualification is a guess. You tell a lender what you make and what you have. They run a quick calculation and say "you could probably afford X." No documents verified. No credit pulled. Worth almost nothing to a seller.\n\nPre-approval is a commitment. I\'ve verified your income with pay stubs and tax returns. I\'ve confirmed your assets. I\'ve pulled your credit and run it through actual underwriting guidelines. The letter you get says: based on what we\'ve verified, this buyer can close on a home up to $X.\n\nIn a competitive Austin market, that difference decides who wins the house.\n\nA seller getting two identical offers — one pre-qualified, one pre-approved — will take the pre-approved buyer every time. Listing agents know which one is more likely to actually close.\n\nIf you haven\'t finished your full application yet, now\'s the time. It takes about 15 minutes and I can have your pre-approval letter to you in 24–48 hours.\n\nStart (or finish) your application: https://mslp.my1003app.com/513013/register\n\nReply if you hit anything weird. I\'ll help.\n\nAdam' + FOOTER;

const EMAIL3 = 'Hi [First Name],\n\nI\'ve been doing this since 2017. Closed over 1,000 loans. In that time, the deals that fell apart almost all failed for the same three reasons.\n\nHere they are so you don\'t repeat them.\n\n1. Credit score drops mid-process.\nUnderwriters re-pull credit late in the process. If your score dropped even 20 points between your pre-approval and closing, it can change your rate, your loan program, or kill the deal entirely.\n\nDon\'t open new credit cards. Don\'t finance furniture. Don\'t co-sign anything. Don\'t close old accounts thinking it\'ll help. Just let your credit sit still until we close.\n\n2. New debt before closing.\nFinancing a car. Taking a personal loan. Using a new credit card heavily. Any of these change your debt-to-income ratio, and your loan is priced around your DTI at application.\n\nIf you need to buy something big, wait until after closing. I mean it.\n\n3. Job changes.\nSwitching jobs mid-process is one of the most common deal-killers. Even a promotion can trigger re-verification. A new employer, a new pay structure, a gap — any of these means re-underwriting, and sometimes the deal no longer works at new numbers.\n\nIf a job change is coming, tell me now. Sometimes we can work around it. Sometimes we can\'t. But we can\'t fix what we don\'t see coming.\n\nWhat to do instead: pay your bills on time, keep your accounts open, keep your employment steady, and send me any financial documents I ask for fast. That\'s it.\n\nQuestions? Reply or grab time with me.\n\nBook a 15-min call: https://calendly.com/adamstyer/15minutes\n\nAdam' + FOOTER;

const EMAIL4 = 'Hi [First Name],\n\nQuick market note.\n\nAustin rates have been moving — some weeks up, some down. The question I get constantly: should I lock now or wait?\n\nThe honest answer: nobody knows where rates are headed. Not me, not the Fed, not the talking heads on CNBC. What I can do is help you think about it clearly.\n\nThree questions I ask every client:\n\n1. How close is your closing date? If you\'re within 30 days, lock. The downside risk of waiting isn\'t worth the small chance of a drop.\n\n2. Can you absorb a quarter-point move up? On a $400K loan, that\'s roughly $50–60/month more. If that breaks your budget, lock early — take the variable out of your life.\n\n3. What\'s your "good enough" rate? If today\'s rate gets you to a monthly payment you\'re comfortable with, that\'s the rate. Don\'t gamble trying to shave another eighth trying to outguess the market.\n\nAlso worth knowing: most loan programs offer float-down options — if rates drop significantly between your lock and closing, we can sometimes re-lock lower. It\'s not automatic. But it\'s a tool I use when the math justifies it.\n\nIf you want to see today\'s actual rates for your specific scenario, just reply and I\'ll run it.\n\nOr see current market rates: https://styermortgage.com/austin-mortgage-rates\n\nAdam' + FOOTER;

const EMAIL5 = 'Hi [First Name],\n\nWant to tell you about a client who closed last month.\n\nFirst-time buyers. Married couple in their early 30s. Dual income, about $165K combined. Credit in the 720s. They\'d been renting in east Austin for four years and were nervous they\'d missed the window.\n\nThey got pre-approved with me on a Tuesday. Wednesday they put in an offer on a house in Pflugerville. Three other buyers were on it.\n\nHere\'s why they won:\n\nTheir pre-approval letter was real. Not a pre-qual. Not a "based on stated income" letter. A verified pre-approval from a broker with a closing track record the listing agent recognized. The seller\'s agent called me personally to confirm. Five minutes. Done.\n\nWe offered fast close. 21 days. In Austin\'s market right now, that\'s a weapon. Many buyers are still operating on 30–35 day timelines. A clean, fast close from a broker the listing agent trusts beats a higher offer with uncertainty.\n\nNo appraisal gap drama. We had a conversation upfront about what to do if the appraisal came in low. They had a plan. When it came in $8K short, they already knew how they wanted to handle it. No panic, no renegotiation death spiral.\n\nThey got keys 21 days after that Tuesday pre-approval.\n\nYour situation is different. Everyone\'s is. But the playbook is repeatable: real pre-approval, clean offer, fast close, no surprises.\n\nIf you\'re ready to finish your application and get the full pre-approval letter in hand — you know where to start.\n\nFinish your application: https://mslp.my1003app.com/513013/register\n\nAdam' + FOOTER;

const EMAIL6 = 'Hi [First Name],\n\nIt\'s been two months since you came in. Life happens — I get it. No judgment.\n\nIf you\'re still sitting on the fence, here\'s a quick reset on what\'s changed:\n\nRates: They\'ve moved. What you thought your payment was going to be two months ago may not match what it is today — could be better, could be worse. Worth a 10-minute check.\n\nPrograms: First-time buyer programs (TSAHC, TDHCA, Travis County) get refunded on a rolling basis. Some open, some close, some change their eligibility bands. What wasn\'t available when we first talked might be now. What was available might not be.\n\nInventory: Austin has more homes on market than this time last year. Sellers are negotiating more. Buyers who were getting beaten in bidding wars a year ago are winning clean offers now.\n\nI\'m not here to sell you a house you don\'t want. If your situation changed and buying isn\'t in the cards — that\'s fine. Reply and tell me to quit bothering you. I will.\n\nBut if you\'re still on the fence and just lost momentum, a 15-minute call can re-baseline everything. I\'ll tell you where you actually stand, what\'s changed for your specific scenario, and whether it makes sense to move now or keep waiting.\n\nNo credit pull. No obligation. Just your numbers.\n\nBook a 15-min call: https://calendly.com/adamstyer/15minutes\n\nOr reply. Either works.\n\nAdam' + FOOTER;

const SUBJ1 = "Your pre-approval request is in — here's what happens next";
const SUBJ2 = 'What "pre-approved" actually means (most buyers get this wrong)';
const SUBJ3 = 'The 3 things that kill a mortgage approval (and how to avoid them)';
const SUBJ4 = 'Austin market update: what rates look like right now';
const SUBJ5 = "A buyer just like you closed last month — here's their story";
const SUBJ6 = "Still thinking about it? No pressure — but here's what's changed";

const HDR = '={{ JSON.stringify({ from: \'Adam Styer <adam@mail.thestyerteam.com>\', reply_to: \'adam@thestyerteam.com\', to: [$(\'Normalize Lead\').item.json.email], subject: ';
const MID = ', text: ';
const TAIL = ".split('[First Name]').join($('Normalize Lead').item.json.first_name || 'there') }) }}";

const RESEND_URL = 'https://api.resend.com/emails';

const webhook = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'PA Nurture Webhook',
    parameters: { httpMethod: 'POST', path: 'pa-nurture' },
    position: [100, 300],
  },
  output: [{ body: { first_name: 'Test', last_name: 'User', email: 'test@example.com', loan_goal: 'Purchase' } }],
});

const normalize = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Normalize Lead',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: "const body = $('PA Nurture Webhook').first().json.body || {};\nreturn [{ json: {\n  first_name: body.first_name || 'there',\n  last_name: body.last_name || '',\n  email: body.email || '',\n  phone: body.phone || '',\n  loan_goal: body.loan_goal || '',\n  submitted_at: new Date().toISOString(),\n} }];",
    },
    position: [300, 300],
  },
  output: [{ first_name: 'Test', email: 'test@example.com' }],
});

const email1 = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Email 1 — Day 0 Welcome',
    parameters: {
      method: 'POST',
      url: RESEND_URL,
      authentication: 'genericCredentialType',
      genericAuthType: 'httpBearerAuth',
      sendBody: true,
      specifyBody: 'string',
      contentType: 'raw',
      rawContentType: 'application/json',
      body: expr(HDR + JSON.stringify(SUBJ1) + MID + JSON.stringify(EMAIL1) + TAIL),
    },
    credentials: { httpBearerAuth: newCredential('Resend') },
    position: [500, 300],
  },
  output: [{ id: 'resend-id' }],
});

const wait1 = node({
  type: 'n8n-nodes-base.wait',
  version: 1.1,
  config: { name: 'Wait 3 Days', parameters: { resume: 'timeInterval', amount: 3, unit: 'days' }, position: [700, 300] },
});

const email2 = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Email 2 — Day 3 Pre-Approval Education',
    parameters: {
      method: 'POST',
      url: RESEND_URL,
      authentication: 'genericCredentialType',
      genericAuthType: 'httpBearerAuth',
      sendBody: true,
      specifyBody: 'string',
      contentType: 'raw',
      rawContentType: 'application/json',
      body: expr(HDR + JSON.stringify(SUBJ2) + MID + JSON.stringify(EMAIL2) + TAIL),
    },
    credentials: { httpBearerAuth: newCredential('Resend') },
    position: [900, 300],
  },
  output: [{ id: 'resend-id' }],
});

const wait2 = node({
  type: 'n8n-nodes-base.wait',
  version: 1.1,
  config: { name: 'Wait 4 Days', parameters: { resume: 'timeInterval', amount: 4, unit: 'days' }, position: [1100, 300] },
});

const email3 = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Email 3 — Day 7 Deal Killers',
    parameters: {
      method: 'POST',
      url: RESEND_URL,
      authentication: 'genericCredentialType',
      genericAuthType: 'httpBearerAuth',
      sendBody: true,
      specifyBody: 'string',
      contentType: 'raw',
      rawContentType: 'application/json',
      body: expr(HDR + JSON.stringify(SUBJ3) + MID + JSON.stringify(EMAIL3) + TAIL),
    },
    credentials: { httpBearerAuth: newCredential('Resend') },
    position: [1300, 300],
  },
  output: [{ id: 'resend-id' }],
});

const wait3 = node({
  type: 'n8n-nodes-base.wait',
  version: 1.1,
  config: { name: 'Wait 7 Days', parameters: { resume: 'timeInterval', amount: 7, unit: 'days' }, position: [1500, 300] },
});

const email4 = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Email 4 — Day 14 Rate Update',
    parameters: {
      method: 'POST',
      url: RESEND_URL,
      authentication: 'genericCredentialType',
      genericAuthType: 'httpBearerAuth',
      sendBody: true,
      specifyBody: 'string',
      contentType: 'raw',
      rawContentType: 'application/json',
      body: expr(HDR + JSON.stringify(SUBJ4) + MID + JSON.stringify(EMAIL4) + TAIL),
    },
    credentials: { httpBearerAuth: newCredential('Resend') },
    position: [1700, 300],
  },
  output: [{ id: 'resend-id' }],
});

const wait4 = node({
  type: 'n8n-nodes-base.wait',
  version: 1.1,
  config: { name: 'Wait 16 Days', parameters: { resume: 'timeInterval', amount: 16, unit: 'days' }, position: [1900, 300] },
});

const email5 = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Email 5 — Day 30 Client Story',
    parameters: {
      method: 'POST',
      url: RESEND_URL,
      authentication: 'genericCredentialType',
      genericAuthType: 'httpBearerAuth',
      sendBody: true,
      specifyBody: 'string',
      contentType: 'raw',
      rawContentType: 'application/json',
      body: expr(HDR + JSON.stringify(SUBJ5) + MID + JSON.stringify(EMAIL5) + TAIL),
    },
    credentials: { httpBearerAuth: newCredential('Resend') },
    position: [2100, 300],
  },
  output: [{ id: 'resend-id' }],
});

const wait5 = node({
  type: 'n8n-nodes-base.wait',
  version: 1.1,
  config: { name: 'Wait 30 Days', parameters: { resume: 'timeInterval', amount: 30, unit: 'days' }, position: [2300, 300] },
});

const email6 = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Email 6 — Day 60 Re-Engagement',
    parameters: {
      method: 'POST',
      url: RESEND_URL,
      authentication: 'genericCredentialType',
      genericAuthType: 'httpBearerAuth',
      sendBody: true,
      specifyBody: 'string',
      contentType: 'raw',
      rawContentType: 'application/json',
      body: expr(HDR + JSON.stringify(SUBJ6) + MID + JSON.stringify(EMAIL6) + TAIL),
    },
    credentials: { httpBearerAuth: newCredential('Resend') },
    position: [2500, 300],
  },
  output: [{ id: 'resend-id' }],
});

export default workflow('pa-welcome-nurture', 'LoanOS — PA Welcome Nurture (6 emails, 60 days)')
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
  .to(email6);
