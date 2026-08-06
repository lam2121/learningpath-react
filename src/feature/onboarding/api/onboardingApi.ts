import { getStoredToken } from '@/common/context/AuthContext'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api'

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

// ─── Onboarding status ─────────────────────────────────────────────────────────

export interface OnboardingStatus {
  user_id: number
  is_finished_placement_test: boolean
}

/** Check if the current user has finished the placement test. */
export async function fetchOnboardingStatus(): Promise<OnboardingStatus> {
  const res = await fetch(`${BASE_URL}/onboarding/status`, {
    method: 'GET',
    headers: authHeaders(),
  })
  return handleResponse<OnboardingStatus>(res)
}

// ─── Placement Test API ───────────────────────────────────────────────────────

export interface PlacementTestResultPayload {
  question_id: number;
  selected_id: string;
  is_correct: boolean;
  axis: string;
  difficulty: number;
}

export interface CompletePlacementTestPayload {
  user_id?: number
  role_id?: number | null
  placement_test_answers?: PlacementTestResultPayload[] | null
}

/** Finalize onboarding by committing role_id and placement test answers. */
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
  job_description?: string | null
  baseline: JobRoleBaseline
  g_skill_description?: string | null
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
 * The frontend adaptive engine will select questions from this pool.
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
