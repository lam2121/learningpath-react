import { getStoredToken } from '@/common/context/AuthContext'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api'

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
		throw new Error(errorData.detail ?? 'Failed to load roadmap.')
	}
	return res.json() as Promise<T>
}

export interface RoadmapLesson {
	id: number
	title: string
	primary_skill: string
	difficulty_tier: string
	estimated_minutes: number | null
	is_generated: boolean
	theory_content: unknown | null
	quiz_content: unknown | null
}

export interface RoadmapTopic {
	id: number
	name: string
	primary_skill: string
	seed_tier: string
	sort_order: number
	total_estimated_minutes: number
	lessons: RoadmapLesson[]
}

export interface RoadmapResponse {
	track: string
	topics: RoadmapTopic[]
	assigned_lessons: Record<string, number>
	total_estimated_minutes: number
}

export interface LessonGenerateResponse {
	lesson_id: number
	status: string
	message: string
}

export async function fetchRoadmap(): Promise<RoadmapResponse> {
	const res = await fetch(`${BASE_URL}/onboarding/roadmap`, {
		method: 'GET',
		headers: authHeaders(),
	})
	return handleResponse<RoadmapResponse>(res)
}

export async function kickoffRoadmapLessonGeneration(
	lessonId: number,
	force = false,
): Promise<LessonGenerateResponse> {
	const suffix = force ? '?force=true' : ''
	const res = await fetch(`${BASE_URL}/onboarding/roadmap/lessons/${lessonId}/generate${suffix}`, {
		method: 'POST',
		headers: authHeaders(),
	})
	return handleResponse<LessonGenerateResponse>(res)
}
