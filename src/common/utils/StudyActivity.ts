import {
    STREAK_RESTORE_MINUTES_PER_DAY,
    STREAK_RESTORE_LOOKBACK_DAYS,
} from "@/const/appConst";

const getStorageKey = (userId: number) =>
    `learning-login-days:${userId}`;
const getStudyMinutesStorageKey = (userId: number) =>
    `learning-study-minutes:${userId}`;
const getStudyRemainderStorageKey = (userId: number) =>
    `learning-study-minutes-remainder:${userId}`;
export const LOGIN_DAYS_UPDATED_EVENT = "careerpath:login-days-updated";
export const STREAK_STATUS_SYNCED_EVENT = "careerpath:streak-status-synced";


function formatDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function emitLoginDaysUpdated(userId: number): void {
    window.dispatchEvent(
        new CustomEvent(LOGIN_DAYS_UPDATED_EVENT, {
            detail: {
                userId,
                loginDays: getLoginDays(userId),
            },
        }),
    );
}

export function recordLoginDay(userId: number): void {
    const storageKey = getStorageKey(userId);
    const todayKey = formatDateKey(new Date());

    try {
        const savedData: unknown = JSON.parse(
            localStorage.getItem(storageKey) ?? "[]",
        );

        const savedDates = Array.isArray(savedData)
            ? savedData.filter(
                (date): date is string => typeof date === "string",
            )
            : [];
        const alreadyRecorded = savedDates.includes(todayKey);

        const updatedDates = [...new Set([...savedDates, todayKey])].sort();

        localStorage.setItem(
            storageKey,
            JSON.stringify(updatedDates),
        );
        if (!alreadyRecorded) {
            emitLoginDaysUpdated(userId);
        }
    } catch {
        localStorage.setItem(
            storageKey,
            JSON.stringify([todayKey]),
        );
        emitLoginDaysUpdated(userId);
    }
}

export function getLoginDays(userId: number): string[] {
    try {
        const savedData: unknown = JSON.parse(
            localStorage.getItem(getStorageKey(userId)) ?? "[]",
        );

        return Array.isArray(savedData)
            ? savedData.filter(
                (date): date is string => typeof date === "string",
            )
            : [];
    } catch {
        return [];
    }
}

export function clearLoginDays(userId: number): void {
    try {
        localStorage.removeItem(getStorageKey(userId));
    } catch {
        // Ignore storage failures and keep the app usable.
    }

    emitLoginDaysUpdated(userId);
}

type StudyMinutesByDay = Record<string, number>;

type StudyMinutesRemainder = {
    dateKey: string;
    milliseconds: number;
};

function isStudyMinutesByDay(value: unknown): value is StudyMinutesByDay {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return false;
    }

    return Object.entries(value).every(
        ([key, minutes]) => typeof key === "string" && typeof minutes === "number",
    );
}

function readStudyMinutesByDay(userId: number): StudyMinutesByDay {
    try {
        const savedData: unknown = JSON.parse(
            localStorage.getItem(getStudyMinutesStorageKey(userId)) ?? "{}",
        );

        if (!isStudyMinutesByDay(savedData)) {
            return {};
        }

        return Object.fromEntries(
            Object.entries(savedData).filter(([, minutes]) => Number.isFinite(minutes) && minutes > 0),
        );
    } catch {
        return {};
    }
}

function readStudyMinutesRemainder(userId: number): StudyMinutesRemainder | null {
    try {
        const savedData: unknown = JSON.parse(
            localStorage.getItem(getStudyRemainderStorageKey(userId)) ?? "null",
        );

        const data = savedData as Record<string, unknown>;
        if (
            !data
            || typeof data !== "object"
            || Array.isArray(data)
            || typeof data.dateKey !== "string"
            || typeof data.milliseconds !== "number"
        ) {
            return null;
        }

        return {
            dateKey: data.dateKey,
            milliseconds: Math.max(0, Math.floor(data.milliseconds)),
        };
    } catch {
        return null;
    }
}

