export type TeamKind = 'lead' | 'loan' | 'contact'
export type TeamRecord = {
  id: string; kind: TeamKind; name: string; email: string; phone: string
  stage: string; source: string; referral: string; amount: number | null
  product: string; closingDate: string | null; priority: boolean; ariveOwned: boolean
  ownCompensation: number | null
}
export type TeamNote = {id:string;record_kind:TeamKind;record_id:string;author_name:string;body:string;created_at:string}
export type TeamSnapshot = {
  asOf:string; displayName:string; compBps:number; owner:boolean; records:TeamRecord[]; notes:TeamNote[]
}
export function estimateCompensation(amount: number | null, bps: number): number | null {
  return amount === null || !Number.isFinite(amount) || amount <= 0 ? null : Math.round(amount * bps / 100) / 100
}
