const getStorageKey = (userId: number) =>
    `learning-login-days:${userId}`;
const getStudyMinutesStorageKey = (userId: number) =>
    `learning-study-minutes:${userId}`;
const getStudyRemainderStorageKey = (userId: number) =>
    `learning-study-minutes-remainder:${userId}`;

function formatDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
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

        const updatedDates = [...new Set([...savedDates, todayKey])].sort();

        localStorage.setItem(
            storageKey,
            JSON.stringify(updatedDates),
        );
    } catch {
        localStorage.setItem(
            storageKey,
            JSON.stringify([todayKey]),
        );
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
