import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useBlocker } from '@tanstack/react-router';
import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    Loader2,
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
import { TopicQuizRegulationsCard } from './TopicQuizRegulationsCard';
import { TopicQuizResultView } from './TopicQuizResultView';
import { TopicQuizQuitDialog } from './TopicQuizQuitDialog';

const AXIS_META: Record<string, { label: string; color: string; bg: string; dot: string }> = {
    D_doc: { label: 'Documentation', color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/60', dot: 'bg-blue-500' },
    C_comm: { label: 'Communication', color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/60', dot: 'bg-emerald-500' },
    T_trouble: { label: 'Troubleshooting', color: 'text-rose-700 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/60', dot: 'bg-rose-500' },
    G_custom: { label: 'Business', color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/60', dot: 'bg-amber-500' },
};

function hasAnswer(answer: string | undefined): answer is string {
    return Boolean(answer && answer.trim().length > 0);
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
            const fetched = await fetchTopicQuizQuestions(topicId, false);
            setQuestions(fetched);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to load Topic Quiz.';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    }, [topicId, SESSION_STORAGE_KEY]);

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

    // Enter advances to the next question, or submits on the last one.
    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key !== 'Enter' || event.shiftKey || event.repeat) return;
            if (submitting || result) return;
            const target = event.target as HTMLElement | null;
            if (
                target &&
                (target.tagName === 'INPUT' ||
                    target.tagName === 'TEXTAREA' ||
                    target.isContentEditable)
            ) {
                return;
            }
            if (!currentQuestion || !hasAnswer(answers[currentQuestion.id])) return;
            event.preventDefault();
            if (currentIndex < totalQuestions - 1) {
                handleNext();
            } else {
                void handleSubmit();
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    });

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
        return (
            <TopicQuizResultView
                result={result}
                displayTopicName={displayTopicName}
                displayTopicOrder={displayTopicOrder}
                onRetake={() => void loadData(true)}
            />
        );
    }

    if (!quizStarted) {
        return (
            <TopicQuizRegulationsCard
                displayTopicName={displayTopicName}
                displayTopicOrder={displayTopicOrder}
                wasResetByRefresh={wasResetByRefresh}
                onStartQuiz={() => {
                    setWasResetByRefresh(false);
                    setQuizStarted(true);
                }}
                onNavigateBack={() => void navigate({ to: '/lessons/learning-path' })}
            />
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
        <div className="flex min-h-[100dvh] w-full max-w-[100vw] overflow-x-hidden flex-col justify-center bg-blue-50/60 pb-12 pt-6 text-slate-950 dark:bg-slate-950 dark:text-white">
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
            <TopicQuizQuitDialog
                isOpen={showQuitModal}
                onClose={() => setShowQuitModal(false)}
                onConfirmExit={() => {
                    setIsExiting(true);
                    sessionStorage.removeItem(SESSION_STORAGE_KEY);
                    void navigate({ to: '/lessons/learning-path' });
                }}
            />
        </div>
    );
}