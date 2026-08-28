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
import type { AuthUser } from "@/common/context/AuthContext";
import {
	fetchWithAuthRetry,
	refreshAccessToken as refreshAuthSession,
} from "@/common/lib/authSession";
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api'
const AUTH_URL = import.meta.env.VITE_AUTH_API_URL ?? 'http://localhost:8001/api/auth'

function jsonHeaders(): HeadersInit {
	return {
		'Content-Type': 'application/json',
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
			username: data.username?.trim() || data.name || data.email.split('@')[0],
			full_name: data.name,
			password: data.password,
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
		headers: jsonHeaders(),
		credentials: 'include',
		body: JSON.stringify({
			credential: data.identifier,
			password: data.password,
		}),
	})
	const authData = await handleResponse<{
		message?: string
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
		user_id: authData.user.id,
		email: authData.user.email,
		name: authData.user.full_name || authData.user.username || authData.user.email,
		role_id: isAdmin ? 2 : 1,
	}
}
/**
 * Logout from Central Auth Service (revokes refresh token and clears SSO cookies).
 * Local auth state is cleared by AuthContext even if this request fails.
 */
export async function logoutUser(): Promise<void> {
	await fetch(`${AUTH_URL}/logout`, {
		method: 'POST',
		credentials: 'include',
	}).catch(() => { })
}

/**
 * Refresh cookie-backed auth state via HttpOnly cookies.
 */
export async function refreshAccessToken(): Promise<void> {
	return refreshAuthSession()
}

/**
 * Fetch CareerPath User Profile & Learning Roadmap from CareerPath Backend (Port 8005).
 */
export async function fetchCurrentUserProfile(
	options: { redirectOnAuthFailure?: boolean } = {},
): Promise<UserProfileResponse> {
	const cacheBuster = Date.now()
	const res = await fetchWithAuthRetry(`${BASE_URL}/user/me?_=${cacheBuster}`, {
		method: 'GET',
		headers: {
			...jsonHeaders(),
			'Cache-Control': 'no-cache, no-store, max-age=0',
			Pragma: 'no-cache',
		},
		cache: 'no-store',
		redirectOnAuthFailure: options.redirectOnAuthFailure,
	})
	return await handleResponse<UserProfileResponse>(res)
}

/**
 * Update daily study time target (60, 120, 180, 240, 300, 360 mins)
 */
export async function updateDailyStudyMinutes(minutes: number): Promise<UserProfileResponse> {
	const res = await fetchWithAuthRetry(`${BASE_URL}/user/me/study-settings`, {
		method: 'PATCH',
		headers: {
			...jsonHeaders(),
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
	const res = await fetchWithAuthRetry(`${BASE_URL}/user/me/career-track`, {
		method: 'DELETE',
		headers: jsonHeaders(),
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
	const res = await fetchWithAuthRetry(`${BASE_URL}/user/me/ai-coach-message`, {
		method: 'POST',
		headers: {
			...jsonHeaders(),
		},
		body: JSON.stringify(payload),
	})
	return await handleResponse<AICoachMessageResponse>(res)
}
export async function getCurrentUser(): Promise<AuthUser> {
	const profile = await fetchCurrentUserProfile();
	return {
		id: profile.id,
		username: profile.name || profile.email.split('@')[0],
		email: profile.email,
		role: Number(profile.role_id) === 2 ? 'admin' : 'employee',
		role_id: profile.role_id,
	};
}

/**
 * Đăng xuất khỏi Central Auth Service và xóa cookie.
 */
export async function logout(): Promise<void> {
	await logoutUser();
}
