import { completePlacementTest, fetchOnboardingStatus, type PlacementTestResultPayload } from './api/onboardingApi'

const ANONYMOUS_PLACEMENT_KEY = 'anonymous_placement_attempt'
const PLACEMENT_MODE_KEY = 'placement_test_mode'

export interface AnonymousPlacementAttempt {
  roleId: number
  answers: PlacementTestResultPayload[]
  completedAt: string
}

export function getPlacementMode(): 'anonymous' | 'authenticated' | null {
  const value = localStorage.getItem(PLACEMENT_MODE_KEY)
  if (value === 'anonymous' || value === 'authenticated') {
    return value
  }
  return null
}

export function setPlacementMode(mode: 'anonymous' | 'authenticated'): void {
  localStorage.setItem(PLACEMENT_MODE_KEY, mode)
}

export function clearPlacementMode(): void {
  localStorage.removeItem(PLACEMENT_MODE_KEY)
}

export function isAnonymousPlacementMode(): boolean {
  return getPlacementMode() === 'anonymous'
}

export function getPlacementReturnPath(): '/discover' | '/onboarding/role-selection' {
  return isAnonymousPlacementMode() ? '/discover' : '/onboarding/role-selection'
}

export function saveAnonymousPlacementAttempt(attempt: AnonymousPlacementAttempt): void {
  localStorage.setItem(ANONYMOUS_PLACEMENT_KEY, JSON.stringify(attempt))
}

export function getAnonymousPlacementAttempt(): AnonymousPlacementAttempt | null {
  try {
    const raw = localStorage.getItem(ANONYMOUS_PLACEMENT_KEY)
    return raw ? (JSON.parse(raw) as AnonymousPlacementAttempt) : null
  } catch {
    return null
  }
}

export function clearAnonymousPlacementAttempt(): void {
  localStorage.removeItem(ANONYMOUS_PLACEMENT_KEY)
}

function clearAnonymousPlacementState(): void {
  clearAnonymousPlacementAttempt()
  clearPlacementMode()
  localStorage.removeItem('pending_role_id')
  localStorage.removeItem('pending_survey_answers')
}

export async function syncAnonymousPlacementAttempt(): Promise<'none' | 'saved' | 'already_exists'> {
  const attempt = getAnonymousPlacementAttempt()
  if (!attempt) {
    return 'none'
  }

  const status = await fetchOnboardingStatus().catch(() => ({ learning_status: 'none' as const }))
  if (status.learning_status === 'enrolled') {
    clearAnonymousPlacementState()
    return 'already_exists'
  }

  try {
    await completePlacementTest({
      role_id: attempt.roleId,
      placement_test_answers: attempt.answers,
    })
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('already has a saved placement test score')
    ) {
      clearAnonymousPlacementState()
      return 'already_exists'
    }
    throw error
  }

  clearAnonymousPlacementState()
  return 'saved'
}
