import { escapeHtml } from './inquiry'
// Existing approved n8n confirmation, preserved for ordinary new inquiries.
export function confirmationHtml(firstName: string) {
 return '<div style="font-family: Georgia, serif; max-width: 560px; color: #1a1a1a;">'+
 '<p>Hey '+escapeHtml(firstName||'there')+',</p>'+
 '<p>Thanks for your inquiry — I’ll reach out to you as soon as possible to walk through your options.</p>'+
 '<p>In the meantime, feel free to call or text me, or grab a time on my calendar:</p>'+
 '<p style="margin-left:1em;">• <strong>Call / text:</strong> <a href="tel:+15129566010">(512) 956-6010</a><br>• <strong>Schedule:</strong> <a href="https://calendly.com/adamstyer/15minutes">15-Min Call</a></p>'+
 '<p>If you haven’t already filled out a loan application, it would be helpful if you did — it makes our first conversation a lot more productive. You can do that here:</p>'+
 '<p><a href="https://hypersmart.my1003app.com/513013/register?time=1779291829279" style="background:#1a1a1a;color:#fff;padding:10px 20px;border-radius:4px;text-decoration:none;font-weight:bold;display:inline-block;">Start Loan Application →</a></p>'+
 '<p>No hard credit pull without your approval.</p>'+
 '<p>Talk soon,<br><strong>Adam Styer</strong><br>Kyber Mortgage Corporation dba HyperSmart Home Loans<br>NMLS #513013<br>(512) 956-6010<br>adam.styer@hypersmart.loan</p>'+
 '<p style="font-size: 11px; color: #888;">Kyber Mortgage Corporation dba HyperSmart Home Loans | NMLS #2653540 | Adam Styer NMLS #513013 | Licensed Mortgage Broker in Texas | 9050 N. Capital of Texas Hwy, Ste 390, Austin, Texas 78759</p></div>'
}
