
import { fetchWithAuthRetry } from "@/common/lib/authSession";

export const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api'

function defaultHeaders(): HeadersInit {
	return {
		'Content-Type': 'application/json',
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
	is_unlocked: boolean
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

export interface LessonQuizAnswerSubmission {
	question_id: string
	question_type: 'fill_blank' | 'multi_select' | 'ordering'
	answer: string
	used_hint: boolean
}

export interface LessonQuizQuestionResult {
	question_id: string
	question_type: 'fill_blank' | 'multi_select' | 'ordering'
	question_text: string
	options: string[]
	user_answer: string
	correct_answer: string
	explanation: string
	is_correct: boolean
	used_hint: boolean
}

export interface LessonQuizSavedAnswer {
	question_id: string
	question_type: 'fill_blank' | 'multi_select' | 'ordering'
	answer: string
	used_hint: boolean
}

export interface LessonQuizStateResponse {
	lesson_id: number
	skill: string
	status: string
	lesson_passed: boolean
	best_score_percent: number
	attempt_count: number
	failed_attempts: number
	completed_at: string | null
	current_skill_score: number | null
	first_pass_score_percent: number | null
}

export interface LessonQuizSubmitResponse extends LessonQuizStateResponse {
	current_attempt_passed: boolean
	weighted_score_percent: number
	correct_no_hint_count: number
	correct_with_hint_count: number
	total_questions: number
	first_pass_radar_applied: boolean
	current_attempt_is_new_best: boolean
	question_results: LessonQuizQuestionResult[]
}

export interface LessonQuizResultDetailResponse {
	lesson_id: number
	lesson_title: string
	topic_name: string | null
	skill: string
	difficulty_tier: string
	status: string
	best_score_percent: number | null
	attempt_count: number
	failed_attempts: number
	correct_no_hint_count: number
	total_no_hint_questions: number
	correct_with_hint_count: number
	total_with_hint_questions: number
	total_questions: number
	recorded_at: string | null
	question_order: string[]
	answers: LessonQuizSavedAnswer[]
	question_results: LessonQuizQuestionResult[]
}
export interface EvaluateAnswerRequest {
	section_type: 'reading' | 'dialogue' | 'listening'
	context: string
	question: string
	reference_answer: string
	user_answer: string
}
export interface EvaluateAnswerResponse {
	feedback_summary: string
}
export async function fetchRoadmap(): Promise<RoadmapResponse> {
	const res = await fetchWithAuthRetry(`${BASE_URL}/onboarding/roadmap`, {
		method: 'GET',
		headers: defaultHeaders(),
		cache: 'no-store',
	})
	return handleResponse<RoadmapResponse>(res)
}

export function buildRoadmapNotificationStreamUrl(): string {
	return `${BASE_URL}/onboarding/roadmap/notifications/stream`
}

export async function kickoffRoadmapLessonGeneration(
	lessonId: number,
	force = false,
): Promise<LessonGenerateResponse> {
	const suffix = force ? '?force=true' : ''
	const res = await fetchWithAuthRetry(`${BASE_URL}/onboarding/roadmap/lessons/${lessonId}/generate${suffix}`, {
		method: 'POST',
		headers: defaultHeaders(),
	})
	return handleResponse<LessonGenerateResponse>(res)
}

export async function fetchLessonQuizState(
	lessonId: number,
): Promise<LessonQuizStateResponse> {
	const res = await fetchWithAuthRetry(`${BASE_URL}/onboarding/roadmap/lessons/${lessonId}/quiz`, {
		method: 'GET',
		headers: defaultHeaders(),
	})
	return handleResponse<LessonQuizStateResponse>(res)
}

export async function submitLessonQuiz(
	lessonId: number,
	payload: {
		question_order: string[]
		answers: LessonQuizAnswerSubmission[]
	},
): Promise<LessonQuizSubmitResponse> {
	const res = await fetchWithAuthRetry(
		`${BASE_URL}/onboarding/roadmap/lessons/${lessonId}/quiz/submit`,
		{
			method: 'POST',
			headers: defaultHeaders(),
			body: JSON.stringify(payload),
		},
	)
	return handleResponse<LessonQuizSubmitResponse>(res)
}

export async function fetchLessonQuizResultDetail(
	lessonId: number,
): Promise<LessonQuizResultDetailResponse> {
	const res = await fetchWithAuthRetry(
		`${BASE_URL}/onboarding/roadmap/lessons/${lessonId}/quiz/result`,
		{
			method: 'GET',
			headers: defaultHeaders(),
			cache: 'no-store',
		},
	)
	return handleResponse<LessonQuizResultDetailResponse>(res)
}

export async function evaluateAnswer(
	payload: EvaluateAnswerRequest,
): Promise<EvaluateAnswerResponse> {
	const res = await fetchWithAuthRetry(`${BASE_URL}/onboarding/roadmap/evaluate-answer`, {
		method: 'POST',
		headers: defaultHeaders(),
		body: JSON.stringify(payload),
	})
	return handleResponse<EvaluateAnswerResponse>(res)
}
