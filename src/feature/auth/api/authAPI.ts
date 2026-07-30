import type { LoginRequest, LoginResponse, RegisterRequest, UserResponse } from '../type/Auth'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api'

async function handleResponse<T>(res: Response): Promise<T> {
	if (!res.ok) {
		const errorData = await res.json().catch(() => ({ detail: res.statusText }))
		throw new Error(errorData.detail ?? 'Đã có lỗi xảy ra.')
	}
	return res.json() as Promise<T>
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