function emitStudyActivityUpdated(userId: number): void {
    window.dispatchEvent(
        new CustomEvent("careerpath:study-activity-updated", {
            detail: {
                userId,
                studyMinutesByDay: getTrackedStudyMinutesByDay(userId),
                streakRestoreMinutes: getStreakRestoreStudyMinutes(userId),
            },
        }),
    );
}

export function getTrackedStudyMinutesByDay(userId: number): StudyMinutesByDay {
    return readStudyMinutesByDay(userId);
}

export function getTrackedStudyMinutesTotal(userId: number): number {
    return Object.values(readStudyMinutesByDay(userId)).reduce(
        (total, minutes) => total + minutes,
        0,
    );
}

export function clearTrackedStudyActivity(userId: number): void {
    try {
        localStorage.removeItem(getStudyMinutesStorageKey(userId));
        localStorage.removeItem(getStudyRemainderStorageKey(userId));
        localStorage.removeItem(getStreakRestoreMinutesStorageKey(userId));
        localStorage.removeItem(getStreakRestoreInitStorageKey(userId));
    } catch {
        // Ignore storage failures and keep the app usable.
    }

    emitStudyActivityUpdated(userId);
}

export function recordStudyTime(userId: number, elapsedMilliseconds: number): void {
    if (!Number.isFinite(elapsedMilliseconds) || elapsedMilliseconds <= 0) {
        return;
    }

    const todayKey = formatDateKey(new Date());
    const studyMinutesByDay = readStudyMinutesByDay(userId);
    const remainder = readStudyMinutesRemainder(userId);
    const carriedMilliseconds =
        remainder?.dateKey === todayKey ? remainder.milliseconds : 0;
    const totalMilliseconds = carriedMilliseconds + Math.floor(elapsedMilliseconds);
    const wholeMinutes = Math.floor(totalMilliseconds / 60_000);
    const nextRemainder = totalMilliseconds % 60_000;

    try {
        if (wholeMinutes > 0) {
            studyMinutesByDay[todayKey] = (studyMinutesByDay[todayKey] ?? 0) + wholeMinutes;
            localStorage.setItem(
                getStudyMinutesStorageKey(userId),
                JSON.stringify(studyMinutesByDay),
            );

            // Synchronize streak restore study minutes directly with study activity
            const currentStreakMinutes = getStreakRestoreStudyMinutes(userId);
            setStreakRestoreStudyMinutes(userId, currentStreakMinutes + wholeMinutes);
        }

        localStorage.setItem(
            getStudyRemainderStorageKey(userId),
            JSON.stringify({
                dateKey: todayKey,
                milliseconds: nextRemainder,
            } satisfies StudyMinutesRemainder),
        );

        if (wholeMinutes > 0) {
            emitStudyActivityUpdated(userId);
        }
    } catch {
        // Ignore storage failures and keep the app usable.
    }
}

export function calculateLongestStreak(dateKeys: string[]): number {
    const uniqueDates = [...new Set(dateKeys)].sort();
    let longestStreak = 0;
    let currentStreak = 0;
    let previousDate: Date | null = null;

    uniqueDates.forEach((dateKey) => {
        const [year, month, day] = dateKey.split("-").map(Number);
        const currentDate = new Date(year, month - 1, day);

        if (previousDate) {
            const expectedDate = new Date(previousDate);
            expectedDate.setDate(expectedDate.getDate() + 1);

            currentStreak =
                formatDateKey(expectedDate) === dateKey ? currentStreak + 1 : 1;
        } else {
            currentStreak = 1;
        }

        longestStreak = Math.max(longestStreak, currentStreak);
        previousDate = currentDate;
    });

    return longestStreak;
}

