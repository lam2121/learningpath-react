import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/shadcn/component/ui/dialog";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/shadcn/component/ui/accordion";
import type {
    LessonQuizQuestionResult,
    LessonQuizResultDetailResponse,
} from "@/feature/learning-path/api/roadmapApi";
import {
    formatHistoryDate,
    formatLabel,
    formatPercent,
    formatQuestionTypeLabel,
    formatStatusLabel,
} from "@/common/utils/historyFormatters";
import { ReadonlyQuizQuestion } from "@/feature/quiz-common/component/ReadonlyQuizQuestion";

interface LessonQuizDetailDialogProps {
    isOpen: boolean;
    onClose: () => void;
    detail: LessonQuizResultDetailResponse | null;
    isLoading: boolean;
    error: string | null;
}

export function LessonQuizDetailDialog({
    isOpen,
    onClose,
    detail,
    isLoading,
    error,
}: LessonQuizDetailDialogProps) {
    const { t } = useTranslation(["history", "profile"]);
    const recordedLabel = formatHistoryDate(detail?.recorded_at ?? null);

    return (
        <Dialog
            open={isOpen}
            onOpenChange={(open) => {
                if (!open) {
                    onClose();
                }
            }}
        >
            <DialogContent className="!w-[98vw] !max-w-[calc(100vw-1rem)] sm:!max-w-[110rem] max-h-[92vh] overflow-y-auto p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
                <DialogHeader>
                    <DialogTitle className="dark:text-white">
                        {detail?.lesson_title ?? t("detail.title", { defaultValue: "Saved lesson quiz answers" })}
                    </DialogTitle>
                    <DialogDescription className="dark:text-slate-400">
                        {detail
                            ? `${detail.topic_name ? `${detail.topic_name} · ` : ""}${formatLabel(detail.skill)} · ${formatLabel(detail.difficulty_tier)}`
                            : t("detail.loadingDesc", { defaultValue: "Loading the saved lesson quiz result from the database." })}
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex min-h-48 items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        {t("detail.loading", { defaultValue: "Loading saved quiz answers..." })}
                    </div>
                ) : error ? (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-5 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
                        {error}
                    </div>
                ) : detail ? (
                    <div className="space-y-5">
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                            <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-800/80">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{t("detail.status", { defaultValue: "Status" })}</p>
                                <p className="mt-1 font-semibold text-slate-950 dark:text-white">{formatStatusLabel(detail.status)}</p>
                            </div>
                            <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-800/80">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{t("detail.bestScore", { defaultValue: "Best score" })}</p>
                                <p className="mt-1 font-semibold text-slate-950 dark:text-white">{formatPercent(detail.best_score_percent)}</p>
                            </div>
                            <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-800/80">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{t("detail.attempts", { defaultValue: "Attempts" })}</p>
                                <p className="mt-1 font-semibold text-slate-950 dark:text-white">{detail.attempt_count}</p>
                            </div>
                            <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-800/80">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{t("detail.failedAttempts", { defaultValue: "Failed attempts" })}</p>
                                <p className="mt-1 font-semibold text-slate-950 dark:text-white">{detail.failed_attempts}</p>
                            </div>
                            <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-800/80">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{t("detail.correctNoHint", { defaultValue: "Correct no hint" })}</p>
                                <p className="mt-1 font-semibold text-slate-950 dark:text-white">{detail.correct_no_hint_count} / {detail.total_no_hint_questions}</p>
                            </div>
                            <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-800/80">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{t("detail.correctWithHint", { defaultValue: "Correct with hint" })}</p>
                                <p className="mt-1 font-semibold text-slate-950 dark:text-white">{detail.correct_with_hint_count} / {detail.total_with_hint_questions}</p>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-800/80">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{t("detail.recorded", { defaultValue: "Recorded" })}</p>
                            <p className="mt-1 font-semibold text-slate-950 dark:text-white">{recordedLabel ?? t("detail.unknown", { defaultValue: "Unknown" })}</p>
                        </div>

                        {detail.question_results.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
                                <p className="w-full text-center" style={{ textAlign: "center" }}>{t("detail.noQuestionResults", { defaultValue: "No saved question results are available for this lesson yet." })}</p>
                            </div>
                        ) : (
                            <Accordion type="multiple" className="rounded-2xl border border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-800/80">
                                {detail.question_results.map((result: LessonQuizQuestionResult, index) => (
                                    <AccordionItem
                                        key={`${result.question_id}-${index}`}
                                        value={`${result.question_id}-${index}`}
                                    >
                                        <AccordionTrigger className="hover:no-underline">
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                                                        {t("detail.question", { count: index + 1, defaultValue: `Question ${index + 1}` })}
                                                    </span>
                                                    <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-[#005596] dark:bg-cyan-950/60 dark:text-cyan-300">
                                                        {formatQuestionTypeLabel(result.question_type)}
                                                    </span>
                                                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${result.is_correct ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300" : "bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300"}`}>
                                                        {result.is_correct ? t("detail.correct", { defaultValue: "Correct" }) : t("detail.incorrect", { defaultValue: "Incorrect" })}
                                                    </span>
                                                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${result.used_hint ? "bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300" : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"}`}>
                                                        {result.used_hint ? t("detail.hintUsed", { defaultValue: "Hint used" }) : t("detail.noHint", { defaultValue: "No hint" })}
                                                    </span>
                                                </div>
                                                <p className="mt-2 text-sm font-semibold leading-6 text-slate-900 dark:text-white">
                                                    {result.question_text || t("detail.questionTextUnavailable", { defaultValue: "Question text unavailable" })}
                                                </p>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="pt-4">
                                            <ReadonlyQuizQuestion
                                                result={result}
                                                questionNumber={index + 1}
                                                totalQuestions={detail.question_results.length}
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
