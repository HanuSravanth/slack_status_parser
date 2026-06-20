/**
 * Shared types for the Slack Status Summarizer.
 */

export interface SlackProgressSummary {
  id: string;
  date: string;
  employee_name: string;
  project_name: string;
  progress: string[];
  blockers: string[];
  plan: string[];
  raw_text?: string;
  created_at: string;
}

export interface EmailExportPayload {
  to: string;
  subject: string;
  body: string;
}
