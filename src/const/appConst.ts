export const APP_NAME = 'TMA IT Communication';
export const APP_VERSION = '1.0.0';
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const TMA_INFO = {
	name: 'TMA Solutions',
	domain: 'tma.com.vn',
	supportEmail: 'support@tma.com.vn',
	HOME_PAGE: 'https://tma.com.vn',
	SMART_LEARNING: 'https://smartlearning.tma.com.vn'
} as const;

export const APP_INFO = {
	name: 'TMA IT Communication',
	version: '1.0.0',
	description: 'AI-Powered IT English Communication Training Platform',
	APP_NAME: 'TMA IT Communication'
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