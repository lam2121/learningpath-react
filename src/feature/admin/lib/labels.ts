// Shared display labels for admin AI-usage data.
//
// These maps previously existed twice (CostDashboard and UsageLogTable) with
// different contents, so the two pages disagreed about what "D1" meant.

export const GENERATOR_LABELS: Record<string, string> = {
	A: 'Placement Test',
	B1: 'Topic Outline',
	B2: 'Lesson Outline',
	C1: 'Theory',
	C2: 'Quiz',
	D1: 'Evaluator',
	D2: 'Advisor',
};

export function generatorLabel(code: string): string {
	return GENERATOR_LABELS[code] ?? code;
}

/** "A - Placement Test", for filter dropdowns. */
export function generatorOptionLabel(code: string): string {
	const label = GENERATOR_LABELS[code];
	return label ? `${code} - ${label}` : code;
}

export const STATUS_STYLES: Record<string, string> = {
	success: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
	retry: 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200',
	rejected: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
	fallback: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300',
};

/**
 * Money formatter for AI costs.
 *
 * Per-call costs are frequently well under a cent, so two decimals renders
 * almost everything as "$0.00".
 */
export function formatCost(usd: number): string {
	if (usd > 0 && usd < 0.0001) return '<$0.0001';
	if (Math.abs(usd) >= 1000) return `$${usd.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
	return `$${usd.toFixed(4)}`;
}

/** Compact form for axis ticks and tight tiles. */
export function formatCostShort(usd: number): string {
	if (usd === 0) return '$0';
	if (Math.abs(usd) < 0.01) return '<$0.01';
	if (Math.abs(usd) >= 1000) return `$${(usd / 1000).toFixed(1)}k`;
	return `$${usd.toFixed(2)}`;
}

export function formatTokens(tokens: number): string {
	if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(2)}M`;
	if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}k`;
	return String(tokens);
}
