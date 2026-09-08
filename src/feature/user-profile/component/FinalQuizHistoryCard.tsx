import { useEffect, useMemo, useState } from "react";
import {
    AlertCircle,
    Award,
    CheckCircle2,
    GraduationCap,
    Loader2,
    ShieldCheck,
} from "lucide-react";

import { fetchCurrentUserProfile } from "@/feature/auth/api/authAPI";
import type { UserProfileResponse } from "@/feature/auth/type/Auth";
import {
    fetchFinalQuizState,
    type FinalQuizQuestionResult,
    type FinalQuizSubmitResponse,
} from "@/feature/learning-path/api/roadmapApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/shadcn/component/ui/card";
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
import { FillBlankQuestion } from "@/feature/quiz-engine/component/FillBlankQuestion";
import { MultiSelectQuestion } from "@/feature/quiz-engine/component/MultiSelectQuestion";
import { OrderingQuestion } from "@/feature/quiz-engine/component/OrderingQuestion";
import type {
    FillBlankQuestionData,
    MultiSelectQuestionData,
    OrderingQuestionData,
} from "@/feature/quiz-engine/type/Quiz";
import { getSkillBadgeClasses, getSkillTextClass } from "./LearningHistoryChart";

const uiTokens = {
    panel: "gap-0 overflow-hidden rounded-2xl border border-cyan-200 bg-slate-50 py-0 shadow-[0_12px_32px_rgba(0,114,187,0.14)]",
    header: "border-b border-cyan-200/70 bg-gradient-to-r from-[#005596] via-[#0072BB] to-[#00A9CE]",
} as const;

const SKILL_LABELS: Record<string, string> = {
    D_doc: "Documentation",
    C_comm: "Communication",
    T_trouble: "Troubleshooting",
    G_custom: "Business",
};

