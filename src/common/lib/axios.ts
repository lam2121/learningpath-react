import axios from 'axios';
import {
	clearClientAuthState,
	redirectToLogin,
	refreshAccessToken,
} from '@/common/lib/authSession';
const commonConfig = {
	baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
	headers: { 'Content-Type': 'application/json' },
	withCredentials: true,
};
export const axiosBase = axios.create(commonConfig);

export const axiosJWT = axios.create(commonConfig);
axiosJWT.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config;
		if (error.response?.status === 401 && !originalRequest._retry) {
			originalRequest._retry = true;
			try {
				await refreshAccessToken(); // Gọi API cấp lại token từ refresh-token cookie
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
