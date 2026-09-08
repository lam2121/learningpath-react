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
    GraduationCap,
    ShieldCheck,
    ShieldAlert,
} from 'lucide-react';
import { Button } from '@/shadcn/component/ui/button';
import { Progress } from '@/shadcn/component/ui/progress';
import { toast } from 'sonner';
import {
    fetchFinalQuizQuestions,
    fetchFinalQuizState,
    submitFinalQuiz,
    type FinalQuizQuestion,
    type FinalQuizSubmitResponse,
    type FinalQuizAnswerSubmission,
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
    result: FinalQuizSubmitResponse["question_results"][number],
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

function ReadonlyFinalQuizQuestion({
    result,
    questionNumber,
    totalQuestions,
    attemptPassed,
}: {
    result: FinalQuizSubmitResponse["question_results"][number];
    questionNumber: number;
    totalQuestions: number;
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

export function FinalQuizEngine() {
    const navigate = useNavigate();

    const [questions, setQuestions] = useState<FinalQuizQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<FinalQuizSubmitResponse | null>(null);
    const [quizStarted, setQuizStarted] = useState(false);
    const [wasResetByRefresh, setWasResetByRefresh] = useState(false);
    const [reviewFilter, setReviewFilter] = useState<'all' | 'correct' | 'incorrect'>('all');
    const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);

    // Detect if a previous active quiz was discarded by a page refresh/reload
    useEffect(() => {
        const hadActiveSession = sessionStorage.getItem('final_quiz_active_session');
        if (hadActiveSession) {
            sessionStorage.removeItem('final_quiz_active_session');
            setWasResetByRefresh(true);
            toast.warning(
                '⚠️ Quiz session reset: No drafts or mid-quiz resumption. Your previous attempt was discarded upon refreshing. Please restart from Question 1.',
                { duration: 6500 }
            );
        }
    }, []);

    // Track active quiz session in sessionStorage
    useEffect(() => {
        if (quizStarted && !result) {
            sessionStorage.setItem('final_quiz_active_session', 'true');
        } else {
            sessionStorage.removeItem('final_quiz_active_session');
        }
    }, [quizStarted, result]);

    const loadData = useCallback(async (forceNew = false) => {
        try {
            setLoading(true);
            if (forceNew) {
                setResult(null);
                setAnswers({});
                setCurrentIndex(0);
                setQuizStarted(false);
                const data = await fetchFinalQuizQuestions(true);
                setQuestions(data);
                return;
            }

            // 1. If user previously finished the test, keep showing the result page on refresh
            const state = await fetchFinalQuizState();
            if (state.latest_attempt) {
                sessionStorage.removeItem('final_quiz_active_session');
                setWasResetByRefresh(false);
                setResult(state.latest_attempt);
                setQuizStarted(true);
                return;
            }

            // 2. Otherwise load questions for a new test and present regulations
            setResult(null);
            setAnswers({});
            setCurrentIndex(0);
            setQuizStarted(false);
            const data = await fetchFinalQuizQuestions(false);
            setQuestions(data);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to load Final Course Quiz.';
            toast.error(message);
            if (message.toLowerCase().includes('locked')) {
                void navigate({ to: '/lessons/learning-path' });
            }
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        void loadData(false);
    }, [loadData]);

    // Navigation and tab-refresh warnings while quiz is in progress
    useEffect(() => {
        if (!quizStarted || result) return;

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
    }, [quizStarted, result]);

    // Block accidental back/forward or in-app navigation while quiz is active
    useBlocker({
        shouldBlockFn: () => {
            toast.error('⚠️ No drafts or mid-quiz resumption: Leaving or navigating away will discard all your answers, and you must restart from Question 1. Please complete and submit your quiz.', {
                duration: 5000,
            });
            return true;
        },
        disabled: !quizStarted || Boolean(result),
        enableBeforeUnload: true,
    });

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

        const payload: FinalQuizAnswerSubmission[] = questions.map((q) => ({
            question_id: q.id,
            question_type: q.question_type,
            answer: answers[q.id] ?? '',
        }));

        try {
            setSubmitting(true);
            const res = await submitFinalQuiz(payload);
            sessionStorage.removeItem('final_quiz_active_session');
            setWasResetByRefresh(false);
            setResult(res);
            if (res.passed) {
                toast.success(`🎉 Congratulations! You graduated the course with ${res.score_percent}%!`);
            } else {
                toast.error(`Final Course Quiz score: ${res.score_percent}%. Pass mark is 80% overall & 60% per skill section.`);
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
                        Loading Final Course Quiz...
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
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                            <GraduationCap className="h-4 w-4" />
                            Final Course Quiz Result
                        </span>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
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
                                                {result.passed ? 'COURSE GRADUATED' : 'ATTEMPT FAILED'}
                                            </span>
                                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                                Pass criteria: ≥ 80% overall & ≥ 60% per skill section
                                            </span>
                                        </div>
                                        <h1 className="mt-1.5 text-2xl font-extrabold text-slate-900 dark:text-white sm:text-3xl">
                                            {result.passed ? 'Outstanding Achievement!' : 'Keep Practicing!'}
                                        </h1>
                                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                                            {result.correct_count} of {result.total_questions} questions correct across all 4 skill domains.
                                        </p>
                                    </div>

                                    <div className="rounded-xl bg-slate-50 px-5 py-3 text-center dark:bg-slate-800">
                                        <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
                                            {result.score_percent}%
                                        </p>
                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Overall Score
                                        </p>
                                    </div>
                                </div>

                                {/* White Space Area: Course Final Quiz & Action Buttons */}
                                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 bg-slate-50/60 px-5 py-3.5 dark:border-slate-800 dark:bg-slate-900/50">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <GraduationCap className="h-4 w-4 text-blue-600" />
                                        <span className="truncate text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            Course Final Graduation Quiz ({result.total_questions} Questions)
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        <Button
                                            onClick={() => void loadData(true)}
                                            className="h-10 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700"
                                        >
                                            <RotateCcw className="mr-2 h-4 w-4" />
                                            {result.passed ? 'Retake Final Quiz' : 'Retry Final Quiz'}
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

                            {/* SKILL SECTION BREAKDOWN (Spec §4.6) */}
                            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Skill Section Breakdown (Pass Mark: ≥ 60%)
                                </h2>
                                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                    {result.skill_breakdown.map((sb) => {
                                        const axis = AXIS_META[sb.skill] ?? AXIS_META['D_doc'];
                                        return (
                                            <div
                                                key={sb.skill}
                                                className={`rounded-xl border p-3.5 transition-all ${sb.passed
                                                    ? 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
                                                    : 'border-rose-200 bg-rose-50/40 dark:border-rose-900/40 dark:bg-rose-950/20'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-bold ${axis.bg} ${axis.color}`}>
                                                        <div className={`h-1.5 w-1.5 rounded-full ${axis.dot}`} />
                                                        {sb.label}
                                                    </div>
                                                    {sb.passed ? (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                                            <ShieldCheck className="h-3.5 w-3.5" />
                                                            Pass
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                                                            <ShieldAlert className="h-3.5 w-3.5" />
                                                            &lt;60%
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">
                                                    {sb.accuracy_percent}%
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    {sb.correct_count} of {sb.total_count} correct
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>

                            {/* Weakest Lessons (if not passed and flagged) */}
                            {!result.passed && result.weakest_lessons.length > 0 && (
                                <section className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 dark:border-rose-900/60 dark:bg-rose-950/20">
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-sm text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
                                            🚩
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-sm font-bold text-rose-900 dark:text-rose-200">
                                                Flagged Lessons to Review Before Retake
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
                                            Expand a question to inspect details.
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
                                        const axis = AXIS_META[q.skill] ?? AXIS_META['D_doc'];

                                        return (
                                            <div
                                                id={`final-question-${q.question_id}`}
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
                                                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${axis.bg} ${axis.color}`}>
                                                                {axis.label}
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
                                                    <div className="border-t border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                                                        <ReadonlyFinalQuizQuestion
                                                            result={q}
                                                            questionNumber={originalIndex + 1}
                                                            totalQuestions={result.question_results.length}
                                                            attemptPassed={result.passed}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        </main>

                        {/* SIDEBAR PALETTE */}
                        <aside className="space-y-4">
                            <section className="sticky top-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                        Question Palette
                                    </h3>
                                    <span className="text-xs text-slate-400">{result.total_questions} total</span>
                                </div>
                                <div className="mt-3 grid grid-cols-6 gap-1.5 sm:grid-cols-8 xl:grid-cols-5">
                                    {questionResults.map((question, index) => (
                                        <button
                                            key={question.question_id}
                                            type="button"
                                            onClick={() => {
                                                setReviewFilter('all');
                                                setExpandedQuestionId(question.question_id);
                                                window.setTimeout(() => {
                                                    document
                                                        .getElementById(`final-question-${question.question_id}`)
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
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                            <GraduationCap className="h-3.5 w-3.5" />
                            Graduation Examination
                        </span>
                    </div>

                    {/* Session Reset Warning Banner */}
                    {wasResetByRefresh && (
                        <div className="mb-4 flex items-start gap-2.5 rounded-2xl border border-amber-300 bg-amber-50 p-3.5 text-amber-900 shadow-sm dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                            <div className="text-xs leading-relaxed">
                                <p className="font-bold text-amber-950 dark:text-amber-100">
                                    Quiz Session Reset Due to Page Refresh
                                </p>
                                <p className="mt-0.5">
                                    The Final Course Quiz does not support drafts or mid-quiz resumption. Because the page was refreshed or navigated away from, all answers were discarded. Please start again from Question 1.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Regulations Card */}
                    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:p-6">
                        <div className="flex items-center gap-3.5 border-b border-slate-100 pb-4 dark:border-slate-800">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                                <GraduationCap className="h-6 w-6" />
                            </div>
                            <div>
                                <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                                    Official Assessment
                                </div>
                                <h1 className="mt-0.5 text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                                    Final Course Quiz Regulations
                                </h1>
                                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
                                    Please carefully review all examination rules and grading criteria before you begin.
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
                                        50 Cumulative Questions
                                    </h3>
                                </div>
                                <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                                    Spans all 4 core skills: Documentation, Communication, Troubleshooting, and Business across all completed topics.
                                </p>
                            </div>

                            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-950/40">
                                <div className="flex items-center gap-2">
                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                                        <ShieldCheck className="h-3.5 w-3.5" />
                                    </div>
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                        Double-Threshold Pass Mark
                                    </h3>
                                </div>
                                <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                                    Requires an overall score of <strong className="text-emerald-700 dark:text-emerald-400">≥ 80%</strong> AND at least <strong className="text-emerald-700 dark:text-emerald-400">60%</strong> in each individual skill domain to graduate.
                                </p>
                            </div>

                            <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-3.5 dark:border-rose-950/50 dark:bg-rose-950/20">
                                <div className="flex items-center gap-2">
                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
                                        <ShieldAlert className="h-3.5 w-3.5" />
                                    </div>
                                    <h3 className="text-sm font-bold text-rose-900 dark:text-rose-200">
                                        Continuous Session (No Mid-Test Exit)
                                    </h3>
                                </div>
                                <p className="mt-1.5 text-xs leading-relaxed text-rose-800 dark:text-rose-300">
                                    There is no exit option during the Final Quiz. You must finish and submit all 50 questions in one sitting.
                                </p>
                            </div>

                            <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-3.5 dark:border-amber-950/50 dark:bg-amber-950/20">
                                <div className="flex items-center gap-2">
                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                                        <AlertCircle className="h-3.5 w-3.5" />
                                    </div>
                                    <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                                        Navigation & Refresh Protected (No Drafts)
                                    </h3>
                                </div>
                                <p className="mt-1.5 text-xs leading-relaxed text-amber-800 dark:text-amber-300">
                                    Do not refresh the page or navigate away. <strong>Quizzes cannot be saved as drafts or resumed midway</strong>—leaving or reloading discards all progress and requires restarting from Question 1.
                                </p>
                            </div>
                        </div>

                        {/* Question Types & Rules Notice */}
                        <div className="mt-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-3.5 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
                            <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                                Question Types Included:
                            </div>
                            <ul className="mt-2 grid gap-1.5 sm:grid-cols-2 text-slate-600 dark:text-slate-400">
                                <li className="flex items-start gap-1.5">
                                    <span className="text-blue-500 font-bold">•</span>
                                    <span><strong>Fill in the Blank:</strong> Type or select technical terminology.</span>
                                </li>
                                <li className="flex items-start gap-1.5">
                                    <span className="text-blue-500 font-bold">•</span>
                                    <span><strong>Multi-Select:</strong> Choose the correct answer from multiple options.</span>
                                </li>
                                <li className="flex items-start gap-1.5">
                                    <span className="text-blue-500 font-bold">•</span>
                                    <span><strong>Ordering:</strong> Sequence steps or sentence parts correctly.</span>
                                </li>
                                <li className="flex items-start gap-1.5">
                                    <span className="text-blue-500 font-bold">•</span>
                                    <span><strong>No Hints:</strong> Graduation exams test independent recall.</span>
                                </li>
                            </ul>
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
                                I Understand the Rules — Start Final Quiz
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
                    <p className="text-base text-slate-600">No questions available for Final Course Quiz.</p>
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
                {/* Top Bar - No Exit Quiz button in Final Course Quiz */}
                <div className="mb-4 flex items-center justify-between">
                    <div className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm border border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                        <GraduationCap className="h-4 w-4 text-blue-600" />
                        Final Course Graduation Quiz
                    </div>
                    <div className="text-right">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                            Graduation Exam
                        </span>
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
                        <strong>No draft or mid-quiz resumption:</strong> Do not refresh or navigate away. Leaving or reloading discards all progress and requires restarting from Question 1.
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

                    <div className="mb-5 flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            <BookOpen className="h-3.5 w-3.5" />
                            From Lesson: {currentQuestion.lesson_title}
                        </span>
                        {currentQuestion.topic_name && (
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                                Topic: {currentQuestion.topic_name}
                            </span>
                        )}
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
                                        Submit Final Quiz
                                        <CheckCircle2 className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
