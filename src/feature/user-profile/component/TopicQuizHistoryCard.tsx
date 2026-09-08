import { useEffect, useMemo, useState } from "react";
import {
    AlertCircle,
    ArrowUpDown,
    CheckCircle2,
    Clock3,
    Loader2,
    Medal,
    RotateCcw,
    Search,
    SlidersHorizontal,
    Sparkles,
    TrendingUp,
    X,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { fetchCurrentUserProfile } from "@/feature/auth/api/authAPI";
import type {
    TopicQuizHistoryEntryResponse,
    UserProfileResponse,
} from "@/feature/auth/type/Auth";
import {
    fetchTopicQuizState,
    type TopicQuizQuestionResult,
    type TopicQuizSubmitResponse,
} from "@/feature/learning-path/api/roadmapApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/shadcn/component/ui/card";
import { Input } from "@/shadcn/component/ui/input";
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
import { getSkillBadgeClasses } from "./LearningHistoryChart";

const uiTokens = {
    panel: "gap-0 overflow-hidden rounded-2xl border border-cyan-200 bg-slate-50 py-0 shadow-[0_12px_32px_rgba(0,114,187,0.14)]",
    header: "border-b border-cyan-200/70 bg-gradient-to-r from-[#005596] via-[#0072BB] to-[#00A9CE]",
    activeControl: "bg-[#0072BB] text-white shadow-md shadow-cyan-200/70",
    inactiveControl: "bg-slate-100 text-slate-800 hover:bg-cyan-100 hover:text-[#005596]",
} as const;

type SortOption = "topic-asc" | "topic-desc" | "score-desc" | "title-asc" | "newest" | "oldest";

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
    result: TopicQuizQuestionResult,
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

function ReadonlyTopicQuizQuestion({
    result,
    questionNumber,
    totalQuestions,
}: {
    result: TopicQuizQuestionResult;
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

export function TopicQuizHistoryCard() {
    const { t } = useTranslation(["history", "profile"]);
    const [profile, setProfile] = useState<UserProfileResponse | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortOption, setSortOption] = useState<SortOption>("topic-asc");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    // Modal state for viewing questions
    const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
    const [selectedTopicName, setSelectedTopicName] = useState<string>("");
    const [selectedTopicOrder, setSelectedTopicOrder] = useState<number | null>(null);
    const [selectedEntry, setSelectedEntry] = useState<TopicQuizHistoryEntryResponse | null>(null);
    const [topicDetail, setTopicDetail] = useState<TopicQuizSubmitResponse | null>(null);
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
            if (selectedTopicId !== null) {
                setSelectedTopicId(null);
                setSelectedEntry(null);
                setTopicDetail(null);
                setDetailError(null);
            }
        };

        if (selectedTopicId !== null) {
            window.history.pushState({ isTopicDetailModalOpen: true }, "");
            window.addEventListener("popstate", handlePopState);
        }

        return () => {
            window.removeEventListener("popstate", handlePopState);
        };
    }, [selectedTopicId]);

    const topicHistory = useMemo(
        () => profile?.topic_quiz_history ?? [],
        [profile],
    );

    const filteredHistory = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();
        return topicHistory.filter((entry) => {
            if (query) {
                const haystack = `${entry.topic_name} topic ${entry.topic_sort_order ?? ""}`.toLowerCase();
                if (!haystack.includes(query)) return false;
            }
            if (statusFilter !== "all" && entry.status !== statusFilter) {
                return false;
            }
            return true;
        });
    }, [searchTerm, statusFilter, topicHistory]);

    const sortedHistory = useMemo(() => {
        return [...filteredHistory].sort((a, b) => {
            if (sortOption === "topic-asc") {
                return (a.topic_sort_order ?? 999) - (b.topic_sort_order ?? 999);
            }
            if (sortOption === "topic-desc") {
                return (b.topic_sort_order ?? 999) - (a.topic_sort_order ?? 999);
            }
            if (sortOption === "score-desc") {
                return (b.best_score_percent ?? 0) - (a.best_score_percent ?? 0);
            }
            if (sortOption === "title-asc") {
                return a.topic_name.localeCompare(b.topic_name);
            }
            if (sortOption === "newest" || sortOption === "oldest") {
                const aDate = a.recorded_at ?? a.completed_at ?? "";
                const bDate = b.recorded_at ?? b.completed_at ?? "";
                const comp = aDate.localeCompare(bDate);
                return sortOption === "newest" ? -comp : comp;
            }
            return 0;
        });
    }, [filteredHistory, sortOption]);

    const openTopicDetail = async (entry: TopicQuizHistoryEntryResponse) => {
        setSelectedTopicId(entry.topic_id);
        setSelectedTopicName(entry.topic_name);
        setSelectedTopicOrder(entry.topic_sort_order ?? null);
        setSelectedEntry(entry);
        setTopicDetail(null);
        setDetailError(null);
        setDetailLoading(true);
        setReviewFilter("all");

        try {
            const state = await fetchTopicQuizState(entry.topic_id);
            const bestAttempt = state.best_attempt ?? state.latest_attempt ?? state.first_pass ?? null;
            if (bestAttempt) {
                setTopicDetail(bestAttempt);
            } else {
                setDetailError("No detailed quiz attempt data found for this topic.");
            }
        } catch (err) {
            setDetailError(err instanceof Error ? err.message : "Failed to load topic quiz details.");
        } finally {
            setDetailLoading(false);
        }
    };

    const isFilterActive = searchTerm !== "" || sortOption !== "topic-asc" || statusFilter !== "all";

    const questionResults = topicDetail?.question_results ?? [];
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
                {/* LEFT SIDEBAR: Filters */}
                <div className="space-y-4 lg:col-span-1">
                    <Card className={uiTokens.panel}>
                        <CardHeader className={`${uiTokens.header} px-4 py-3 sm:px-5`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="rounded-lg bg-white/25 p-1 text-white">
                                        <SlidersHorizontal className="h-3.5 w-3.5" />
                                    </div>
                                    <CardTitle className="text-lg font-bold text-white">
                                        {t("filters.title", { defaultValue: "Search & Filter" })}
                                    </CardTitle>
                                </div>
                                {isFilterActive && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearchTerm("");
                                            setSortOption("topic-asc");
                                            setStatusFilter("all");
                                        }}
                                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-bold text-cyan-50 transition-colors hover:bg-white/15"
                                    >
                                        <RotateCcw className="h-3 w-3" />
                                        {t("filters.reset", { defaultValue: "Reset" })}
                                    </button>
                                )}
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-5 p-4 sm:p-5">
                            {/* Search */}
                            <div>
                                <label className="mb-2 block text-sm font-bold uppercase tracking-[0.14em] text-[#005596]/60">
                                    {t("filters.search", { defaultValue: "Search" })}
                                </label>
                                <div className="relative">
                                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-500" />
                                    <Input
                                        type="search"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search topic name..."
                                        className="h-11 rounded-xl border-cyan-100 bg-cyan-50/60 pl-9 pr-8 text-base focus-visible:border-cyan-300 focus-visible:bg-white"
                                    />
                                    {searchTerm && (
                                        <button
                                            type="button"
                                            onClick={() => setSearchTerm("")}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-cyan-500 hover:bg-cyan-100"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Sort */}
                            <div>
                                <label className="mb-2 block text-sm font-bold uppercase tracking-[0.14em] text-[#005596]/60">
                                    {t("filters.sortBy", { defaultValue: "Sort By" })}
                                </label>
                                <div className="grid grid-cols-1 gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setSortOption("topic-asc")}
                                        className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-all ${sortOption === "topic-asc"
                                            ? `${uiTokens.activeControl} font-bold`
                                            : uiTokens.inactiveControl
                                            }`}
                                    >
                                        <span className="flex items-center gap-2">
                                            <ArrowUpDown className="h-4 w-4" />
                                            Topic 1 → 8 (Default)
                                        </span>
                                        {sortOption === "topic-asc" && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setSortOption("topic-desc")}
                                        className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-all ${sortOption === "topic-desc"
                                            ? `${uiTokens.activeControl} font-bold`
                                            : uiTokens.inactiveControl
                                            }`}
                                    >
                                        <span className="flex items-center gap-2">
                                            <ArrowUpDown className="h-4 w-4" />
                                            Topic 8 → 1
                                        </span>
                                        {sortOption === "topic-desc" && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setSortOption("score-desc")}
                                        className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-all ${sortOption === "score-desc"
                                            ? `${uiTokens.activeControl} font-bold`
                                            : uiTokens.inactiveControl
                                            }`}
                                    >
                                        <span className="flex items-center gap-2">
                                            <TrendingUp className="h-4 w-4" />
                                            Highest Score
                                        </span>
                                        {sortOption === "score-desc" && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setSortOption("newest")}
                                        className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-all ${sortOption === "newest"
                                            ? `${uiTokens.activeControl} font-bold`
                                            : uiTokens.inactiveControl
                                            }`}
                                    >
                                        <span className="flex items-center gap-2">
                                            <Clock3 className="h-4 w-4" />
                                            {t("sort.newest", { defaultValue: "Newest First" })}
                                        </span>
                                        {sortOption === "newest" && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />}
                                    </button>
                                </div>
                            </div>

                            {/* Status Filter */}
                            <div>
                                <label className="mb-2 block text-sm font-bold uppercase tracking-[0.14em] text-[#005596]/60">
                                    Status
                                </label>
                                <div className="flex flex-wrap gap-1.5">
                                    {[
                                        { label: "All", value: "all" },
                                        { label: "Passed", value: "passed" },
                                        { label: "Failed", value: "failed" },
                                    ].map((st) => (
                                        <button
                                            key={st.value}
                                            type="button"
                                            onClick={() => setStatusFilter(st.value)}
                                            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${statusFilter === st.value
                                                ? "bg-[#0072BB] text-white shadow-sm"
                                                : "bg-cyan-50 text-[#005596] hover:bg-cyan-100"
                                                }`}
                                        >
                                            {st.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* RIGHT CONTENT AREA: Topic Quiz History Cards */}
                <div className="min-w-0 space-y-4 lg:col-span-3">
                    <Card className={`flex min-w-0 flex-col ${uiTokens.panel}`}>
                        <CardHeader className={`${uiTokens.header} px-5 py-4 sm:px-6`}>
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <CardTitle className="text-2xl font-black text-white sm:text-3xl">
                                        Best Topic Quiz Scores
                                    </CardTitle>
                                    <p className="mt-1 text-base text-cyan-100">
                                        Highest score saved for each topic assessment in your roadmap.
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 self-start sm:self-auto">
                                    <span className="whitespace-nowrap rounded-xl border border-white/30 bg-white/20 px-3 py-1.5 text-sm font-black uppercase tracking-[0.14em] text-white shadow-sm">
                                        {sortedHistory.length} Topics
                                    </span>
                                    <div className="rounded-xl bg-amber-400 p-2 text-white shadow-sm">
                                        <Medal className="h-5 w-5" />
                                    </div>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-5 sm:p-6">
                            {topicHistory.length === 0 ? (
                                <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-cyan-100 bg-cyan-50/60 px-4 py-6 text-center">
                                    <Sparkles className="h-10 w-10 text-cyan-500" />
                                    <div>
                                        <p className="text-lg font-bold text-slate-900">
                                            No Topic Quiz History Yet
                                        </p>
                                        <p className="mt-2 text-base leading-7 text-slate-500">
                                            Complete all assigned lessons in a topic to unlock and take its Topic Quiz.
                                        </p>
                                    </div>
                                </div>
                            ) : sortedHistory.length === 0 ? (
                                <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-cyan-100 bg-cyan-50/60 px-4 py-8 text-center">
                                    <Search className="h-8 w-8 text-cyan-500" />
                                    <div>
                                        <p className="text-lg font-bold text-slate-900">
                                            No matching topics found
                                        </p>
                                        <p className="mt-2 text-base leading-7 text-slate-500">
                                            Try adjusting your search or status filter.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid gap-3 sm:grid-cols-1 xl:grid-cols-2">
                                    {sortedHistory.map((entry) => {
                                        const recordedLabel = formatHistoryDate(entry.recorded_at ?? entry.completed_at);
                                        const topicOrderLabel = entry.topic_sort_order
                                            ? `Topic ${entry.topic_sort_order}`
                                            : "Topic";
                                        const statusClasses =
                                            entry.status === "passed"
                                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold"
                                                : entry.status === "failed"
                                                    ? "bg-rose-100 text-rose-800 border border-rose-200 font-bold"
                                                    : "bg-amber-100 text-amber-800 border border-amber-200 font-bold";

                                        return (
                                            <button
                                                key={entry.topic_id}
                                                type="button"
                                                onClick={() => void openTopicDetail(entry)}
                                                className="group flex w-full cursor-pointer flex-col rounded-xl border border-cyan-200 bg-[#eef7ff] p-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-400 hover:bg-white hover:shadow-[0_8px_20px_rgba(0,169,206,0.22)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                                            >
                                                {/* Top section: Badges + Topic Name on left, Best Score Badge on right */}
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex flex-wrap items-center gap-1.5">
                                                            <span className="rounded-full bg-cyan-200 px-2.5 py-1 text-xs font-bold text-[#004a82]">
                                                                {topicOrderLabel}
                                                            </span>
                                                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ${statusClasses}`}>
                                                                {entry.status === "passed" ? (
                                                                    <CheckCircle2 className="h-3 w-3" />
                                                                ) : entry.status === "failed" ? (
                                                                    <AlertCircle className="h-3 w-3" />
                                                                ) : (
                                                                    <Clock3 className="h-3 w-3" />
                                                                )}
                                                                <span className="capitalize">{entry.status}</span>
                                                            </span>
                                                        </div>

                                                        {/* Topic Name - moved up to sit nicely in the middle next to the score badge */}
                                                        <p className="mt-2 text-base font-bold text-slate-800 transition-colors group-hover:text-[#005596] line-clamp-1">
                                                            {entry.topic_name}
                                                        </p>
                                                    </div>

                                                    {/* Enlarged Best Score Badge */}
                                                    <div className="min-w-[84px] shrink-0 rounded-xl bg-[#0082c9] px-3 py-2 text-center shadow-md transition-colors group-hover:bg-[#0069aa]">
                                                        <p className="text-[10px] font-black uppercase leading-none tracking-[0.16em] text-cyan-50">
                                                            BEST
                                                        </p>
                                                        <p className="mt-1 text-2xl font-black leading-none text-white">
                                                            {formatPercent(entry.best_score_percent)}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Stats line */}
                                                <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-slate-200 pt-2 text-xs text-slate-600">
                                                    <span>{entry.attempt_count} attempt{entry.attempt_count !== 1 ? "s" : ""}</span>
                                                    <span>•</span>
                                                    <span>{entry.failed_attempts} failed</span>
                                                    <span>•</span>
                                                    <span>{entry.correct_count}/{entry.total_questions} correct</span>
                                                    <span className="ml-auto text-slate-500">
                                                        {recordedLabel ?? "Not recorded"}
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* DETAIL MODAL: Question Review for Selected Topic */}
            <Dialog
                open={selectedTopicId !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        if (window.history.state?.isTopicDetailModalOpen) {
                            window.history.back();
                        }
                        setSelectedTopicId(null);
                        setSelectedEntry(null);
                        setTopicDetail(null);
                        setDetailError(null);
                    }
                }}
            >
                <DialogContent className="!w-[98vw] !max-w-[calc(100vw-1rem)] sm:!max-w-[110rem] max-h-[92vh] overflow-y-auto p-6 sm:p-8">
                    <DialogHeader>
                        <DialogTitle className="text-xl sm:text-2xl font-black text-slate-900">
                            {selectedTopicOrder ? `Topic ${selectedTopicOrder}: ${selectedTopicName}` : selectedTopicName}
                        </DialogTitle>
                        <DialogDescription>
                            {topicDetail
                                ? `Topic Quiz Assessment · Saved Best Attempt · ${topicDetail.passed ? "Passed" : "Failed"}`
                                : "Loading saved topic quiz results..."}
                        </DialogDescription>
                    </DialogHeader>

                    {detailLoading ? (
                        <div className="flex min-h-48 items-center justify-center gap-3 text-slate-500">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Loading topic quiz results...
                        </div>
                    ) : detailError ? (
                        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-5 text-sm text-rose-700">
                            {detailError}
                        </div>
                    ) : topicDetail ? (
                        <div className="space-y-5">
                            {/* Metric Strip matching Lesson Quiz layout */}
                            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Status</p>
                                    <p className={`mt-1 font-semibold capitalize ${topicDetail.passed ? "text-emerald-700" : "text-rose-700"}`}>
                                        {formatStatusLabel(selectedEntry?.status ?? (topicDetail.passed ? "passed" : "failed"))}
                                    </p>
                                </div>
                                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Best Score</p>
                                    <p className="mt-1 font-semibold text-slate-950">
                                        {formatPercent(topicDetail.score_percent ?? selectedEntry?.best_score_percent)}
                                    </p>
                                </div>
                                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Total Attempts</p>
                                    <p className="mt-1 font-semibold text-slate-950">
                                        {topicDetail.attempt_count ?? selectedEntry?.attempt_count ?? 1}
                                    </p>
                                </div>
                                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Failed Attempts</p>
                                    <p className="mt-1 font-semibold text-slate-950">
                                        {topicDetail.failed_attempts ?? selectedEntry?.failed_attempts ?? 0}
                                    </p>
                                </div>
                                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Correct Questions</p>
                                    <p className="mt-1 font-semibold text-slate-950">
                                        {topicDetail.correct_count} / {topicDetail.total_questions}
                                    </p>
                                </div>
                                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Recorded Date</p>
                                    <p className="mt-1 font-semibold text-slate-950">
                                        {formatHistoryDate(selectedEntry?.recorded_at ?? selectedEntry?.completed_at) ?? "Unknown"}
                                    </p>
                                </div>
                            </div>

                            {/* Weakest Lessons Alert if applicable */}
                            {topicDetail.weakest_lessons && topicDetail.weakest_lessons.length > 0 && (
                                <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-rose-900">
                                        Flagged Review Modules ({topicDetail.weakest_lessons.length})
                                    </h4>
                                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                        {topicDetail.weakest_lessons.map((wl) => (
                                            <div key={wl.lesson_id} className="rounded-xl border border-rose-200 bg-white p-2.5 text-xs">
                                                <p className="font-bold text-slate-900">{wl.title}</p>
                                                <p className="mt-0.5 text-slate-500">Accuracy: {wl.accuracy_percent}%</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Question Filter Header */}
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                                <p className="text-sm font-bold text-slate-900">
                                    Questions ({questionResults.length})
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
                                                        {result.lesson_title ? (
                                                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                                                                {result.lesson_title}
                                                            </span>
                                                        ) : null}
                                                        {result.skill ? (
                                                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getSkillBadgeClasses(result.skill)}`}>
                                                                {SKILL_LABELS[result.skill] ?? formatLabel(result.skill)}
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-900">
                                                        {result.question_text || "Question statement unavailable"}
                                                    </p>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent className="pt-4">
                                                <ReadonlyTopicQuizQuestion
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
