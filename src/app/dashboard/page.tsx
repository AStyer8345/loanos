import {getOrganization} from '@/lib/getOrganization'
import {redirect} from 'next/navigation'
import SimpleLeadDesk from '@/components/operations/SimpleLeadDesk'
import OperationalHome from '@/components/operations/OperationalHome'
export const dynamic='force-dynamic'
export default async function DashboardPage(){let org;try{org=await getOrganization()}catch{redirect('/auth/login')}return org.organizationId===process.env.LEAD_DESK_ORGANIZATION_ID?<SimpleLeadDesk/>:<OperationalHome/>}
