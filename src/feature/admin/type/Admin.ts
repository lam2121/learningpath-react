// Admin Module Types (v2.1)

export type SkillKey = 'D_doc' | 'C_comm' | 'T_trouble' | 'G_custom';

export interface BudgetVector {
	D_doc: number;
	C_comm: number;
	T_trouble: number;
	G_custom: number;
}

export interface SkillDefinition {
	description: string;
	example_questions: string[];
}

export interface RoleSkillDefinitions {
	D_doc: SkillDefinition;
	C_comm: SkillDefinition;
	T_trouble: SkillDefinition;
	G_custom: SkillDefinition;
}

export const DEFAULT_BASELINE: BudgetVector = {
	D_doc: 25,
	C_comm: 25,
	T_trouble: 25,
	G_custom: 25,
};

export interface CareerTrack {
	id: number;
	name: string;
	jobDescription: string;
	baseline: BudgetVector;
	skillDefinitions: RoleSkillDefinitions;
	seedTier1: string;
	seedTier2: string;
	isActive: boolean;
	createdBy: number | null;
	activeLearnerCount: number;
	topicsCount: number;
	lessonsCount: number;
	generationStatus: string | null;
}

// Request payloads (backend uses snake_case for these)
export interface TrackCreatePayload {
	name: string;
	job_description: string;
	baseline: BudgetVector;
	skill_definitions: RoleSkillDefinitions;
	seed_tier_1: string;
	seed_tier_2: string;
}

export interface TrackUpdatePayload extends Partial<TrackCreatePayload> {
	is_active?: boolean;
}

export interface BudgetValidationResult {
	isValid: boolean;
	errors: string[];
	warnings: string[];
}

export interface CostRecord {
	id: string;
	date: string; // ISO date string
	generator: string;
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
	id: number;
	generator: string;
	role: string;
	inputPreview: string;
	error: string;
	rawResponse: string;
	timestamp: string;
	validatorChecks: ValidatorCheck[] | null;
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
	enabledBy?: number | string;
	reason?: string;
}

export interface AiPreviewRequest {
	jobDescription: string;
	skillDefinitions: RoleSkillDefinitions;
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

export interface GenerateResponse {
	message: string;
	roleId: number;
}

export interface GenerationStatus {
	roleId: number;
	status: string;
	step: string;
	stepACount: number;
	stepAErrors: number;
	stepB1Count: number;
	stepB1Errors: number;
	stepB2Count: number;
	stepB2Errors: number;
	startedAt: string | null;
	finishedAt: string | null;
	errorMessage: string | null;
}

export interface ResetLearnersResult {
	resetLearners: number;
	clearedAnswers: number;
	clearedRoadmaps: number;
}

export interface DashboardData {
	totalTracks: number;
	activeTracks: number;
	activeLearners: number;
	aiCalls30d: number;
	aiCost30d: number;
	pendingRejected: number;
}
