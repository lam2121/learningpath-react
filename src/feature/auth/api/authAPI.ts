import { getStoredToken } from '@/common/context/AuthContext'
import type {
	LoginRequest,
	LoginResponse,
	RegisterRequest,
	StudySettingsUpdateRequest,
	UserProfileResponse,
	UserResponse,
	AICoachMessageRequest,
	AICoachMessageResponse,
} from '../type/Auth'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api'
const AUTH_URL = import.meta.env.VITE_AUTH_API_URL ?? 'http://localhost:8001/api/auth'

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

async function handleEmptyResponse(res: Response): Promise<void> {
	if (!res.ok) {
		const errorData = await res.json().catch(() => ({ detail: res.statusText }))
		throw new Error(errorData.detail ?? 'Đã có lỗi xảy ra.')
	}
}

/**
 * Register via Central Auth Service (Port 8001).
 */
export async function registerUser(data: RegisterRequest): Promise<UserResponse> {
	const res = await fetch(`${AUTH_URL}/register`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		credentials: 'include',
		body: JSON.stringify({
			email: data.email,
			username: data.username || data.name || data.email.split('@')[0],
			full_name: data.name,
			password: data.password,
			role: 'employee',
		}),
	})
	const responseData = await handleResponse<{ message: string; user: UserResponse }>(res)
	return responseData.user
}

/**
 * Login via Central Auth Service (Port 8001).
 * Supports both Email and Username.
 */
export async function loginUser(data: LoginRequest): Promise<LoginResponse> {
	const res = await fetch(`${AUTH_URL}/login`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		credentials: 'include',
		body: JSON.stringify({
			credential: data.identifier,
			password: data.password,
		}),
	})
	const authData = await handleResponse<{
		access_token: string
		refresh_token: string
		token_type: string
		user: {
			id: number
			email: string
			username?: string
			full_name?: string
			role: string
		}
	}>(res)

	const rawRole = String(authData.user?.role || (authData as any).role || '').trim().toLowerCase();
	const isAdmin = rawRole === 'admin' || rawRole === 'administrator' || (authData as any).role_id === 2 || (authData.user as any)?.role_id === 2;

	return {
		access_token: authData.access_token,
		token_type: authData.token_type || 'bearer',
		user_id: authData.user?.id || (authData as any).user_id,
		email: authData.user?.email || (authData as any).email,
		name: authData.user?.full_name || authData.user?.username || authData.user?.email || (authData as any).name,
		role_id: isAdmin ? 2 : 1,
	}
}

/**
 * Guest Login via Central Auth Service.
 */
export async function guestLoginUser(email: string, name?: string): Promise<LoginResponse> {
	const res = await fetch(`${AUTH_URL}/guest/login`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		credentials: 'include',
		body: JSON.stringify({ email, name }),
	})
	const authData = await handleResponse<{
		access_token: string
		refresh_token: string
		token_type: string
		user: {
			id: number
			email: string
			username?: string
			full_name?: string
			role: string
		}
	}>(res)

	return {
		access_token: authData.access_token,
		token_type: authData.token_type || 'bearer',
		user_id: authData.user.id,
		email: authData.user.email,
		name: authData.user.full_name || authData.user.username || authData.user.email,
		role_id: authData.user.role === 'admin' ? 2 : 1,
	}
}

/**
 * Logout from Central Auth Service (revokes refresh token and clears SSO cookies).
 */
export async function logoutUser(): Promise<void> {
	await fetch(`${AUTH_URL}/logout`, {
		method: 'POST',
		credentials: 'include',
	}).catch(() => {})
}

/**
 * Refresh Access Token from Central Auth Service via HttpOnly cookie.
 */
export async function refreshAccessToken(): Promise<{ access_token: string } | null> {
	try {
		const res = await fetch(`${AUTH_URL}/refresh-token`, {
			method: 'POST',
			credentials: 'include',
		})
		if (!res.ok) return null
		return await res.json()
	} catch {
		return null
	}
}

/**
 * Request Password Reset OTP from Central Auth Service.
 */
export async function requestPasswordOtp(credential: string): Promise<{ success: boolean; message: string; expires_in_minutes?: number }> {
	const res = await fetch(`${AUTH_URL}/password/otp`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ credential, credential_type: 'email' }),
	})
	return await handleResponse<{ success: boolean; message: string; expires_in_minutes?: number }>(res)
}

/**
 * Verify Password Reset OTP with Central Auth Service.
 */
export async function verifyPasswordOtp(email: string, otp: string): Promise<{ success: boolean; token: string; message: string }> {
	const res = await fetch(`${AUTH_URL}/password/otp/verify`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email, otp, purpose: 'reset_password' }),
	})
	return await handleResponse<{ success: boolean; token: string; message: string }>(res)
}

/**
 * Reset Password using verified action token in Central Auth Service.
 */
export async function resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
	const res = await fetch(`${AUTH_URL}/password/reset`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ token, new_password: newPassword }),
	})
	return await handleResponse<{ message: string }>(res)
}

/**
 * Fetch CareerPath User Profile & Learning Roadmap from CareerPath Backend (Port 8005).
 */
export async function fetchCurrentUserProfile(): Promise<UserProfileResponse> {
	const cacheBuster = Date.now()
	const res = await fetch(`${BASE_URL}/user/me?_=${cacheBuster}`, {
		method: 'GET',
		headers: {
			...authHeaders(),
			'Cache-Control': 'no-cache, no-store, max-age=0',
			Pragma: 'no-cache',
		},
		cache: 'no-store',
	})
	return await handleResponse<UserProfileResponse>(res)
}

/**
 * Update daily study time target (60, 120, 180, 240, 300, 360 mins)
 */
export async function updateDailyStudyMinutes(minutes: number): Promise<UserProfileResponse> {
	const res = await fetch(`${BASE_URL}/user/me/study-settings`, {
		method: 'PATCH',
		headers: {
			'Content-Type': 'application/json',
			...authHeaders(),
		},
		body: JSON.stringify({ daily_study_minutes: minutes }),
	})
	return await handleResponse<UserProfileResponse>(res)
}

export async function updateStudySettings(
	data: StudySettingsUpdateRequest,
): Promise<UserProfileResponse> {
	return updateDailyStudyMinutes(data.daily_study_minutes)
}

/**
 * Reset career track / roadmap so the user can retake onboarding.
 */
export async function resetUserCareerTrack(): Promise<void> {
	const res = await fetch(`${BASE_URL}/user/me/career-track`, {
		method: 'DELETE',
		headers: authHeaders(),
	})
	return handleEmptyResponse(res)
}

export async function deleteCareerTrack(): Promise<void> {
	return resetUserCareerTrack()
}

/**
 * Generate AI Coach weekly message from prompt E1 via backend.
 */
export async function generateAICoachMessage(payload: AICoachMessageRequest): Promise<AICoachMessageResponse> {
	const res = await fetch(`${BASE_URL}/user/me/ai-coach-message`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			...authHeaders(),
		},
		body: JSON.stringify(payload),
	})
	return await handleResponse<AICoachMessageResponse>(res)
}
