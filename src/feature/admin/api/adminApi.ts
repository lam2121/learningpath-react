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
		jobDescription: 'Business Analyst làm việc với stakeholders để thu thập, phân tích và ghi chép yêu cầu nghiệp vụ. Chuyển đổi nhu cầu khách hàng thành đặc tả kỹ thuật rõ ràng cho đội phát triển.',
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
		jobDescription: 'QA Engineer đảm bảo chất lượng phần mềm thông qua kiểm thử thủ công và tự động hóa. Viết test case, báo cáo lỗi, và cộng tác với dev để cải thiện quy trình.',
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
		jobDescription: 'DevOps Engineer xây dựng và vận hành hạ tầng CI/CD, monitoring, và deployment. Cân bằng giữa tốc độ phát hành và độ ổn định hệ thống.',
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
		jobDescription: 'Project Manager điều phối dự án phần mềm từ khâu khởi tạo đến bàn giao. Quản lý scope, timeline, budget, risk và team communication.',
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
		jobDescription: 'Solution Architect thiết kế kiến trúc hệ thống đáp ứng yêu cầu kỹ thuật và phi kỹ thuật. Cân bằng giữa scalability, security, cost và time-to-market.',
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
			message: `Chi phí hôm qua ($${yesterday.toFixed(2)}) vượt ${((yesterday/avg7d - 1)*100).toFixed(0)}% trung bình 7 ngày ($${avg7d.toFixed(2)})`
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
			{ id: 'user_1', name: 'Nguyễn Văn A', email: 'a@tma.com.vn', progress: 45 },
			{ id: 'user_2', name: 'Trần Thị B', email: 'b@tma.com.vn', progress: 72 },
			{ id: 'user_3', name: 'Lê Văn C', email: 'c@tma.com.vn', progress: 23 }
		].slice(0, 3) : [],
		message: track.activeLearnerCount > 0
			? `Track này đang có ${track.activeLearnerCount} học viên đang học. Việc tắt track sẽ không ảnh hưởng đến khóa học hiện tại của họ (đã đóng băng ngân sách tại thời điểm tạo), nhưng học viên MỚI sẽ không thể chọn track này.`
			: 'Track này không có học viên đang hoạt động. Có thể tắt an toàn.'
	};
}

export async function validateBudget(budget: BudgetVector): Promise<BudgetValidationResult> {
	await delay(100);
	const sum = budget.D + budget.C + budget.T + budget.G;
	const errors: string[] = [];
	const warnings: string[] = [];
	
	if (sum !== 100) {
		errors.push(`Tổng ngân sách phải bằng 100 (hiện tại: ${sum})`);
	}
	if (budget.D < 0 || budget.C < 0 || budget.T < 0 || budget.G < 0) {
		errors.push('Không được có giá trị âm');
	}
	if (budget.D > 100 || budget.C > 100 || budget.T > 100 || budget.G > 100) {
		errors.push('Không được vượt quá 100 cho một kỹ năng');
	}
	
	// Anti-flattening warning
	const nonZero = [budget.D, budget.C, budget.T, budget.G].filter(v => v > 0).length;
	if (nonZero === 4 && Math.max(...Object.values(budget)) - Math.min(...Object.values(budget).filter(v => v > 0)) < 15) {
		warnings.push('Phân bổ quá đều (anti-flattening). Nên tập trung vào 1-2 kỹ năng chính cho mỗi milestone.');
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
	const isVague = gSkillDefinition.length < 50 || gSkillDefinition.toLowerCase().includes('làm việc') || gSkillDefinition.toLowerCase().includes('công việc');
	
	if (isVague) {
		return {
			examples: [
				'Làm việc với dữ liệu để phân tích xu hướng.',
				'Giao tiếp với team để hiểu yêu cầu.',
				'Viết báo cáo định kỳ cho quản lý.'
			],
			warning: 'Định nghĩa G-skill quá chung chung. AI sinh ra các ví dụ không mang tính chuyên ngành. Hãy bổ sung các từ khóa kỹ thuật cụ thể (VD: ETL pipeline, data quality metrics, stakeholder elicitation...).'
		};
	}
	
	return {
		examples: [
			`Dựa trên JD: "${jobDescription.slice(0, 80)}..." và G-skill: "${gSkillDefinition.slice(0, 80)}..."`,
			'Ví dụ 1: Stakeholder mô tả yêu cầu mơ hồ → BA dùng kỹ thuật "5 Whys" để làm rõ root cause.',
			'Ví dụ 2: Scope creep xuất hiện mid-sprint → BA facilitator workshop ưu tiên backlog với MoSCoW.',
			'Ví dụ 3: Handover sang Dev → BA viết Acceptance Criteria theo format Given/When/Then.',
			'Ví dụ 4: UAT phase → BA coordinate với QA thiết kế test case trace từ AC.'
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