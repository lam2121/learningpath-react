// Implicit Confidence Detection Algorithm
// From docs/03-scoring-and-algorithms.md Section 4

export type ConfidenceFlag = 'confident' | 'warning' | 'fail';

export interface ConfidenceInput {
	timeSpentMs: number;
	blurCount: number;
	isCorrect: boolean;
}

const MIN_TIME_MS = 3000;      // < 3s = suspicious fast
const MAX_TIME_MS = 60000;     // > 60s = suspicious slow (looking up)

export function calculateConfidence(input: ConfidenceInput): ConfidenceFlag {
	const { timeSpentMs, blurCount, isCorrect } = input;

	if (!isCorrect) {
		return 'fail';
	}

	// Check for suspicious timing (too fast = guessing, too slow = looking up)
	const timeSuspicious = timeSpentMs < MIN_TIME_MS || timeSpentMs > MAX_TIME_MS;
	const focusLost = blurCount > 0;

	if (timeSuspicious || focusLost) {
		return 'warning'; // Correct but signal violation → 50% vector weight
	}

	return 'confident'; // Correct & Confident → 100% vector weight
}

export function calculateScore(isCorrect: boolean, confidence: ConfidenceFlag): number {
	if (!isCorrect) return 0;
	if (confidence === 'confident') return 1.0;
	if (confidence === 'warning') return 0.5;
	return 0;
}

export function getConfidenceLabel(flag: ConfidenceFlag): string {
	switch (flag) {
		case 'confident':
			return 'Confident & Correct';
		case 'warning':
			return 'Correct but shows signs of guessing/referring to materials';
		case 'fail':
			return 'Incorrect';
	}
}

export function getConfidenceColor(flag: ConfidenceFlag): string {
	switch (flag) {
		case 'confident':
			return 'text-green-600 bg-green-100';
		case 'warning':
			return 'text-amber-600 bg-amber-100';
		case 'fail':
			return 'text-red-600 bg-red-100';
	}
}