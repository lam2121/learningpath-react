import { useEffect, useState } from "react";
import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    BookOpen,
    Check,
    CheckCircle2,
    Loader2,
    RotateCcw,
    Sparkles,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/shadcn/component/ui/dialog";
import { Button } from "@/shadcn/component/ui/button";
import { Progress } from "@/shadcn/component/ui/progress";
import {
    fetchQuizReview,
    submitQuizReview,
    type QuizReviewQuestionItem,
    type QuizReviewSubmitResponse,
} from "../api/quizReviewApi";
import { getInitialOrderingIndices } from "../utils/dailyReviewFormatters";
import { DailyReviewSummaryView } from "./DailyReviewSummaryView";
import { DailyReviewOrderingQuestion } from "./DailyReviewOrderingQuestion";

interface DailyReviewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCompleted?: (remainingCount: number) => void;
    preloadedQuestions?: QuizReviewQuestionItem[];
}

export function DailyReviewDialog({
    open,
    onOpenChange,
    onCompleted,
    preloadedQuestions,
}: DailyReviewDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [questions, setQuestions] = useState<QuizReviewQuestionItem[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
    const [submitResult, setSubmitResult] = useState<QuizReviewSubmitResponse | null>(null);

    useEffect(() => {
        if (!open) {
            return;
        }

        setSubmitResult(null);
        setCurrentIndex(0);
        setUserAnswers({});
        setErrorMessage(null);

        if (preloadedQuestions && preloadedQuestions.length > 0) {
            setQuestions(preloadedQuestions);
            return;
        }

        let isMounted = true;
        const loadQuestions = async () => {
            try {
                setIsLoading(true);
                const data = await fetchQuizReview(5);
                if (!isMounted) return;
                setQuestions(data.review_questions);
                if (data.review_questions.length === 0) {
                    setErrorMessage("No wrong answers pending review right now. Great job!");
                }
            } catch (err) {
                if (!isMounted) return;
                setErrorMessage(err instanceof Error ? err.message : "Failed to load review questions.");
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        void loadQuestions();

        return () => {
            isMounted = false;
        };
    }, [open, preloadedQuestions]);

    const currentQuestion = questions[currentIndex];
    const progressPercent = questions.length > 0
        ? Math.round(((currentIndex + 1) / questions.length) * 100)
        : 0;

    const handleSelectOption = (value: string) => {
        if (!currentQuestion) return;
        setUserAnswers((prev) => ({
            ...prev,
            [currentQuestion.review_id]: value,
        }));
    };

    const handleToggleMultiOption = (optionIndex: number) => {
        if (!currentQuestion) return;
        const existing = userAnswers[currentQuestion.review_id] ?? "";
        const parts = existing ? existing.split("|").map(Number).filter((n) => !Number.isNaN(n)) : [];
        const set = new Set(parts);
        if (set.has(optionIndex)) {
            set.delete(optionIndex);
        } else {
            set.add(optionIndex);
        }
        const updated = Array.from(set).sort((a, b) => a - b).join("|");
        setUserAnswers((prev) => ({
            ...prev,
            [currentQuestion.review_id]: updated,
        }));
    };

    const handleSubmit = async () => {
        if (questions.length === 0) return;
        try {
            setIsSubmitting(true);
            setErrorMessage(null);

            const payload = questions.map((q) => {
                let ans = userAnswers[q.review_id] ?? "";
                if (q.question_type === "ordering" && !ans) {
                    const initial = getInitialOrderingIndices(q.options.length);
                    ans = initial.join("|");
                }
                return {
                    review_id: q.review_id,
                    answer: ans,
                };
            });

            const response = await submitQuizReview(payload);
            setSubmitResult(response);
            onCompleted?.(response.remaining_count);

            // Notify rest of the app about review updates
            window.dispatchEvent(
                new CustomEvent("careerpath:review-updated", {
                    detail: { remainingCount: response.remaining_count },
                })
            );
        } catch (err) {
            setErrorMessage(err instanceof Error ? err.message : "Failed to submit review answers.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="!w-[94vw] !max-w-4xl lg:!max-w-5xl xl:!max-w-6xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
                <DialogHeader className="space-y-3 pb-2 text-left">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-700 ring-1 ring-blue-100 dark:bg-blue-950/60 dark:text-blue-300 dark:ring-blue-900/40">
                                <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                Daily Knowledge Review
                            </span>
                            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-100 dark:bg-amber-950/60 dark:text-amber-300 dark:ring-amber-900/40">
                                Spaced Repetition
                            </span>
                        </div>
                    </div>

                    <DialogTitle className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
                        {submitResult ? "Review Summary" : "Review Past Mistakes"}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-slate-500 dark:text-slate-400">
                        {submitResult
                            ? "See which questions you mastered and which ones need more practice."
                            : "Answer each question to reinforce the material and remove it from your review queue."}
                    </DialogDescription>

                    {/* Prominent Notice Banner */}
                    <div className="rounded-2xl border border-amber-200 bg-[linear-gradient(135deg,_rgba(254,243,199,0.7)_0%,_rgba(255,251,235,1)_100%)] p-4 text-amber-950 shadow-sm ring-1 ring-amber-100 dark:border-amber-900/40 dark:bg-[linear-gradient(135deg,rgba(120,53,15,0.25)_0%,rgba(15,23,42,0.9)_100%)] dark:text-amber-200 dark:ring-amber-900/30">
                        <div className="flex items-start gap-3">
                            <div className="rounded-xl bg-amber-100 p-2 text-amber-700 dark:bg-amber-950/80 dark:text-amber-400">
                                <RotateCcw className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                                    Notice: Review from your lessons
                                </p>
                                <p className="mt-1 text-xs leading-relaxed text-amber-800 dark:text-amber-300/80">
                                    These questions are from previous lesson quizzes where you chose the wrong answer.
                                    Answer them correctly to remove them from your review pool; incorrect answers will stay for another time!
                                </p>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
                        <p className="text-sm font-medium">Loading your review questions...</p>
                    </div>
                ) : submitResult ? (
                    /* Results Summary View */
                    <DailyReviewSummaryView
                        submitResult={submitResult}
                        questions={questions}
                        onClose={() => onOpenChange(false)}
                    />
                ) : questions.length === 0 ? (
                    <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 py-8 text-center">
                        <div className="rounded-full bg-emerald-50 p-4 text-emerald-600 ring-1 ring-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-400 dark:ring-emerald-900/40">
                            <CheckCircle2 className="h-8 w-8" />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-slate-900 dark:text-white">No Review Questions Pending</p>
                            <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
                                You don't have any incorrect lesson quiz answers waiting for review. Keep up the amazing work on your lessons!
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="rounded-xl border-slate-200 dark:border-slate-700 dark:text-slate-200"
                        >
                            Close
                        </Button>
                    </div>
                ) : currentQuestion ? (
                    /* Question Stepper View */
                    <div className="space-y-6 pt-2">
                        {/* Progress Bar & Badges */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                                <div className="flex items-center gap-2">
                                    <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    <span className="text-slate-700 dark:text-slate-200 font-medium">
                                        From: {currentQuestion.lesson_title}
                                    </span>
                                </div>
                                <span className="text-blue-600 dark:text-blue-400">
                                    Question {currentIndex + 1} of {questions.length}
                                </span>
                            </div>
                            <Progress value={progressPercent} className="h-2 bg-slate-100 dark:bg-slate-800" />
                        </div>

                        {/* Question Stem */}
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-800/60">
                            <p className="text-lg font-semibold leading-relaxed text-slate-900 dark:text-white">
                                {currentQuestion.stem}
                            </p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                {currentQuestion.question_type === "multi_select"
                                    ? "Multiple answers possible. Check all that apply."
                                    : currentQuestion.question_type === "ordering"
                                        ? "Hold & drag to arrange items into the correct logical order, or use the arrows."
                                        : "Choose the correct option to fill the blank."}
                            </p>
                        </div>

                        {/* Options by Question Type */}
                        {currentQuestion.question_type === "fill_blank" && (
                            <div className="grid gap-3 sm:grid-cols-2">
                                {currentQuestion.options.map((option, idx) => {
                                    const isSelected = userAnswers[currentQuestion.review_id] === option;
                                    return (
                                        <button
                                            type="button"
                                            key={idx}
                                            onClick={() => handleSelectOption(option)}
                                            className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left font-medium transition ${isSelected
                                                ? "border-blue-600 bg-blue-50/80 text-blue-900 shadow-sm ring-1 ring-blue-500 dark:border-blue-500 dark:bg-blue-950/60 dark:text-blue-200 dark:ring-blue-500/60"
                                                : "border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50/60 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:bg-slate-800"
                                                }`}
                                        >
                                            <span>{option}</span>
                                            <span
                                                className={`flex h-5 w-5 items-center justify-center rounded-full border ${isSelected
                                                    ? "border-blue-600 bg-blue-600 text-white"
                                                    : "border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-700"
                                                    }`}
                                            >
                                                {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {currentQuestion.question_type === "multi_select" && (
                            <div className="grid gap-3 sm:grid-cols-2">
                                {currentQuestion.options.map((option, idx) => {
                                    const rawSelected = userAnswers[currentQuestion.review_id];
                                    const selectedIndices = rawSelected && rawSelected.trim() !== ""
                                        ? rawSelected
                                        .split("|")
                                        .map((s) => s.trim())
                                        .filter((s) => s.length > 0 && !Number.isNaN(Number(s)))
                                        .map(Number)
                                        : [];
                                    const isSelected = selectedIndices.includes(idx);
                                    return (
                                        <button
                                            type="button"
                                            key={idx}
                                            onClick={() => handleToggleMultiOption(idx)}
                                            className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left font-medium transition ${isSelected
                                                ? "border-blue-600 bg-blue-50/80 text-blue-900 shadow-sm ring-1 ring-blue-500 dark:border-blue-500 dark:bg-blue-950/60 dark:text-blue-200 dark:ring-blue-500/60"
                                                : "border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50/60 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:bg-slate-800"
                                                }`}
                                        >
                                            <span>{option}</span>
                                            <span
                                                className={`flex h-5 w-5 items-center justify-center rounded-lg border ${isSelected
                                                    ? "border-blue-600 bg-blue-600 text-white"
                                                    : "border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-700"
                                                    }`}
                                            >
                                                {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {currentQuestion.question_type === "ordering" && (
                            <DailyReviewOrderingQuestion
                                question={currentQuestion}
                                userAnswer={userAnswers[currentQuestion.review_id]}
                                onAnswerChange={(newAns) =>
                                    setUserAnswers((prev) => ({
                                        ...prev,
                                        [currentQuestion.review_id]: newAns,
                                    }))
                                }
                            />
                        )}

                        {errorMessage && (
                            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                <span>{errorMessage}</span>
                            </div>
                        )}

                        {/* Navigation Footer */}
                        <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                            <Button
                                type="button"
                                variant="outline"
                                disabled={currentIndex === 0}
                                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                                className="h-11 rounded-xl border-slate-200 px-4 dark:border-slate-700 dark:text-slate-200"
                            >
                                <ArrowLeft className="mr-1.5 h-4 w-4" />
                                Previous
                            </Button>

                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => onOpenChange(false)}
                                    className="h-11 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                                >
                                    Review Later
                                </Button>

                                {currentIndex < questions.length - 1 ? (
                                    <Button
                                        type="button"
                                        onClick={() => setCurrentIndex((prev) => prev + 1)}
                                        className="h-11 rounded-xl bg-blue-600 px-5 text-white hover:bg-blue-700 shadow-sm"
                                    >
                                        Next
                                        <ArrowRight className="ml-1.5 h-4 w-4" />
                                    </Button>
                                ) : (
                                    <Button
                                        type="button"
                                        disabled={isSubmitting}
                                        onClick={handleSubmit}
                                        className="h-11 rounded-xl bg-emerald-600 px-6 text-white hover:bg-emerald-700 shadow-sm"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Submitting...
                                            </>
                                        ) : (
                                            "Submit Review"
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}
