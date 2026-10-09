import type { StudyHistoryEntryResponse } from "@/feature/auth/type/Auth";

export type StudyGoalDecision = "break" | "continue";

function buildDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

export function getTodayDateKey(): string {
    return buildDateKey(new Date());
}

function getStudyGoalDecisionStorageKey(userId: number, dateKey: string) {
    return `careerpath:daily-study-goal:${userId}:${dateKey}`;
}

export function clearStudyGoalDecisions(userId: number) {
    const prefix = `careerpath:daily-study-goal:${userId}:`;

    try {
        for (let index = localStorage.length - 1; index >= 0; index -= 1) {
            const key = localStorage.key(index);
            if (key?.startsWith(prefix)) {
                localStorage.removeItem(key);
            }
        }
    } catch {
        // Ignore storage failures and keep the UI usable.
    }
}

export function readStudyGoalDecision(
    userId: number,
    dateKey = getTodayDateKey(),
): StudyGoalDecision | null {
    try {
        const value = localStorage.getItem(
            getStudyGoalDecisionStorageKey(userId, dateKey),
        );
        return value === "break" || value === "continue" ? value : null;
    } catch {
        return null;
    }
}

export function writeStudyGoalDecision(
    userId: number,
    decision: StudyGoalDecision,
    dateKey = getTodayDateKey(),
) {
    try {
        localStorage.setItem(
            getStudyGoalDecisionStorageKey(userId, dateKey),
            decision,
        );
    } catch {
        // Ignore storage failures and keep the UI usable.
    }
}

export function getStudyMinutesForDate(
    studyHistory: StudyHistoryEntryResponse[] | undefined,
    dateKey = getTodayDateKey(),
) {
    return studyHistory?.find((entry) => entry.studied_on === dateKey)?.minutes ?? 0;
}
