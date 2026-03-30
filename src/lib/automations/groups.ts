export interface GroupDef {
  key: string
  label: string
  order: number
}

export const AUTOMATION_GROUPS: GroupDef[] = [
  { key: 'Loan Pipeline', label: 'LOAN PIPELINE', order: 1 },
  { key: 'Email Automations', label: 'EMAIL AUTOMATIONS', order: 2 },
  { key: 'SEO / SEM', label: 'SEO / SEM', order: 3 },
  { key: 'Social Media', label: 'SOCIAL MEDIA', order: 4 },
  { key: 'Lead Generation', label: 'LEAD GENERATION', order: 5 },
  { key: 'LoanOS Core', label: 'LOANOS CORE', order: 6 },
  { key: 'CRM & Enterprise', label: 'CRM & ENTERPRISE', order: 7 },
  { key: 'Communication Logging', label: 'COMMUNICATION LOGGING', order: 8 },
  { key: 'AI Assistants', label: 'AI ASSISTANTS', order: 9 },
]

export function getGroupOrder(groupName: string): number {
  return AUTOMATION_GROUPS.find(g => g.key === groupName)?.order ?? 99
}

export function getGroupLabel(groupName: string): string {
  return AUTOMATION_GROUPS.find(g => g.key === groupName)?.label ?? groupName.toUpperCase()
}
