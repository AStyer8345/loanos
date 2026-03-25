/**
 * Single source of truth for the Claude model strings used across all API routes.
 * Update here when upgrading models — no need to touch individual route files.
 */
export const CLAUDE_MODEL = 'claude-sonnet-4-6'

/** Used for lightweight extraction tasks (quick-add, JSON parsing). */
export const CLAUDE_HAIKU_MODEL = 'claude-haiku-4-5'
