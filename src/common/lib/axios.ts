import axios from 'axios';
import {
	clearClientAuthState,
	redirectToLogin,
	refreshAccessToken,
} from '@/common/lib/authSession';
import { getAccessToken } from '@/feature/auth/helper/authHelper';

const commonConfig = {
	baseURL: import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '/api',
	headers: { 'Content-Type': 'application/json' },
	withCredentials: true,
};
export const axiosBase = axios.create(commonConfig);

export const axiosJWT = axios.create(commonConfig);

// Automatically attach Bearer token from localStorage to every authenticated request
axiosJWT.interceptors.request.use(
	(config) => {
		const token = getAccessToken();
		if (token) {
			if (typeof (config.headers as any)?.set === 'function') {
				(config.headers as any).set('Authorization', `Bearer ${token}`);
			} else {
				config.headers = config.headers || {};
				config.headers.Authorization = `Bearer ${token}`;
			}
		}
		return config;
	},
	(error) => Promise.reject(error)
);

axiosJWT.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config;
		if (error.response?.status === 401 && !originalRequest._retry) {
			originalRequest._retry = true;
		try {
				await refreshAccessToken(); // Gọi API cấp lại token từ refresh-token cookie/storage
				const newToken = getAccessToken();
				if (newToken && originalRequest?.headers) {
					if (typeof (originalRequest.headers as any)?.set === 'function') {
						(originalRequest.headers as any).set('Authorization', `Bearer ${newToken}`);
					} else {
						originalRequest.headers.Authorization = `Bearer ${newToken}`;
					}
				}
				return axiosJWT(originalRequest); // Thực hiện lại request ban đầu
			} catch (refreshError) {
				// Nếu refresh token cũng hết hạn, chuyển hướng về login
				clearClientAuthState();
				redirectToLogin();
				return Promise.reject(refreshError);
			}
		}
		return Promise.reject(error);
	}
);
