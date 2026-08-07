// Mock Quiz API - Simulates backend endpoints with realistic latency and data
// All data structures follow the minified matrix format from docs/04-ai-content-and-prompts.md

import type {
	QuizQuestion,
	QuizSession,
	QuizResult,
	UserAnswerRecord,
	QuestionResult,
	FillBlankQuestionData,
	MultiSelectQuestionData,
	OrderingQuestionData,
} from '../type/Quiz';

const SIMULATED_LATENCY_MS = 300; // Base latency

function delay(ms: number = SIMULATED_LATENCY_MS): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms));
}

function generateId(prefix: string): string {
	return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ============================================================================
// MOCK QUESTION BANKS (matching Schema C2/C3/C4 format exactly)
// ============================================================================

const MOCK_FILL_BLANK_QUESTIONS: FillBlankQuestionData[] = [
	[
		"The server crashed due to a memory ___.",
		"lake|leak|lock|leakage",
		"leak",
		"Memory leak causing crash",
		10, 0, 0, 0,  // D=10 (ONE-HOT)
		30, 20, 30, 20  // remaining budget
	],
	[
		"We need to ___ the new release to production.",
		"deploy|delete|delay|deny",
		"deploy",
		"Deploy is deployment to production environment",
		0, 10, 0, 0,  // C=10
		30, 10, 30, 20
	],
	[
		"The bug was ___ by the QA team on staging.",
		"reproduced|produced|reduced|removed",
		"reproduced",
		"Reproduce is to reproduce the error",
		0, 0, 10, 0,  // T=10
		30, 10, 20, 20
	],
	[
		"Our goal is to ___ the client's ROI by 20%.",
		"increase|decrease|ignore|guess",
		"increase",
		"ROI is return on investment, needs to increase",
		0, 0, 0, 10,  // G=10
		30, 10, 20, 10
	],
	[
		"Please ___ the API documentation before integration.",
		"review|delete|ignore|skip",
		"review",
		"Review document is to examine carefully",
		10, 0, 0, 0,
		20, 10, 20, 10
	],
	[
		"The team must ___ the scope change request.",
		"evaluate|ignore|reject|accept",
		"evaluate",
		"Evaluate is to assess impact",
		0, 10, 0, 0,
		20, 0, 20, 10
	],
	[
		"Root cause analysis ___ the database deadlock.",
		"identified|ignored|created|hidden",
		"identified",
		"Identified is to ascertain",
		0, 0, 10, 0,
		20, 0, 10, 10
	],
	[
		"We should ___ the budget for Q4 infrastructure.",
		"approve|reduce|increase|estimate",
		"approve",
		"Approve is to approve budget",
		0, 0, 0, 10,
		20, 0, 10, 0
	],
	[
		"The developer needs to ___ the pull request.",
		"review|merge|close|delete",
		"review",
		"Review PR is to examine code",
		10, 0, 0, 0,
		10, 0, 10, 0
	],
	[
		"Let's ___ the meeting for next Monday.",
		"schedule|cancel|skip|forget",
		"schedule",
		"Schedule is to schedule",
		0, 10, 0, 0,
		10, -10, 10, 0
	]
];

const MOCK_MULTI_SELECT_QUESTIONS: MultiSelectQuestionData[] = [
	[
		"Select the appropriate responses when a client pushes scope creep",
		"Let's add it to the backlog for next sprint|Sure, I will add it now|I need to check the impact on this sprint first|No, we are too busy|Let me review it after our current commitments",
		"0|2|4",
		"Push to backlog and assess impact to manage scope",
		0, 10, 0, 0,
		30, 20, 30, 20
	],
	[
		"Select the appropriate responses when production is down",
		"We are investigating the root cause now|It's not my job|We will update you in 30 minutes|I'll fix it in 5 minutes",
		"0|2",
		"Commit to investigating and a real update time",
		0, 10, 0, 0,
		30, 10, 30, 20
	],
	[
		"Select the appropriate steps when explaining a pending bug fix",
		"The bug is triaged as P2, we work on P1 first|It will fix itself|Here is our priority list and timeline|I'm too lazy to fix it now",
		"0|2",
		"Explain the triage priority and show a timeline",
		0, 0, 10, 0,
		30, 10, 20, 20
	],
	[
		"Select the appropriate responses when asked for a Friday delivery",
		"Let me check the impact on current sprint commitments|Impossible|No problem, done|I will confirm after reviewing the workload",
		"0|3",
		"Evaluate impact before making any commitment",
		0, 10, 0, 0,
		30, 0, 20, 20
	],
	[
		"Select the appropriate responses when the client asks for a discount",
		"I can propose a phased approach to fit the budget|No discount, ever|Sure, 50% off|Let me see what we can trade in scope",
		"0|3",
		"Negotiate a win-win solution within budget",
		0, 0, 0, 10,
		30, 0, 20, 10
	],
	[
		"Select the details a bug report must include",
		"Reproduction steps|The reporter's favorite food|Expected vs actual behavior|Environment and version",
		"0|2|3",
		"A bug report needs steps, expected/actual, and environment",
		10, 0, 0, 0,
		30, 0, 20, 10
	],
	[
		"Select the appropriate ways to confirm understanding of a requirement",
		"Repeat the requirement in your own words|Ask clarifying questions|Agree before verifying details|Assume and start coding",
		"0|1|2",
		"Confirm by paraphrasing, clarifying, and verifying",
		0, 10, 0, 0,
		30, 0, 10, 10
	],
	[
		"Select the appropriate actions when a scope change request arrives",
		"Assess the impact on timeline and budget|Accept it silently|Document the change request|Reject it without discussion",
		"0|2",
		"Assess and document the change before deciding",
		0, 0, 10, 0,
		20, 0, 10, 10
	],
	[
		"Select the appropriate content for a daily standup update",
		"What I did yesterday|What I will do today|Any blockers|Personal weekend plans",
		"0|1|2",
		"A standup covers yesterday, today, and blockers only",
		0, 10, 0, 0,
		20, 0, 10, 0
	],
	[
		"Select the appropriate responses when a deadline cannot be met",
		"Inform stakeholders early|Silently hope for the best|Propose a new timeline with reasons|Blame the QA team",
		"0|2",
		"Communicate early and propose a realistic timeline",
		0, 0, 10, 0,
		20, 0, 10, 0
	]
];

const MOCK_ORDERING_QUESTIONS: OrderingQuestionData[] = [
	[
		"Order the deployment steps",
		"Run tests|Merge PR|Deploy to staging|Monitor logs",
		"1|0|2|3",
		"Process: Merge -> Test -> Deploy -> Monitor",
		0, 0, 10, 0,
		30, 20, 20, 20
	],
	[
		"Sequence the bug report workflow",
		"Write reproduction steps|Assign to developer|Verify fix|Close ticket",
		"0|1|2|3",
		"Bug reporting process: Reproduce -> Assign -> Verify -> Close",
		0, 0, 10, 0,
		30, 20, 10, 20
	],
	[
		"Arrange the code review process",
		"Create PR|Review code|Address comments|Approve and merge",
		"0|1|2|3",
		"PR workflow: Create -> Review -> Address -> Merge",
		10, 0, 0, 0,
		20, 20, 10, 20
	],
	[
		"Order the incident response",
		"Detect alert|Investigate root cause|Apply fix|Post-mortem",
		"0|1|2|3",
		"Incident response: Detect -> Investigate -> Fix -> Learn",
		0, 0, 10, 0,
		20, 20, 0, 20
	],
	[
		"Sequence the requirement gathering",
		"Interview stakeholder|Document requirements|Review with team|Get sign-off",
		"0|1|2|3",
		"Elicitation: Interview -> Document -> Review -> Sign-off",
		0, 10, 0, 0,
		20, 10, 0, 20
	]
];

// Generate 10 questions of each type for a 30-question lesson quiz
function getLessonQuizQuestions(): QuizQuestion[] {
	const questions: QuizQuestion[] = [];
	const types: Array<'fill_blank' | 'multi_select' | 'ordering'> = ['fill_blank', 'multi_select', 'ordering'];
	const banks = {
		fill_blank: MOCK_FILL_BLANK_QUESTIONS,
		multi_select: MOCK_MULTI_SELECT_QUESTIONS,
		ordering: MOCK_ORDERING_QUESTIONS
	};

	for (const type of types) {
		const bank = banks[type];
		for (let i = 0; i < 10; i++) {
			const data = bank[i % bank.length];
			questions.push({
				id: generateId(`${type}_q`),
				type,
				data: [...data] as FillBlankQuestionData | MultiSelectQuestionData | OrderingQuestionData
			});
		}
	}

	return questions;
}

// Topic quiz: 30 questions pulled from completed lessons (mock)
function getTopicQuizQuestions(): QuizQuestion[] {
	const questions: QuizQuestion[] = [];
	const banks = {
		fill_blank: MOCK_FILL_BLANK_QUESTIONS,
		multi_select: MOCK_MULTI_SELECT_QUESTIONS,
		ordering: MOCK_ORDERING_QUESTIONS
	};

	// 10 fill_blank, 10 multi_select, 10 ordering
	for (let i = 0; i < 10; i++) {
		questions.push({
			id: generateId(`topic_fb_${i}`),
			type: 'fill_blank',
			data: [...banks.fill_blank[i % banks.fill_blank.length]] as FillBlankQuestionData
		});
	}
	for (let i = 0; i < 10; i++) {
		questions.push({
			id: generateId(`topic_ms_${i}`),
			type: 'multi_select',
			data: [...banks.multi_select[i % banks.multi_select.length]] as MultiSelectQuestionData
		});
	}
	for (let i = 0; i < 10; i++) {
		questions.push({
			id: generateId(`topic_or_${i}`),
			type: 'ordering',
			data: [...banks.ordering[i % banks.ordering.length]] as OrderingQuestionData
		});
	}

	return questions;
}

// Final test: 60 questions focusing on weak skills (mock)
function getFinalTestQuestions(): QuizQuestion[] {
	const questions: QuizQuestion[] = [];
	const banks = {
		fill_blank: MOCK_FILL_BLANK_QUESTIONS,
		multi_select: MOCK_MULTI_SELECT_QUESTIONS,
		ordering: MOCK_ORDERING_QUESTIONS
	};

	// Mix based on "weak skills" - mock distribution: 20 per type
	const distribution = [
		...Array(20).fill('fill_blank'),
		...Array(20).fill('multi_select'),
		...Array(20).fill('ordering')
	];

	for (let i = 0; i < 60; i++) {
		const type = distribution[i] as 'fill_blank' | 'multi_select' | 'ordering';
		const bank = banks[type];
		questions.push({
			id: generateId(`final_${type}_${i}`),
			type,
			data: [...bank[i % bank.length]] as FillBlankQuestionData | MultiSelectQuestionData | OrderingQuestionData
		});
	}

	return questions;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

// In-memory session storage (simulates backend)
const sessionStore = new Map<string, QuizSession>();
const autoSaveStore = new Map<string, Record<number, UserAnswerRecord>>();

export async function fetchQuiz(
	type: 'lesson' | 'topic' | 'final',
	targetId: string
): Promise<QuizSession> {
	await delay();

	let questions: QuizQuestion[];
	let timeLimit: number | undefined;
	const targetNameMap: Record<string, string> = {
		'lesson-1': 'Writing Bug Reports',
		'lesson-2': 'Daily Standup Communication',
		'lesson-3': 'Scope Negotiation',
		'topic-1': 'Communication Fundamentals',
		'final': 'Final Graduation Test'
	};

	switch (type) {
		case 'lesson':
			questions = getLessonQuizQuestions();
			break;
		case 'topic':
			questions = getTopicQuizQuestions();
			break;
		case 'final':
			questions = getFinalTestQuestions();
			timeLimit = 3600; // 60 minutes strict timer
			break;
	}

	const session: QuizSession = {
		id: generateId('session'),
		type,
		targetId,
		targetName: targetNameMap[targetId] || targetId,
		questions,
		answers: {},
		startedAt: Date.now(),
		timeLimitSeconds: timeLimit,
		timeRemainingSeconds: timeLimit,
		status: 'in_progress',
		currentIndex: 0
	};

	sessionStore.set(session.id, session);
	return session;
}

export async function submitAnswer(
	sessionId: string,
	questionIndex: number,
	answer: UserAnswerRecord
): Promise<{ success: boolean }> {
	await delay(100); // Fast auto-save

	const session = sessionStore.get(sessionId);
	if (!session) throw new Error('Session not found');

	session.answers[questionIndex] = answer;
	session.currentIndex = Math.max(session.currentIndex, questionIndex + 1);

	// Also store in auto-save for resume
	const saveKey = `${sessionId}_${questionIndex}`;
	autoSaveStore.set(saveKey, { [questionIndex]: answer });

	return { success: true };
}

export async function autoSaveAnswers(
	sessionId: string,
	answers: Record<number, UserAnswerRecord>
): Promise<{ success: boolean }> {
	await delay(50);

	const session = sessionStore.get(sessionId);
	if (!session) throw new Error('Session not found');

	// Merge answers
	session.answers = { ...session.answers, ...answers };

	// Persist auto-save
	for (const [idx, ans] of Object.entries(answers)) {
		const saveKey = `${sessionId}_${idx}`;
		autoSaveStore.set(saveKey, { [Number(idx)]: ans });
	}

	return { success: true };
}

export async function resumeQuiz(sessionId: string): Promise<QuizSession | null> {
	await delay();

	const session = sessionStore.get(sessionId);
	if (!session) return null;

	// Check for any auto-saved answers not in session
	for (const [key, value] of autoSaveStore.entries()) {
		if (key.startsWith(`${sessionId}_`)) {
			for (const [idx, ans] of Object.entries(value)) {
				if (!session.answers[Number(idx)]) {
					session.answers[Number(idx)] = ans;
				}
			}
		}
	}

	return session;
}

export async function submitQuiz(sessionId: string): Promise<QuizResult> {
	await delay(500); // Simulate grading time

	const session = sessionStore.get(sessionId);
	if (!session) throw new Error('Session not found');

	if (session.status === 'submitted') {
		throw new Error('Quiz already submitted');
	}

	session.status = 'submitted';

	const questionResults: QuestionResult[] = [];
	let totalScore = 0;

	for (let i = 0; i < session.questions.length; i++) {
		const q = session.questions[i];
		const userRecord = session.answers[i];
		const isCorrect = checkAnswer(q, userRecord?.answer || '');
		const confidence = userRecord ? userRecord.confidenceFlag : 'fail' as const;
		const score = calculateScore(isCorrect, confidence);

		totalScore += score;

		// Extract question text based on type
		let questionText = '';
		if (q.type === 'fill_blank') questionText = (q.data as FillBlankQuestionData)[0];
		else if (q.type === 'multi_select') questionText = (q.data as MultiSelectQuestionData)[0];
		else if (q.type === 'ordering') questionText = (q.data as OrderingQuestionData)[0];

		// Get correct answer
		let correctAnswer = '';
		if (q.type === 'fill_blank') correctAnswer = (q.data as FillBlankQuestionData)[2];
		else if (q.type === 'multi_select') correctAnswer = (q.data as MultiSelectQuestionData)[2];
		else if (q.type === 'ordering') correctAnswer = (q.data as OrderingQuestionData)[2];

		// Get explanation
		let explanation = '';
		if (q.type === 'fill_blank') explanation = (q.data as FillBlankQuestionData)[3];
		else if (q.type === 'multi_select') explanation = (q.data as MultiSelectQuestionData)[3];
		else if (q.type === 'ordering') explanation = (q.data as OrderingQuestionData)[3];

		// Get skill vector (indices 4-7 are weights)
		let skillVector: [number, number, number, number] = [0, 0, 0, 0];
		if (q.type === 'fill_blank') {
			const d = q.data as FillBlankQuestionData;
			skillVector = [d[4], d[5], d[6], d[7]];
		} else if (q.type === 'multi_select') {
			const d = q.data as MultiSelectQuestionData;
			skillVector = [d[4], d[5], d[6], d[7]];
		} else if (q.type === 'ordering') {
			const d = q.data as OrderingQuestionData;
			skillVector = [d[4], d[5], d[6], d[7]];
		}

		questionResults.push({
			index: i,
			type: q.type,
			questionText,
			userAnswer: userRecord?.answer || '',
			correctAnswer,
			isCorrect,
			explanation,
			skillVector,
			timeSpentSeconds: userRecord?.timeSpentSeconds || 0,
			confidenceFlag: confidence
		});
	}

	// Calculate breakdown
	const { aggregateVectors, calculateSkillPercentages, calculateGatekeepingScore, isPassed } = await import('../util/skillVector');
	
	const breakdown = aggregateVectors(questionResults.map(qr => ({
		skillVector: qr.skillVector,
		score: qr.confidenceFlag === 'confident' ? 10 : qr.confidenceFlag === 'warning' ? 5 : 0
	})));
	const percentages = calculateSkillPercentages(breakdown);
	
	const gatekeeping = calculateGatekeepingScore(questionResults);
	const passed = isPassed(gatekeeping.percentage, session.type === 'final' ? 80 : 70);

	// Generate AI summary (mock Prompt D-1 style)
	const aiSummary = generateAISummary(passed, percentages, session.type);

	const result: QuizResult = {
		sessionId: session.id,
		type: session.type,
		targetId: session.targetId,
		targetName: session.targetName,
		passed,
		score: totalScore,
		maxScore: session.questions.length * 10, // Max 10 per question in Flow 2
		percentage: gatekeeping.percentage,
		skillBreakdown: {
			D: { score: breakdown.D.score, total: breakdown.D.total },
			C: { score: breakdown.C.score, total: breakdown.C.total },
			T: { score: breakdown.T.score, total: breakdown.T.total },
			G: { score: breakdown.G.score, total: breakdown.G.total }
		},
		questionResults,
		aiSummary
	};

	return result;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function checkAnswer(question: QuizQuestion, userAnswer: string): boolean {
	if (!userAnswer) return false;
	
	if (question.type === 'multi_select') {
		const correct = (question.data as MultiSelectQuestionData)[2]
			.split('|')
			.map(s => s.trim())
			.filter(Boolean)
			.sort()
			.join('|');
		const user = userAnswer
			.split('|')
			.map(s => s.trim())
			.filter(Boolean)
			.sort()
			.join('|');
		return user === correct;
	}

	let correct = '';
	if (question.type === 'fill_blank') correct = (question.data as FillBlankQuestionData)[2];
	else if (question.type === 'ordering') correct = (question.data as OrderingQuestionData)[2];

	return userAnswer.trim().toLowerCase() === correct.trim().toLowerCase();
}

function calculateScore(isCorrect: boolean, confidence: 'confident' | 'warning' | 'fail'): number {
	if (!isCorrect) return 0;
	if (confidence === 'confident') return 10; // Full vector weight
	if (confidence === 'warning') return 5;   // 50% vector weight
	return 0;
}

function generateAISummary(
	passed: boolean,
	percentages: { D: number; C: number; T: number; G: number },
	type: 'lesson' | 'topic' | 'final'
): string {
	const weakSkills = Object.entries(percentages)
		.filter(([, v]) => v < 70)
		.sort((a, b) => a[1] - b[1])
		.map(([k]) => k);

	const skillNames: Record<string, string> = {
		D: 'Technical Document (D)',
		C: 'Communication (C)',
		T: 'Troubleshooting (T)',
		G: 'Growth/Economics (G)'
	};

	if (passed) {
		if (type === 'final') {
			return `Congratulations on graduating the course! You achieved ${percentages.D}% D, ${percentages.C}% C, ${percentages.T}% T, ${percentages.G}% G. Please continue daily study habits to further improve.`;
		}
		return `You passed the ${type} quiz! Strengths: ${Object.entries(percentages).filter(([,v])=>v>=70).map(([k])=>skillNames[k]).join(', ')}. ${weakSkills.length ? `Needs attention: ${weakSkills.map(k=>skillNames[k]).join(', ')}` : ''}`;
	} else {
		const focus = weakSkills.slice(0, 2).map(k => skillNames[k]).join(' and ');
		return `You did not pass the ${type} quiz. System recommends reviewing ${focus} before retrying. Don't get discouraged, this is an opportunity to strengthen your foundation!`;
	}
}