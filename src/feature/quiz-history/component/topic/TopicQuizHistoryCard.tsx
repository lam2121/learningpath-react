import { useEffect, useMemo, useState } from "react";
import {
    Medal,
    Search,
    Sparkles,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { fetchCurrentUserProfile } from "@/feature/auth/api/authAPI";
import type {
    TopicQuizHistoryEntryResponse,
    UserProfileResponse,
} from "@/feature/auth/type/Auth";
import {
    fetchTopicQuizState,
    type TopicQuizSubmitResponse,
} from "@/feature/learning-path/api/roadmapApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/shadcn/component/ui/card";
import { formatLabel } from "@/common/utils/historyFormatters";
import {
    TopicQuizFilterSidebar,
    type TopicQuizSortOption,
} from "./TopicQuizFilterSidebar";
import { TopicQuizHistoryItem } from "./TopicQuizHistoryItem";
import { TopicQuizDetailDialog } from "./TopicQuizDetailDialog";

const uiTokens = {
    panel: "gap-0 overflow-hidden rounded-2xl border border-cyan-200 bg-slate-50 py-0 shadow-[0_12px_32px_rgba(0,114,187,0.14)] dark:border-cyan-900/40 dark:bg-slate-900 dark:shadow-[0_12px_32px_rgba(0,0,0,0.4)]",
    header: "border-b border-cyan-200/70 bg-gradient-to-r from-[#005596] via-[#0072BB] to-[#00A9CE] dark:border-cyan-900/50 dark:from-slate-900 dark:via-cyan-950/60 dark:to-slate-900",
    activeControl: "bg-[#0072BB] text-white shadow-md shadow-cyan-200/70 dark:bg-blue-600 dark:shadow-none",
    inactiveControl: "bg-slate-100 text-slate-800 hover:bg-cyan-100 hover:text-[#005596] dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:text-cyan-300",
} as const;

const SKILL_LABELS: Record<string, string> = {
    D_doc: "Documentation",
    C_comm: "Communication",
    T_trouble: "Problem Solving",
    G_custom: "Specialization",
};

export function TopicQuizHistoryCard() {
    const { t } = useTranslation(["history", "profile"]);
    const [profile, setProfile] = useState<UserProfileResponse | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortOption, setSortOption] = useState<TopicQuizSortOption>("topic-asc");

    // Modal state for viewing questions
    const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
    const [selectedTopicName, setSelectedTopicName] = useState<string>("");
    const [selectedTopicOrder, setSelectedTopicOrder] = useState<number | null>(null);
    const [selectedEntry, setSelectedEntry] = useState<TopicQuizHistoryEntryResponse | null>(null);
    const [topicDetail, setTopicDetail] = useState<TopicQuizSubmitResponse | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState<string | null>(null);
    const [reviewFilter, setReviewFilter] = useState<"all" | "correct" | "incorrect">("all");

    const getSkillLabel = (skill: string) => {
        switch (skill) {
            case "D_doc":
                return t("finalQuiz.docSkill", { defaultValue: "Documentation (D)" });
            case "C_comm":
                return t("finalQuiz.commSkill", { defaultValue: "Communication (C)" });
            case "T_trouble":
                return t("finalQuiz.troubleSkill", { defaultValue: "Problem Solving (T)" });
            case "G_custom":
                return t("finalQuiz.businessSkill", { defaultValue: "Specialization (G)" });
            default:
                return SKILL_LABELS[skill] ?? formatLabel(skill);
        }
    };

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
            return true;
        });
    }, [searchTerm, topicHistory]);

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

    const isFilterActive = searchTerm !== "" || sortOption !== "topic-asc";

    return (
        <>
            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-4">
                {/* LEFT SIDEBAR: Filters */}
                <TopicQuizFilterSidebar
                    searchTerm={searchTerm}
                    onSearchTermChange={setSearchTerm}
                    sortOption={sortOption}
                    onSortOptionChange={setSortOption}
                    onReset={() => {
                        setSearchTerm("");
                        setSortOption("topic-asc");
                    }}
                    isFilterActive={isFilterActive}
                    uiTokens={uiTokens}
                />

                {/* RIGHT CONTENT AREA: Topic Quiz History Cards */}
                <div className="min-w-0 space-y-4 lg:col-span-3">
                    <Card className={`flex min-w-0 flex-col ${uiTokens.panel}`}>
                        <CardHeader className={`${uiTokens.header} px-5 py-4 sm:px-6`}>
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <CardTitle className="text-2xl font-black text-white sm:text-3xl">
                                        {t("topicQuiz.title", { defaultValue: "Best Topic Quiz Scores" })}
                                    </CardTitle>
                                    <p className="mt-1 text-base text-cyan-100">
                                        {t("topicQuiz.subtitle", { defaultValue: "Highest score saved for each topic assessment in your roadmap." })}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 self-start sm:self-auto">
                                    <span className="whitespace-nowrap rounded-xl border border-white/30 bg-white/20 px-3 py-1.5 text-sm font-black uppercase tracking-[0.14em] text-white shadow-sm">
                                        {t("topicQuiz.topicCount", { count: sortedHistory.length, defaultValue: `${sortedHistory.length} Topics` })}
                                    </span>
                                    <div className="rounded-xl bg-amber-400 p-2 text-white shadow-sm">
                                        <Medal className="h-5 w-5" />
                                    </div>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-5 sm:p-6">
                            {topicHistory.length === 0 ? (
                                <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-cyan-100 bg-cyan-50/60 px-4 py-6 text-center dark:border-cyan-900/40 dark:bg-cyan-950/20">
                                    <Sparkles className="h-10 w-10 text-cyan-500" />
                                    <div className="w-full flex flex-col items-center justify-center text-center">
                                        <p className="w-full text-center text-lg font-bold text-slate-900 dark:text-white" style={{ textAlign: "center" }}>
                                            {t("topicQuiz.empty.noHistoryTitle", { defaultValue: "No Topic Quiz History Yet" })}
                                        </p>
                                        <p className="mt-2 w-full text-center text-base leading-7 text-slate-500 dark:text-slate-400" style={{ textAlign: "center" }}>
                                            {t("topicQuiz.empty.noHistoryDesc", { defaultValue: "Complete all assigned lessons in a topic to unlock and take its Topic Quiz." })}
                                        </p>
                                    </div>
                                </div>
                            ) : sortedHistory.length === 0 ? (
                                <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-cyan-100 bg-cyan-50/60 px-4 py-8 text-center dark:border-cyan-900/40 dark:bg-cyan-950/20">
                                    <Search className="h-8 w-8 text-cyan-500" />
                                    <div className="w-full flex flex-col items-center justify-center text-center">
                                        <p className="w-full text-center text-lg font-bold text-slate-900 dark:text-white" style={{ textAlign: "center" }}>
                                            {t("topicQuiz.empty.noMatchTitle", { defaultValue: "No matching topics found" })}
                                        </p>
                                        <p className="mt-2 w-full text-center text-base leading-7 text-slate-500 dark:text-slate-400" style={{ textAlign: "center" }}>
                                            {t("topicQuiz.empty.noMatchDesc", { defaultValue: "Try adjusting your search query." })}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid gap-3 sm:grid-cols-1 xl:grid-cols-2">
                                    {sortedHistory.map((entry) => (
                                        <TopicQuizHistoryItem
                                            key={entry.topic_id}
                                            entry={entry}
                                            onClick={() => void openTopicDetail(entry)}
                                        />
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* DETAIL MODAL: Question Review for Selected Topic */}
            <TopicQuizDetailDialog
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
                selectedTopicOrder={selectedTopicOrder}
                selectedTopicName={selectedTopicName}
                selectedEntry={selectedEntry}
                topicDetail={topicDetail}
                detailLoading={detailLoading}
                detailError={detailError}
                reviewFilter={reviewFilter}
                onReviewFilterChange={setReviewFilter}
                getSkillLabel={getSkillLabel}
            />
        </>
    );
}
