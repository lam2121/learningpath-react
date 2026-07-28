import axios from 'axios';

export const axiosBase = axios.create({
	baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
	headers: { 'Content-Type': 'application/json' }
});

export const axiosJWT = axios.create({
	baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
	headers: { 'Content-Type': 'application/json' }
});

axiosJWT.interceptors.request.use((config) => {
	const token = localStorage.getItem('auth_access_token');
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});