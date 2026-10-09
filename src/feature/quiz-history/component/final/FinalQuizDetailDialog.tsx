import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { UserProfileResponse } from "@/feature/auth/type/Auth";
import type { FinalQuizSubmitResponse } from "@/feature/learning-path/api/roadmapApi";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/shadcn/component/ui/accordion";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/shadcn/component/ui/dialog";
import { formatHistoryDate, formatPercent, formatQuestionTypeLabel } from "@/common/utils/historyFormatters";
import { getSkillBadgeClasses, getSkillTextClass } from "@/common/utils/historyBadgeStyles";
import { ReadonlyQuizQuestion } from "@/feature/quiz-common/component/ReadonlyQuizQuestion";

type FinalQuizHistoryItem = NonNullable<UserProfileResponse["final_quiz_history"]>[number];

interface FinalQuizDetailDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    primaryFinalQuiz: FinalQuizHistoryItem | null;
    finalDetail: FinalQuizSubmitResponse | null;
    detailLoading: boolean;
    detailError: string | null;
    reviewFilter: "all" | "correct" | "incorrect";
    onReviewFilterChange: (filter: "all" | "correct" | "incorrect") => void;
    getSkillLabel: (skill: string) => string;
}

export function FinalQuizDetailDialog({
    open,
    onOpenChange,
    primaryFinalQuiz,
    finalDetail,
    detailLoading,
    detailError,
    reviewFilter,
    onReviewFilterChange,
    getSkillLabel,
}: FinalQuizDetailDialogProps) {
    const { t } = useTranslation("history");

    const questionResults = finalDetail?.question_results ?? [];
    const correctCount = questionResults.filter((q) => q.is_correct).length;
    const incorrectCount = questionResults.length - correctCount;

    const displayedQuestions = questionResults.filter((q) => {
        if (reviewFilter === "correct") return q.is_correct;
        if (reviewFilter === "incorrect") return !q.is_correct;
        return true;
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="!w-[98vw] !max-w-[calc(100vw-1rem)] sm:!max-w-[110rem] max-h-[92vh] overflow-y-auto p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
                <DialogHeader>
                    <DialogTitle className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                        {t("finalQuiz.detail.title", {
                            name:
                                primaryFinalQuiz?.role_name ??
                                t("finalQuiz.detail.defaultTitle", { defaultValue: "Graduation Examination" }),
                            defaultValue: `Final Course Quiz — ${primaryFinalQuiz?.role_name ?? "Graduation Examination"}`,
                        })}
                    </DialogTitle>
                    <DialogDescription>
                        {finalDetail
                            ? t("finalQuiz.detail.description", {
                                status: finalDetail.passed
                                    ? t("finalQuiz.detail.graduated", { defaultValue: "Graduated (Passed)" })
                                    : t("finalQuiz.detail.retakeRequired", { defaultValue: "Retake Required (Failed)" }),
                                defaultValue: `Career Track Graduation Exam · Saved Best Attempt · ${
                                    finalDetail.passed ? "Graduated (Passed)" : "Retake Required (Failed)"
                                }`,
                            })
                            : t("finalQuiz.detail.loading", { defaultValue: "Loading saved final quiz results..." })}
                    </DialogDescription>
                </DialogHeader>

                {detailLoading ? (
                    <div className="flex min-h-48 items-center justify-center gap-3 text-slate-500">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        {t("finalQuiz.detail.loading", { defaultValue: "Loading saved final quiz results..." })}
                    </div>
                ) : detailError ? (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-5 text-sm text-rose-700">
                        {detailError}
                    </div>
                ) : finalDetail ? (
                    <div className="space-y-5">
                        {/* Metric Strip */}
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                            <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-800/80">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                    {t("finalQuiz.detail.status", { defaultValue: "Status" })}
                                </p>
                                <p
                                    className={`mt-1 font-semibold capitalize ${
                                        finalDetail.passed
                                            ? "text-emerald-700 dark:text-emerald-400"
                                            : "text-rose-700 dark:text-rose-400"
                                    }`}
                                >
                                    {finalDetail.passed
                                        ? t("finalQuiz.detail.graduated", { defaultValue: "Graduated (Passed)" })
                                        : t("finalQuiz.detail.retakeRequired", { defaultValue: "Retake Required (Failed)" })}
                                </p>
                            </div>
                            <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-800/80">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                    {t("finalQuiz.detail.bestScore", { defaultValue: "Best Score" })}
                                </p>
                                <p className="mt-1 font-semibold text-slate-950 dark:text-white">
                                    {formatPercent(finalDetail.score_percent ?? primaryFinalQuiz?.best_score_percent)}
                                </p>
                            </div>
                            <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-800/80">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                    {t("finalQuiz.detail.totalAttempts", { defaultValue: "Total Attempts" })}
                                </p>
                                <p className="mt-1 font-semibold text-slate-950 dark:text-white">
                                    {finalDetail.attempt_count ?? primaryFinalQuiz?.attempt_count ?? 1}
                                </p>
                            </div>
                            <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-800/80">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                    {t("finalQuiz.detail.failedAttempts", { defaultValue: "Failed Attempts" })}
                                </p>
                                <p className="mt-1 font-semibold text-slate-950 dark:text-white">
                                    {finalDetail.failed_attempts ?? primaryFinalQuiz?.failed_attempts ?? 0}
                                </p>
                            </div>
                            <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-800/80">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                    {t("finalQuiz.detail.correctQuestions", { defaultValue: "Correct Questions" })}
                                </p>
                                <p className="mt-1 font-semibold text-slate-950 dark:text-white">
                                    {finalDetail.correct_count} / {finalDetail.total_questions}
                                </p>
                            </div>
                            <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-800/80">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                    {t("finalQuiz.detail.recordedDate", { defaultValue: "Recorded Date" })}
                                </p>
                                <p className="mt-1 font-semibold text-slate-950 dark:text-white">
                                    {formatHistoryDate(
                                        primaryFinalQuiz?.completed_at ?? primaryFinalQuiz?.recorded_at,
                                    ) ?? t("finalQuiz.detail.unknown", { defaultValue: "Unknown" })}
                                </p>
                            </div>
                        </div>

                        {/* Section Performance */}
                        {finalDetail.skill_breakdown && finalDetail.skill_breakdown.length > 0 && (
                            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/60">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2.5">
                                    {t("finalQuiz.detail.sectionPerformance", {
                                        defaultValue: "Section Performance (≥ 60% required per section)",
                                    })}
                                </h4>
                                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                                    {finalDetail.skill_breakdown.map((sb) => (
                                        <div
                                            key={sb.skill}
                                            className={`rounded-xl border p-3 text-center ${
                                                sb.passed
                                                    ? "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/50 dark:bg-emerald-950/40"
                                                    : "border-rose-200 bg-rose-50/60 dark:border-rose-900/50 dark:bg-rose-950/40"
                                            }`}
                                        >
                                            <p className={`text-xs font-bold ${getSkillTextClass(sb.skill)}`}>
                                                {getSkillLabel(sb.skill)}
                                            </p>
                                            <p
                                                className={`mt-1 text-lg font-black ${
                                                    sb.passed
                                                        ? "text-emerald-800 dark:text-emerald-300"
                                                        : "text-rose-800 dark:text-rose-300"
                                                }`}
                                            >
                                                {Math.round(sb.accuracy_percent)}%
                                            </p>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                                {t("finalQuiz.detail.sectionCorrect", {
                                                    correct: sb.correct_count,
                                                    total: sb.total_count,
                                                    defaultValue: `${sb.correct_count}/${sb.total_count} correct`,
                                                })}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Question Filter Header */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                                {t("finalQuiz.detail.questions", {
                                    count: questionResults.length,
                                    defaultValue: `Graduation Questions (${questionResults.length})`,
                                })}
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => onReviewFilterChange("all")}
                                    className={`rounded-xl px-3 py-1 text-xs font-bold transition-all ${
                                        reviewFilter === "all"
                                            ? "bg-[#0072BB] text-white shadow-sm dark:bg-blue-600"
                                            : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                                    }`}
                                >
                                    {t("finalQuiz.detail.all", {
                                        count: questionResults.length,
                                        defaultValue: `All (${questionResults.length})`,
                                    })}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onReviewFilterChange("incorrect")}
                                    className={`rounded-xl px-3 py-1 text-xs font-bold transition-all ${
                                        reviewFilter === "incorrect"
                                            ? "bg-rose-600 text-white shadow-sm"
                                            : "bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300 dark:hover:bg-rose-900/60"
                                    }`}
                                >
                                    {t("finalQuiz.detail.incorrect", {
                                        count: incorrectCount,
                                        defaultValue: `Incorrect (${incorrectCount})`,
                                    })}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onReviewFilterChange("correct")}
                                    className={`rounded-xl px-3 py-1 text-xs font-bold transition-all ${
                                        reviewFilter === "correct"
                                            ? "bg-emerald-600 text-white shadow-sm"
                                            : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900/60"
                                    }`}
                                >
                                    {t("finalQuiz.detail.correct", {
                                        count: correctCount,
                                        defaultValue: `Correct (${correctCount})`,
                                    })}
                                </button>
                            </div>
                        </div>

                        {/* Accordion Questions */}
                        {displayedQuestions.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
                                <p className="w-full text-center" style={{ textAlign: "center" }}>
                                    {t("finalQuiz.detail.noQuestionsMatch", {
                                        defaultValue: "No questions match the selected filter.",
                                    })}
                                </p>
                            </div>
                        ) : (
                            <Accordion
                                type="multiple"
                                className="rounded-2xl border border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-800/80"
                            >
                                {displayedQuestions.map((result, index) => (
                                    <AccordionItem
                                        key={`${result.question_id}-${index}`}
                                        value={`${result.question_id}-${index}`}
                                    >
                                        <AccordionTrigger className="hover:no-underline">
                                            <div className="min-w-0 text-left">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                                                        {t("finalQuiz.detail.question", {
                                                            count: index + 1,
                                                            defaultValue: `Question ${index + 1}`,
                                                        })}
                                                    </span>
                                                    <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-[#005596] dark:bg-cyan-950/60 dark:text-cyan-300">
                                                        {formatQuestionTypeLabel(result.question_type)}
                                                    </span>
                                                    <span
                                                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                            result.is_correct
                                                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300"
                                                                : "bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300"
                                                        }`}
                                                    >
                                                        {result.is_correct
                                                            ? t("finalQuiz.detail.correctBadge", { defaultValue: "Correct" })
                                                            : t("finalQuiz.detail.incorrectBadge", {
                                                                defaultValue: "Incorrect",
                                                            })}
                                                    </span>
                                                    {result.skill ? (
                                                        <span
                                                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getSkillBadgeClasses(
                                                                result.skill,
                                                            )}`}
                                                        >
                                                            {getSkillLabel(result.skill)}
                                                        </span>
                                                    ) : null}
                                                    {result.lesson_title ? (
                                                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                                                            {result.lesson_title}
                                                        </span>
                                                    ) : null}
                                                </div>
                                                <p className="mt-2 text-sm font-semibold leading-6 text-slate-900 dark:text-white">
                                                    {result.question_text ||
                                                        t("finalQuiz.detail.questionUnavailable", {
                                                            defaultValue: "Question statement unavailable",
                                                        })}
                                                </p>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="pt-4">
                                            <ReadonlyQuizQuestion
                                                result={result}
                                                questionNumber={index + 1}
                                                totalQuestions={displayedQuestions.length}
                                            />
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        )}
                    </div>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}