export function calculateCurrentStreak(
    dateKeys: string[],
    referenceDate: Date = new Date(),
): number {
    const dateSet = new Set(dateKeys);
    const todayKey = formatDateKey(referenceDate);

    let checkDate = new Date(referenceDate);
    if (!dateSet.has(todayKey)) {
        checkDate.setDate(checkDate.getDate() - 1);
        const yesterdayKey = formatDateKey(checkDate);
        if (!dateSet.has(yesterdayKey)) {
            return 0;
        }
    }

    let streak = 0;
    while (dateSet.has(formatDateKey(checkDate))) {
        streak += 1;
        checkDate.setDate(checkDate.getDate() - 1);
    }
    return streak;
}

export const RESTORE_MINUTES_PER_DAY = STREAK_RESTORE_MINUTES_PER_DAY;
export const STREAK_RESTORED_EVENT = "careerpath:streak-restored";

export function getRestoredDays(userId: number): string[] {
    try {
        const savedData: unknown = JSON.parse(
            localStorage.getItem(`learning-restored-days:${userId}`) ?? "[]",
        );
        return Array.isArray(savedData)
            ? savedData.filter((d): d is string => typeof d === "string")
            : [];
    } catch {
        return [];
    }
}

export function getUsedRestoreCredits(userId: number): number {
    try {
        const saved = localStorage.getItem(`learning-used-restore-credits:${userId}`);
        const parsed = Number(saved);
        return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    } catch {
        return 0;
    }
}

export function findMissedDays(
    dateKeys: string[],
    referenceDate: Date = new Date(),
    maxLookbackDays: number = STREAK_RESTORE_LOOKBACK_DAYS,
): string[] {
    if (dateKeys.length === 0) return [];
    const dateSet = new Set(dateKeys);
    const sortedDates = [...dateSet].sort();
    const earliestDateKey = sortedDates[0];
    const [eYear, eMonth, eDay] = earliestDateKey.split("-").map(Number);
    const earliestDate = new Date(eYear, eMonth - 1, eDay);

    const cutoffDate = new Date(referenceDate);
    cutoffDate.setDate(cutoffDate.getDate() - maxLookbackDays);

    const startDate = earliestDate > cutoffDate ? earliestDate : cutoffDate;
    const missed: string[] = [];

    const cursor = new Date(referenceDate);
    cursor.setDate(cursor.getDate() - 1);

    while (cursor >= startDate) {
        const key = formatDateKey(cursor);
        if (!dateSet.has(key)) {
            missed.push(key);
        }
        cursor.setDate(cursor.getDate() - 1);
    }

    return missed;
}

export type StreakRestoreStatus = {
    totalStudiedMinutes: number;
    requiredMinutesPerDay: number;
    totalEarnedCredits: number;
    usedCredits: number;
    availableCredits: number;
    progressMinutes: number;
    progressPercent: number;
    restoredDays: string[];
    missedDays: string[];
    currentStreak: number;
    longestStreak: number;
};

const STREAK_RESTORE_VERSION = "v3";
const getStreakRestoreMinutesStorageKey = (userId: number) =>
    `learning-streak-restore-minutes:${userId}`;
const getStreakRestoreInitStorageKey = (userId: number) =>
    `learning-streak-restore-${STREAK_RESTORE_VERSION}:${userId}`;

function ensureStreakRestoreInitialized(userId: number): void {
    if (!Number.isFinite(userId) || userId <= 0) return;
    try {
        const initKey = getStreakRestoreInitStorageKey(userId);
        if (typeof localStorage !== "undefined" && !localStorage.getItem(initKey)) {
            // "Bắt đầu tính từ bây giờ không tính lúc trước":
            // Clear any old keys that stored historical completed lesson minutes or test restores
            localStorage.removeItem(`learning-server-study-minutes:${userId}`);
            localStorage.removeItem(`learning-used-restore-credits:${userId}`);
            localStorage.removeItem(`learning-restored-days:${userId}`);
            localStorage.removeItem(`learning-streak-restore-initialized:${userId}`);
            localStorage.setItem(getStreakRestoreMinutesStorageKey(userId), "0");
            localStorage.setItem(initKey, "true");
        }
    } catch {
        // Ignore storage failures
    }
}

