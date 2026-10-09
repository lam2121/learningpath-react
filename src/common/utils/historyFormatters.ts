import i18n from "@/i18n/i18n";

export function getIntlLocale(lang?: string): string {
    const l = (lang || i18n?.language || (typeof localStorage !== "undefined" ? localStorage.getItem("app_language") : "") || "").toLowerCase();
    if (l.startsWith("jp") || l.startsWith("ja")) return "ja-JP";
    if (l.startsWith("vi")) return "vi-VN";
    return "en-US";
}

export function formatStudyDuration(minutes: number, minUnit?: string): string {
    const unit = minUnit || (i18n ? i18n.t("min", { ns: "profile", defaultValue: "min" }) : "min");
    const rounded = Math.round(minutes);
    if (rounded <= 0) {
        return `0 ${unit}`;
    }
    return rounded === 1 ? `1 ${unit}` : `${rounded} ${unit}`;
}

export function formatPercent(value: number | null | undefined): string {
    if (value == null || Number.isNaN(value)) {
        return "—";
    }
    return Number.isInteger(value) ? `${value}%` : `${value.toFixed(1)}%`;
}

export function formatLabel(value: string): string {
    return value
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

export function formatStatusLabel(value: string): string {
    return value
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

export function formatHistoryDate(value: string | null | undefined, locale?: string): string | null {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return null;
    }
    const resolvedLocale = locale || getIntlLocale();
    return parsed.toLocaleDateString(resolvedLocale, {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

export function formatQuestionTypeLabel(value: string): string {
    return value
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}
