import { useEffect, useMemo, useState } from "react";
import { Button } from "@/shadcn/component/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/shadcn/component/ui/dropdown-menu";
import { Flame, Shield } from "lucide-react";
import { useTranslation } from "react-i18next";

import { LearningCalendar } from "@/feature/user-profile/component/LearningCalendar";
import { useAuth } from "@/common/context/AuthContext";
import {
    calculateCurrentStreak,
    calculateLongestStreak,
    getLoginDays,
    getStreakRestoreStatus,
    getTrackedStudyMinutesTotal,
    LOGIN_DAYS_UPDATED_EVENT,
    STREAK_RESTORED_EVENT,
    STREAK_STATUS_SYNCED_EVENT,
    syncServerStreakStatus,
} from "@/common/utils/StudyActivity";
import { fetchServerStreakStatus } from "@/feature/user-profile/api/streakApi";

export function StreakDropdown() {
    const { t } = useTranslation("nav");
    const auth = useAuth();
    const userId = Number(auth.user?.id);
    const [loginDays, setLoginDays] = useState<string[]>([]);
    const [availableCredits, setAvailableCredits] = useState(0);

    useEffect(() => {
        if (!Number.isFinite(userId) || userId <= 0) {
            setLoginDays([]);
            setAvailableCredits(0);
            return;
        }

        const syncStreakData = () => {
            setLoginDays(getLoginDays(userId));
            const status = getStreakRestoreStatus(userId);
            setAvailableCredits(status.availableCredits);
        };

        const syncFromServer = async () => {
            try {
                const clientMinutes = getTrackedStudyMinutesTotal(userId);
                const serverStatus = await fetchServerStreakStatus(clientMinutes);
                syncServerStreakStatus(userId, serverStatus);
                setAvailableCredits(serverStatus.available_credits);
                setLoginDays(getLoginDays(userId));
            } catch {
                syncStreakData();
            }
        };

        const handleUpdate = (event: Event) => {
            const customEvent = event as CustomEvent<{ userId?: number }>;
            if (customEvent.detail.userId !== userId) {
                return;
            }

            syncStreakData();
        };

        const handleStatusSynced = (event: Event) => {
            const customEvent = event as CustomEvent<{ userId?: number; serverStatus?: { available_credits?: number } }>;
            if (customEvent.detail?.userId && customEvent.detail.userId !== userId) {
                return;
            }
            if (typeof customEvent.detail?.serverStatus?.available_credits === "number") {
                setAvailableCredits(customEvent.detail.serverStatus.available_credits);
                setLoginDays(getLoginDays(userId));
            } else {
                syncStreakData();
            }
        };

        syncStreakData();
        void syncFromServer();

        window.addEventListener(LOGIN_DAYS_UPDATED_EVENT, handleUpdate);
        window.addEventListener(STREAK_RESTORED_EVENT, handleUpdate);
        window.addEventListener(STREAK_STATUS_SYNCED_EVENT, handleStatusSynced);
        window.addEventListener("careerpath:profile-updated", syncFromServer);
        window.addEventListener("careerpath:study-activity-updated", syncFromServer);

        return () => {
            window.removeEventListener(LOGIN_DAYS_UPDATED_EVENT, handleUpdate);
            window.removeEventListener(STREAK_RESTORED_EVENT, handleUpdate);
            window.removeEventListener(STREAK_STATUS_SYNCED_EVENT, handleStatusSynced);
            window.removeEventListener("careerpath:profile-updated", syncFromServer);
            window.removeEventListener("careerpath:study-activity-updated", syncFromServer);
        };
    }, [userId]);

    const streakDisplay = useMemo(() => {
        const current = calculateCurrentStreak(loginDays);
        if (current > 0) return current;
        return calculateLongestStreak(loginDays);
    }, [loginDays]);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    className="flex items-center gap-1.5 px-2.5"
                >
                    <Flame className="h-5 w-5 fill-orange-200 text-orange-500" />

                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {streakDisplay}
                    </span>

                    <span className="hidden text-sm text-slate-600 sm:inline dark:text-slate-400">
                        {t("dayStreak", { defaultValue: "day streak" })}
                    </span>

                    {availableCredits > 0 ? (
                        <span
                            title={`${availableCredits} streak restore credits`}
                            className="ml-1 inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300"
                        >
                            <Shield className="h-3 w-3 text-emerald-600" />
                            {availableCredits}
                        </span>
                    ) : null}
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="end"
                sideOffset={8}
                className="
                    max-h-[85vh]
                    w-[calc(100vw-2rem)]
                    max-w-[420px]
                    overflow-y-auto
                    rounded-2xl
                    border-slate-200
                    bg-white
                    p-4
                    shadow-[0_20px_50px_rgba(15,23,42,0.15)]
                    dark:border-slate-800
                    dark:bg-slate-900
                    dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)]
                "
            >
                <LearningCalendar embedded userId={userId} />
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
