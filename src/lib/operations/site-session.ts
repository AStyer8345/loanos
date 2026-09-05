import {createHmac,timingSafeEqual} from 'node:crypto';
export const SITE_SESSION_PATH='/api/agents/lead-desk-session';
export function verifySiteRequest(req:Request,body:string,secret:string,now=Date.now()){
 const ts=req.headers.get('x-desk-time')||'',sig=req.headers.get('x-desk-signature')||'';
 if(secret.length<32||!/^\d{13}$/.test(ts)||Math.abs(now-Number(ts))>60000||!/^[a-f0-9]{64}$/.test(sig))return false;
 const expected=createHmac('sha256',secret).update(ts+'\nPOST\n'+SITE_SESSION_PATH+'\n'+body).digest();
 return timingSafeEqual(expected,Buffer.from(sig,'hex'));
}
