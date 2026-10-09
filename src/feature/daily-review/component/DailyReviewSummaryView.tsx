import {
    Check,
    CheckCircle2,
    RotateCcw,
    Trophy,
} from "lucide-react";
import { Button } from "@/shadcn/component/ui/button";
import type { QuizReviewQuestionItem, QuizReviewSubmitResponse } from "../api/quizReviewApi";
import { formatDisplayAnswer } from "../utils/dailyReviewFormatters";

interface DailyReviewSummaryViewProps {
    submitResult: QuizReviewSubmitResponse;
    questions: QuizReviewQuestionItem[];
    onClose: () => void;
}

export function DailyReviewSummaryView({
    submitResult,
    questions,
    onClose,
}: DailyReviewSummaryViewProps) {
    return (
        <div className="space-y-6 pt-2">
            <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/30">
                    <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                        <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-200">
                            {submitResult.cleared_count}
                        </p>
                        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                            Mastered & Removed
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3.5 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/30">
                    <div className="rounded-xl bg-amber-100 p-2.5 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                        <RotateCcw className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-amber-900 dark:text-amber-200">
                            {submitResult.failed_count}
                        </p>
                        <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                            Kept For Future Review
                        </p>
                    </div>
                </div>
            </div>

            {submitResult.remaining_count > 0 ? (
                <p className="text-sm text-slate-600 dark:text-slate-300">
                    You still have <strong>{submitResult.remaining_count}</strong> question(s) in your review pool. They will show up again on your next morning login or review session.
                </p>
            ) : (
                <div className="flex items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-900 dark:border-blue-900/40 dark:bg-blue-950/40 dark:text-blue-200">
                    <Trophy className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    <div>
                        <p className="font-semibold text-sm">All Caught Up!</p>
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                            You cleared all pending wrong questions from your lesson review list!
                        </p>
                    </div>
                </div>
            )}

            <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Detailed Breakdown
                </p>
                <div className="space-y-3">
                    {submitResult.results.map((item, index) => {
                        const questionDef = questions.find((q) => q.review_id === item.review_id);
                        const itemOptions = item.options && item.options.length > 0
                            ? item.options
                            : (questionDef?.options ?? []);
                        const displayedUserAnswer = formatDisplayAnswer(item.user_answer, item.question_type, itemOptions);
                        const displayedCorrectAnswer = formatDisplayAnswer(item.correct_answer, item.question_type, itemOptions);

                        return (
                            <div
                                key={item.review_id}
                                className={`rounded-2xl border p-5 text-sm transition ${item.is_correct
                                    ? "border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/40 dark:bg-emerald-950/20"
                                    : "border-amber-200 bg-amber-50/40 dark:border-amber-900/40 dark:bg-amber-950/20"
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        {item.is_correct ? (
                                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                                                <Check className="h-4 w-4" />
                                            </span>
                                        ) : (
                                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                                                <RotateCcw className="h-4 w-4" />
                                            </span>
                                        )}
                                        <span className="font-semibold text-slate-900 dark:text-white">
                                            Question {index + 1}
                                        </span>
                                    </div>
                                    <span
                                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${item.is_correct
                                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300"
                                            : "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300"
                                            }`}
                                    >
                                        {item.is_correct ? "Mastered (Removed)" : "Kept for Next Review"}
                                    </span>
                                </div>

                                <p className="mt-3 text-slate-900 dark:text-slate-100 font-medium">{item.stem}</p>

                                <div className="mt-3 space-y-2 rounded-xl bg-white/80 p-3.5 border border-slate-200/60 shadow-xs dark:bg-slate-800/80 dark:border-slate-700/60">
                                    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1">
                                        <span className="font-semibold text-slate-600 dark:text-slate-400 min-w-[110px] text-xs">Your Answer:</span>
                                        <span className={`text-xs font-medium ${item.is_correct ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"}`}>
                                            {displayedUserAnswer}
                                        </span>
                                    </div>
                                    {!item.is_correct && (
                                        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1">
                                            <span className="font-semibold text-emerald-800 dark:text-emerald-300 min-w-[110px] text-xs">Correct Answer:</span>
                                            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                                                {displayedCorrectAnswer}
                                            </span>
                                        </div>
                                    )}
                                    {item.explanation && (
                                        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 pt-1.5 border-t border-slate-100 dark:border-slate-700/60">
                                            <span className="font-semibold text-slate-500 dark:text-slate-400 min-w-[110px] text-xs">Explanation:</span>
                                            <span className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                                {item.explanation}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="pt-2">
                <Button
                    onClick={onClose}
                    className="h-12 w-full rounded-2xl bg-blue-600 text-base font-semibold hover:bg-blue-700 shadow-md shadow-blue-500/20"
                >
                    Finish & Continue
                </Button>
            </div>
        </div>
    );
}
