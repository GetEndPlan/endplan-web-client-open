import { api } from '@/shared/api'

export const KEY_PERSON_START_OWN_ENDPLAN_PROMPT_KEY = 'key_person_start_own_endplan' as const
export const KEY_PERSON_INACTIVITY_ACCESS_PROMPT_PREFIX = 'key_person_inactivity_access' as const

export function getKeyPersonInactivityAccessPromptKey(sharedVaultId: string): string {
  return `${KEY_PERSON_INACTIVITY_ACCESS_PROMPT_PREFIX}_${sharedVaultId}`
}

export type UserPromptState = {
  promptKey: string
  startedAt: string | null
  dismissedAt: string | null
}

export const userPromptStateApi = {
  async get(promptKey: string): Promise<UserPromptState> {
    return api.get<UserPromptState>(`/api/v1/user/prompt-states/${promptKey}`)
  },

  async markStarted(promptKey: string): Promise<UserPromptState> {
    return api.post<UserPromptState>(`/api/v1/user/prompt-states/${promptKey}/start`)
  },

  async markDismissed(promptKey: string): Promise<UserPromptState> {
    return api.post<UserPromptState>(`/api/v1/user/prompt-states/${promptKey}/dismiss`)
  },
}
