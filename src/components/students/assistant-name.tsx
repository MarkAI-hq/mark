'use client'

import { useAssistantName } from '@/hooks/use-assistant-name'

/**
 * The student's name for their assistant, as inline text. Drop it into any
 * student-facing sentence — including server-rendered pages — in place of a
 * hard-coded "Tracy":  Ask <AssistantName /> instantly
 */
export function AssistantName() {
  return <>{useAssistantName()}</>
}
