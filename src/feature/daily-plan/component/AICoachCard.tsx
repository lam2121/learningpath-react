import { CheckCircle2, Clock, Loader2, Sparkles, Target } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/shadcn/component/ui/card";
import type { RoadmapLesson, RoadmapTopic } from "@/feature/learning-path/api/roadmapApi";
import { formatMinutes, formatProgressMinutes } from "../utils/dailyPlanFormatters";

interface AICoachCardProps {
    isGeneratingCoach: boolean;
    coachMessage: string | null;
    allAssignedLessonsCompleted: boolean;
    completedLessonCount: number;
    totalAssignedLessons: number;
    nextLesson: RoadmapLesson | null;
    nextTopic: RoadmapTopic | null;
    currentDays: number;
    currentMinutes: number;
    lessonMinutes: number;
    minUnit: string;
}

export function AICoachCard({
    isGeneratingCoach,
    coachMessage,
    allAssignedLessonsCompleted,
    completedLessonCount,
    totalAssignedLessons,
    nextLesson,
    nextTopic,
    currentDays,
    currentMinutes,
    lessonMinutes,
    minUnit,
}: AICoachCardProps) {
    const { t } = useTranslation("profile");

    return (
        <Card className="relative overflow-hidden rounded-3xl border border-indigo-300 bg-gradient-to-br from-indigo-50/80 via-blue-50/40 to-white shadow-xs transition-all duration-300 hover:shadow-md dark:border-indigo-700 dark:bg-[linear-gradient(135deg,_rgba(30,58,138,0.25)_0%,_rgba(15,23,42,0.95)_55%,_rgba(15,23,42,1)_100%)] dark:shadow-[0_18px_45px_rgba(0,0,0,0.4)]">
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-purple-400/15 blur-2xl dark:bg-purple-600/15" />
            <div className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-blue-400/10 blur-2xl dark:bg-blue-600/10" />

            <CardContent className="relative p-5 sm:p-6">
                <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white shadow-md shadow-indigo-500/25">
                        <Sparkles className="h-6 w-6" />
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                                {t("aiCoach", { defaultValue: "AI Coach" })}
                            </h3>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white shadow-xs">
                                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                                {t("personalGuidance", { defaultValue: "Personal Guidance" })}
                            </span>
                        </div>

                        {/* Coach Message Bubble */}
                        <div className="mt-3 rounded-2xl border border-indigo-100/90 bg-white/95 p-4 shadow-xs backdrop-blur-xs dark:border-indigo-900/50 dark:bg-slate-900/80">
                            {isGeneratingCoach ? (
                                <div className="flex items-center gap-2.5 py-1 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>{t("aiCoachAnalyzing", { defaultValue: "AI Coach is analyzing your progress..." })}</span>
                                </div>
                            ) : (
                                <p className="text-sm sm:text-base font-medium leading-relaxed text-slate-700 dark:text-slate-200">
                                    {coachMessage ? (
                                        coachMessage
                                    ) : allAssignedLessonsCompleted ? (
                                        t("aiCoachAllCompleted", {
                                            completed: completedLessonCount,
                                            total: totalAssignedLessons,
                                            defaultValue: `You have completed ${completedLessonCount} of ${totalAssignedLessons} assigned lessons. Use today to review and consolidate what you passed.`,
                                        })
                                    ) : nextLesson && currentDays ? (
                                        t("aiCoachPace", {
                                            rate: formatProgressMinutes(currentMinutes, minUnit),
                                            title: nextLesson.title,
                                            days: currentDays,
                                            defaultValue: `At ${formatProgressMinutes(currentMinutes, minUnit)} per day, completing ${nextLesson.title} keeps you on pace to finish in about ${currentDays} day${currentDays === 1 ? "" : "s"}.`,
                                        })
                                    ) : (
                                        t("aiCoachFallback", {
                                            defaultValue:
                                                "Start with your next lesson first. Once you finish a quiz, AI Coach can suggest exactly what to review next.",
                                        })
                                    )}
                                </p>
                            )}
                        </div>

                        {allAssignedLessonsCompleted ? (
                            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50/80 px-2.5 py-1 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                    {t("roadmapProgressSaved", { defaultValue: "Roadmap progress saved" })}
                                </span>
                                <span className="rounded-full border border-slate-200/80 bg-white/80 px-2.5 py-1 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                    {t("lessonsPassedCount", {
                                        completed: completedLessonCount,
                                        total: totalAssignedLessons,
                                        defaultValue: `${completedLessonCount}/${totalAssignedLessons} lessons passed`,
                                    })}
                                </span>
                            </div>
                        ) : nextLesson && nextTopic ? (
                            <div className="mt-3 flex flex-wrap gap-2 text-xs sm:text-sm font-semibold">
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200/80 bg-blue-50/80 px-2.5 py-1 text-blue-800 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                                    <Target className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                    {t("aiCoachFocus", { topic: nextTopic.name, defaultValue: `Focus: ${nextTopic.name}` })}
                                </span>
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/80 px-2.5 py-1 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                    <Clock className="h-3.5 w-3.5 text-slate-500" />
                                    {t("aiCoachNext", {
                                        duration: formatMinutes(
                                            lessonMinutes,
                                            minUnit,
                                            t("estimatePending", { defaultValue: "Estimate pending" }),
                                        ),
                                        defaultValue: `Next: ${formatMinutes(
                                            lessonMinutes,
                                            minUnit,
                                            t("estimatePending", { defaultValue: "Estimate pending" }),
                                        )}`,
                                    })}
                                </span>
                            </div>
                        ) : null}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
