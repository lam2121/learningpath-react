export function formatMinutes(
    minutes: number | null | undefined,
    minUnit = "min",
    pendingText = "Estimate pending",
) {
    if (minutes == null || minutes <= 0) {
        return pendingText;
    }
    if (minUnit === "分") {
        return `${minutes}分`;
    }
    if (minUnit === "phút") {
        return `${minutes} phút`;
    }
    return minutes === 1 ? "1 minute" : `${minutes} minutes`;
}

export function formatProgressMinutes(minutes: number, minUnit = "min") {
    if (minutes <= 0) {
        if (minUnit === "分") return "0分";
        if (minUnit === "phút") return "0 phút";
        return "0 min";
    }
    if (minUnit === "分") {
        return `${minutes}分`;
    }
    if (minUnit === "phút") {
        return `${minutes} phút`;
    }
    return `${minutes} min`;
}

export function formatDifficultyTier(
    tier: string | undefined | null,
    t: (key: string, opts?: { defaultValue?: string }) => string,
) {
    if (!tier) return "";
    const lower = tier.toLowerCase();
    if (lower === "beginner") return t("tierBeginner", { defaultValue: "Beginner" });
    if (lower === "intermediate") return t("tierIntermediate", { defaultValue: "Intermediate" });
    if (lower === "advanced") return t("tierAdvanced", { defaultValue: "Advanced" });
    return tier
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

export function estimateDays(totalMinutes: number, dailyStudyMinutes: number) {
    if (totalMinutes <= 0 || dailyStudyMinutes <= 0) {
        return 0;
    }
    return Math.max(1, Math.ceil(totalMinutes / dailyStudyMinutes));
}
