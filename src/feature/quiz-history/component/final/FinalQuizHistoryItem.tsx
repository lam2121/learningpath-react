import {
    AlertCircle,
    CheckCircle2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import type { UserProfileResponse } from "@/feature/auth/type/Auth";
import { formatHistoryDate, formatPercent } from "@/common/utils/historyFormatters";
import { getSkillTextClass } from "@/common/utils/historyBadgeStyles";

type FinalQuizHistoryItemType = NonNullable<UserProfileResponse["final_quiz_history"]>[number];

interface FinalQuizHistoryItemProps {
    primaryFinalQuiz: FinalQuizHistoryItemType;
    onClick: () => void;
    getSkillLabel: (skill: string) => string;
}

export function FinalQuizHistoryItem({
    primaryFinalQuiz,
    onClick,
    getSkillLabel,
}: FinalQuizHistoryItemProps) {
    const { t } = useTranslation(["history", "profile"]);

    return (
        <button
            type="button"
            onClick={onClick}
            className="group flex w-full cursor-pointer flex-col rounded-2xl border border-cyan-200 bg-[#eef7ff] p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-400 hover:bg-white hover:shadow-[0_12px_28px_rgba(0,169,206,0.24)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:border-cyan-900/40 dark:bg-slate-800/80 dark:hover:bg-slate-800 dark:hover:border-cyan-500"
        >
            {/* Top row: Track Badge + Status + Best Score */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-cyan-200 px-3 py-1 text-xs font-bold text-[#004a82] dark:bg-cyan-900 dark:text-cyan-200">
                            {t("finalQuiz.card.careerTrack", {
                                name: primaryFinalQuiz.role_name,
                                defaultValue: `Career Track: ${primaryFinalQuiz.role_name}`,
                            })}
                        </span>
                        <span
                            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${
                                primaryFinalQuiz.status === "passed"
                                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900/60"
                                    : primaryFinalQuiz.status === "failed"
                                        ? "bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900/60"
                                        : "bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900/60"
                            }`}
                        >
                            {primaryFinalQuiz.status === "passed" ? (
                                <CheckCircle2 className="h-3.5 w-3.5" />
                            ) : (
                                <AlertCircle className="h-3.5 w-3.5" />
                            )}
                            <span className="capitalize">
                                {primaryFinalQuiz.status === "passed"
                                    ? t("topicQuiz.filters.passed", { defaultValue: "Passed" })
                                    : primaryFinalQuiz.status === "failed"
                                        ? t("topicQuiz.filters.failed", { defaultValue: "Failed" })
                                        : primaryFinalQuiz.status}
                            </span>
                        </span>
                    </div>

                    <h3 className="mt-3 text-xl font-black text-slate-900 transition-colors group-hover:text-[#005596] dark:text-white dark:group-hover:text-cyan-400">
                        {t("finalQuiz.card.examTitle", { defaultValue: "Comprehensive Final Examination" })}
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {t("finalQuiz.card.examDesc", {
                            defaultValue: "Click card to review saved best-attempt answers and explanations.",
                        })}
                    </p>
                </div>

                {/* Enlarged Best Score Badge */}
                <div className="min-w-[100px] shrink-0 rounded-2xl bg-[#0082c9] px-4 py-3 text-center shadow-md transition-colors group-hover:bg-[#0069aa] dark:bg-blue-600 dark:group-hover:bg-blue-500 self-start">
                    <p className="text-[11px] font-black uppercase leading-none tracking-[0.16em] text-cyan-50">
                        {t("finalQuiz.card.best", { defaultValue: "BEST" })}
                    </p>
                    <p className="mt-1.5 text-3xl font-black leading-none text-white">
                        {formatPercent(primaryFinalQuiz.best_score_percent)}
                    </p>
                </div>
            </div>

            {/* Skill Section Breakdown Tiles */}
            {primaryFinalQuiz.skill_scores && (
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {Object.entries(primaryFinalQuiz.skill_scores).map(([sk, sc]) => {
                        const label = getSkillLabel(sk);
                        const passed = sc >= 60.0;
                        return (
                            <div
                                key={sk}
                                className={`rounded-xl border p-2.5 text-center ${
                                    passed
                                        ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/30"
                                        : "border-rose-200 bg-rose-50/50 dark:border-rose-900/40 dark:bg-rose-950/30"
                                }`}
                            >
                                <p className={`text-[11px] font-bold truncate ${getSkillTextClass(sk)}`}>
                                    {label}
                                </p>
                                <p
                                    className={`mt-0.5 text-base font-black ${
                                        passed
                                            ? "text-emerald-800 dark:text-emerald-300"
                                            : "text-rose-800 dark:text-rose-300"
                                    }`}
                                >
                                    {Math.round(sc)}%
                                </p>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                    {passed
                                        ? t("finalQuiz.card.passSection", { defaultValue: "Pass (≥60%)" })
                                        : t("finalQuiz.card.needsReview", { defaultValue: "Needs Review" })}
                                </p>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Bottom Stats Line */}
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-slate-200 dark:border-slate-700/60 pt-3 text-xs text-slate-600 dark:text-slate-400">
                <span>
                    {t(primaryFinalQuiz.attempt_count === 1 ? "finalQuiz.card.attempt_one" : "finalQuiz.card.attempt_other", {
                        count: primaryFinalQuiz.attempt_count,
                        defaultValue: `${primaryFinalQuiz.attempt_count} attempt${
                            primaryFinalQuiz.attempt_count !== 1 ? "s" : ""
                        }`,
                    })}
                </span>
                <span>•</span>
                <span>
                    {t("finalQuiz.card.failed", {
                        count: primaryFinalQuiz.failed_attempts,
                        defaultValue: `${primaryFinalQuiz.failed_attempts} failed`,
                    })}
                </span>
                <span>•</span>
                <span>
                    {t("finalQuiz.card.questionsCorrect", {
                        correct: primaryFinalQuiz.correct_count,
                        total: primaryFinalQuiz.total_questions,
                        defaultValue: `${primaryFinalQuiz.correct_count}/${primaryFinalQuiz.total_questions} questions correct`,
                    })}
                </span>
                <span>•</span>
                <span>
                    {t("finalQuiz.card.progress", {
                        percent: Math.round(primaryFinalQuiz.progress),
                        defaultValue: `Progress: ${Math.round(primaryFinalQuiz.progress)}%`,
                    })}
                </span>
                <span className="ml-auto text-slate-500 dark:text-slate-400">
                    {formatHistoryDate(primaryFinalQuiz.completed_at ?? primaryFinalQuiz.recorded_at) ??
                        t("finalQuiz.card.recorded", { defaultValue: "Recorded" })}
                </span>
            </div>
        </button>
    );
}
