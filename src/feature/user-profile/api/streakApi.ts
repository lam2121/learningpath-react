import { fetchWithAuthRetry } from "@/common/lib/authSession";
import { API_BASE_URL as BASE_URL } from "@/const/appConst";

export type BackendStreakStatus = {
    total_studied_minutes: number;
    required_minutes_per_day: number;
    total_earned_credits: number;
    used_credits: number;
    available_credits: number;
    progress_minutes: number;
    progress_percent: number;
    restored_dates: string[];
    current_streak: number;
    longest_streak: number;
};

export async function fetchServerStreakStatus(
    clientStudyMinutes?: number,
): Promise<BackendStreakStatus> {
    const query = clientStudyMinutes && clientStudyMinutes > 0
        ? `?client_study_minutes=${encodeURIComponent(clientStudyMinutes)}`
        : "";
    const response = await fetchWithAuthRetry(`${BASE_URL}/user/me/streak${query}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(
            typeof errorData.detail === "string" ? errorData.detail : "Failed to fetch streak status",
        );
    }

    return response.json();
}

export async function restoreServerStreak(
    dates: string[],
    clientStudyMinutes?: number,
): Promise<BackendStreakStatus> {
    const response = await fetchWithAuthRetry(`${BASE_URL}/user/me/streak/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            dates,
            client_study_minutes: clientStudyMinutes,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(
            typeof errorData.detail === "string" ? errorData.detail : "Failed to restore streak",
        );
    }

    return response.json();
}
