import {getOrganization} from '@/lib/getOrganization'
import {redirect} from 'next/navigation'
import OperationalHome from '@/components/operations/OperationalHome'
export const dynamic='force-dynamic'
export default async function DashboardPage(){try{await getOrganization()}catch{redirect('/auth/login')}return <OperationalHome/>}
