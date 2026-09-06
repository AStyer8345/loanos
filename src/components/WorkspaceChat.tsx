'use client'
import {usePathname} from 'next/navigation'
import LoanOSChat from '@/components/crm/LoanOSChat'
/** Team members use shared records; the owner assistant and its history stay separate. */
export default function WorkspaceChat(){
 const path=usePathname()
 return path==='/team'||path==='/invite/accept'?null:<LoanOSChat/>
}
