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
  is_finished_placement_test: boolean
}

/** Check if current user has completed onboarding survey and placement test. */
export async function fetchOnboardingStatus(): Promise<OnboardingStatus> {
  const res = await fetch(`${BASE_URL}/onboarding/status`, {
    method: 'GET',
    headers: authHeaders(),
  })
  return handleResponse<OnboardingStatus>(res)
}

export interface CompletePlacementTestPayload {
  user_id?: number
  role_id?: number | null
  survey_answers?: SurveyAnswerPayload[] | null
}

/** Finalize onboarding by committing survey answers, role_id, and setting is_finished_placement_test = True. */
export async function completePlacementTest(
  payload: CompletePlacementTestPayload,
): Promise<{ message: string; is_finished_placement_test: boolean }> {
  const res = await fetch(`${BASE_URL}/onboarding/placement-test/complete`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  })
  return handleResponse<{ message: string; is_finished_placement_test: boolean }>(res)
}


// ─── Job Role API ─────────────────────────────────────────────────────────────

export interface JobRoleBaseline {
  D_doc?: number
  C_comm?: number
  T_trouble?: number
  G_custom?: number
}

export interface JobRole {
  id: number
  name: string
  baseline: JobRoleBaseline
  example_question: string[] | null
}

/** Fetch all job roles from database. No auth required. */
export async function fetchJobRoles(): Promise<JobRole[]> {
  const res = await fetch(`${BASE_URL}/onboarding/job-roles`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })
  return handleResponse<JobRole[]>(res)
}

// ─── Placement Test Questions API ─────────────────────────────────────────────

export interface RawPlacementQuestionApi {
  id: number
  skill: 'D' | 'C' | 'T' | 'G'
  level: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
  statement: string
  options: string[]
  correct_answer: string
}

/**
 * Fetch all placement test questions for a given job role from the database.
 * The frontend adaptive engine will select 24 questions from this pool.
 */
export async function fetchPlacementTestQuestions(
  roleId: number,
): Promise<RawPlacementQuestionApi[]> {
  const res = await fetch(
    `${BASE_URL}/onboarding/placement-test/questions?role_id=${roleId}`,
    {
      method: 'GET',
      headers: authHeaders(),
    },
  )
  return handleResponse<RawPlacementQuestionApi[]>(res)
}
