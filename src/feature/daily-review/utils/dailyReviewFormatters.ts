export function getInitialOrderingIndices(length: number): number[] {
    const indices = Array.from({ length }, (_, i) => i);
    if (length <= 1) return indices;
    // Rotate to ensure steps are not pre-ordered in 0, 1, 2, 3 sequence
    return [...indices.slice(1), indices[0]];
}

export function formatDisplayAnswer(
    rawAnswer: string | null | undefined,
    questionType: string,
    options: string[] = []
): string {
    if (!rawAnswer || !rawAnswer.trim()) {
        return "None selected";
    }

    const trimmed = rawAnswer.trim();

    // 1. Pipe-separated indices (multi_select, ordering, or indexed answers like "0|1")
    if (trimmed.includes("|") && options.length > 0) {
        const parts = trimmed.split("|").map((s) => s.trim());
        if (parts.every((p) => p.length > 0 && !Number.isNaN(Number(p)))) {
            const indices = parts.map(Number);
            if (questionType === "ordering") {
                const steps = indices
                    .map((idx, pos) => `${pos + 1}. ${options[idx] ?? `Step ${idx + 1}`}`);
                if (steps.length > 0) {
                    return steps.join(" ➔ ");
                }
            }
            const selectedTexts = indices
                .map((idx) => options[idx])
                .filter(Boolean);
            if (selectedTexts.length > 0) {
                return selectedTexts.join(", ");
            }
        }
    }

    // 2. Ordering question fallback
    if (questionType === "ordering" && trimmed.includes("|") && options.length > 0) {
        const indices = trimmed.split("|").map(Number).filter((n) => !Number.isNaN(n));
        const steps = indices.map((idx, pos) => `${pos + 1}. ${options[idx] ?? `Step ${idx + 1}`}`);
        if (steps.length > 0) return steps.join(" ➔ ");
    }

    // 3. Single numeric index (e.g. "0", "1", "2")
    if (/^\d+$/.test(trimmed) && options.length > 0) {
        const idx = parseInt(trimmed, 10);
        if (options[idx] !== undefined) {
            return options[idx];
        }
    }

    return trimmed;
}
