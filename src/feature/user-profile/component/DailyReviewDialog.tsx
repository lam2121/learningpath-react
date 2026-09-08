
import { useEffect, useRef, useState } from "react";
import {
    AlertCircle,
    ArrowDown,
    ArrowLeft,
    ArrowRight,
    ArrowUp,
    BookOpen,
    Check,
    CheckCircle2,
    GripVertical,
    Loader2,
    RotateCcw,
    Sparkles,
    Trophy,
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

interface DailyReviewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCompleted?: (remainingCount: number) => void;
    preloadedQuestions?: QuizReviewQuestionItem[];
}

function getInitialOrderingIndices(length: number): number[] {
    const indices = Array.from({ length }, (_, i) => i);
    if (length <= 1) return indices;
    // Rotate to ensure steps are not pre-ordered in 0, 1, 2, 3 sequence
    return [...indices.slice(1), indices[0]];
}

function formatDisplayAnswer(
    rawAnswer: string | null | undefined,
    questionType: string,
    options: string[] = []
): string {
    if (!rawAnswer || !rawAnswer.trim()) {
        return "None selected";
    }

    const trimmed = rawAnswer.trim();

    // 1. Pipe-separated indices (multi_select, ordering, or indexed answers like "0|1")
    if (trimmed.includes("|") && options.length > 0) {
        const parts = trimmed.split("|").map((s) => s.trim());
        if (parts.every((p) => p.length > 0 && !Number.isNaN(Number(p)))) {
            const indices = parts.map(Number);
            if (questionType === "ordering") {
                const steps = indices
                    .map((idx, pos) => `${pos + 1}. ${options[idx] ?? `Step ${idx + 1}`}`);
                if (steps.length > 0) {
                    return steps.join(" ➔ ");
                }
            }
            const selectedTexts = indices
                .map((idx) => options[idx])
                .filter(Boolean);
            if (selectedTexts.length > 0) {
                return selectedTexts.join(", ");
            }
        }
    }

    // 2. Ordering question fallback
    if (questionType === "ordering" && trimmed.includes("|") && options.length > 0) {
        const indices = trimmed.split("|").map(Number).filter((n) => !Number.isNaN(n));
        const steps = indices.map((idx, pos) => `${pos + 1}. ${options[idx] ?? `Step ${idx + 1}`}`);
        if (steps.length > 0) return steps.join(" ➔ ");
    }

    // 3. Single numeric index (e.g. "0", "1", "2")
    if (/^\d+$/.test(trimmed) && options.length > 0) {
        const idx = parseInt(trimmed, 10);
        if (options[idx] !== undefined) {
            return options[idx];
        }
    }

    return trimmed;
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

    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const draggedIndexRef = useRef<number | null>(null);
    const touchDragIndexRef = useRef<number | null>(null);

    useEffect(() => {
        setDraggedIndex(null);
        draggedIndexRef.current = null;
        touchDragIndexRef.current = null;
    }, [currentIndex, open]);

    // For ordering questions: initialize, retrieve steps with stable original indices, and reorder
    const getOrderingStepItems = (question: QuizReviewQuestionItem): Array<{ originalIndex: number; text: string }> => {
        const stored = userAnswers[question.review_id];
        let indices: number[];
        if (stored && stored.trim() !== "") {
            const parsed = stored.split("|").map(Number).filter((n) => !Number.isNaN(n));
            if (parsed.length === question.options.length) {
                indices = parsed;
            } else {
                indices = getInitialOrderingIndices(question.options.length);
            }
        } else {
            indices = getInitialOrderingIndices(question.options.length);
        }
        return indices.map((idx) => ({
            originalIndex: idx,
            text: question.options[idx] ?? "",
        }));
    };

    const handleReorder = (fromIdx: number, toIdx: number) => {
        if (!currentQuestion) return;
        const currentItems = getOrderingStepItems(currentQuestion);
        if (toIdx < 0 || toIdx >= currentItems.length || fromIdx === toIdx) return;

        const nextItems = [...currentItems];
        const [moved] = nextItems.splice(fromIdx, 1);
        nextItems.splice(toIdx, 0, moved);

        const newAnswer = nextItems.map((item) => item.originalIndex).join("|");
        setUserAnswers((prev) => ({
            ...prev,
            [currentQuestion.review_id]: newAnswer,
        }));
    };

    const handleResetOrdering = () => {
        if (!currentQuestion) return;
        const initialIndices = getInitialOrderingIndices(currentQuestion.options.length);
        setUserAnswers((prev) => ({
            ...prev,
            [currentQuestion.review_id]: initialIndices.join("|"),
        }));
    };

    // Drag-and-drop handlers (Desktop)
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        draggedIndexRef.current = index;
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", String(index));
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        const fromIndex = draggedIndexRef.current;
        if (fromIndex === null || fromIndex === index) return;

        handleReorder(fromIndex, index);
        draggedIndexRef.current = index;
        setDraggedIndex(index);
    };

    const handleDragEnd = () => {
        draggedIndexRef.current = null;
        setDraggedIndex(null);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        draggedIndexRef.current = null;
        setDraggedIndex(null);
    };

    // Touch handlers (Mobile & touch displays)
    const handleTouchStart = (_e: React.TouchEvent<HTMLDivElement>, index: number) => {
        touchDragIndexRef.current = index;
        setDraggedIndex(index);
    };

    const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
        if (touchDragIndexRef.current === null) return;
        const touch = e.touches[0];
        if (!touch) return;

        const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
        const cardEl = targetEl?.closest("[data-step-index]");
        if (!cardEl) return;

        const targetIndexStr = cardEl.getAttribute("data-step-index");
        if (targetIndexStr === null) return;

        const targetIndex = Number(targetIndexStr);
        const fromIndex = touchDragIndexRef.current;
        if (Number.isNaN(targetIndex) || fromIndex === null || fromIndex === targetIndex) return;

        handleReorder(fromIndex, targetIndex);
        touchDragIndexRef.current = targetIndex;
        setDraggedIndex(targetIndex);
    };

    const handleTouchEnd = () => {
        touchDragIndexRef.current = null;
        setDraggedIndex(null);
    };

    const handleSubmit = async () => {
        if (questions.length === 0) return;
        try {
            setIsSubmitting(true);
            setErrorMessage(null);

            const payload = questions.map((q) => {
                let ans = userAnswers[q.review_id] ?? "";
                if (q.question_type === "ordering" && !ans) {
                    const currentItems = getOrderingStepItems(q);
                    ans = currentItems.map((item) => item.originalIndex).join("|");
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
            <DialogContent className="!w-[94vw] !max-w-4xl lg:!max-w-5xl xl:!max-w-6xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8">
                <DialogHeader className="space-y-3 pb-2 text-left">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-700 ring-1 ring-blue-100">
                                <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                                Daily Knowledge Review
                            </span>
                            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-100">
                                Spaced Repetition
                            </span>
                        </div>
                    </div>

                    <DialogTitle className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                        {submitResult ? "Review Summary" : "Review Past Mistakes"}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-slate-500">
                        {submitResult
                            ? "See which questions you mastered and which ones need more practice."
                            : "Answer each question to reinforce the material and remove it from your review queue."}
                    </DialogDescription>

                    {/* Prominent Notice Banner */}
                    <div className="rounded-2xl border border-amber-200 bg-[linear-gradient(135deg,_rgba(254,243,199,0.7)_0%,_rgba(255,251,235,1)_100%)] p-4 text-amber-950 shadow-sm ring-1 ring-amber-100">
                        <div className="flex items-start gap-3">
                            <div className="rounded-xl bg-amber-100 p-2 text-amber-700">
                                <RotateCcw className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-amber-900">
                                    Notice: Review from your lessons
                                </p>
                                <p className="mt-1 text-xs leading-relaxed text-amber-800">
                                    These questions are from previous lesson quizzes where you chose the wrong answer.
                                    Answer them correctly to remove them from your review pool; incorrect answers will stay for another time!
                                </p>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 text-slate-500">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                        <p className="text-sm font-medium">Loading your review questions...</p>
                    </div>
                ) : submitResult ? (
                    /* Results Summary View */
                    <div className="space-y-6 pt-2">
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="flex items-center gap-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 shadow-sm">
                                <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-700">
                                    <CheckCircle2 className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-emerald-900">
                                        {submitResult.cleared_count}
                                    </p>
                                    <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                                        Mastered & Removed
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3.5 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 shadow-sm">
                                <div className="rounded-xl bg-amber-100 p-2.5 text-amber-700">
                                    <RotateCcw className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-amber-900">
                                        {submitResult.failed_count}
                                    </p>
                                    <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
                                        Kept For Future Review
                                    </p>
                                </div>
                            </div>
                        </div>

                        {submitResult.remaining_count > 0 ? (
                            <p className="text-sm text-slate-600">
                                You still have <strong>{submitResult.remaining_count}</strong> question(s) in your review pool. They will show up again on your next morning login or review session.
                            </p>
                        ) : (
                            <div className="flex items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-900">
                                <Trophy className="h-6 w-6 text-blue-600" />
                                <div>
                                    <p className="font-semibold text-sm">All Caught Up!</p>
                                    <p className="text-xs text-blue-700">
                                        You cleared all pending wrong questions from your lesson review list!
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
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
                                                ? "border-emerald-200 bg-emerald-50/40"
                                                : "border-amber-200 bg-amber-50/40"
                                                }`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-center gap-2">
                                                    {item.is_correct ? (
                                                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                                                            <Check className="h-4 w-4" />
                                                        </span>
                                                    ) : (
                                                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                                                            <RotateCcw className="h-4 w-4" />
                                                        </span>
                                                    )}
                                                    <span className="font-semibold text-slate-900">
                                                        Question {index + 1}
                                                    </span>
                                                </div>
                                                <span
                                                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${item.is_correct
                                                        ? "bg-emerald-100 text-emerald-800"
                                                        : "bg-amber-100 text-amber-800"
                                                        }`}
                                                >
                                                    {item.is_correct ? "Mastered (Removed)" : "Kept for Next Review"}
                                                </span>
                                            </div>

                                            <p className="mt-3 text-slate-900 font-medium">{item.stem}</p>

                                            <div className="mt-3 space-y-2 rounded-xl bg-white/80 p-3.5 border border-slate-200/60 shadow-xs">
                                                <div className="flex flex-col sm:flex-row sm:items-baseline gap-1">
                                                    <span className="font-semibold text-slate-600 min-w-[110px] text-xs">Your Answer:</span>
                                                    <span className={`text-xs font-medium ${item.is_correct ? "text-emerald-700" : "text-rose-700"}`}>
                                                        {displayedUserAnswer}
                                                    </span>
                                                </div>
                                                {!item.is_correct && (
                                                    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1">
                                                        <span className="font-semibold text-emerald-800 min-w-[110px] text-xs">Correct Answer:</span>
                                                        <span className="text-xs font-medium text-emerald-700">
                                                            {displayedCorrectAnswer}
                                                        </span>
                                                    </div>
                                                )}
                                                {item.explanation && (
                                                    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 pt-1.5 border-t border-slate-100">
                                                        <span className="font-semibold text-slate-500 min-w-[110px] text-xs">Explanation:</span>
                                                        <span className="text-xs text-slate-600 leading-relaxed">
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
                                onClick={() => onOpenChange(false)}
                                className="h-12 w-full rounded-2xl bg-blue-600 text-base font-semibold hover:bg-blue-700 shadow-md shadow-blue-500/20"
                            >
                                Finish & Continue
                            </Button>
                        </div>
                    </div>
                ) : questions.length === 0 ? (
                    <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 py-8 text-center">
                        <div className="rounded-full bg-emerald-50 p-4 text-emerald-600 ring-1 ring-emerald-100">
                            <CheckCircle2 className="h-8 w-8" />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-slate-900">No Review Questions Pending</p>
                            <p className="mt-1 max-w-md text-sm text-slate-500">
                                You don't have any incorrect lesson quiz answers waiting for review. Keep up the amazing work on your lessons!
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="rounded-xl border-slate-200"
                        >
                            Close
                        </Button>
                    </div>
                ) : currentQuestion ? (
                    /* Question Stepper View */
                    <div className="space-y-6 pt-2">
                        {/* Progress Bar & Badges */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                                <div className="flex items-center gap-2">
                                    <BookOpen className="h-4 w-4 text-blue-600" />
                                    <span className="text-slate-700 font-medium">
                                        From: {currentQuestion.lesson_title}
                                    </span>
                                </div>
                                <span className="text-blue-600">
                                    Question {currentIndex + 1} of {questions.length}
                                </span>
                            </div>
                            <Progress value={progressPercent} className="h-2 bg-slate-100" />
                        </div>

                        {/* Question Stem */}
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 shadow-sm">
                            <p className="text-lg font-semibold leading-relaxed text-slate-900">
                                {currentQuestion.stem}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
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
                                                ? "border-blue-600 bg-blue-50/80 text-blue-900 shadow-sm ring-1 ring-blue-500"
                                                : "border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50/60"
                                                }`}
                                        >
                                            <span>{option}</span>
                                            <span
                                                className={`flex h-5 w-5 items-center justify-center rounded-full border ${isSelected
                                                    ? "border-blue-600 bg-blue-600 text-white"
                                                    : "border-slate-300 bg-white"
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
                                                ? "border-blue-600 bg-blue-50/80 text-blue-900 shadow-sm ring-1 ring-blue-500"
                                                : "border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50/60"
                                                }`}
                                        >
                                            <span>{option}</span>
                                            <span
                                                className={`flex h-5 w-5 items-center justify-center rounded-lg border ${isSelected
                                                    ? "border-blue-600 bg-blue-600 text-white"
                                                    : "border-slate-300 bg-white"
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
                            <div className="space-y-3">
                                <div className="space-y-2">
                                    {getOrderingStepItems(currentQuestion).map((item, idx, arr) => {
                                        const isDragging = draggedIndex === idx;

                                        return (
                                            <div
                                                key={`step-${item.originalIndex}`}
                                                data-step-index={idx}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, idx)}
                                                onDragOver={(e) => handleDragOver(e, idx)}
                                                onDragEnd={handleDragEnd}
                                                onDrop={handleDrop}
                                                onTouchStart={(e) => handleTouchStart(e, idx)}
                                                onTouchMove={handleTouchMove}
                                                onTouchEnd={handleTouchEnd}
                                                onTouchCancel={handleTouchEnd}
                                                className={`group relative flex items-center justify-between gap-3 rounded-2xl border p-3.5 text-sm font-medium transition-all duration-150 select-none ${
                                                    isDragging
                                                        ? "border-blue-400 bg-blue-50/90 text-blue-950 shadow-lg ring-2 ring-blue-400/50 scale-[1.01] cursor-grabbing z-10"
                                                        : "border-slate-200 bg-white text-slate-800 shadow-sm hover:border-slate-300 hover:bg-slate-50/70 cursor-grab"
                                                }`}
                                            >
                                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                                    <div
                                                        className="flex items-center text-slate-400 group-hover:text-slate-600 transition-colors touch-none cursor-grab active:cursor-grabbing shrink-0"
                                                        title="Hold and release to reorder"
                                                    >
                                                        <GripVertical className="h-5 w-5" />
                                                    </div>

                                                    <span
                                                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                                                            isDragging
                                                                ? "bg-blue-600 text-white shadow-sm"
                                                                : "bg-blue-50 text-blue-700"
                                                        }`}
                                                    >
                                                        {idx + 1}
                                                    </span>

                                                    <span className="truncate sm:whitespace-normal text-slate-800 leading-snug">
                                                        {item.text}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-1 shrink-0">
                                                    <button
                                                        type="button"
                                                        disabled={idx === 0}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleReorder(idx, idx - 1);
                                                        }}
                                                        title="Move step up"
                                                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-25 disabled:pointer-events-none transition-colors"
                                                    >
                                                        <ArrowUp className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={idx === arr.length - 1}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleReorder(idx, idx + 1);
                                                        }}
                                                        title="Move step down"
                                                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-25 disabled:pointer-events-none transition-colors"
                                                    >
                                                        <ArrowDown className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="flex items-center justify-between px-1 text-xs text-slate-500">
                                    <span className="flex items-center gap-1 text-slate-400">
                                        <GripVertical className="h-3.5 w-3.5" />
                                        Hold and drag any step to reorder
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleResetOrdering}
                                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                                    >
                                        <RotateCcw className="h-3 w-3" />
                                        Reset order
                                    </button>
                                </div>
                            </div>
                        )}

                        {errorMessage && (
                            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                <span>{errorMessage}</span>
                            </div>
                        )}

                        {/* Navigation Footer */}
                        <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                disabled={currentIndex === 0}
                                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                                className="h-11 rounded-xl border-slate-200 px-4"
                            >
                                <ArrowLeft className="mr-1.5 h-4 w-4" />
                                Previous
                            </Button>

                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => onOpenChange(false)}
                                    className="h-11 rounded-xl text-slate-500 hover:text-slate-700"
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
