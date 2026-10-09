import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import {
    Award,
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    RotateCcw,
    XCircle,
    BookOpen,
} from 'lucide-react';
import { Button } from '@/shadcn/component/ui/button';
import { Progress } from '@/shadcn/component/ui/progress';
import type { TopicQuizSubmitResponse } from '@/feature/learning-path/api/roadmapApi';
import { ReadonlyQuizQuestion } from '@/feature/quiz-common/component/ReadonlyQuizQuestion';

interface TopicQuizResultViewProps {
    result: TopicQuizSubmitResponse;
    displayTopicName: string;
    displayTopicOrder?: number;
    onRetake: () => void;
}

export function TopicQuizResultView({
    result,
    displayTopicName,
    displayTopicOrder,
    onRetake,
}: TopicQuizResultViewProps) {
    const [reviewFilter, setReviewFilter] = useState<'all' | 'incorrect' | 'correct'>('all');
    const [expandedQuestionId, setExpandedQuestionId] = useState<string | number | null>(null);

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
                                        onClick={onRetake}
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
                                                        <ReadonlyQuizQuestion
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
