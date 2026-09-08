import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link, useBlocker } from '@tanstack/react-router';
import {
    Award,
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    Loader2,
    RotateCcw,
    XCircle,
    BookOpen,
} from 'lucide-react';
import { Button } from '@/shadcn/component/ui/button';
import { Progress } from '@/shadcn/component/ui/progress';
import { toast } from 'sonner';
import {
    fetchTopicQuizQuestions,
    fetchTopicQuizState,
    fetchRoadmap,
    submitTopicQuiz,
    type TopicQuizQuestion,
    type TopicQuizSubmitResponse,
    type TopicQuizAnswerSubmission,
} from '@/feature/learning-path/api/roadmapApi';
import { FillBlankQuestion } from '@/feature/quiz-engine/component/FillBlankQuestion';
import { MultiSelectQuestion } from '@/feature/quiz-engine/component/MultiSelectQuestion';
import { OrderingQuestion } from '@/feature/quiz-engine/component/OrderingQuestion';
import type {
    FillBlankQuestionData,
    MultiSelectQuestionData,
    OrderingQuestionData,
} from '@/feature/quiz-engine/type/Quiz';

const AXIS_META: Record<string, { label: string; color: string; bg: string; dot: string }> = {
    D_doc: { label: 'Documentation', color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/60', dot: 'bg-blue-500' },
    C_comm: { label: 'Communication', color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/60', dot: 'bg-emerald-500' },
    T_trouble: { label: 'Troubleshooting', color: 'text-rose-700 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/60', dot: 'bg-rose-500' },
    G_custom: { label: 'Business', color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/60', dot: 'bg-amber-500' },
};

function hasAnswer(answer: string | undefined): answer is string {
    return Boolean(answer && answer.trim().length > 0);
}

function buildReadonlyQuestionData(
    result: TopicQuizSubmitResponse["question_results"][number],
) {
    const optionsString = Array.isArray(result.options)
        ? result.options.join("|")
        : result.options;

    const data = [
        result.question_text,
        optionsString,
        result.correct_answer,
        result.explanation,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
    ];

    if (result.question_type === "fill_blank") {
        return data as unknown as FillBlankQuestionData;
    }

    if (result.question_type === "multi_select") {
        return data as unknown as MultiSelectQuestionData;
    }

    return data as unknown as OrderingQuestionData;
}

function ReadonlyTopicQuizQuestion({
    result,
    questionNumber,
    totalQuestions,
    attemptPassed,
}: {
    result: TopicQuizSubmitResponse["question_results"][number];
    questionNumber: number;
    totalQuestions: number;
    // Whether the OVERALL topic quiz attempt passed. On a failed attempt,
    // the correct answer / explanation must stay hidden — the learner only
    // gets to see what they answered, same as EmbeddedLessonQuiz's
    // `revealAnswer={currentAttemptPassed}` gate for failed lesson attempts.
    attemptPassed: boolean;
}) {
    const data = buildReadonlyQuestionData(result);

    if (result.question_type === "fill_blank") {
        return (
            <FillBlankQuestion
                data={data as FillBlankQuestionData}
                questionNumber={questionNumber}
                totalQuestions={totalQuestions}
                onAnswer={() => { }}
                isSubmitted
                userAnswer={result.user_answer}
                revealAnswer={attemptPassed}
            />
        );
    }

    if (result.question_type === "multi_select") {
        return (
            <MultiSelectQuestion
                data={data as MultiSelectQuestionData}
                questionNumber={questionNumber}
                totalQuestions={totalQuestions}
                userAnswer={result.user_answer}
                onAnswerChange={() => { }}
                isSubmitted
                isCorrect={result.is_correct}
                explanation={attemptPassed ? result.explanation : undefined}
                revealAnswer={attemptPassed}
            />
        );
    }

    return (
        <OrderingQuestion
            data={data as OrderingQuestionData}
            questionNumber={questionNumber}
            totalQuestions={totalQuestions}
            userAnswer={result.user_answer}
            onAnswerChange={() => { }}
            isSubmitted
            isCorrect={result.is_correct}
            explanation={attemptPassed ? result.explanation : undefined}
            revealAnswer={attemptPassed}
        />
    );
}

interface TopicQuizEngineProps {
    topicId: number;
    topicName?: string;
    topicOrder?: number;
}

export function TopicQuizEngine({ topicId, topicName, topicOrder }: TopicQuizEngineProps) {
    const navigate = useNavigate();
    const [questions, setQuestions] = useState<TopicQuizQuestion[]>([]);
    // Falls back to fetching the roadmap itself when the parent doesn't pass
    // `topicName`/`topicOrder` explicitly, so the result page shows the same
    // "Topic {sort_order}: {name}" the learning-path page shows, instead of
    // the generic "Topic Quiz" placeholder.
    const [fetchedTopicName, setFetchedTopicName] = useState<string | null>(null);
    const [fetchedTopicOrder, setFetchedTopicOrder] = useState<number | null>(null);
    const displayTopicName = topicName ?? fetchedTopicName ?? 'Topic Quiz';
    const displayTopicOrder = topicOrder ?? fetchedTopicOrder ?? undefined;
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<TopicQuizSubmitResponse | null>(null);
    const [quizStarted, setQuizStarted] = useState(false);
    const [showQuitModal, setShowQuitModal] = useState(false);
    const [isExiting, setIsExiting] = useState(false);
    const [wasResetByRefresh, setWasResetByRefresh] = useState(false);
    const SESSION_STORAGE_KEY = `topic_quiz_active_${topicId}`;

    const [reviewFilter, setReviewFilter] = useState<'all' | 'incorrect' | 'correct'>('all');
    const [expandedQuestionId, setExpandedQuestionId] = useState<string | number | null>(null);

    // Detect if a previous active quiz was discarded by a page refresh/reload
    useEffect(() => {
        const hadActiveSession = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (hadActiveSession) {
            sessionStorage.removeItem(SESSION_STORAGE_KEY);
            setWasResetByRefresh(true);
            toast.warning(
                '⚠️ Quiz session reset: No drafts or mid-quiz resumption. Your previous attempt was discarded upon refreshing. Please restart from Question 1.',
                { duration: 6500 }
            );
        }
    }, [SESSION_STORAGE_KEY]);

    // Track active quiz session in sessionStorage
    useEffect(() => {
        if (quizStarted && !result && !isExiting) {
            sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
        } else {
            sessionStorage.removeItem(SESSION_STORAGE_KEY);
        }
    }, [quizStarted, result, isExiting, SESSION_STORAGE_KEY]);

    const loadData = useCallback(async (forceNew = false) => {
        try {
            setLoading(true);
            if (forceNew) {
                setResult(null);
                setCurrentIndex(0);
                setAnswers({});
                setQuizStarted(false);
                setIsExiting(false);
                setReviewFilter('all');
                setExpandedQuestionId(null);
                const fetched = await fetchTopicQuizQuestions(topicId, true);
                setQuestions(fetched);
                return;
            }

            // 1. If user previously finished the test, keep showing the result page on refresh
            const state = await fetchTopicQuizState(topicId);
            if (state.latest_attempt) {
                sessionStorage.removeItem(SESSION_STORAGE_KEY);
                setWasResetByRefresh(false);
                setResult(state.latest_attempt);
                setQuizStarted(true);
                return;
            }

            // 2. Otherwise load questions for a new test and present regulations
            setResult(null);
            setCurrentIndex(0);
            setAnswers({});
            setQuizStarted(false);
            setIsExiting(false);
            setReviewFilter('all');
            setExpandedQuestionId(null);
            const fetched = await fetchTopicQuizQuestions(topicId, false);
            setQuestions(fetched);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to load Topic Quiz.';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    }, [topicId]);

    useEffect(() => {
        void loadData(false);
    }, [loadData]);

    // Navigation and tab-refresh warnings while quiz is in progress
    useEffect(() => {
        if (!quizStarted || result || isExiting) return;

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            const msg = '⚠️ No drafts or mid-quiz resumption: If you reload or leave, all your answers will be lost and you must restart from Question 1.';
            e.preventDefault();
            e.returnValue = msg;
            return msg;
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [quizStarted, result, isExiting]);

    // Block accidental back/forward or in-app navigation while quiz is active
    useBlocker({
        shouldBlockFn: () => {
            if (isExiting) return false;
            toast.error(
                '⚠️ No drafts or mid-quiz resumption: Navigating away will discard all your answers and progress, and you must restart from Question 1. Use "Exit Quiz" in the top bar if you wish to quit.',
                { duration: 5000 }
            );
            return true;
        },
        disabled: !quizStarted || Boolean(result) || isExiting,
        enableBeforeUnload: true,
    });

    useEffect(() => {
        if (topicName && topicOrder !== undefined) {
            // Parent already gave us both — no need to fetch anything ourselves.
            return;
        }
        let cancelled = false;
        void fetchRoadmap()
            .then((roadmap) => {
                if (cancelled) return;
                const matchedTopic = roadmap.topics.find((t) => t.id === topicId);
                if (matchedTopic) {
                    setFetchedTopicName(matchedTopic.name);
                    setFetchedTopicOrder(matchedTopic.sort_order);
                }
            })
            .catch(() => {
                // Non-fatal: worst case the header falls back to "Topic Quiz"
                // with no order badge.
            });
        return () => {
            cancelled = true;
        };
    }, [topicId, topicName, topicOrder]);

    const currentQuestion = questions[currentIndex];
    const totalQuestions = questions.length;
    const answeredCount = Object.values(answers).filter((value) => hasAnswer(value)).length;
    const progressPercent = totalQuestions > 0 ? Math.round(((currentIndex + 1) / totalQuestions) * 100) : 0;

    const handleAnswerChange = (answer: string) => {
        if (!currentQuestion || submitting || result) return;
        setAnswers((prev) => ({
            ...prev,
            [currentQuestion.id]: answer,
        }));
    };

    const handleNext = () => {
        if (currentIndex < totalQuestions - 1) {
            setCurrentIndex((prev) => prev + 1);
        }
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex((prev) => prev - 1);
        }
    };

    const handleSubmit = async () => {
        if (submitting) return;

        const payload: TopicQuizAnswerSubmission[] = questions.map((q) => ({
            question_id: q.id,
            question_type: q.question_type,
            answer: answers[q.id] ?? '',
        }));

        try {
            setSubmitting(true);
            const res = await submitTopicQuiz(topicId, payload);
            sessionStorage.removeItem(SESSION_STORAGE_KEY);
            setWasResetByRefresh(false);
            setResult(res);
            if (res.passed) {
                toast.success(`Congratulations! You passed the Topic Quiz with ${res.score_percent}%`);
            } else {
                toast.error(`Topic Quiz failed with ${res.score_percent}%. Please review flagged lessons.`);
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Submission failed. Please try again.';
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-blue-50/60 p-4 dark:bg-slate-950">
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    <span className="text-base font-semibold text-slate-800 dark:text-slate-200">
                        Loading Topic Quiz...
                    </span>
                </div>
            </div>
        );
    }

    if (result) {
        const questionResults = result.question_results ?? [];
        const correctResults = questionResults.filter((q) => q.is_correct);
        const incorrectResults = questionResults.filter((q) => !q.is_correct);
        const filteredQuestionResults = questionResults.filter((q) => {
            if (reviewFilter === 'incorrect') return !q.is_correct;
            if (reviewFilter === 'correct') return q.is_correct;
            return true;
        });

        return (
            <div className="min-h-screen bg-blue-50/60 px-4 py-4 text-slate-950 dark:bg-slate-950 dark:text-white sm:px-6 sm:py-6">
                <div className="mx-auto w-full max-w-[1300px]">
                    {/* Header */}
                    <div className="mb-4 flex items-center justify-between">
                        <Link
                            to="/lessons/learning-path"
                            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Roadmap
                        </Link>
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                            {displayTopicOrder !== undefined
                                ? `Topic ${displayTopicOrder}: ${displayTopicName} Result`
                                : `${displayTopicName} Result`}
                        </span>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
                        {/* MAIN CONTENT */}
                        <main className="min-w-0 space-y-4">
                            {/* Result Summary Card */}
                            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md dark:border-slate-800 dark:bg-slate-900">
                                <div className="grid gap-5 p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-6">
                                    <div
                                        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border ${result.passed
                                            ? 'border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-400'
                                            : 'border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-400'
                                            }`}
                                    >
                                        {result.passed ? <Award className="h-7 w-7" /> : <AlertCircle className="h-7 w-7" />}
                                    </div>

                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span
                                                className={`inline-flex items-center rounded-full px-3 py-0.5 text-xs font-bold ${result.passed
                                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
                                                    : 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200'
                                                    }`}
                                            >
                                                {result.passed ? 'PASSED' : 'FAILED'}
                                            </span>
                                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                                Pass mark: 75%
                                            </span>
                                        </div>
                                        <h1 className="mt-1.5 text-2xl font-extrabold text-slate-900 dark:text-white sm:text-3xl">
                                            {result.passed ? 'Great work!' : 'Keep practicing!'}
                                        </h1>
                                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                                            {result.correct_count} of {result.total_questions} questions correct.
                                        </p>
                                    </div>

                                    <div className="rounded-xl bg-slate-50 px-5 py-3 text-center dark:bg-slate-800">
                                        <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
                                            {result.score_percent}%
                                        </p>
                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Score
                                        </p>
                                    </div>
                                </div>

                                {/* White Space Area: Topic Name and Topic Ordering */}
                                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 bg-slate-50/60 px-5 py-3.5 dark:border-slate-800 dark:bg-slate-900/50">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <span className="truncate text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            {displayTopicOrder !== undefined
                                                ? `Topic ${displayTopicOrder}: ${displayTopicName}`
                                                : displayTopicName}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        <Button
                                            onClick={() => void loadData(true)}
                                            className="h-10 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700"
                                        >
                                            <RotateCcw className="mr-2 h-4 w-4" />
                                            {result.passed ? 'Retake Quiz' : 'Retry Quiz'}
                                        </Button>
                                        <Button asChild variant="outline" className="h-10 rounded-xl text-sm">
                                            <Link to="/lessons/learning-path">
                                                Roadmap
                                                <ArrowRight className="ml-2 h-4 w-4" />
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </section>

                            {/* Weakest Lessons */}
                            {!result.passed && result.weakest_lessons.length > 0 && (
                                <section className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 dark:border-rose-900/60 dark:bg-rose-950/20">
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-sm text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
                                            🚩
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-sm font-bold text-rose-900 dark:text-rose-200">
                                                Lessons to Review
                                            </h3>
                                            <div className="mt-3 grid gap-2.5 md:grid-cols-2">
                                                {result.weakest_lessons.map((lesson) => (
                                                    <div
                                                        key={lesson.lesson_id}
                                                        className="flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-white p-3 dark:border-rose-900/40 dark:bg-slate-900"
                                                    >
                                                        <div className="min-w-0">
                                                            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                                                                {lesson.title}
                                                            </p>
                                                            <p className="text-xs text-slate-500">
                                                                Accuracy: {lesson.accuracy_percent}%
                                                            </p>
                                                        </div>
                                                        <Button asChild size="sm" variant="outline" className="h-8 px-3 text-xs">
                                                            <Link
                                                                to="/lessons/$lessonId"
                                                                params={{ lessonId: String(lesson.lesson_id) }}
                                                            >
                                                                <BookOpen className="mr-1.5 h-3.5 w-3.5" />
                                                                Review
                                                            </Link>
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {/* QUESTION REVIEW */}
                            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
                                <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <h2 className="text-base font-bold text-slate-900 dark:text-white">
                                            Question Review
                                        </h2>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            Expand a question to check explanation.
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setReviewFilter('all')}
                                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${reviewFilter === 'all'
                                                ? 'bg-blue-600 text-white shadow-sm'
                                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                                                }`}
                                        >
                                            All ({questionResults.length})
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setReviewFilter('incorrect')}
                                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${reviewFilter === 'incorrect'
                                                ? 'bg-rose-600 text-white shadow-sm'
                                                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/30 dark:text-rose-300'
                                                }`}
                                        >
                                            Incorrect ({incorrectResults.length})
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setReviewFilter('correct')}
                                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${reviewFilter === 'correct'
                                                ? 'bg-emerald-600 text-white shadow-sm'
                                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-300'
                                                }`}
                                        >
                                            Correct ({correctResults.length})
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-3 space-y-2">
                                    {filteredQuestionResults.map((q) => {
                                        const originalIndex = result.question_results.findIndex(
                                            (item) => item.question_id === q.question_id,
                                        );
                                        const isExpanded = expandedQuestionId === q.question_id;

                                        return (
                                            <div
                                                id={`topic-question-${q.question_id}`}
                                                key={q.question_id}
                                                className={`overflow-hidden rounded-xl border transition-all ${q.is_correct
                                                    ? 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
                                                    : 'border-rose-200 bg-rose-50/30 dark:border-rose-900/50 dark:bg-rose-950/10'
                                                    }`}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => setExpandedQuestionId(isExpanded ? null : q.question_id)}
                                                    className="flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                                >
                                                    <div
                                                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${q.is_correct
                                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                            : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                                                            }`}
                                                    >
                                                        {q.is_correct ? (
                                                            <CheckCircle2 className="h-4 w-4" />
                                                        ) : (
                                                            <XCircle className="h-4 w-4" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                                                Q{originalIndex + 1}
                                                            </span>
                                                            <span
                                                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${q.is_correct
                                                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                                    : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                                                                    }`}
                                                            >
                                                                {q.is_correct ? 'Correct' : 'Incorrect'}
                                                            </span>
                                                        </div>
                                                        <p className="mt-1 truncate text-sm text-slate-600 dark:text-slate-400">
                                                            {q.question_text}
                                                        </p>
                                                    </div>
                                                    <div className={`shrink-0 text-sm text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                                                        ▼
                                                    </div>
                                                </button>

                                                {isExpanded && (
                                                    <div className="border-t border-slate-100 bg-slate-50/40 p-3 dark:border-slate-800 dark:bg-slate-950/20 sm:p-4">
                                                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                                                            <ReadonlyTopicQuizQuestion
                                                                result={q}
                                                                questionNumber={originalIndex + 1}
                                                                totalQuestions={result.total_questions}
                                                                attemptPassed={result.passed}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {filteredQuestionResults.length === 0 && (
                                        <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center dark:border-slate-800">
                                            <p className="text-sm font-medium text-slate-500">
                                                No questions in this category.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </main>

                        {/* RIGHT SIDEBAR */}
                        <aside className="space-y-4 xl:sticky xl:top-6 xl:h-fit">
                            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Performance</h3>
                                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                        {result.score_percent}%
                                    </span>
                                </div>
                                <div className="mt-3">
                                    <Progress value={result.score_percent} className="h-2.5 rounded-full" />
                                </div>
                                <div className="mt-4 grid grid-cols-2 gap-3">
                                    <div className="rounded-xl bg-emerald-50 p-3 text-center dark:bg-emerald-950/30">
                                        <p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300">
                                            {correctResults.length}
                                        </p>
                                        <p className="mt-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">Correct</p>
                                    </div>
                                    <div className="rounded-xl bg-rose-50 p-3 text-center dark:bg-rose-950/30">
                                        <p className="text-2xl font-extrabold text-rose-700 dark:text-rose-300">
                                            {incorrectResults.length}
                                        </p>
                                        <p className="mt-1 text-xs font-semibold text-rose-700 dark:text-rose-400">Incorrect</p>
                                    </div>
                                </div>
                            </section>

                            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Questions</h3>
                                    <span className="text-xs text-slate-400">{result.total_questions} total</span>
                                </div>
                                <div className="mt-3 grid grid-cols-6 gap-1.5">
                                    {questionResults.map((question, index) => (
                                        <button
                                            key={question.question_id}
                                            type="button"
                                            onClick={() => {
                                                setReviewFilter('all');
                                                setExpandedQuestionId(question.question_id);
                                                window.setTimeout(() => {
                                                    document
                                                        .getElementById(`topic-question-${question.question_id}`)
                                                        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                }, 50);
                                            }}
                                            className={`flex aspect-square items-center justify-center rounded-lg text-xs font-bold transition-transform hover:scale-105 ${question.is_correct
                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                                                }`}
                                            title={`Question ${index + 1}`}
                                        >
                                            {index + 1}
                                        </button>
                                    ))}
                                </div>
                            </section>
                        </aside>
                    </div>
                </div>
            </div>
        );
    }

    if (!quizStarted) {
        return (
            <div className="flex min-h-screen flex-col justify-center bg-blue-50/60 px-4 py-6 text-slate-950 dark:bg-slate-950 dark:text-white sm:px-6 sm:py-8">
                <div className="mx-auto w-full max-w-5xl">
                    {/* Header Link */}
                    <div className="mb-4 flex items-center justify-between">
                        <Link
                            to="/lessons/learning-path"
                            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Roadmap
                        </Link>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            {displayTopicOrder !== undefined
                                ? `Topic ${displayTopicOrder}: ${displayTopicName}`
                                : displayTopicName}
                        </span>
                    </div>

                    {/* Session Reset Warning Banner */}
                    {wasResetByRefresh && (
                        <div className="mb-4 flex items-start gap-2.5 rounded-2xl border border-amber-300 bg-amber-50 p-3.5 text-amber-900 shadow-sm dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                            <div className="text-xs leading-relaxed">
                                <p className="font-bold text-amber-950 dark:text-amber-100">
                                    Quiz Session Reset Due to Page Refresh
                                </p>
                                <p className="mt-0.5">
                                    Topic quizzes do not support drafts or mid-quiz resumption. Because the page was refreshed or navigated away from, all previous answers were discarded. Please start again from Question 1.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Regulations Card */}
                    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:p-6">
                        <div className="flex items-center gap-3.5 border-b border-slate-100 pb-4 dark:border-slate-800">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                                <BookOpen className="h-6 w-6" />
                            </div>
                            <div>
                                <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                                    Topic Assessment
                                </div>
                                <h1 className="mt-0.5 text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                                    {displayTopicOrder !== undefined ? `Topic ${displayTopicOrder} Quiz Regulations` : 'Topic Quiz Regulations'}
                                </h1>
                                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
                                    Review topic examination guidelines before testing your mastery.
                                </p>
                            </div>
                        </div>

                        {/* Regulations Grid */}
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-950/40">
                                <div className="flex items-center gap-2">
                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                                        <BookOpen className="h-3.5 w-3.5" />
                                    </div>
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                        30 Cumulative Questions
                                    </h3>
                                </div>
                                <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                                    Sourced from all assigned lessons in this topic to test retention and understanding.
                                </p>
                            </div>

                            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-950/40">
                                <div className="flex items-center gap-2">
                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                    </div>
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                        Passing Score: 75%
                                    </h3>
                                </div>
                                <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                                    You must answer at least 23 of 30 questions correctly (≥ 75%) to unlock the subsequent topic on your roadmap.
                                </p>
                            </div>

                            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-950/40">
                                <div className="flex items-center gap-2">
                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
                                        <AlertCircle className="h-3.5 w-3.5" />
                                    </div>
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                        No In-Quiz Hints
                                    </h3>
                                </div>
                                <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                                    Unlike standard lesson practice, topic quizzes do not offer hints. Responses evaluate unassisted recall.
                                </p>
                            </div>

                            <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-3.5 dark:border-amber-950/50 dark:bg-amber-950/20">
                                <div className="flex items-center gap-2">
                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                                        <ArrowLeft className="h-3.5 w-3.5" />
                                    </div>
                                    <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                                        Navigation Protection & Exit Policy (No Drafts)
                                    </h3>
                                </div>
                                <p className="mt-1.5 text-xs leading-relaxed text-amber-800 dark:text-amber-300">
                                    Refreshing or navigating back will trigger warnings. You can exit anytime via the "Exit Quiz" button in the header, <strong>but quizzes cannot be saved as drafts or resumed midway</strong>—all progress will be lost, and you must restart from Question 1.
                                </p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => void navigate({ to: '/lessons/learning-path' })}
                                className="h-11 rounded-xl px-5 text-sm font-semibold"
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Roadmap
                            </Button>

                            <Button
                                type="button"
                                onClick={() => {
                                    setWasResetByRefresh(false);
                                    setQuizStarted(true);
                                }}
                                className="h-11 rounded-xl bg-blue-600 px-7 text-sm font-bold text-white shadow-md hover:bg-blue-700"
                            >
                                I Understand the Rules — Start Topic Quiz
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!currentQuestion) {
        return (
            <div className="flex min-h-screen items-center justify-center p-4">
                <div className="text-center">
                    <p className="text-base text-slate-600">No questions found for this topic.</p>
                    <Button onClick={() => navigate({ to: '/lessons/learning-path' })} className="mt-4 text-sm">
                        Back to Roadmap
                    </Button>
                </div>
            </div>
        );
    }

    const axis = AXIS_META[currentQuestion.skill] ?? AXIS_META['D_doc'];
    const selectedAnswer = answers[currentQuestion.id];

    return (
        <div className="flex min-h-screen flex-col justify-center bg-blue-50/60 pb-12 pt-6 text-slate-950 dark:bg-slate-950 dark:text-white">
            <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
                {/* Top Bar */}
                <div className="mb-4 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => setShowQuitModal(true)}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Exit Quiz
                    </button>
                    <div className="text-right">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{displayTopicOrder !== undefined
                            ? `Topic ${displayTopicOrder}: ${displayTopicName} Quiz`
                            : `${displayTopicName} Quiz`}</span>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                            Question {currentIndex + 1} of {totalQuestions}
                        </p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                    <div className="mb-1.5 flex justify-between text-xs font-medium text-slate-500">
                        <span>Progress</span>
                        <span>{answeredCount} of {totalQuestions} answered ({progressPercent}%)</span>
                    </div>
                    <Progress value={progressPercent} className="h-2.5 rounded-full" />
                </div>

                {/* Live Session Warning Notice */}
                <div className="mb-5 flex items-center justify-center gap-2 rounded-xl border border-amber-200/80 bg-amber-50/80 py-2 px-3.5 text-center text-xs font-medium text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
                    <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                    <span>
                        <strong>No draft or mid-quiz resumption:</strong> Do not navigate away or refresh the page. Leaving or reloading discards all progress and requires restarting from Question 1.
                    </span>
                </div>

                {/* Question Card */}
                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:p-8 [&_p]:text-base [&_span]:text-base [&_label]:text-base [&_button]:text-base">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
                        <div className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-bold ${axis.bg} ${axis.color}`}>
                            <div className={`h-2 w-2 rounded-full ${axis.dot}`} />
                            {axis.label}
                        </div>
                    </div>

                    <div className="mb-5">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            <BookOpen className="h-3.5 w-3.5" />
                            From Lesson: {currentQuestion.lesson_title}
                        </span>
                    </div>

                    <div className="text-lg font-medium leading-relaxed">
                        {currentQuestion.question_type === 'fill_blank' ? (
                            <FillBlankQuestion
                                key={currentQuestion.id}
                                data={currentQuestion.data as FillBlankQuestionData}
                                questionNumber={currentIndex + 1}
                                totalQuestions={totalQuestions}
                                onAnswer={handleAnswerChange}
                                isSubmitted={false}
                                userAnswer={selectedAnswer}
                                revealAnswer={false}
                            />
                        ) : currentQuestion.question_type === 'multi_select' ? (
                            <MultiSelectQuestion
                                key={currentQuestion.id}
                                data={currentQuestion.data as MultiSelectQuestionData}
                                questionNumber={currentIndex + 1}
                                totalQuestions={totalQuestions}
                                userAnswer={selectedAnswer ?? null}
                                onAnswerChange={handleAnswerChange}
                                isSubmitted={false}
                                explanation={(currentQuestion.data as MultiSelectQuestionData)[3]}
                                revealAnswer={false}
                            />
                        ) : (
                            <OrderingQuestion
                                key={currentQuestion.id}
                                data={currentQuestion.data as OrderingQuestionData}
                                questionNumber={currentIndex + 1}
                                totalQuestions={totalQuestions}
                                userAnswer={selectedAnswer ?? null}
                                onAnswerChange={handleAnswerChange}
                                isSubmitted={false}
                                explanation={(currentQuestion.data as OrderingQuestionData)[3]}
                                revealAnswer={false}
                            />
                        )}
                    </div>
                </div>

                {/* Bottom Navigation Buttons */}
                <div className="mt-5 flex items-center justify-between gap-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handlePrevious}
                        disabled={currentIndex === 0}
                        className="h-12 rounded-xl px-6 text-sm font-semibold"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Previous
                    </Button>

                    <div className="flex items-center gap-3">
                        {currentIndex < totalQuestions - 1 ? (
                            <Button
                                type="button"
                                onClick={handleNext}
                                className="h-12 rounded-xl bg-blue-600 px-8 text-sm font-bold text-white hover:bg-blue-700"
                            >
                                Next
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="h-12 rounded-xl bg-emerald-600 px-9 text-sm font-bold text-white shadow-lg hover:bg-emerald-700"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        Submit Topic Quiz
                                        <CheckCircle2 className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Quit Confirmation Modal */}
            {showQuitModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowQuitModal(false)} />
                    <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
                            <AlertCircle className="h-6 w-6" />
                        </div>
                        <h3 className="text-center text-lg font-bold text-slate-900 dark:text-white">Exit Topic Quiz?</h3>
                        
                        <div className="mt-3 rounded-xl border border-rose-200/80 bg-rose-50/80 p-3.5 text-center text-xs leading-relaxed text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
                            <p className="font-bold">⚠️ No Drafts or Mid-Quiz Resumption</p>
                            <p className="mt-1">
                                Your answers cannot be saved as a draft or resumed midway. If you exit now, all current progress will be lost and you must restart the quiz from the very beginning (Question 1).
                            </p>
                        </div>

                        <div className="mt-6 flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setShowQuitModal(false)}
                                className="h-10 flex-1 rounded-xl text-sm font-semibold"
                            >
                                Stay & Finish
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={() => {
                                    setIsExiting(true);
                                    sessionStorage.removeItem(SESSION_STORAGE_KEY);
                                    void navigate({ to: '/lessons/learning-path' });
                                }}
                                className="h-10 flex-1 rounded-xl text-sm font-bold shadow-sm"
                            >
                                Exit & Discard
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}