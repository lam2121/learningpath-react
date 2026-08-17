// Admin API - real backend calls (FastAPI /api/admin)

import { axiosJWT } from '@/common/lib/axios';

import type {
	CareerTrack,
	BudgetVector,
	BudgetValidationResult,
	CostDashboardData,
	RejectedContent,
	KillSwitchState,
	AiPreviewRequest,
	AiPreviewResponse,
	TrackDeactivationWarning,
	TrackCreatePayload,
	TrackUpdatePayload,
	GenerateResponse,
	GenerationStatus,
	DashboardData,
	ValidatorCheck,
	SkillKey,
	RoleSkillDefinitions,
	ResetLearnersResult,
} from '../type/Admin';

// Re-export types for consumers
export type {
	CareerTrack,
	BudgetVector,
	BudgetValidationResult,
	CostDashboardData,
	RejectedContent,
	KillSwitchState,
	AiPreviewRequest,
	AiPreviewResponse,
	TrackDeactivationWarning,
	TrackCreatePayload,
	TrackUpdatePayload,
	GenerateResponse,
	GenerationStatus,
	DashboardData,
	SkillKey,
	RoleSkillDefinitions,
	ResetLearnersResult,
};

export { DEFAULT_BASELINE } from '../type/Admin';

function unwrapError(error: unknown): Error {
	if (error instanceof Error) return error;
	const axiosError = error as { response?: { data?: { detail?: string } } };
	const detail = axiosError?.response?.data?.detail;
	return new Error(detail || 'Request failed');
}

// ============================================================================
// Tracks (job roles)
// ============================================================================

export async function fetchTracks(): Promise<CareerTrack[]> {
	const res = await axiosJWT.get<CareerTrack[]>('/admin/roles');
	return res.data;
}

export async function fetchTrack(id: number): Promise<CareerTrack | null> {
	try {
		const res = await axiosJWT.get<CareerTrack>(`/admin/roles/${id}`);
		return res.data;
	} catch (error) {
		const err = unwrapError(error);
		if (err.message.includes('404')) return null;
		throw err;
	}
}

export async function createTrack(track: TrackCreatePayload): Promise<CareerTrack> {
	try {
		const res = await axiosJWT.post<CareerTrack>('/admin/roles', track);
		return res.data;
	} catch (error) {
		throw unwrapError(error);
	}
}

export async function updateTrack(id: number, updates: TrackUpdatePayload): Promise<CareerTrack> {
	try {
		const res = await axiosJWT.patch<CareerTrack>(`/admin/roles/${id}`, updates);
		return res.data;
	} catch (error) {
		throw unwrapError(error);
	}
}

export async function deactivateTrack(id: number): Promise<CareerTrack> {
	const res = await axiosJWT.post<CareerTrack>(`/admin/roles/${id}/deactivate`);
	return res.data;
}

export async function activateTrack(id: number): Promise<CareerTrack> {
	const res = await axiosJWT.post<CareerTrack>(`/admin/roles/${id}/activate`);
	return res.data;
}

export async function deleteTrack(id: number): Promise<void> {
	await axiosJWT.delete(`/admin/roles/${id}`);
}

export async function generatePlacement(roleId: number, force = false): Promise<GenerateResponse> {
	const res = await axiosJWT.post<GenerateResponse>(`/admin/roles/${roleId}/generate${force ? '?force=true' : ''}`);
	return res.data;
}

export async function generateCourse(roleId: number, force = false): Promise<GenerateResponse> {
	const res = await axiosJWT.post<GenerateResponse>(`/admin/roles/${roleId}/generate-course${force ? '?force=true' : ''}`);
	return res.data;
}

export async function resetTrackLearners(roleId: number): Promise<ResetLearnersResult> {
	const res = await axiosJWT.post<ResetLearnersResult>(`/admin/roles/${roleId}/reset-learners`);
	return res.data;
}

export async function fetchGenerationStatus(roleId: number): Promise<GenerationStatus> {
	const res = await axiosJWT.get<GenerationStatus>(`/admin/roles/${roleId}/generation-status`);
	return res.data;
}

export async function getDeactivationWarning(id: number): Promise<TrackDeactivationWarning> {
	const track = await fetchTrack(id);
	if (!track) throw new Error('Track not found');

	const count = track.activeLearnerCount;
	return {
		hasActiveLearners: count > 0,
		activeLearnerCount: count,
		activeLearnersPreview: [],
		message: count > 0
			? `This track currently has ${count} active learners. Deactivating the track will not affect their current courses, but NEW learners will not be able to select this track.`
			: 'This track has no active learners. Safe to deactivate.'
	};
}

