// Mock Admin API - Simulates backend endpoints for admin features

import type {
	CareerTrack,
	BudgetVector,
	BudgetValidationResult,
	CostDashboardData,
	RejectedContent,
	KillSwitchState,
	AiPreviewRequest,
	AiPreviewResponse,
	TrackDeactivationWarning
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
	TrackDeactivationWarning
};

const SIMULATED_LATENCY_MS = 300;

function delay(ms: number = SIMULATED_LATENCY_MS): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms));
}

function generateId(prefix: string): string {
	return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const mockTracks: CareerTrack[] = [
	{
		id: 'track_ba',
		name: 'Business Analyst',
		jobDescription: 'Business Analyst works with stakeholders to gather, analyze, and document business requirements. Transforms customer needs into clear technical specifications for the development team.',
		gSkillDefinition: 'Eliciting requirements, clarifying scope, stakeholder communication, writing BRD/FSD, acceptance criteria definition, user story mapping, process modeling (BPMN), gap analysis, facilitating workshops.',
		seedTier1: 'stakeholder, requirement, scope, business process, user story, acceptance criteria, workshop, interview, documentation, validation',
		seedTier2: 'gap analysis, traceability matrix, impact assessment, change request, baseline, sign-off, elicitation techniques, prioritization frameworks, conflict resolution, negotiation',
		budgets: {
			basic: { D: 25, C: 35, T: 15, G: 25 },
			intermediate: { D: 30, C: 30, T: 20, G: 20 },
			advanced: { D: 35, C: 25, T: 15, G: 25 }
		},
		isActive: true,
		createdAt: '2024-01-15T10:00:00Z',
		createdBy: 'admin@tma.com.vn',
		activeLearnerCount: 247
	},
	{
		id: 'track_qa',
		name: 'QA Engineer',
		jobDescription: 'QA Engineer ensures software quality through manual and automated testing. Writes test cases, reports bugs, and collaborates with developers to improve processes.',
		gSkillDefinition: 'Writing bug reports, test plans, test cases, automation scripts, regression testing, defect triage, severity/priority classification, root cause analysis, test metrics reporting.',
		seedTier1: 'bug report, test case, test plan, regression, automation, severity, priority, defect, verification, validation',
		seedTier2: 'root cause analysis, flaky test, test pyramid, CI/CD integration, test coverage, mutation testing, contract testing, performance testing, security testing, test strategy',
		budgets: {
			basic: { D: 30, C: 20, T: 35, G: 15 },
			intermediate: { D: 25, C: 20, T: 40, G: 15 },
			advanced: { D: 20, C: 15, T: 45, G: 20 }
		},
		isActive: true,
		createdAt: '2024-01-15T10:00:00Z',
		createdBy: 'admin@tma.com.vn',
		activeLearnerCount: 189
	},
	{
		id: 'track_devops',
		name: 'DevOps Engineer',
		jobDescription: 'DevOps Engineer builds and operates CI/CD infrastructure, monitoring, and deployment. Balances between release speed and system stability.',
		gSkillDefinition: 'Incident response, runbook writing, post-mortem analysis, capacity planning, infrastructure as code, deployment strategies, monitoring/alerting, disaster recovery, SLO/SLI definition.',
		seedTier1: 'deployment, pipeline, monitoring, incident, alert, rollback, infrastructure, container, orchestration, cloud',
		seedTier2: 'chaos engineering, SRE practices, error budgets, SLI/SLO, canary deployment, blue-green, feature flags, observability, distributed tracing, runbook automation',
		budgets: {
			basic: { D: 20, C: 20, T: 40, G: 20 },
			intermediate: { D: 15, C: 15, T: 50, G: 20 },
			advanced: { D: 10, C: 15, T: 55, G: 20 }
		},
		isActive: true,
		createdAt: '2024-01-15T10:00:00Z',
		createdBy: 'admin@tma.com.vn',
		activeLearnerCount: 156
	},
	{
		id: 'track_pm',
		name: 'Project Manager',
		jobDescription: 'Project Manager coordinates software projects from initiation to delivery. Manages scope, timeline, budget, risk, and team communication.',
		gSkillDefinition: 'Project charter, scope management, timeline planning, risk management, stakeholder communication, status reporting, change control, resource allocation, vendor management, lessons learned.',
		seedTier1: 'project plan, scope, timeline, budget, risk, stakeholder, milestone, deliverable, status report, change request',
		seedTier2: 'critical path, earned value, agile hybrid, portfolio management, benefits realization, governance, escalation, negotiation, conflict resolution, organizational change',
		budgets: {
			basic: { D: 20, C: 40, T: 15, G: 25 },
			intermediate: { D: 15, C: 40, T: 20, G: 25 },
			advanced: { D: 10, C: 45, T: 15, G: 30 }
		},
		isActive: true,
		createdAt: '2024-01-15T10:00:00Z',
		createdBy: 'admin@tma.com.vn',
		activeLearnerCount: 312
	},
	{
		id: 'track_sa',
		name: 'Solution Architect',
		jobDescription: 'Solution Architect designs system architecture to meet technical and non-technical requirements. Balances scalability, security, cost, and time-to-market.',
		gSkillDefinition: 'Architecture decision records, technical design docs, trade-off analysis, technology evaluation, proof of concept, non-functional requirements, security architecture, data architecture, integration patterns, cost optimization.',
		seedTier1: 'architecture, design, scalability, security, integration, technology, evaluation, documentation, decision, trade-off',
		seedTier2: 'domain-driven design, event-driven, microservices, serverless, API gateway, service mesh, data mesh, zero trust, compliance, technical debt management',
		budgets: {
			basic: { D: 35, C: 25, T: 20, G: 20 },
			intermediate: { D: 30, C: 30, T: 20, G: 20 },
			advanced: { D: 25, C: 35, T: 15, G: 25 }
		},
		isActive: false,
		createdAt: '2024-01-15T10:00:00Z',
		createdBy: 'admin@tma.com.vn',
		activeLearnerCount: 0
	}
];

const mockRejectedContent: RejectedContent[] = [
	{
		id: 'reject_001',
		generator: 'C2',
		role: 'Business Analyst',
		inputPreview: 'Lesson: Writing User Stories - Target: [D=3,C=2,T=1,G=0]',
		error: 'SUM_TO_10_VIOLATION: Row weights [3,2,1,0] sum to 6, expected 10',
		rawResponse: '[[...]]',
		timestamp: '2024-12-20T14:30:00Z',
		validatorChecks: [
			{ check: 'sum_to_10', passed: false, details: 'Row sums to 6, not 10' },
			{ check: 'one_hot_quiz_weights', passed: true },
			{ check: 'zero_dimension_check', passed: true }
		],
		status: 'pending'
	},
	{
		id: 'reject_002',
		generator: 'C1',
		role: 'QA Engineer',
		inputPreview: 'Topic: Test Automation - Theory generation',
		error: 'MISSING_SECTION: Listening section is empty in generated theory',
		rawResponse: '[[...]]',
		timestamp: '2024-12-20T10:15:00Z',
		validatorChecks: [
			{ check: '8_sections_present', passed: false, details: 'Missing listening section' },
			{ check: 'sum_to_10', passed: true },
			{ check: 'vocab_count', passed: true }
		],
		status: 'fixed'
	}
];

let killSwitchState: KillSwitchState = {
	enabled: false
};

// Generate mock cost data
function generateMockCostData(): CostDashboardData {
	const generators = ['A', 'B1', 'B2', 'C1', 'C2', 'D1', 'D2'];
	const dailyCosts = [];
	const generatorBreakdown = [];
	
	let totalCost30d = 0;
	
	for (let i = 29; i >= 0; i--) {
		const date = new Date();
		date.setDate(date.getDate() - i);
		const dateStr = date.toISOString().split('T')[0];
		
		let dayTotal = 0;
		const byGenerator: Record<string, number> = {};
		
		for (const gen of generators) {
			const cost = Math.random() * 50 + 5;
			byGenerator[gen] = Math.round(cost * 100) / 100;
			dayTotal += cost;
		}
		
		// Add spike on day 15
		if (i === 14) {
			dayTotal *= 2.5;
			for (const gen of Object.keys(byGenerator)) {
				byGenerator[gen] *= 2.5;
			}
		}
		
		dailyCosts.push({
			date: dateStr,
			total: Math.round(dayTotal * 100) / 100,
			byGenerator: Object.fromEntries(
				Object.entries(byGenerator).map(([k, v]) => [k, Math.round(v * 100) / 100])
			)
		});
		totalCost30d += dayTotal;
	}
	
	for (const gen of generators) {
		const count = Math.floor(Math.random() * 500) + 100;
		const totalTokens = count * (Math.floor(Math.random() * 2000) + 500);
		const totalCost = totalTokens * 0.00001;
		generatorBreakdown.push({
			generator: gen,
			count,
			totalTokens,
			totalCost: Math.round(totalCost * 100) / 100,
			avgCost: Math.round((totalCost / count) * 10000) / 10000
		});
	}
	
	const alerts = [];
	const avg7d = dailyCosts.slice(-7).reduce((a, b) => a + b.total, 0) / 7;
	const yesterday = dailyCosts[dailyCosts.length - 1].total;
	if (yesterday > avg7d * 1.5) {
		alerts.push({
			date: dailyCosts[dailyCosts.length - 1].date,
			type: 'spike' as const,
			message: `Yesterday's cost ($${yesterday.toFixed(2)}) exceeded ${((yesterday/avg7d - 1)*100).toFixed(0)}% vs 7-day average ($${avg7d.toFixed(2)})`
		});
	}
	
	return {
		totalCost30d: Math.round(totalCost30d * 100) / 100,
		dailyAverage: Math.round((totalCost30d / 30) * 100) / 100,
		dailyCosts,
		generatorBreakdown,
		alerts
	};
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

export async function fetchTracks(): Promise<CareerTrack[]> {
	await delay();
	return [...mockTracks].sort((a, b) => a.name.localeCompare(b.name));
}

export async function fetchTrack(id: string): Promise<CareerTrack | null> {
	await delay();
	return mockTracks.find(t => t.id === id) || null;
}

export async function createTrack(track: Omit<CareerTrack, 'id' | 'createdAt' | 'activeLearnerCount'>): Promise<CareerTrack> {
	await delay(500);
	const newTrack: CareerTrack = {
		...track,
		id: generateId('track'),
		createdAt: new Date().toISOString(),
		activeLearnerCount: 0
	};
	mockTracks.push(newTrack);
	return newTrack;
}

export async function updateTrack(id: string, updates: Partial<CareerTrack>): Promise<CareerTrack> {
	await delay(500);
	const idx = mockTracks.findIndex(t => t.id === id);
	if (idx === -1) throw new Error('Track not found');
	mockTracks[idx] = { ...mockTracks[idx], ...updates, updatedAt: new Date().toISOString() };
	return mockTracks[idx];
}

export async function deactivateTrack(id: string): Promise<CareerTrack> {
	await delay(500);
	const idx = mockTracks.findIndex(t => t.id === id);
	if (idx === -1) throw new Error('Track not found');
	mockTracks[idx] = { ...mockTracks[idx], isActive: false, updatedAt: new Date().toISOString() };
	return mockTracks[idx];
}

export async function getDeactivationWarning(id: string): Promise<TrackDeactivationWarning> {
	await delay(300);
	const track = mockTracks.find(t => t.id === id);
	if (!track) throw new Error('Track not found');
	
	return {
		hasActiveLearners: track.activeLearnerCount > 0,
		activeLearnerCount: track.activeLearnerCount,
		activeLearnersPreview: track.activeLearnerCount > 0 ? [
				{ id: 'user_1', name: 'Nguyen Van A', email: 'a@tma.com.vn', progress: 45 },
				{ id: 'user_2', name: 'Tran Thi B', email: 'b@tma.com.vn', progress: 72 },
				{ id: 'user_3', name: 'Le Van C', email: 'c@tma.com.vn', progress: 23 }
			].slice(0, 3) : [],
		message: track.activeLearnerCount > 0
			? `This track currently has ${track.activeLearnerCount} active learners. Deactivating the track will not affect their current courses (budget frozen at creation time), but NEW learners will not be able to select this track.`
			: 'This track has no active learners. Safe to deactivate.'
	};
}

export async function validateBudget(budget: BudgetVector): Promise<BudgetValidationResult> {
	await delay(100);
	const sum = budget.D + budget.C + budget.T + budget.G;
	const errors: string[] = [];
	const warnings: string[] = [];
	
	if (sum !== 100) {
		errors.push(`Total budget must equal 100 (currently: ${sum})`);
	}
	if (budget.D < 0 || budget.C < 0 || budget.T < 0 || budget.G < 0) {
		errors.push('Cannot have negative values');
	}
	if (budget.D > 100 || budget.C > 100 || budget.T > 100 || budget.G > 100) {
		errors.push('Cannot exceed 100 for a single skill');
	}
	
	// Anti-flattening warning
	const nonZero = [budget.D, budget.C, budget.T, budget.G].filter(v => v > 0).length;
	if (nonZero === 4 && Math.max(...Object.values(budget)) - Math.min(...Object.values(budget).filter(v => v > 0)) < 15) {
		warnings.push('Distribution too even (anti-flattening). Should focus on 1-2 main skills for each milestone.');
	}
	
	return {
		isValid: errors.length === 0,
		errors,
		warnings
	};
}

export async function previewAiGeneration(request: AiPreviewRequest): Promise<AiPreviewResponse> {
	await delay(1000); // Simulate AI call
	
	const { jobDescription, gSkillDefinition } = request;
	
	// Generate mock preview based on input quality
	const isVague = gSkillDefinition.length < 50 || gSkillDefinition.toLowerCase().includes('work with') || gSkillDefinition.toLowerCase().includes('job');
	
	if (isVague) {
		return {
			examples: [
				'Work with data to analyze trends.',
				'Communicate with team to understand requirements.',
				'Write periodic reports for management.'
			],
			warning: 'G-skill definition is too generic. AI generates non-specialized examples. Please add specific technical keywords (e.g., ETL pipeline, data quality metrics, stakeholder elicitation...).'
		};
	}
	
	return {
		examples: [
			`Based on JD: "${jobDescription.slice(0, 80)}..." and G-skill: "${gSkillDefinition.slice(0, 80)}..."`,
			'Example 1: Stakeholder describes vague requirement → BA uses "5 Whys" technique to clarify root cause.',
			'Example 2: Scope creep appears mid-sprint → BA facilitates workshop to prioritize backlog with MoSCoW.',
			'Example 3: Handover to Dev → BA writes Acceptance Criteria in Given/When/Then format.',
			'Example 4: UAT phase → BA coordinates with QA to design test cases traced from AC.'
		]
	};
}

export async function fetchCostDashboard(): Promise<CostDashboardData> {
	await delay(500);
	return generateMockCostData();
}

export async function fetchRejectedContent(filters?: { generator?: string; status?: string; role?: string }): Promise<RejectedContent[]> {
	await delay(300);
	let result = [...mockRejectedContent];
	
	if (filters?.generator && filters.generator !== 'all') {
		result = result.filter(r => r.generator === filters.generator);
	}
	if (filters?.status && filters.status !== 'all') {
		result = result.filter(r => r.status === filters.status);
	}
	if (filters?.role) {
		result = result.filter(r => r.role === filters.role);
	}
	
	return result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function updateRejectedContentStatus(id: string, status: 'fixed' | 'ignored'): Promise<RejectedContent> {
	await delay(200);
	const idx = mockRejectedContent.findIndex(r => r.id === id);
	if (idx === -1) throw new Error('Not found');
	mockRejectedContent[idx] = { ...mockRejectedContent[idx], status };
	return mockRejectedContent[idx];
}

export async function fetchKillSwitchState(): Promise<KillSwitchState> {
	await delay(100);
	return { ...killSwitchState };
}

export async function toggleKillSwitch(enabled: boolean, reason?: string): Promise<KillSwitchState> {
	await delay(300);
	killSwitchState = {
		enabled,
		enabledAt: enabled ? new Date().toISOString() : undefined,
		enabledBy: 'admin@tma.com.vn',
		reason
	};
	
	// Broadcast to other tabs
	if (typeof window !== 'undefined') {
		window.dispatchEvent(new CustomEvent('kill-switch-changed', { detail: killSwitchState }));
	}
	
	return { ...killSwitchState };
}