export const APP_NAME = 'CareerPath AI';
export const APP_VERSION = '1.0.0';
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const APP_META = {
	name: 'CareerPath',
	domain: 'careerpath.local',
	supportEmail: 'support@careerpath.io',
	HOME_PAGE: '/',
	SMART_LEARNING: '/lessons/learning-path'
} as const;

export const APP_INFO = {
	name: 'CareerPath AI',
	version: '1.0.0',
	description: 'AI-Powered Career English Communication Platform',
	APP_NAME: 'CareerPath AI'
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