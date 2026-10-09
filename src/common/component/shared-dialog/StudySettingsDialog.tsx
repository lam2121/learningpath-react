import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
    ChevronRight,
    Clock3,
    Compass,
    Sliders,
    Sparkles,
    X,
} from "lucide-react";

import {
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "@/shadcn/component/ui/dialog";
import { userProfileTexts } from "@/feature/user-profile/userProfileTexts";
import {
    fetchJobRoles,
    fetchPlacementTestResult,
} from "@/feature/onboarding/api/onboardingApi";

type StudySettingsDialogProps = {
    studyMinutes?: number;
    onCareerClick: () => void;
    onStudyTimeClick: () => void;
};

export function StudySettingsDialog({
    studyMinutes,
    onCareerClick,
    onStudyTimeClick,
}: StudySettingsDialogProps) {
    const { t } = useTranslation("profile");
    const resolvedMinutes = studyMinutes ?? 120;

    const formatDisplay = (mins: number) => {
        const perDay = t("perDay", { defaultValue: "/ Day" });
        return `${mins} ${t("mins", { defaultValue: "mins" })} ${perDay}`;
    };

    const [careerName, setCareerName] = useState<string>("Career Track");

    useEffect(() => {
        let isMounted = true;

        const loadCareerName = async () => {
            try {
                const result = await fetchPlacementTestResult();
                if (isMounted && result.role_name?.trim()) {
                    setCareerName(result.role_name.trim());
                    return;
                }
            } catch {
                // ignore error
            }

            const pendingRoleId = Number(localStorage.getItem("pending_role_id"));
            if (!pendingRoleId || Number.isNaN(pendingRoleId)) {
                if (isMounted) {
                    setCareerName("Career Track");
                }
                return;
            }

            try {
                const roles = await fetchJobRoles();
                const matchedRole = roles.find((role) => role.id === pendingRoleId);
                if (isMounted) {
                    setCareerName(matchedRole?.name?.trim() || "Career Track");
                }
            } catch {
                if (isMounted) {
                    setCareerName("Career Track");
                }
            }
        };

        void loadCareerName();

        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <DialogContent
            showCloseButton={false}
            className="sm:max-w-[460px] overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-0 shadow-2xl dark:border-slate-800 dark:bg-slate-900 gap-0"
        >
            {/* Header with decorative brand gradient */}
            <div className="relative border-b border-slate-100 bg-gradient-to-br from-sky-50/80 via-blue-50/40 to-indigo-50/20 px-6 py-5 dark:border-slate-800/80 dark:from-slate-800/80 dark:via-slate-800/40 dark:to-slate-900">
                <DialogClose asChild>
                    <button
                        type="button"
                        className="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-200/60 hover:text-slate-700 dark:hover:bg-slate-700/60 dark:hover:text-slate-200 focus:outline-hidden"
                        aria-label="Close"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </DialogClose>

                <div className="flex items-center gap-3.5 pr-8">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#005596] via-[#0072BB] to-[#00A9CE] text-white shadow-md shadow-blue-500/20">
                        <Sliders className="h-5 w-5" />
                    </div>
                    <div>
                        <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                            {userProfileTexts.studySettings()}
                        </DialogTitle>
                        <DialogDescription className="mt-0.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                            {userProfileTexts.updatePreferences()}
                        </DialogDescription>
                    </div>
                </div>
            </div>

            {/* Interactive Setting Action Tiles */}
            <div className="space-y-3.5 p-5 sm:p-6">
                {/* Career Track Tile */}
                <div
                    role="button"
                    tabIndex={0}
                    onClick={onCareerClick}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onCareerClick();
                        }
                    }}
                    className="group relative flex w-full cursor-pointer items-center justify-between rounded-2xl border border-slate-200/80 bg-gradient-to-r from-white via-blue-50/20 to-sky-50/30 p-4 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-400 hover:from-white hover:via-blue-50/50 hover:to-sky-50/60 hover:shadow-lg hover:shadow-blue-500/10 active:translate-y-0 dark:border-slate-800 dark:bg-gradient-to-r dark:from-slate-800/80 dark:via-slate-800/50 dark:to-slate-900 dark:hover:border-blue-500/60 dark:hover:shadow-blue-900/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                    <div className="flex items-center gap-3.5 min-w-0">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/25 transition-transform duration-200 group-hover:scale-105">
                            <Compass className="h-6 w-6" />
                        </div>

                        <div className="min-w-0 flex-1">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-cyan-400">
                                {t("careerDirection", { defaultValue: "Career Direction" })}
                            </span>
                            <p className="text-base font-bold text-slate-900 transition-colors group-hover:text-blue-700 dark:text-white dark:group-hover:text-cyan-300 truncate">
                                {userProfileTexts.changeTrack()}
                            </p>
                            <div className="mt-1 flex items-center gap-1.5">
                                <span className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200/70 bg-blue-50/90 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/60 dark:text-blue-300 truncate max-w-full">
                                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500 animate-pulse" />
                                    <span className="truncate">
                                        {careerName === "Career Track" ? userProfileTexts.careerTrack() : careerName}
                                    </span>
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100/80 text-slate-400 transition-all duration-200 group-hover:bg-blue-600 group-hover:text-white group-hover:translate-x-0.5 group-hover:shadow-sm dark:bg-slate-800 dark:text-slate-400 dark:group-hover:bg-blue-500">
                        <ChevronRight className="h-4 w-4" />
                    </div>
                </div>

                {/* Daily Study Time Tile */}
                <div
                    role="button"
                    tabIndex={0}
                    onClick={onStudyTimeClick}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onStudyTimeClick();
                        }
                    }}
                    className="group relative flex w-full cursor-pointer items-center justify-between rounded-2xl border border-slate-200/80 bg-gradient-to-r from-white via-emerald-50/20 to-teal-50/30 p-4 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-400 hover:from-white hover:via-emerald-50/50 hover:to-teal-50/60 hover:shadow-lg hover:shadow-emerald-500/10 active:translate-y-0 dark:border-slate-800 dark:bg-gradient-to-r dark:from-slate-800/80 dark:via-slate-800/50 dark:to-slate-900 dark:hover:border-emerald-500/60 dark:hover:shadow-emerald-900/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                    <div className="flex items-center gap-3.5 min-w-0">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25 transition-transform duration-200 group-hover:scale-105">
                            <Clock3 className="h-6 w-6" />
                        </div>

                        <div className="min-w-0 flex-1">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                {t("studySchedule", { defaultValue: "Study Schedule" })}
                            </span>
                            <p className="text-base font-bold text-slate-900 transition-colors group-hover:text-emerald-700 dark:text-white dark:group-hover:text-emerald-300 truncate">
                                {userProfileTexts.dailyStudyTime()}
                            </p>
                            <div className="mt-1 flex items-center gap-1.5">
                                <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200/70 bg-emerald-50/90 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/60 dark:text-emerald-300">
                                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                                    <span>{formatDisplay(resolvedMinutes)}</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100/80 text-slate-400 transition-all duration-200 group-hover:bg-emerald-600 group-hover:text-white group-hover:translate-x-0.5 group-hover:shadow-sm dark:bg-slate-800 dark:text-slate-400 dark:group-hover:bg-emerald-500">
                        <ChevronRight className="h-4 w-4" />
                    </div>
                </div>

                {/* Helpful footer notice */}
                <div className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                    <Sparkles className="h-4 w-4 shrink-0 text-amber-500 dark:text-amber-400" />
                    <span>
                        {t("studySettingsFooterNotice", {
                            defaultValue: "Your personalized learning path automatically adapts to these preferences.",
                        })}
                    </span>
                </div>
            </div>
        </DialogContent>
    );
}
