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

export async function registerUser(data: RegisterRequest): Promise<UserResponse> {
	const res = await fetch(`${BASE_URL}/auth/register`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	})
	return handleResponse<UserResponse>(res)
}

export async function loginUser(data: LoginRequest): Promise<LoginResponse> {
	// FastAPI OAuth2 form expects application/x-www-form-urlencoded
	const formBody = new URLSearchParams({
		username: data.identifier,
		password: data.password,
	})
	const res = await fetch(`${BASE_URL}/auth/login`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: formBody.toString(),
	})
	return handleResponse<LoginResponse>(res)
}

export async function fetchCurrentUserProfile(): Promise<UserProfileResponse> {
	const cacheBuster = Date.now()
	const res = await fetch(`${BASE_URL}/auth/me?_=${cacheBuster}`, {
		method: 'GET',
		headers: {
			...authHeaders(),
			'Cache-Control': 'no-cache, no-store, max-age=0',
			Pragma: 'no-cache',
		},
		cache: 'no-store',
	})
	return handleResponse<UserProfileResponse>(res)
}

export async function updateStudySettings(
	data: StudySettingsUpdateRequest,
): Promise<UserProfileResponse> {
	const res = await fetch(`${BASE_URL}/auth/me/study-settings`, {
		method: 'PATCH',
		headers: authHeaders(),
		body: JSON.stringify(data),
	})
	return handleResponse<UserProfileResponse>(res)
}

export async function deleteCareerTrack(): Promise<void> {
	const res = await fetch(`${BASE_URL}/auth/me/career-track`, {
		method: 'DELETE',
		headers: authHeaders(),
	})
	return handleEmptyResponse(res)
}

export async function generateAICoachMessage(
	data: AICoachMessageRequest,
): Promise<AICoachMessageResponse> {
	const res = await fetch(`${BASE_URL}/auth/me/ai-coach-message`, {
		method: 'POST',
		headers: authHeaders(),
		body: JSON.stringify(data),
	})
	return handleResponse<AICoachMessageResponse>(res)
}
