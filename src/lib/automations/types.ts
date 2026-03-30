export type AutomationSource = 'claude_code' | 'n8n' | 'supabase_setting'
export type AutomationStatus = 'active' | 'paused' | 'errored' | 'disabled'
export type TriggerType = 'webhook' | 'schedule' | 'manual' | 'disabled'
export type EmailMode = 'ai_generated' | 'fixed_template' | 'hybrid'
export type RunStatus = 'success' | 'error' | 'running' | 'no_changes'

export interface AgentConfig {
  focus_areas?: string[]
  avoid?: string
  priority?: string
}

export interface EmailConfig {
  tone?: 'formal' | 'conversational' | 'casual'
  length?: 'short' | 'medium' | 'long'
  always_include?: string[]
  never_include?: string[]
}

export interface AssistantConfig {
  tone?: 'professional' | 'friendly' | 'casual'
  topics_focus?: string[]
  topics_avoid?: string[]
  key_instructions?: string
}

export type AutomationConfig = AgentConfig | EmailConfig | AssistantConfig

export interface AutomationRegistryRow {
  id: string
  org_id: string
  name: string
  description: string
  group_name: string
  source: AutomationSource
  source_id: string
  source_node_id: string | null
  trigger_type: TriggerType
  schedule: string | null
  status: AutomationStatus
  config: AutomationConfig
  prompt_snapshot: string | null
  email_template: string | null
  email_mode: EmailMode | null
  email_variables: Record<string, string>[] | null
  email_test_data: Record<string, string> | null
  last_run_at: string | null
  last_run_summary: string | null
  last_run_status: RunStatus | null
  created_at: string
  updated_at: string
}

export interface AutomationRunRow {
  id: string
  automation_id: string
  org_id: string
  started_at: string
  completed_at: string | null
  status: 'success' | 'error' | 'running'
  summary: string | null
  full_log: string | null
  changes_made: Record<string, unknown> | null
  created_at: string
}
