export const APP_NAME = import.meta.env.VITE_APP_NAME || 'CareerPath AI';
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '/api';
export const AUTH_BASE_URL = import.meta.env.VITE_AUTH_API_URL || '/api/auth';
export const BASE_PATH = (import.meta.env.VITE_BASE_PATH || '/careerpath').replace(/\/+$/, '') || '/';

export function getAppPath(subPath: string): string {
	const clean = subPath.startsWith('/') ? subPath : `/${subPath}`;
	return BASE_PATH === '/' ? clean : `${BASE_PATH}${clean}`;
}

export const TMA_INFO = {
	name: import.meta.env.VITE_COMPANY_NAME || 'TMA Solutions',
	domain: import.meta.env.VITE_COMPANY_DOMAIN || 'tma.com.vn',
	supportEmail: import.meta.env.VITE_SUPPORT_EMAIL || 'support@tma.com.vn',
	HOME_PAGE: import.meta.env.VITE_HOME_PAGE_URL || 'https://tma.com.vn',
	SMART_LEARNING: import.meta.env.VITE_SMART_LEARNING_URL || 'https://smartlearning.tma.com.vn'
} as const;

export const APP_INFO = {
	name: 'CareerPath',
	APP_NAME: 'CareerPath',
	version: '1.0.0',
	description: 'AI-powered, role-specific professional English learning platform',
} as const;

export const ROLES = {
	ADMIN: 'admin',
	LEARNER: 'learner',
	MANAGER: 'manager'
} as const;

export const QUIZ_TYPES = {
	LESSON: 'lesson',
	TOPIC: 'topic',
	FINAL: 'final'
} as const;

export const SKILLS = {
	D: 'Document',
	C: 'Communication',
	T: 'Troubleshooting',
	G: 'Growth/Economics'
} as const;

export const STREAK_RESTORE_MINUTES_PER_DAY = Number(
	import.meta.env.VITE_STREAK_RESTORE_MINUTES_PER_DAY || 120,
);

export const STREAK_RESTORE_LOOKBACK_DAYS = Number(
	import.meta.env.VITE_STREAK_RESTORE_LOOKBACK_DAYS || 30,
);
