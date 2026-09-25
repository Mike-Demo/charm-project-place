import type { ComponentType } from 'react'
import { template as sessionPassTemplate } from './session-pass'
import { template as sessionReminderTemplate } from './session-reminder'
import { template as sessionDayOfTemplate } from './session-day-of'
import { template as sessionAftercareTemplate } from './session-aftercare'
import { template as sessionShareTemplate } from './session-share'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  /** Fixed recipient — overrides caller-provided recipientEmail when set. */
  to?: string
}

/**
 * Template registry — maps template names to their React Email components.
 * Import and register new templates here after creating them in this directory.
 *
 * Example:
 *   import { template as welcomeTemplate } from './welcome'
 *   // then add to TEMPLATES: 'welcome': welcomeTemplate
 */
export const TEMPLATES: Record<string, TemplateEntry> = {
  // Add templates here as they are created, e.g.:
  // 'welcome': welcomeTemplate,
  'session-pass': sessionPassTemplate,
  'session-reminder': sessionReminderTemplate,
  'session-day-of': sessionDayOfTemplate,
  'session-aftercare': sessionAftercareTemplate,
  'session-share': sessionShareTemplate,
}
