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
  learning_status: 'none' | 'enrolled'
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
  selected_text?: string;
  is_correct: boolean;
  axis: string;
  difficulty: string;
}

export interface CompletePlacementTestPayload {
  user_id?: number
  role_id?: number | null
  placement_test_answers?: PlacementTestResultPayload[] | null
}

/** Finalize onboarding by committing role_id and placement test answers. */
export async function completePlacementTest(
  payload: CompletePlacementTestPayload,
): Promise<{ message: string; learning_status: 'enrolled' }> {
  const res = await fetch(`${BASE_URL}/onboarding/placement-test/complete`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  })
  return handleResponse<{ message: string; learning_status: 'enrolled' }>(res)
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
  is_active?: boolean
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
  level: string  // Easy | Medium | Hard | Expert
  statement: string
  options: string[]
  correct_answer: string
}

/** Placement test result detail for a single question */
export interface PlacementAnswerDetail {
  question_id: number
  axis: string            // v2.1 tag: D_doc | C_comm | T_trouble | G_custom
  level: string           // Easy | Medium | Hard | Expert
  statement: string
  options: string[]       // 4 plain-text options
  correct_answer: string  // exact text of the correct option
  selected_id: string     // letter: 'a' | 'b' | 'c' | 'd'
  selected_text?: string  // exact text of the option the user picked
  is_correct: boolean
}

/** Placement test result response */
export interface PlacementResult {
  learning_status: 'none' | 'enrolled'
  total_questions: number
  total_correct: number
  overall_percent: number
  skill_scores: Record<string, number>  // {D_doc: 75, C_comm: 80, T_trouble: 60, G_custom: 50}
  starting_level: string               // 'basic' | 'intermediate' | 'advanced'
  weak_skills: string[]               // list of skill tags where score < 0.5, weakest first
  role_id: number | null
  role_name: string | null
  baseline: Record<string, number> | null  // {D_doc: 20, C_comm: 20, T_trouble: 50, G_custom: 10}
  answers: PlacementAnswerDetail[]
  radar_score?: {
    start_vector: Record<string, number>
    current_vector: Record<string, number>
    prev_stack: Record<string, number[]>
  } | null
}

/** Fetch the current user's placement test result (scores, starting level, per-question detail) */
export async function fetchPlacementTestResult(): Promise<PlacementResult> {
  const res = await fetch(`${BASE_URL}/onboarding/placement-test/result`, {
    method: 'GET',
    headers: authHeaders(),
  })
  return handleResponse<PlacementResult>(res)
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
