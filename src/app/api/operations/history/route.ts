import { NextResponse } from 'next/server'
import { operationalContext } from '@/lib/operations/server'
import { intakeDb } from '@/lib/intake/server'
import { decryptInquiry, type CipherPayload } from '@/lib/intake/inquiry'
import { readAllPages } from '@/lib/read-all-pages'
import { historyRow, type HistoryMetadata } from '@/lib/historical-import'
export const dynamic='force-dynamic'
export const maxDuration=60
const headers={'Cache-Control':'private, no-store'}
const source='jungo_master_2026_09_02'
export async function GET(req:Request){
  let ctx:Awaited<ReturnType<typeof operationalContext>>
  try{ctx=await operationalContext(req)}catch{return NextResponse.json({error:'Sign in to view your Jungo history.'},{status:401,headers})}
  try{
    // Establish every authorized row with the caller's RLS-scoped client first.
    const metadata=await readAllPages(async(from,to)=>{
      const r=await ctx.db.from('historical_import_records').select('entity_type,external_id,contact_id,loan_id,disposition,reason',{count:'exact'})
        .eq('organization_id',ctx.organizationId).eq('source_key',source).order('entity_type').order('external_id').range(from,to)
      return {...r,data:r.data?.map(row=>({...row,id:row.entity_type+':'+row.external_id}))??null}
    })
    const records=[]
    for(const type of ['contact','loan'] as const){
      const allowed=metadata.filter(r=>r.entity_type===type)
      for(let from=0;from<allowed.length;from+=200){
        const chunk=allowed.slice(from,from+200)
        const {data,error}=await intakeDb().from('historical_import_records').select('external_id,payload_cipher')
          .eq('organization_id',ctx.organizationId).eq('source_key',source).eq('entity_type',type).in('external_id',chunk.map(r=>r.external_id))
        if(error||!data||data.length!==chunk.length)throw new Error('Incomplete source history')
        const payloads=new Map(data.map(r=>[r.external_id,r.payload_cipher as CipherPayload]))
        for(const row of chunk){
          const payload=decryptInquiry(payloads.get(row.external_id)!)
          if(!payload.record||typeof payload.record!=='object'||Array.isArray(payload.record))throw new Error('Invalid source record')
          records.push(historyRow(row as HistoryMetadata,payload.record as Record<string,unknown>))
        }
      }
    }
    return NextResponse.json({source:'Jungo master workbook, reconciled September 2, 2026',records},{headers})
  }catch{return NextResponse.json({error:'The complete history could not be loaded. Please retry.'},{status:503,headers})}
}
