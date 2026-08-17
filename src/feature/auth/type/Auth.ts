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

export interface UserProfileResponse extends UserResponse {
	started_at: string | null
	estimated_finish: string | null
	total_estimated_minutes: number
	daily_study_minutes: number
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
