import DocumentReviewHome from '@/components/documents/DocumentReviewHome'
export const dynamic='force-dynamic'
export default function Page({params}:{params:{id:string}}){return <DocumentReviewHome loanId={params.id}/>}
