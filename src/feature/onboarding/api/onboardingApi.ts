import { getStoredToken } from '@/common/context/AuthContext'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api'

export type SkillAxis = 'D_doc' | 'C_comm' | 'T_trouble' | 'G_biz'

export interface SubQuestionOption {
  id: string
  label: string
}

export interface SubQuestion {
  question: string
  options: SubQuestionOption[]
}

export interface SurveyQuestion {
  id: string
  axis: SkillAxis
  question: string
  context: string
  subQuestion?: SubQuestion
}

export interface SurveyAnswerPayload {
  survey_id: number
  rating: number
  sub_answer: string | null
}

export interface SubmitSurveyRequest {
  user_id: number
  answers: SurveyAnswerPayload[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build headers with Authorization Bearer token when a session exists. */
function authHeaders(): HeadersInit {
  const token = getStoredToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(errorData.detail ?? 'Đã có lỗi xảy ra.')
  }
  return res.json() as Promise<T>
}

// ─── Survey API ───────────────────────────────────────────────────────────────

/** Fetch all active survey questions. Requires a valid session token. */
export async function fetchSurveyQuestions(): Promise<SurveyQuestion[]> {
  const res = await fetch(`${BASE_URL}/onboarding/surveys`, {
    method: 'GET',
    headers: authHeaders(),
  })
  return handleResponse<SurveyQuestion[]>(res)
}

/** Submit the user's survey answers. Requires a valid session token. */
export async function submitSurveyAnswers(
  payload: SubmitSurveyRequest,
): Promise<{ message: string; recorded_count: number }> {
  const res = await fetch(`${BASE_URL}/onboarding/surveys/submit`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  })
  return handleResponse<{ message: string; recorded_count: number }>(res)
}

export interface OnboardingStatus {
  user_id: number
  has_completed_survey: boolean
}

/** Check if current user has completed onboarding survey. */
export async function fetchOnboardingStatus(): Promise<OnboardingStatus> {
  const res = await fetch(`${BASE_URL}/onboarding/status`, {
    method: 'GET',
    headers: authHeaders(),
  })
  return handleResponse<OnboardingStatus>(res)
}

