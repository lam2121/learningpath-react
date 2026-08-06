export type SkillVector = 'D' | 'C' | 'T' | 'G';

// Sub-budgets are tracking vectors [D, C, T, G]
export type VectorArray = [number, number, number, number];

// Question formats from Schema_C2, C3, C4
export type FillBlankQuestionData = [
	stem: string,                    // Professional Response with a blank ___
	options: string,                 // "OptionA|OptionB|OptionC|OptionD"
	answer: string,                  // Correct option verbatim
	explanation: string,             // Vietnamese detailed explanation
	wD: number, wC: number, wT: number, wG: number, // ONE-HOT weights (one 10, three 0s)
	remD: number, remC: number, remT: number, remG: number // Running remaining budget
];

export type MultiSelectQuestionData = [
	stem: string,                    // Professional scenario with a selection instruction
	options: string,                 // "OptionA|OptionB|OptionC|OptionD|OptionE"
	answer: string,                  // Correct option indices (e.g., "0|2")
	explanation: string,             // Vietnamese detailed explanation
	wD: number, wC: number, wT: number, wG: number, // ONE-HOT weights (one 10, three 0s)
	remD: number, remC: number, remT: number, remG: number // Running remaining budget
];

export type OrderingQuestionData = [
	instruction: string,             // Sequencing challenge instruction
	steps: string,                   // Shuffled steps separated by |
	answer: string,                  // Correct sequence indices (e.g., "1|2|0")
	explanation: string,             // Vietnamese logical explanation
	wD: number, wC: number, wT: number, wG: number, // ONE-HOT weights
	remD: number, remC: number, remT: number, remG: number // Running remaining budget
];

export type QuestionType = 'fill_blank' | 'multi_select' | 'ordering';

export interface QuizQuestion {
	id: string;
	type: QuestionType;
	data: FillBlankQuestionData | MultiSelectQuestionData | OrderingQuestionData;
}

export type UserAnswer = string; // Option letter, selected indices, or index sequence e.g. "1|2|0"

export interface UserAnswerRecord {
	answer: UserAnswer;
	timeSpentSeconds: number;
	blurCount: number;
	confidenceFlag: 'confident' | 'warning' | 'fail';
}

export interface QuizSession {
	id: string;
	type: 'lesson' | 'topic' | 'final';
	targetId: string; // lessonId, topicId, or 'final-test'
	targetName: string; // Name of the lesson/topic
	questions: QuizQuestion[];
	answers: Record<number, UserAnswerRecord>; // key: question index
	startedAt: number;
	timeLimitSeconds?: number; // Strict timer for final test (e.g. 3600s = 60 mins)
	timeRemainingSeconds?: number;
	status: 'in_progress' | 'submitted';
	currentIndex: number;
}

export interface QuestionResult {
	index: number;
	type: QuestionType;
	questionText: string;
	userAnswer: string;
	correctAnswer: string;
	isCorrect: boolean;
	explanation: string;
	skillVector: VectorArray; // One-hot [D, C, T, G]
	timeSpentSeconds: number;
	confidenceFlag: 'confident' | 'warning' | 'fail';
}

export interface QuizResult {
	sessionId: string;
	type: 'lesson' | 'topic' | 'final';
	targetId: string;
	targetName: string;
	passed: boolean;
	score: number; // Raw correct answers (or implicit score sum)
	maxScore: number;
	percentage: number;
	skillBreakdown: {
		D: { score: number; total: number };
		C: { score: number; total: number };
		T: { score: number; total: number };
		G: { score: number; total: number };
	};
	questionResults: QuestionResult[];
	aiSummary: string; // Vietnamese encouraging summary (Prompt D-1 style)
}
