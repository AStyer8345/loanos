type Page<T> = {data:T[]|null;count:number|null;error:{message:string}|null}

/** Read a complete, stably ordered result before exposing search or totals. */
export async function readAllPages<T extends {id:string}>(read:(from:number,to:number)=>PromiseLike<Page<T>>,size=500):Promise<T[]> {
  const rows:T[]=[]
  const seen=new Set<string>()
  let expected:number|null=null
  for(let from=0;;from+=size){
    const page=await read(from,from+size-1)
    if(page.error)throw new Error(page.error.message)
    if(!page.data)throw new Error('Records could not be loaded. Please refresh.')
    if(expected!==null&&page.count!==expected)throw new Error('Records changed while loading. Please refresh.')
    expected=page.count
    for(const row of page.data){
      if(seen.has(row.id))throw new Error('Records changed while loading. Please refresh.')
      seen.add(row.id);rows.push(row)
    }
    if(page.data.length<size){
      if(expected!==null&&rows.length!==expected)throw new Error('The full list could not be loaded. Please refresh.')
      return rows
    }
  }
}
