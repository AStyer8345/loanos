import {describe,it,expect} from 'vitest'
import {readAllPages} from './read-all-pages'
describe('complete record lists',()=>{
 it('includes older rows beyond both the first page and the API default limit',async()=>{
   const source=Array.from({length:1251},(_,i)=>({id:String(i),amount:i}))
   const rows=await readAllPages(async(from,to)=>({data:source.slice(from,to+1),count:source.length,error:null}))
   expect(rows).toHaveLength(1251);expect(rows.at(-1)?.id).toBe('1250')
   expect(rows.reduce((n,r)=>n+r.amount,0)).toBe(781875)
 })
 it('does not show incomplete totals after a failed later page',async()=>{
   await expect(readAllPages(async(from)=>from===0?{data:[{id:'a'},{id:'b'}],count:3,error:null}:{data:null,count:null,error:{message:'connection interrupted'}},2)).rejects.toThrow('connection interrupted')
 })
 it('rejects truncated pages and shifting records',async()=>{
   await expect(readAllPages(async()=>({data:[{id:'a'}],count:3,error:null}),2)).rejects.toThrow('full list')
   await expect(readAllPages(async()=>({data:[{id:'a'},{id:'b'}],count:4,error:null}),2)).rejects.toThrow('Records changed')
 })
})
