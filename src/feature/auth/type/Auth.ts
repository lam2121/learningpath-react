// ── Request types ───────────────────────────────────────────────
export interface RegisterRequest {
	email: string
	name: string
	password: string
}

export interface LoginRequest {
	identifier: string
	password: string
}

// ── Response types ──────────────────────────────────────────────
export interface UserResponse {
	id: number
	email: string
	name: string
	role_id: number | null
	created_at: string
}

export interface StudyHistoryEntryResponse {
	studied_on: string
	minutes: number
}

export interface LessonQuizHistoryEntryResponse {
	lesson_id: number
	lesson_title: string
	topic_name: string | null
	topic_sort_order?: number | null
	skill: string
	difficulty_tier: string
	status: string
	best_score_percent: number | null
	passed: boolean
	attempt_count: number
	failed_attempts: number
	correct_no_hint_count: number
	total_no_hint_questions: number
	correct_with_hint_count: number
	total_with_hint_questions: number
	total_questions: number
	recorded_at: string | null
	completed_at: string | null
	last_submitted_at: string | null
}

export interface UserProfileResponse extends UserResponse {
	started_at: string | null
	estimated_finish: string | null
	total_estimated_minutes: number
	daily_study_minutes: number
	total_studied_minutes: number
	study_history: StudyHistoryEntryResponse[]
	lesson_quiz_history?: LessonQuizHistoryEntryResponse[]
	initial_skill_scores?: Record<string, number> | null
	current_skill_scores?: Record<string, number> | null
}

export interface StudySettingsUpdateRequest {
	daily_study_minutes: number
}

export interface LoginResponse {
	access_token: string
	token_type: string
	user_id: number
	email: string
	name: string
	role_id: number | null
}

export interface AICoachMessageRequest {
	day_streak: number
	lesson_learner: number
	total_lesson_in_track: number
	accuracy: number
	daily_study_per_day: number
}

export interface AICoachMessageResponse {
	feedback_summary: string
}

