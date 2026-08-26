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

// ─── Dev-mode types (mirrors backend roadmap_schema.py) ───────────────────────

export interface SkillDifficultyBreakdown {
  easy: number   // 0-4 correct on Easy questions
  medium: number // 0-4 correct on Medium questions
  hard: number   // 0-4 correct on Hard questions
}

export type SkillScores = Record<string, SkillDifficultyBreakdown>

export interface DevLesson {
  id: number
  title: string
  primary_skill: string
  difficulty_tier: string
  is_generated: boolean
  is_unlocked: boolean
  theory_content: unknown | null
  quiz_content: unknown | null
}

export interface DevTopic {
  id: number
  name: string
  primary_skill: string
  seed_tier: string
  sort_order: number
  lessons: DevLesson[]
}

export interface DevRoadmap {
  track: string
  topics: DevTopic[]
  assigned_lessons: Record<string, number>
}

export interface GenerateLessonResult {
  lesson_id: number
  status: string
  message: string
}

// ─── Dev-mode API (dev harness, §12.9) ────────────────────────────────────────

/**
 * Force-recompute the roadmap from skill-score sliders (dev-mode only, skips
 * placement answers). `roleId` is required so a user who has not finished
 * placement can still get a roadmap. Backend returns 404 in production.
 */
export async function devGenerateCourse(
  roleId: number,
  skills: SkillScores,
): Promise<DevRoadmap> {
  const res = await fetch(`${BASE_URL}/onboarding/roadmap/select`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ role_id: roleId, skills }),
  })
  return handleResponse<DevRoadmap>(res)
}

/** Fetch the current user's roadmap with lessons inline (auto-computes when empty). */
export async function fetchDevRoadmap(): Promise<DevRoadmap> {
  const res = await fetch(`${BASE_URL}/onboarding/roadmap`, {
    method: 'GET',
    headers: authHeaders(),
  })
  return handleResponse<DevRoadmap>(res)
}

/**
 * Synchronously generate C-1 (theory) + C-2 (quiz) for one lesson of the
 * caller's roadmap. Dev-gated (404 in production). Optional `force=true`
 * clears + regenerates an already-generated lesson.
 */
export async function generateDevLesson(
  lessonId: number,
  force = false,
): Promise<GenerateLessonResult> {
  const res = await fetch(
    `${BASE_URL}/onboarding/roadmap/lessons/${lessonId}/generate${force ? '?force=true' : ''}`,
    {
      method: 'POST',
      headers: authHeaders(),
    },
  )
  return handleResponse<GenerateLessonResult>(res)
}
