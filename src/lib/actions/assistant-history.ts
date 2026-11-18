'use server'

import { fetcher } from '@/lib/fetch'
import type { ServerActionResponse } from '@/lib/types'
import type { ServerChatRow } from '@/components/tracy/server-history'

/**
 * The signed-in user's saved Tracy chat history (assistant_messages), oldest
 * first. Tracy writes every turn here, so this is what lets chat history
 * follow the user across browsers instead of living only in localStorage.
 */
export async function getTracyChatHistory(): Promise<
  ServerActionResponse<ServerChatRow[] | { data: ServerChatRow[] }>
> {
  return fetcher('/assistant/messages', { cache: 'no-store' })
}
