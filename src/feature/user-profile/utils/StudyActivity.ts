const getStorageKey = (userId: number) =>
    `learning-login-days:${userId}`;

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