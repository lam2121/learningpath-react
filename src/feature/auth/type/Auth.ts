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

export interface UserProfileResponse extends UserResponse {
	started_at: string | null
	estimated_finish: string | null
	total_estimated_minutes: number
	daily_study_minutes: number
	total_studied_minutes: number
	study_history: StudyHistoryEntryResponse[]
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
