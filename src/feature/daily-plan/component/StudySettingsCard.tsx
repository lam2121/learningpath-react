import { Calendar, ChevronRight, Clock, Settings, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/shadcn/component/ui/card";

interface StudySettingsCardProps {
    currentMinutes: number;
    estimatedFinishLabel: string | null;
    onClick: () => void;
}

export function StudySettingsCard({
    currentMinutes,
    estimatedFinishLabel,
    onClick,
}: StudySettingsCardProps) {
    const { t } = useTranslation("profile");

    return (
        <Card
            role="button"
            tabIndex={0}
            onClick={onClick}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onClick();
                }
            }}
            className="group relative cursor-pointer overflow-hidden rounded-3xl border border-emerald-300 bg-gradient-to-br from-emerald-50/80 via-teal-50/30 to-white shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-emerald-400 hover:shadow-lg dark:border-emerald-700 dark:bg-gradient-to-br dark:from-emerald-950/30 dark:via-slate-900 dark:to-slate-900"
        >
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-400/10 blur-2xl dark:bg-emerald-500/10" />

            <CardContent className="flex min-h-[80px] items-center justify-between gap-4 p-5 sm:p-6">
                <div className="flex items-start gap-4 min-w-0 flex-1">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-600 to-cyan-600 text-white shadow-md shadow-emerald-500/25 transition-transform duration-300 group-hover:scale-105">
                        <Settings className="h-6 w-6 transition-transform duration-500 group-hover:rotate-45" />
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                                {t("studySettings", { defaultValue: "Study Settings" })}
                            </h3>
                            <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white shadow-xs">
                                <Sparkles className="h-3 w-3" />
                                {t("changeTrack", { defaultValue: "Change Career" })}
                            </span>
                            <span className="rounded-full border border-emerald-200/80 bg-emerald-50/80 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                {t("studyTime", { defaultValue: "Study Time" })}
                            </span>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-100/70 px-2.5 py-1 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300">
                                <Clock className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" />
                                {currentMinutes} {t("mins", { defaultValue: "mins" })} / {t("day", { defaultValue: "day" })}
                            </span>
                            {estimatedFinishLabel ? (
                                <span className="inline-flex items-center gap-1.5 rounded-lg bg-teal-100/60 px-2.5 py-1 text-teal-900 dark:bg-teal-950/60 dark:text-teal-300">
                                    <Calendar className="h-3.5 w-3.5 text-teal-700 dark:text-teal-400" />
                                    {t("finishBy", { date: estimatedFinishLabel, defaultValue: `Finish by ${estimatedFinishLabel}` })}
                                </span>
                            ) : null}
                        </div>

                        <p className="mt-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                            {t("studySettingsCardDesc", {
                                defaultValue: "Open settings to change career direction or update your daily study time.",
                            })}
                        </p>
                    </div>
                </div>

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-emerald-200/80 bg-white text-emerald-700 shadow-xs transition-all duration-300 group-hover:translate-x-1 group-hover:border-emerald-400 group-hover:bg-emerald-600 group-hover:text-white dark:border-emerald-800 dark:bg-slate-800 dark:text-emerald-400 dark:group-hover:bg-emerald-600 dark:group-hover:text-white">
                    <ChevronRight className="h-5 w-5" />
                </div>
            </CardContent>
        </Card>
    );
}
