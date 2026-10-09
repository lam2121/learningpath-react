import { Link } from '@tanstack/react-router';
import {
    ArrowLeft,
    ArrowRight,
    BookOpen,
    CheckCircle2,
    AlertCircle,
    GraduationCap,
    ShieldCheck,
    ShieldAlert,
} from 'lucide-react';
import { Button } from '@/shadcn/component/ui/button';

interface FinalQuizRegulationsCardProps {
    wasResetByRefresh: boolean;
    onStartQuiz: () => void;
    onNavigateBack: () => void;
}

export function FinalQuizRegulationsCard({
    wasResetByRefresh,
    onStartQuiz,
    onNavigateBack,
}: FinalQuizRegulationsCardProps) {
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
                            onClick={onNavigateBack}
                            className="h-11 rounded-xl px-5 text-sm font-semibold"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Roadmap
                        </Button>

                        <Button
                            type="button"
                            onClick={onStartQuiz}
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