export function getStreakRestoreStudyMinutes(userId: number): number {
    ensureStreakRestoreInitialized(userId);
    try {
        const val = localStorage.getItem(getStreakRestoreMinutesStorageKey(userId));
        const parsed = val !== null ? parseInt(val, 10) : NaN;
        return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    } catch {
        return 0;
    }
}

export function setStreakRestoreStudyMinutes(userId: number, minutes: number): void {
    ensureStreakRestoreInitialized(userId);
    if (!Number.isFinite(minutes) || minutes < 0) return;
    try {
        localStorage.setItem(
            getStreakRestoreMinutesStorageKey(userId),
            String(Math.floor(minutes)),
        );
    } catch {
        // Ignore storage failures
    }
}

export function getServerStudyMinutes(userId: number): number {
    return getStreakRestoreStudyMinutes(userId);
}

export function setServerStudyMinutes(userId: number, minutes: number): void {
    setStreakRestoreStudyMinutes(userId, minutes);
}

export function getServerRequiredMinutes(userId: number): number {
    try {
        const val = localStorage.getItem(`learning-required-minutes:${userId}`);
        const parsed = val ? parseInt(val, 10) : NaN;
        return Number.isFinite(parsed) && parsed > 0 ? parsed : RESTORE_MINUTES_PER_DAY;
    } catch {
        return RESTORE_MINUTES_PER_DAY;
    }
}

export function setServerRequiredMinutes(userId: number, minutes: number): void {
    if (!Number.isFinite(minutes) || minutes <= 0) return;
    try {
        localStorage.setItem(
            `learning-required-minutes:${userId}`,
            String(Math.floor(minutes)),
        );
    } catch {
        // Ignore storage failures
    }
}

export function getStreakRestoreStatus(
    userId: number,
    clientStudyMinutes: number = 0,
): StreakRestoreStatus {
    const trackedMinutes = getStreakRestoreStudyMinutes(userId);
    const totalStudiedMinutes = Math.max(clientStudyMinutes, trackedMinutes);
    const requiredMinutesPerDay = getServerRequiredMinutes(userId);
    const totalEarnedCredits = Math.floor(totalStudiedMinutes / requiredMinutesPerDay);
    const usedCredits = getUsedRestoreCredits(userId);
    const availableCredits = Math.max(0, totalEarnedCredits - usedCredits);
    const progressMinutes = totalStudiedMinutes % requiredMinutesPerDay;
    const progressPercent = Math.min(
        100,
        Math.round((progressMinutes / requiredMinutesPerDay) * 100),
    );

    const loginDays = getLoginDays(userId);
    const restoredDays = getRestoredDays(userId);
    const missedDays = findMissedDays(loginDays);
    const currentStreak = calculateCurrentStreak(loginDays);
    const longestStreak = calculateLongestStreak(loginDays);

    return {
        totalStudiedMinutes,
        requiredMinutesPerDay,
        totalEarnedCredits,
        usedCredits,
        availableCredits,
        progressMinutes,
        progressPercent,
        restoredDays,
        missedDays,
        currentStreak,
        longestStreak,
    };
}

