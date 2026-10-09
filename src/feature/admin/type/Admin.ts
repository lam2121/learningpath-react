// Admin Module Types (v2.1)

export type SkillKey = 'D_doc' | 'C_comm' | 'T_trouble' | 'G_custom';

export interface BudgetVector {
	D_doc: number;
	C_comm: number;
	T_trouble: number;
	G_custom: number;
}

export interface SkillDefinition {
	description: string | Record<string, string>;
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
	placementQuestionsCount: number;
	topicsCount: number;
	lessonsCount: number;
	generationStatus: string | null;
	placementGenerationStatus: string | null;
	courseGenerationStatus: string | null;
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

export type CostRange =
	| '7d'
	| '30d'
	| '90d'
	| 'this_month'
	| 'last_month'
	| '12m'
	| 'all';

export type CostGranularity = 'daily' | 'weekly' | 'monthly';

/** One point on the spend-over-time chart. */
export interface CostBucket {
	period: string;
	label: string;
	total: number;
	calls: number;
	byGenerator: Record<string, number>;
}

/** One row of any breakdown (generator / model / provider / track / status). */
export interface CostGroup {
	key: string;
	label: string | null;
	count: number;
	promptTokens: number;
	completionTokens: number;
	totalTokens: number;
	totalCost: number;
	avgCost: number;
	share: number;
}

export interface CostAlert {
	date: string;
	type: 'spike' | 'budget_warning' | 'kill_switch';
	message: string;
}

export interface CostFilters {
	range?: CostRange;
	granularity?: CostGranularity;
	generator?: string;
	model?: string;
	roleId?: number | null;
	status?: string;
}

export interface CostDashboardData {
	rangeKey: CostRange;
	granularity: CostGranularity;
	fromDate: string;
	toDate: string;
	totalCost: number;
	totalCalls: number;
	totalTokens: number;
	periodAverage: number;
	buckets: CostBucket[];
	byGenerator: CostGroup[];
	byModel: CostGroup[];
	byProvider: CostGroup[];
	byTrack: CostGroup[];
	byStatus: CostGroup[];
	availableModels: string[];
	alerts: CostAlert[];
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

export interface UsageLog {
	id: number;
	generator: string;
	model: string;
	promptTokens: number;
	completionTokens: number;
	costUsd: number;
	status: 'success' | 'retry' | 'rejected' | 'fallback' | string;
	roleId: number | null;
	roleName: string | null;
	createdAt: string;
}

export interface UsageLogFilters {
	generator?: string;
	status?: string;
	roleId?: number | null;
	limit?: number;
}

export interface UsageLogClearResult {
	deletedCount: number;
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

export interface GenerationActiveJob {
	workflow: 'placement' | 'course' | null;
	status: 'pending' | 'in_progress' | 'completed' | 'failed' | null;
	step: 'a' | 'b1' | 'b2' | null;
	startedAt: string | null;
	finishedAt: string | null;
}

export interface PlacementGenerationSummary {
	questionCount: number;
	targetCount: number;
	lastStatus: 'empty' | 'pending' | 'in_progress' | 'completed' | 'failed';
	lastStartedAt: string | null;
	lastFinishedAt: string | null;
	lastErrorMessage: string | null;
}

export interface CourseGenerationSummary {
	topicsCount: number;
	targetTopics: number;
	lessonsCount: number;
	targetLessons: number;
	currentStep: 'b1' | 'b2' | null;
	lastStatus: 'empty' | 'pending' | 'in_progress' | 'completed' | 'failed';
	lastStartedAt: string | null;
	lastFinishedAt: string | null;
	lastErrorMessage: string | null;
	stepB1Count: number;
	stepB1Errors: number;
	stepB2Count: number;
	stepB2Errors: number;
}

export interface GenerationBlockers {
	killSwitchOn: boolean;
	killSwitchReason: string | null;
	activeLearnerCount: number;
	requiresLearnerResetForPlacement: boolean;
	requiresLearnerResetForCourse: boolean;
}

export interface GenerationSummary {
	roleId: number;
	activeJob: GenerationActiveJob;
	placement: PlacementGenerationSummary;
	course: CourseGenerationSummary;
	blockers: GenerationBlockers;
}

export interface ClearedCounts {
	clearedAnswers: number;
	clearedRoadmaps: number;
	clearedLessons: number;
	clearedTopicQuizzes: number;
	clearedFinalQuizzes: number;
	clearedRadarScores: number;
	clearedQueueEntries: number;
	clearedFlashcards: number;
}

export interface ResetLearnersResult extends ClearedCounts {
	resetLearners: number;
}

// ── Users ────────────────────────────────────────────────────────────────────
//
// The roster comes from CareerPath's own `user` table. The shared auth_db is
// never read or written from the admin portal, so identity fields that live
// only there (phone, avatar, is_verified, is_active) are deliberately absent.

export const LEARNER_ROLE_ID = 1;
export const ADMIN_ROLE_ID = 2;

export type UserRoleFilter = 'admin' | 'employee' | '';

/** One roster row: CareerPath identity plus learning state. */
export interface AdminUser {
	id: number;
	name: string;
	email: string;
	roleId: number | null;
	createdAt: string;
	jobRoleId: number | null;
	jobRoleName: string | null;
	learningStatus: string;
	lessonsCompleted: number;
	lessonsTotal: number;
	topicQuizzesPassed: number;
	finalQuizStatus: string | null;
	flashcardCount: number;
	hasPlacementAnswers: boolean;
}

export interface AdminUserFilters {
	search?: string;
	role?: UserRoleFilter;
	limit?: number;
	offset?: number;
}

export interface AdminUserPage {
	items: AdminUser[];
	total: number;
	limit: number;
	offset: number;
}

export interface ResetLearnerResult extends ClearedCounts {
	userId: number;
}

export interface DashboardData {
	totalTracks: number;
	activeTracks: number;
	activeLearners: number;
	aiCalls30d: number;
	aiCost30d: number;
	pendingRejected: number;
}
