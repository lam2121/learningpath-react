import { fetchWithAuthRetry } from "@/common/lib/authSession";
import type {
	FillBlankQuestionData,
	MultiSelectQuestionData,
	OrderingQuestionData,
} from "@/feature/quiz-engine/type/Quiz";

export const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'

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
	is_completed?: boolean
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
	topic_quiz_status?: 'locked' | 'ready' | 'passed' | 'failed'
	topic_quiz_score?: number | null
	topic_quiz_attempt_count?: number
	weakest_lesson_ids?: number[]
	lessons: RoadmapLesson[]
}

export interface RoadmapResponse {
	track: string
	topics: RoadmapTopic[]
	assigned_lessons: Record<string, number>
	total_estimated_minutes: number
	final_quiz_status?: 'locked' | 'ready' | 'passed' | 'failed'
	final_quiz_score?: number | null
	final_quiz_attempt_count?: number
	all_topic_quizzes_passed?: boolean
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

// ─── Topic Quiz API (Spec §4.2, §4.4) ────────────────────────────────────────
//
// NOTE: Topic Quiz questions now share the same fill_blank / multi_select /
// ordering row shape as lesson quizzes (see quiz-engine's Quiz types). There
// is no `difficulty` field anywhere in this section.

export type TopicQuizQuestionType = 'fill_blank' | 'multi_select' | 'ordering'

export interface TopicQuizQuestion {
	id: string
	question_number: number
	skill: string
	question_type: TopicQuizQuestionType
	data: FillBlankQuestionData | MultiSelectQuestionData | OrderingQuestionData
	lesson_id: number
	lesson_title: string
}

export interface TopicQuizAnswerSubmission {
	question_id: string
	question_type: TopicQuizQuestionType
	answer: string
}

export interface TopicQuizQuestionResult {
	question_id: string
	question_type: TopicQuizQuestionType
	question_text: string
	options: string[]
	user_answer: string
	correct_answer: string
	explanation: string
	is_correct: boolean
	lesson_id: number
	lesson_title: string
	skill?: string | null
}

export interface WeakestLessonSummary {
	lesson_id: number
	title: string
	correct_count: number
	total_count: number
	accuracy_percent: number
}

export interface TopicQuizSubmitResponse {
	topic_id: number
	topic_name: string
	passed: boolean
	score_percent: number
	correct_count: number
	total_questions: number
	status: 'passed' | 'failed'
	attempt_count: number
	failed_attempts: number
	weakest_lessons: WeakestLessonSummary[]
	question_results: TopicQuizQuestionResult[]
	skill_scores?: Record<string, number> | null
}

export interface TopicQuizStateResponse {
	topic_id: number
	topic_name: string
	is_unlocked: boolean
	status: 'locked' | 'ready' | 'passed' | 'failed'
	attempt_count: number
	failed_attempts: number
	best_score_percent: number | null
	last_score_percent: number | null
	weakest_lessons: WeakestLessonSummary[]
	total_assigned_lessons: number
	completed_assigned_lessons: number
	latest_attempt?: TopicQuizSubmitResponse | null
	best_attempt?: TopicQuizSubmitResponse | null
	first_pass?: TopicQuizSubmitResponse | null
}

export async function fetchTopicQuizQuestions(
	topicId: number,
	forceNew: boolean = false,
): Promise<TopicQuizQuestion[]> {
	const query = forceNew ? '?new_attempt=true' : ''
	const res = await fetchWithAuthRetry(
		`${BASE_URL}/onboarding/topics/${topicId}/quiz/questions${query}`,
		{
			method: 'GET',
			headers: defaultHeaders(),
			cache: 'no-store',
		},
	)
	return handleResponse<TopicQuizQuestion[]>(res)
}

export async function submitTopicQuiz(
	topicId: number,
	answers: TopicQuizAnswerSubmission[],
): Promise<TopicQuizSubmitResponse> {
	const res = await fetchWithAuthRetry(
		`${BASE_URL}/onboarding/topics/${topicId}/quiz/submit`,
		{
			method: 'POST',
			headers: defaultHeaders(),
			body: JSON.stringify({ answers }),
		},
	)
	return handleResponse<TopicQuizSubmitResponse>(res)
}

export async function fetchTopicQuizState(
	topicId: number,
): Promise<TopicQuizStateResponse> {
	const res = await fetchWithAuthRetry(
		`${BASE_URL}/onboarding/topics/${topicId}/quiz/state`,
		{
			method: 'GET',
			headers: defaultHeaders(),
			cache: 'no-store',
		},
	)
	return handleResponse<TopicQuizStateResponse>(res)
}

export interface FinalQuizQuestion {
	id: string
	question_number: number
	skill: string
	question_type: 'fill_blank' | 'multi_select' | 'ordering'
	data: FillBlankQuestionData | MultiSelectQuestionData | OrderingQuestionData
	lesson_id: number
	lesson_title: string
	topic_id?: number | null
	topic_name?: string | null
}

export interface FinalQuizAnswerSubmission {
	question_id: string
	question_type: 'fill_blank' | 'multi_select' | 'ordering'
	answer: string
}

export interface FinalQuizQuestionResult {
	question_id: string
	question_type: 'fill_blank' | 'multi_select' | 'ordering'
	question_text: string
	options: string[]
	user_answer: string
	correct_answer: string
	explanation: string
	is_correct: boolean
	lesson_id: number
	lesson_title: string
	skill: string
}

export interface FinalQuizSkillScore {
	skill: string
	label: string
	correct_count: number
	total_count: number
	accuracy_percent: number
	passed: boolean
}

export interface FinalQuizSubmitResponse {
	passed: boolean
	score_percent: number
	correct_count: number
	total_questions: number
	status: 'passed' | 'failed'
	attempt_count: number
	failed_attempts: number
	skill_scores: Record<string, number>
	skill_breakdown: FinalQuizSkillScore[]
	weakest_lessons: WeakestLessonSummary[]
	question_results: FinalQuizQuestionResult[]
}

export interface FinalQuizStateResponse {
	is_unlocked: boolean
	status: 'locked' | 'ready' | 'passed' | 'failed'
	attempt_count: number
	failed_attempts: number
	best_score_percent: number | null
	last_score_percent: number | null
	passed: boolean
	total_topics: number
	completed_topics: number
	skill_scores: Record<string, number> | null
	skill_breakdown: FinalQuizSkillScore[]
	weakest_lessons: WeakestLessonSummary[]
	latest_attempt?: FinalQuizSubmitResponse | null
	best_attempt?: FinalQuizSubmitResponse | null
	first_pass?: FinalQuizSubmitResponse | null
}

export async function fetchFinalQuizQuestions(
	forceNew: boolean = false,
): Promise<FinalQuizQuestion[]> {
	const query = forceNew ? '?new_attempt=true' : ''
	const res = await fetchWithAuthRetry(
		`${BASE_URL}/onboarding/final-quiz/questions${query}`,
		{
			method: 'GET',
			headers: defaultHeaders(),
			cache: 'no-store',
		},
	)
	return handleResponse<FinalQuizQuestion[]>(res)
}

export async function submitFinalQuiz(
	answers: FinalQuizAnswerSubmission[],
): Promise<FinalQuizSubmitResponse> {
	const res = await fetchWithAuthRetry(
		`${BASE_URL}/onboarding/final-quiz/submit`,
		{
			method: 'POST',
			headers: defaultHeaders(),
			body: JSON.stringify({ answers }),
		},
	)
	return handleResponse<FinalQuizSubmitResponse>(res)
}

export async function fetchFinalQuizState(): Promise<FinalQuizStateResponse> {
	const res = await fetchWithAuthRetry(
		`${BASE_URL}/onboarding/final-quiz/state`,
		{
			method: 'GET',
			headers: defaultHeaders(),
			cache: 'no-store',
		},
	)
	return handleResponse<FinalQuizStateResponse>(res)
}