export function restoreMissedDays(
    userId: number,
    datesToRestore: string[],
    clientStudyMinutes: number = 0,
): { success: boolean; restoredCount: number; error?: string } {
    if (!datesToRestore || datesToRestore.length === 0) {
        return { success: false, restoredCount: 0, error: "No dates provided" };
    }

    const trackedMinutes = getStreakRestoreStudyMinutes(userId);
    const effectiveMinutes = Math.max(clientStudyMinutes, trackedMinutes);
    const currentStatus = getStreakRestoreStatus(userId, effectiveMinutes);
    const existingRestored = new Set(currentStatus.restoredDays);
    const cleanDates = [...new Set(datesToRestore)].filter(
        (d) => !existingRestored.has(d),
    );

    if (cleanDates.length === 0) {
        return { success: true, restoredCount: 0 };
    }

    if (cleanDates.length > currentStatus.availableCredits) {
        return {
            success: false,
            restoredCount: 0,
            error: `Cần ${cleanDates.length} lượt khôi phục (${cleanDates.length * currentStatus.requiredMinutesPerDay} phút học), nhưng chỉ còn ${currentStatus.availableCredits} lượt.`,
        };
    }

    const updatedRestored = [...currentStatus.restoredDays, ...cleanDates].sort();
    const updatedUsed = currentStatus.usedCredits + cleanDates.length;
    const currentLoginDays = getLoginDays(userId);
    const updatedLoginDays = [...new Set([...currentLoginDays, ...cleanDates])].sort();

    try {
        localStorage.setItem(
            `learning-restored-days:${userId}`,
            JSON.stringify(updatedRestored),
        );
        localStorage.setItem(
            `learning-used-restore-credits:${userId}`,
            String(updatedUsed),
        );
        localStorage.setItem(
            getStorageKey(userId),
            JSON.stringify(updatedLoginDays),
        );
    } catch {
        // Ignore storage failures
    }

    emitLoginDaysUpdated(userId);
    window.dispatchEvent(
        new CustomEvent(STREAK_RESTORED_EVENT, {
            detail: {
                userId,
                restoredDates: cleanDates,
                totalRestored: updatedRestored,
            },
        }),
    );

    return { success: true, restoredCount: cleanDates.length };
}

export function syncRestoredDaysFromServer(
    userId: number,
    serverRestoredDates: string[],
    serverUsedCredits?: number,
): void {
    if (!Array.isArray(serverRestoredDates) || serverRestoredDates.length === 0) {
        return;
    }

    const localRestored = getRestoredDays(userId);
    const mergedRestored = [...new Set([...localRestored, ...serverRestoredDates])].sort();
    const localLogin = getLoginDays(userId);
    const mergedLogin = [...new Set([...localLogin, ...serverRestoredDates])].sort();

    const localUsed = getUsedRestoreCredits(userId);
    const targetUsed = Math.max(
        localUsed,
        serverUsedCredits ?? serverRestoredDates.length,
    );

    try {
        localStorage.setItem(
            `learning-restored-days:${userId}`,
            JSON.stringify(mergedRestored),
        );
        localStorage.setItem(
            `learning-used-restore-credits:${userId}`,
            String(targetUsed),
        );
        localStorage.setItem(
            getStorageKey(userId),
            JSON.stringify(mergedLogin),
        );
    } catch {
        // Ignore storage failures
    }

    emitLoginDaysUpdated(userId);
}

export function syncServerStreakStatus(
    userId: number,
    serverStatus: {
        total_studied_minutes?: number;
        required_minutes_per_day?: number;
        used_credits?: number;
        restored_dates?: string[];
    },
): void {
    if (!Number.isFinite(userId) || userId <= 0) return;
    if (serverStatus.total_studied_minutes !== undefined) {
        setStreakRestoreStudyMinutes(userId, serverStatus.total_studied_minutes);
    }
    if (serverStatus.required_minutes_per_day !== undefined) {
        setServerRequiredMinutes(userId, serverStatus.required_minutes_per_day);
    }
    if (Array.isArray(serverStatus.restored_dates) && serverStatus.restored_dates.length > 0) {
        syncRestoredDaysFromServer(
            userId,
            serverStatus.restored_dates,
            serverStatus.used_credits,
        );
    } else if (serverStatus.used_credits !== undefined) {
        try {
            localStorage.setItem(
                `learning-used-restore-credits:${userId}`,
                String(serverStatus.used_credits),
            );
        } catch {
            // Ignore storage failures
        }
    }

    window.dispatchEvent(
        new CustomEvent(STREAK_STATUS_SYNCED_EVENT, {
            detail: {
                userId,
                serverStatus,
            },
        }),
    );
}

