// Admin Module Types

export interface CareerTrack {
	id: string;
	name: string;
	jobDescription: string;
	gSkillDefinition: string;
	seedTier1: string;
	seedTier2: string;
	budgets: {
		basic: BudgetVector;
		intermediate: BudgetVector;
		advanced: BudgetVector;
	};
	isActive: boolean;
	createdAt: string;
	createdBy: string;
	updatedAt?: string;
	activeLearnerCount: number;
}

export interface BudgetVector {
	D: number;
	C: number;
	T: number;
	G: number;
}

export interface BudgetValidationResult {
	isValid: boolean;
	errors: string[];
	warnings: string[];
}

export interface CostRecord {
	id: string;
	date: string; // ISO date string
	generator: 'A' | 'B1' | 'B2' | 'C1' | 'C2' | 'D1' | 'D2';
	inputTokens: number;
	outputTokens: number;
	costUsd: number;
	status: 'success' | 'retry' | 'fallback' | 'rejected';
	role?: string;
}

export interface CostDashboardData {
	totalCost30d: number;
	dailyAverage: number;
	dailyCosts: Array<{
		date: string;
		total: number;
		byGenerator: Record<string, number>;
	}>;
	generatorBreakdown: Array<{
		generator: string;
		count: number;
		totalTokens: number;
		totalCost: number;
		avgCost: number;
	}>;
	alerts: Array<{
		date: string;
		type: 'spike' | 'budget_warning' | 'kill_switch';
		message: string;
	}>;
}

export interface RejectedContent {
	id: string;
	generator: 'A' | 'B1' | 'B2' | 'C1' | 'C2' | 'D1' | 'D2';
	role: string;
	inputPreview: string;
	error: string;
	rawResponse: string;
	timestamp: string;
	validatorChecks: ValidatorCheck[];
	status: 'pending' | 'fixed' | 'ignored';
}

export interface ValidatorCheck {
	check: string;
	passed: boolean;
	details?: string;
}

export interface KillSwitchState {
	enabled: boolean;
	enabledAt?: string;
	enabledBy?: string;
	reason?: string;
}

export interface AiPreviewRequest {
	jobDescription: string;
	gSkillDefinition: string;
}

export interface AiPreviewResponse {
	examples: string[];
	warning?: string;
}

export interface TrackDeactivationWarning {
	hasActiveLearners: boolean;
	activeLearnerCount: number;
	activeLearnersPreview: Array<{
		id: string;
		name: string;
		email: string;
		progress: number;
	}>;
	message: string;
}