export async function validateBudget(budget: BudgetVector): Promise<BudgetValidationResult> {
	const values = [budget.D_doc, budget.C_comm, budget.T_trouble, budget.G_custom];
	const sum = values.reduce((a, b) => a + b, 0);
	const errors: string[] = [];
	const warnings: string[] = [];

	if (sum !== 100) {
		errors.push(`Total budget must equal 100 (currently: ${sum})`);
	}
	if (values.some(v => v % 5 !== 0)) {
		errors.push('Each skill must be a multiple of 5');
	}
	if (values.some(v => v < 10)) {
		errors.push('Each skill must be at least 10');
	}
	if (values.some(v => v > 100)) {
		errors.push('Cannot exceed 100 for a single skill');
	}

	// Anti-flattening warning
	if (values.filter(v => v > 0).length === 4 && Math.max(...values) - Math.min(...values) < 15) {
		warnings.push('Distribution too even (anti-flattening). Should focus on 1-2 main skills.');
	}

	return { isValid: errors.length === 0, errors, warnings };
}

export async function previewAiGeneration(request: AiPreviewRequest): Promise<AiPreviewResponse> {
	try {
		const res = await axiosJWT.post<AiPreviewResponse>('/admin/preview', request);
		return res.data;
	} catch (error) {
		throw unwrapError(error);
	}
}

// ============================================================================
// Dashboard / Costs
// ============================================================================

export async function fetchDashboard(): Promise<DashboardData> {
	const res = await axiosJWT.get<DashboardData>('/admin/dashboard');
	return res.data;
}

export async function fetchCostDashboard(): Promise<CostDashboardData> {
	const res = await axiosJWT.get<CostDashboardData>('/admin/costs');
	return res.data;
}

// ============================================================================
// Rejected content
// ============================================================================

function normalizeValidatorChecks(checks: unknown): ValidatorCheck[] | null {
	if (Array.isArray(checks)) {
		return checks as ValidatorCheck[];
	}
	if (checks && typeof checks === 'object') {
		return Object.entries(checks as Record<string, unknown>).map(([check, passed]) => ({
			check,
			passed: Boolean(passed),
		}));
	}
	return null;
}

interface RejectedResponse {
	id: number;
	generator: string;
	roleId: number | null;
	roleName: string | null;
	inputPreview: string | null;
	error: string;
	rawResponse: string | null;
	validatorChecks: unknown;
	status: string;
	createdAt: string;
}

function toRejectedContent(row: RejectedResponse): RejectedContent {
	return {
		id: row.id,
		generator: row.generator,
		role: row.roleName || '',
		inputPreview: row.inputPreview || '',
		error: row.error,
		rawResponse: row.rawResponse || '',
		timestamp: row.createdAt,
		validatorChecks: normalizeValidatorChecks(row.validatorChecks),
		status: (['pending', 'fixed', 'ignored'].includes(row.status) ? row.status : 'pending') as RejectedContent['status'],
	};
}

export async function fetchRejectedContent(filters?: { generator?: string; status?: string; role?: string }): Promise<RejectedContent[]> {
	const params = new URLSearchParams();
	if (filters?.generator && filters.generator !== 'all') params.set('generator', filters.generator);
	if (filters?.status && filters.status !== 'all') params.set('status', filters.status);

	const query = params.toString();
	const res = await axiosJWT.get<RejectedResponse[]>(`/admin/rejected${query ? `?${query}` : ''}`);
	let rows = res.data.map(toRejectedContent);

	if (filters?.role) {
		rows = rows.filter(r => r.role.toLowerCase().includes(filters.role!.toLowerCase()));
	}
	return rows;
}

export async function updateRejectedContentStatus(id: number, status: 'fixed' | 'ignored'): Promise<RejectedContent> {
	const res = await axiosJWT.post<RejectedResponse>(`/admin/rejected/${id}/status`, { status });
	return toRejectedContent(res.data);
}

// ============================================================================
// Kill switch
// ============================================================================

export async function fetchKillSwitchState(): Promise<KillSwitchState> {
	const res = await axiosJWT.get<KillSwitchState>('/admin/kill-switch');
	return res.data;
}

export async function toggleKillSwitch(enabled: boolean, reason?: string): Promise<KillSwitchState> {
	const res = await axiosJWT.post<KillSwitchState>('/admin/kill-switch', { enabled, reason });
	const state = res.data;

	// Broadcast to other tabs
	if (typeof window !== 'undefined') {
		window.dispatchEvent(new CustomEvent('kill-switch-changed', { detail: state }));
	}
	return state;
}
