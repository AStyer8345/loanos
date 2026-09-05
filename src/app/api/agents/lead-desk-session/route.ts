import {createClient} from '@supabase/supabase-js';
import {intakeDb} from '@/lib/intake/server';
import {verifySiteRequest} from '@/lib/operations/site-session';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
let cached:{access_token:string;expires_at:number;siteUserId:string}|null=null;
let pending:Promise<{access_token:string;expires_at:number;siteUserId:string}>|null=null;
export async function POST(req:Request){
 const body=await req.text();
 if(body.length>1000||!verifySiteRequest(req,body,process.env.LEAD_DESK_BRIDGE_SECRET||''))return Response.json({error:'Unauthorized'},{status:401,headers});
 try{
  const input=JSON.parse(body),siteUserId=process.env.LEAD_DESK_OPENAI_USER_ID;
  if(!siteUserId||input.siteUserId!==siteUserId)return Response.json({error:'Account not linked'},{status:403,headers});
  if(cached&&cached.siteUserId===siteUserId&&cached.expires_at>Date.now()/1000+120)return Response.json(cached,{headers});
  if(!pending)pending=(async()=>{
   const admin=intakeDb();
   // Mapping is fixed server-side, never selected by the browser or request.
   const {data:profile,error}=await admin.from('profiles').select('id,email,organization_id,role').eq('id',process.env.LEAD_DESK_LOANOS_USER_ID!).single();
   if(error||!profile||profile.organization_id!==process.env.LEAD_DESK_ORGANIZATION_ID||profile.role!=='owner')throw Error('Owner unavailable');
   const {data:identity,error:identityError}=await admin.auth.admin.getUserById(profile.id);
   if(identityError||!identity.user?.email||identity.user.email.toLowerCase()!==profile.email.toLowerCase()||!identity.user.email_confirmed_at)throw Error('Owner identity unavailable');
   // Supported Auth exchange creates a normal user session: subsequent API
   // calls still use user RLS. No email is sent and no password is changed.
   const {data:link,error:linkError}=await admin.auth.admin.generateLink({type:'magiclink',email:identity.user.email});
   if(linkError||!link.properties?.hashed_token)throw Error('Sign-in unavailable');
   const userClient=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,{auth:{persistSession:false,autoRefreshToken:false}});
   const {data:auth,error:authError}=await userClient.auth.verifyOtp({type:'magiclink',token_hash:link.properties.hashed_token});
   if(authError||!auth.session||auth.user?.id!==profile.id)throw Error('Sign-in unavailable');
   return {access_token:auth.session.access_token,expires_at:auth.session.expires_at!,siteUserId};
  })().finally(()=>{pending=null;});
  cached=await pending;
  return Response.json(cached,{headers});
 }catch{return Response.json({error:'Lead Desk connection is temporarily unavailable.'},{status:503,headers});}
}