function formatHistoryDate(raw: string | null | undefined): string | null {
    if (!raw) return null;
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

function formatPercent(value: number | null | undefined): string {
    if (value == null || Number.isNaN(value)) return "—";
    return Number.isInteger(value) ? `${value}%` : `${value.toFixed(1)}%`;
}

function formatQuestionTypeLabel(value: string) {
    return value
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function formatStatusLabel(value: string) {
    return value
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function formatLabel(value: string) {
    return value
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function buildReadonlyQuestionData(
    result: FinalQuizQuestionResult,
): FillBlankQuestionData | MultiSelectQuestionData | OrderingQuestionData {
    const optionsStr = Array.isArray(result.options) ? result.options.join("|") : "";
    const base = [
        result.question_text ?? "",
        optionsStr,
        result.correct_answer ?? "",
        result.explanation ?? "",
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
    ] as const;

    return [...base] as FillBlankQuestionData | MultiSelectQuestionData | OrderingQuestionData;
}

function ReadonlyFinalQuizQuestion({
    result,
    questionNumber,
    totalQuestions,
}: {
    result: FinalQuizQuestionResult;
    questionNumber: number;
    totalQuestions: number;
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
                revealAnswer
            />
        );
    }

    if (result.question_type === "ordering") {
        return (
            <OrderingQuestion
                data={data as OrderingQuestionData}
                questionNumber={questionNumber}
                totalQuestions={totalQuestions}
                userAnswer={result.user_answer}
                onAnswerChange={() => { }}
                isSubmitted
                isCorrect={result.is_correct}
                explanation={result.explanation}
                revealAnswer
            />
        );
    }

    return (
        <MultiSelectQuestion
            data={data as MultiSelectQuestionData}
            questionNumber={questionNumber}
            totalQuestions={totalQuestions}
            userAnswer={result.user_answer}
            onAnswerChange={() => { }}
            isSubmitted
            isCorrect={result.is_correct}
            explanation={result.explanation}
            revealAnswer
        />
    );
}

export function FinalQuizHistoryCard() {
    const [profile, setProfile] = useState<UserProfileResponse | null>(null);

    // Modal state for question review
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [finalDetail, setFinalDetail] = useState<FinalQuizSubmitResponse | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState<string | null>(null);
    const [reviewFilter, setReviewFilter] = useState<"all" | "correct" | "incorrect">("all");

    useEffect(() => {
        let isMounted = true;
        const loadProfile = async () => {
            try {
                const response = await fetchCurrentUserProfile();
                if (isMounted) setProfile(response);
            } catch {
                if (isMounted) setProfile(null);
            }
        };
        void loadProfile();
        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        const handlePopState = () => {
            if (isDetailOpen) {
                setIsDetailOpen(false);
                setFinalDetail(null);
                setDetailError(null);
            }
        };

        if (isDetailOpen) {
            window.history.pushState({ isFinalDetailModalOpen: true }, "");
            window.addEventListener("popstate", handlePopState);
        }

        return () => {
            window.removeEventListener("popstate", handlePopState);
        };
    }, [isDetailOpen]);

    const finalHistory = useMemo(
        () => profile?.final_quiz_history ?? [],
        [profile],
    );

    const primaryFinalQuiz = finalHistory[0] ?? null;

    const openFinalDetail = async () => {
        setIsDetailOpen(true);
        setFinalDetail(null);
        setDetailError(null);
        setDetailLoading(true);
        setReviewFilter("all");

        try {
            const state = await fetchFinalQuizState();
            const bestAttempt = state.best_attempt ?? state.latest_attempt ?? state.first_pass ?? null;
            if (bestAttempt) {
                setFinalDetail(bestAttempt);
            } else {
                setDetailError("No detailed final quiz attempt found in your record.");
            }
        } catch (err) {
            setDetailError(err instanceof Error ? err.message : "Failed to load final quiz details.");
        } finally {
            setDetailLoading(false);
        }
    };

    const questionResults = finalDetail?.question_results ?? [];
    const correctCount = questionResults.filter((q) => q.is_correct).length;
    const incorrectCount = questionResults.length - correctCount;

    const displayedQuestions = questionResults.filter((q) => {
        if (reviewFilter === "correct") return q.is_correct;
        if (reviewFilter === "incorrect") return !q.is_correct;
        return true;
    });

    return (
        <>
            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-4">
                {/* LEFT SIDEBAR: Graduation Exam Requirements */}
                <div className="space-y-4 lg:col-span-1">
                    <Card className={uiTokens.panel}>
                        <CardHeader className={`${uiTokens.header} px-4 py-3 sm:px-5`}>
                            <div className="flex items-center gap-2 text-white">
                                <ShieldCheck className="h-4 w-4" />
                                <CardTitle className="text-lg font-bold">
                                    Graduation Standard
                                </CardTitle>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-4 p-4 sm:p-5 text-xs text-slate-600 sm:text-sm">
                            <div className="rounded-xl border border-sky-100 bg-sky-50/70 p-3 text-sky-950">
                                <p className="font-bold text-sky-900 mb-1">Dual-Gate Criteria:</p>
                                <ul className="space-y-1 text-xs">
                                    <li className="flex items-center gap-1.5">
                                        <span className="font-bold text-sky-600">✓</span>
                                        <span>Overall Score ≥ 80%</span>
                                    </li>
                                    <li className="flex items-center gap-1.5">
                                        <span className="font-bold text-sky-600">✓</span>
                                        <span>All 4 skills ≥ 60%</span>
                                    </li>
                                </ul>
                            </div>

                            <div>
                                <p className="font-bold text-[#005596] mb-1.5 uppercase text-[11px] tracking-wider">
                                    Graduation Skills Evaluated:
                                </p>
                                <div className="space-y-1 text-xs">
                                    <p className="flex justify-between font-medium text-[#005596]">
                                        <span>• Documentation (D)</span>
                                        <span className="text-slate-500">≥ 60%</span>
                                    </p>
                                    <p className="flex justify-between font-medium text-teal-700">
                                        <span>• Communication (C)</span>
                                        <span className="text-slate-500">≥ 60%</span>
                                    </p>
                                    <p className="flex justify-between font-medium text-rose-700">
                                        <span>• Troubleshooting (T)</span>
                                        <span className="text-slate-500">≥ 60%</span>
                                    </p>
                                    <p className="flex justify-between font-medium text-amber-700">
                                        <span>• Business (G)</span>
                                        <span className="text-slate-500">≥ 60%</span>
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* RIGHT CONTENT AREA: Final Course Quiz Record */}
                <div className="min-w-0 space-y-4 lg:col-span-3">
                    <Card className={`flex min-w-0 flex-col ${uiTokens.panel}`}>
                        <CardHeader className={`${uiTokens.header} px-5 py-4 sm:px-6`}>
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <CardTitle className="text-2xl font-black text-white sm:text-3xl">
                                        Best Final Course Quiz Score
                                    </CardTitle>
                                    <p className="mt-1 text-base text-cyan-100">
                                        Highest graduation examination score saved for your enrolled career track.
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 self-start sm:self-auto">
                                    <span className="whitespace-nowrap rounded-xl border border-white/30 bg-white/20 px-3 py-1.5 text-sm font-black uppercase tracking-[0.14em] text-white shadow-sm">
                                        Graduation Exam
                                    </span>
                                    <div className="rounded-xl bg-amber-400 p-2 text-white shadow-sm">
                                        <Award className="h-5 w-5" />
                                    </div>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-5 sm:p-6">
                            {!primaryFinalQuiz ? (
                                <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-cyan-100 bg-cyan-50/60 px-4 py-6 text-center">
                                    <GraduationCap className="h-10 w-10 text-cyan-500" />
                                    <div>
                                        <p className="text-lg font-bold text-slate-900">
                                            No Final Course Quiz Record Yet
                                        </p>
                                        <p className="mt-2 text-base leading-7 text-slate-500">
                                            Complete all Topic Quizzes in your roadmap to unlock the Final Course Quiz.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <button
                                        type="button"
                                        onClick={() => void openFinalDetail()}
                                        className="group flex w-full cursor-pointer flex-col rounded-2xl border border-cyan-200 bg-[#eef7ff] p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-400 hover:bg-white hover:shadow-[0_12px_28px_rgba(0,169,206,0.24)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                                    >
                                        {/* Top row: Track Badge + Status + Best Score */}
                                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="rounded-full bg-cyan-200 px-3 py-1 text-xs font-bold text-[#004a82]">
                                                        Career Track: {primaryFinalQuiz.course_name}
                                                    </span>
                                                    <span
                                                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${primaryFinalQuiz.status === "passed"
                                                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                                            : primaryFinalQuiz.status === "failed"
                                                                ? "bg-rose-100 text-rose-800 border border-rose-200"
                                                                : "bg-amber-100 text-amber-800 border border-amber-200"
                                                            }`}
                                                    >
                                                        {primaryFinalQuiz.status === "passed" ? (
                                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                                        ) : (
                                                            <AlertCircle className="h-3.5 w-3.5" />
                                                        )}
                                                        <span className="capitalize">{primaryFinalQuiz.status}</span>
                                                    </span>
                                                </div>

                                                <h3 className="mt-3 text-xl font-black text-slate-900 transition-colors group-hover:text-[#005596]">
                                                    Comprehensive Final Examination
                                                </h3>
                                                <p className="mt-0.5 text-xs text-slate-500">
                                                    Click card to review saved best-attempt answers and explanations.
                                                </p>
                                            </div>

                                            {/* Enlarged Best Score Badge */}
                                            <div className="min-w-[100px] shrink-0 rounded-2xl bg-[#0082c9] px-4 py-3 text-center shadow-md transition-colors group-hover:bg-[#0069aa] self-start">
                                                <p className="text-[11px] font-black uppercase leading-none tracking-[0.16em] text-cyan-50">
                                                    BEST
                                                </p>
                                                <p className="mt-1.5 text-3xl font-black leading-none text-white">
                                                    {formatPercent(primaryFinalQuiz.best_score_percent)}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Skill Section Breakdown Tiles */}
                                        {primaryFinalQuiz.skill_scores && (
                                            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                                                {Object.entries(primaryFinalQuiz.skill_scores).map(([sk, sc]) => {
                                                    const label = SKILL_LABELS[sk] ?? sk;
                                                    const passed = sc >= 60.0;
                                                    return (
                                                        <div
                                                            key={sk}
                                                            className={`rounded-xl border p-2.5 text-center ${passed
                                                                ? "border-emerald-200 bg-emerald-50/50"
                                                                : "border-rose-200 bg-rose-50/50"
                                                                }`}
                                                        >
                                                            <p className={`text-[11px] font-bold truncate ${getSkillTextClass(sk)}`}>
                                                                {label}
                                                            </p>
                                                            <p className={`mt-0.5 text-base font-black ${passed ? "text-emerald-800" : "text-rose-800"}`}>
                                                                {Math.round(sc)}%
                                                            </p>
                                                            <p className="text-[10px] text-slate-500">
                                                                {passed ? "Pass (≥60%)" : "Needs Review"}
                                                            </p>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Bottom Stats Line */}
                                        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-slate-200 pt-3 text-xs text-slate-600">
                                            <span>
                                                <strong>{primaryFinalQuiz.attempt_count}</strong> attempt{primaryFinalQuiz.attempt_count !== 1 ? "s" : ""}
                                            </span>
                                            <span>•</span>
                                            <span>
                                                <strong>{primaryFinalQuiz.failed_attempts}</strong> failed
                                            </span>
                                            <span>•</span>
                                            <span>
                                                <strong>{primaryFinalQuiz.correct_count}/{primaryFinalQuiz.total_questions}</strong> questions correct
                                            </span>
                                            <span>•</span>
                                            <span>
                                                Progress: <strong>{Math.round(primaryFinalQuiz.progress)}%</strong>
                                            </span>
                                            <span className="ml-auto text-slate-500">
                                                {formatHistoryDate(primaryFinalQuiz.completed_at ?? primaryFinalQuiz.recorded_at) ?? "Recorded"}
                                            </span>
                                        </div>
                                    </button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* DETAIL MODAL: Question Review for Final Course Quiz */}
            <Dialog
                open={isDetailOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        if (window.history.state?.isFinalDetailModalOpen) {
                            window.history.back();
                        }
                        setIsDetailOpen(false);
                        setFinalDetail(null);
                        setDetailError(null);
                    }
                }}
            >
                <DialogContent className="!w-[98vw] !max-w-[calc(100vw-1rem)] sm:!max-w-[110rem] max-h-[92vh] overflow-y-auto p-6 sm:p-8">
                    <DialogHeader>
                        <DialogTitle className="text-xl sm:text-2xl font-black text-slate-900">
                            Final Course Quiz — {primaryFinalQuiz?.course_name ?? "Graduation Examination"}
                        </DialogTitle>
                        <DialogDescription>
                            {finalDetail
                                ? `Career Track Graduation Exam · Saved Best Attempt · ${finalDetail.passed ? "Graduated (Passed)" : "Retake Required (Failed)"}`
                                : "Loading saved final quiz results..."}
                        </DialogDescription>
                    </DialogHeader>

                    {detailLoading ? (
                        <div className="flex min-h-48 items-center justify-center gap-3 text-slate-500">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Loading saved final quiz results...
                        </div>
                    ) : detailError ? (
                        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-5 text-sm text-rose-700">
                            {detailError}
                        </div>
                    ) : finalDetail ? (
                        <div className="space-y-5">
                            {/* Metric Strip matching Lesson Quiz layout */}
                            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Status</p>
                                    <p className={`mt-1 font-semibold capitalize ${finalDetail.passed ? "text-emerald-700" : "text-rose-700"}`}>
                                        {formatStatusLabel(primaryFinalQuiz?.status ?? (finalDetail.passed ? "passed" : "failed"))}
                                    </p>
                                </div>
                                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Best Score</p>
                                    <p className="mt-1 font-semibold text-slate-950">
                                        {formatPercent(finalDetail.score_percent ?? primaryFinalQuiz?.best_score_percent)}
                                    </p>
                                </div>
                                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Total Attempts</p>
                                    <p className="mt-1 font-semibold text-slate-950">
                                        {finalDetail.attempt_count ?? primaryFinalQuiz?.attempt_count ?? 1}
                                    </p>
                                </div>
                                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Failed Attempts</p>
                                    <p className="mt-1 font-semibold text-slate-950">
                                        {finalDetail.failed_attempts ?? primaryFinalQuiz?.failed_attempts ?? 0}
                                    </p>
                                </div>
                                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Correct Questions</p>
                                    <p className="mt-1 font-semibold text-slate-950">
                                        {finalDetail.correct_count} / {finalDetail.total_questions}
                                    </p>
                                </div>
                                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Recorded Date</p>
                                    <p className="mt-1 font-semibold text-slate-950">
                                        {formatHistoryDate(primaryFinalQuiz?.completed_at ?? primaryFinalQuiz?.recorded_at) ?? "Unknown"}
                                    </p>
                                </div>
                            </div>

                            {/* Section Performance (Dual-Gate criteria) */}
                            {finalDetail.skill_breakdown && finalDetail.skill_breakdown.length > 0 && (
                                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5">
                                        Section Performance (≥ 60% required per section)
                                    </h4>
                                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                                        {finalDetail.skill_breakdown.map((sb) => (
                                            <div
                                                key={sb.skill}
                                                className={`rounded-xl border p-3 text-center ${
                                                    sb.passed
                                                        ? "border-emerald-200 bg-emerald-50/60"
                                                        : "border-rose-200 bg-rose-50/60"
                                                }`}
                                            >
                                                <p className={`text-xs font-bold ${getSkillTextClass(sb.skill)}`}>{sb.label}</p>
                                                <p className={`mt-1 text-lg font-black ${sb.passed ? "text-emerald-800" : "text-rose-800"}`}>
                                                    {Math.round(sb.accuracy_percent)}%
                                                </p>
                                                <p className="text-[10px] text-slate-500">
                                                    {sb.correct_count}/{sb.total_count} correct
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Question Filter Header */}
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                                <p className="text-sm font-bold text-slate-900">
                                    Graduation Questions ({questionResults.length})
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setReviewFilter("all")}
                                        className={`rounded-xl px-3 py-1 text-xs font-bold transition-all ${
                                            reviewFilter === "all"
                                                ? "bg-[#0072BB] text-white shadow-sm"
                                                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                        }`}
                                    >
                                        All ({questionResults.length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setReviewFilter("incorrect")}
                                        className={`rounded-xl px-3 py-1 text-xs font-bold transition-all ${
                                            reviewFilter === "incorrect"
                                                ? "bg-rose-600 text-white shadow-sm"
                                                : "bg-rose-50 text-rose-700 hover:bg-rose-100"
                                        }`}
                                    >
                                        Incorrect ({incorrectCount})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setReviewFilter("correct")}
                                        className={`rounded-xl px-3 py-1 text-xs font-bold transition-all ${
                                            reviewFilter === "correct"
                                                ? "bg-emerald-600 text-white shadow-sm"
                                                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                        }`}
                                    >
                                        Correct ({correctCount})
                                    </button>
                                </div>
                            </div>

                            {/* Accordion Questions */}
                            {displayedQuestions.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                                    No questions match the selected filter.
                                </div>
                            ) : (
                                <Accordion type="multiple" className="rounded-2xl border border-slate-200 bg-white px-4">
                                    {displayedQuestions.map((result, index) => (
                                        <AccordionItem
                                            key={`${result.question_id}-${index}`}
                                            value={`${result.question_id}-${index}`}
                                        >
                                            <AccordionTrigger className="hover:no-underline">
                                                <div className="min-w-0 text-left">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                                                            Question {index + 1}
                                                        </span>
                                                        <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-[#005596]">
                                                            {formatQuestionTypeLabel(result.question_type)}
                                                        </span>
                                                        <span
                                                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                                result.is_correct
                                                                    ? "bg-emerald-100 text-emerald-700"
                                                                    : "bg-rose-100 text-rose-700"
                                                            }`}
                                                        >
                                                            {result.is_correct ? "Correct" : "Incorrect"}
                                                        </span>
                                                        {result.skill ? (
                                                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getSkillBadgeClasses(result.skill)}`}>
                                                                {SKILL_LABELS[result.skill] ?? formatLabel(result.skill)}
                                                            </span>
                                                        ) : null}
                                                        {result.lesson_title ? (
                                                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                                                                {result.lesson_title}
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-900">
                                                        {result.question_text || "Question statement unavailable"}
                                                    </p>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent className="pt-4">
                                                <ReadonlyFinalQuizQuestion
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
        </>
    );
}
