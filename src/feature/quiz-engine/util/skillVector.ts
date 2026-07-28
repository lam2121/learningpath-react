// Skill Vector Aggregation - Flow 2 from docs/03-scoring-and-algorithms.md
// Converts question-level results into D/C/T/G skill profiles

import type { VectorArray, QuestionResult } from '../type/Quiz';

export function aggregateVectors(
	questions: Array<{ skillVector: VectorArray; score: number }>
): {
	D: { score: number; total: number };
	C: { score: number; total: number };
	T: { score: number; total: number };
	G: { score: number; total: number };
} {
	const result = {
		D: { score: 0, total: 0 },
		C: { score: 0, total: 0 },
		T: { score: 0, total: 0 },
		G: { score: 0, total: 0 },
	};

	for (const q of questions) {
		const [d, c, t, g] = q.skillVector;
		if (d === 10) {
			result.D.total += 10;
			result.D.score += q.score;
		}
		if (c === 10) {
			result.C.total += 10;
			result.C.score += q.score;
		}
		if (t === 10) {
			result.T.total += 10;
			result.T.score += q.score;
		}
		if (g === 10) {
			result.G.total += 10;
			result.G.score += q.score;
		}
	}

	return result;
}

export function calculateSkillPercentages(breakdown: ReturnType<typeof aggregateVectors>) {
	return {
		D: breakdown.D.total > 0 ? Math.round((breakdown.D.score / breakdown.D.total) * 100) : 0,
		C: breakdown.C.total > 0 ? Math.round((breakdown.C.score / breakdown.C.total) * 100) : 0,
		T: breakdown.T.total > 0 ? Math.round((breakdown.T.score / breakdown.T.total) * 100) : 0,
		G: breakdown.G.total > 0 ? Math.round((breakdown.G.score / breakdown.G.total) * 100) : 0,
	};
}

export function calculateGatekeepingScore(questionResults: QuestionResult[]) {
	let score = 0;
	const maxScore = questionResults.length;

	for (const qr of questionResults) {
		if (qr.confidenceFlag === 'confident') score += 1;
		else if (qr.confidenceFlag === 'warning') score += 0.5;
	}

	const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
	return { score, maxScore, percentage };
}

export function isPassed(percentage: number, threshold: number = 70): boolean {
	return percentage >= threshold;
}

// Global Score Update: New_Global = (Old_Global × 0.7) + (Lesson_Performance × 0.3)
export function updateGlobalScore(
	oldGlobal: number,
	lessonPerformancePercent: number
): number {
	return Math.round(oldGlobal * 0.7 + lessonPerformancePercent * 0.3);
}

// Get skill label from one-hot vector
export function getSkillLabel(vector: VectorArray): 'D' | 'C' | 'T' | 'G' | '-' {
	const idx = vector.indexOf(10);
	if (idx === 0) return 'D';
	if (idx === 1) return 'C';
	if (idx === 2) return 'T';
	if (idx === 3) return 'G';
	return '-';
}

export const skillLabels: Record<'D' | 'C' | 'T' | 'G', string> = {
	D: 'Văn bản kỹ thuật (D)',
	C: 'Giao tiếp (C)',
	T: 'Xử lý rủi ro (T)',
	G: 'Thương mại (G)'
};

export const skillColors: Record<'D' | 'C' | 'T' | 'G', string> = {
	D: 'bg-blue-100 text-blue-700 border-blue-200',
	C: 'bg-green-100 text-green-700 border-green-200',
	T: 'bg-orange-100 text-orange-700 border-orange-200',
	G: 'bg-purple-100 text-purple-700 border-purple-200'
};