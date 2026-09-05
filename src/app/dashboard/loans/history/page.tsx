'use client'
import {useEffect,useMemo,useState} from 'react'
import Link from 'next/link'
import type {HistoryRow} from '@/lib/historical-import'
import '../loan-records.css'
const labels={matched:'Already in LoanOS',created:'Added to LoanOS',review:'Needs a match check',excluded:'Source entry only'}
export default function HistoryPage(){
  const [rows,setRows]=useState<HistoryRow[]>([]),[error,setError]=useState(''),[loading,setLoading]=useState(true),[attempt,setAttempt]=useState(0)
  const [search,setSearch]=useState(''),[kind,setKind]=useState('all'),[state,setState]=useState('all'),[page,setPage]=useState(0),[expanded,setExpanded]=useState<string|null>(null)
  useEffect(()=>{
    const controller=new AbortController();setLoading(true);setError('')
    fetch('/api/operations/history',{signal:controller.signal,cache:'no-store'}).then(async r=>{const body=await r.json();if(!r.ok)throw new Error(body.error||'History is unavailable');return body})
      .then(body=>{setRows(body.records);setLoading(false)}).catch(e=>{if(!controller.signal.aborted){setError(e.message);setRows([]);setLoading(false)}})
    return()=>controller.abort()
  },[attempt])
  const filtered=useMemo(()=>{const q=search.trim().toLowerCase();return rows.filter(r=>(kind==='all'||r.kind===kind)&&(state==='all'||r.disposition===state)&&(!q||[r.name,r.email,r.loanNumber,r.address,r.referral,r.notes].some(v=>v.toLowerCase().includes(q))))},[rows,kind,state,search])
  const shown=filtered.slice(page*50,page*50+50)
  const change=(fn:()=>void)=>{fn();setPage(0);setExpanded(null)}
  return <div className="loan-records-desk">
    <header className="loan-records-header"><div><div className="loan-records-eyebrow">LOAN DESK</div><h1>Jungo history</h1><p>Your contact and loan spreadsheet, reconciled September 2, 2026.</p></div><div className="loan-records-header-actions"><Link href="/dashboard/loans">Loan Records</Link><Link href="/dashboard/contacts">Contacts</Link></div></header>
    <p className="loan-records-footnote">Matched records link to LoanOS. Entries needing a match check are saved here until their identity or loan can be confirmed. Historical stages show what the spreadsheet recorded.</p>
    {error?<div role="alert" className="loan-records-error">{error} <button onClick={()=>setAttempt(v=>v+1)}>Retry</button></div>:null}
    <div className="loan-records-views" aria-label="History status">{(['all','matched','created','review','excluded'] as const).map(s=><button key={s} aria-pressed={state===s} onClick={()=>change(()=>setState(s))}>{s==='all'?'All entries':labels[s]}<span>{loading||error?'—':rows.filter(r=>s==='all'||r.disposition===s).length.toLocaleString()}</span></button>)}</div>
    <div className="loan-records-saved"><label>Show <select value={kind} onChange={e=>change(()=>setKind(e.target.value))}><option value="all">Contacts and loans</option><option value="contact">Contacts</option><option value="loan">Loans</option></select></label><div className="loan-records-search"><input aria-label="Search Jungo history" value={search} onChange={e=>change(()=>setSearch(e.target.value))} placeholder="Search name, email, loan number, address or notes…"/></div></div>
    <p aria-live="polite" className="loan-records-footnote">{loading?'Loading the full history…':error?'History unavailable':`${filtered.length.toLocaleString()} entries in this view`}</p>
    {!loading&&!error&&<><div className="loan-records-table" style={{overflowX:'auto'}}><table><thead><tr><th scope="col">Name</th><th scope="col">Record</th><th scope="col">Property / address</th><th scope="col">Amount</th><th scope="col">Import result</th><th scope="col">Details</th></tr></thead><tbody>{shown.map(r=><HistoryEntry key={r.id} row={r} expanded={expanded===r.id} toggle={()=>setExpanded(v=>v===r.id?null:r.id)}/>)}</tbody></table>{!filtered.length&&<p style={{padding:24}}>No entries match this view.</p>}</div><div className="loan-records-saved" style={{marginTop:20}}><button disabled={page===0} onClick={()=>setPage(v=>v-1)}>Previous</button><span>Page {page+1} of {Math.max(1,Math.ceil(filtered.length/50))}</span><button disabled={(page+1)*50>=filtered.length} onClick={()=>setPage(v=>v+1)}>Next</button></div></>}
  </div>
}
function HistoryEntry({row:r,expanded,toggle}:{row:HistoryRow;expanded:boolean;toggle:()=>void}){
 return <><tr><td className="loan-records-borrower"><span className="borrower-label">{r.name||'Name needs review'}</span>{r.email&&<div>{r.email}</div>}</td><td>{r.kind==='loan'?'Loan':'Contact'}{r.loanNumber&&<div>{r.loanNumber}</div>}</td><td>{r.address||'—'}</td><td>{r.amount==null?'—':r.amount.toLocaleString('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0})}</td><td>{labels[r.disposition]}</td><td><button aria-expanded={expanded} onClick={toggle}>{expanded?'Hide':'View'}</button>{r.href&&<div><Link href={r.href}>Open in LoanOS →</Link></div>}</td></tr>{expanded&&<tr><td colSpan={6}><dl className="history-details"><dt>Match explanation</dt><dd>{r.reason}</dd><dt>Recorded stage</dt><dd>{r.stage||'Not supplied'}</dd><dt>Referral</dt><dd>{r.referral||'Not supplied'}</dd><dt>Source notes</dt><dd style={{whiteSpace:'pre-wrap'}}>{r.notes||'No notes in this source row.'}</dd></dl></td></tr>}</>
}
