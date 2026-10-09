import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Award, GraduationCap, Lock } from "lucide-react";
import { Button } from "@/shadcn/component/ui/button";
import { Progress } from "@/shadcn/component/ui/progress";

interface FinalCourseQuizCardProps {
    status?: 'locked' | 'ready' | 'passed' | 'failed';
    score?: number | null;
    totalTopics: number;
    passedTopicsCount: number;
}

export function FinalCourseQuizCard({
    status = "locked",
    score = null,
    totalTopics = 8,
    passedTopicsCount = 0,
}: FinalCourseQuizCardProps) {
    const { t } = useTranslation("profile");

    if (status === "locked") {
        const progressPercent = totalTopics > 0 ? Math.round((passedTopicsCount / totalTopics) * 100) : 0;
        return (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/40">
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                        <Lock className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                {t("finalCourseQuiz", { defaultValue: "Final Course Quiz" })}
                            </h3>
                            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                {t("locked", { defaultValue: "Locked" })}
                            </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {t("passAllTopicQuizzesPrompt", { count: totalTopics, defaultValue: `Pass all ${totalTopics} topic quizzes to unlock the Final Course Quiz.` })}
                        </p>
                        <div className="mt-2 flex items-center gap-2 text-xs font-medium text-slate-500">
                            <Progress value={progressPercent} className="h-1.5 flex-1" />
                            <span className="shrink-0">
                                {t("topicsPassedFraction", { passed: passedTopicsCount, total: totalTopics, defaultValue: `${passedTopicsCount}/${totalTopics} passed` })}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const isPassed = status === "passed";
    const isFailed = status === "failed";

    return (
        <div
            className={[
                "mt-4 rounded-2xl border p-4 shadow-sm transition-all",
                isPassed
                    ? "border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/60 dark:bg-emerald-950/20"
                    : isFailed
                        ? "border-amber-200 bg-amber-50/60 dark:border-amber-900/60 dark:bg-amber-950/20"
                        : "border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50/60 dark:border-blue-800 dark:from-blue-950/40 dark:to-indigo-950/30",
            ].join(" ")}
        >
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div
                        className={[
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                            isPassed
                                ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/60 dark:text-emerald-400"
                                : isFailed
                                    ? "bg-amber-100 text-amber-600 dark:bg-amber-900/60 dark:text-amber-400"
                                    : "bg-blue-600 text-white shadow-md shadow-blue-500/20",
                        ].join(" ")}
                    >
                        {isPassed ? <Award className="h-5 w-5" /> : <GraduationCap className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                {t("finalCourseQuiz", { defaultValue: "Final Course Quiz" })}
                            </h3>
                            <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                    isPassed
                                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200"
                                        : isFailed
                                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200"
                                            : "bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200"
                                }`}
                            >
                                {isPassed ? t("graduated", { defaultValue: "Graduated" }) : isFailed ? t("retryAvailable", { defaultValue: "Retry Available" }) : t("readyToTake", { defaultValue: "Ready to Take" })}
                            </span>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                            {isPassed
                                ? t("graduatedWithScore", { score: score ?? 0, defaultValue: `Graduated with ${score ?? 0}% overall score!` })
                                : isFailed
                                    ? t("finalLastAttemptDesc", { score: score ?? 0, defaultValue: `Last attempt: ${score ?? 0}% — 80% overall & 60% per skill section required.` })
                                    : t("finalCourseQuizRules", { defaultValue: "50 cumulative questions · 80% overall & 60% per skill section to graduate" })}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <Button
                        asChild
                        size="sm"
                        className={[
                            "h-9 rounded-xl px-4 text-xs font-bold text-white shadow-md",
                            isPassed
                                ? "bg-emerald-600 hover:bg-emerald-700"
                                : isFailed
                                    ? "bg-amber-600 hover:bg-amber-700"
                                    : "bg-blue-600 hover:bg-blue-700",
                        ].join(" ")}
                    >
                        <Link
                            to="/quiz/$quizType/$targetId"
                            params={{
                                quizType: "final",
                                targetId: "course",
                            }}
                        >
                            {isPassed ? t("review", { defaultValue: "Review" }) : isFailed ? t("retryFinalQuiz", { defaultValue: "Retry Final Quiz" }) : t("takeFinalQuiz", { defaultValue: "Take Final Quiz" })}
                            <ArrowRight className="ml-1 h-3.5 w-3.5" />
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
