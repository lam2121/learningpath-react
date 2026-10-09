import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Medal,
    Search,
    Sparkles,
} from "lucide-react";

import { fetchCurrentUserProfile } from "@/feature/auth/api/authAPI";
import type {
    LessonQuizHistoryEntryResponse,
    UserProfileResponse,
} from "@/feature/auth/type/Auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/shadcn/component/ui/card";
import {
    fetchLessonQuizResultDetail,
    type LessonQuizResultDetailResponse,
} from "@/feature/learning-path/api/roadmapApi";
import { formatPercent } from "@/common/utils/historyFormatters";
import { LessonQuizDetailDialog } from "./LessonQuizDetailDialog";
import {
    LESSONS_PER_PAGE,
    TOPICS_PER_PAGE,
    lessonHistoryUi,
    lessonSkillFilters,
    TopicHistoryHeader,
    type SortOption,
} from "./lessonHistoryTypes";
import { LessonQuizFilterSidebar } from "./LessonQuizFilterSidebar";
import { LessonQuizCardItem } from "./LessonQuizCardItem";
import { LessonQuizPagination } from "./LessonQuizPagination";

// Re-export for backward compatibility
export {
    LESSONS_PER_PAGE,
    TOPICS_PER_PAGE,
    lessonHistoryUi,
    lessonSkillFilters,
    TopicHistoryHeader,
};
export type { SortOption };

export type LessonQuizHistoryCardProps = {
    compact?: boolean;
    excludedStatuses?: string[];
};

export function LessonQuizHistoryCard({
    compact = false,
    excludedStatuses = [],
}: LessonQuizHistoryCardProps) {
    const { t } = useTranslation(["history", "profile"]);
    const [profile, setProfile] = useState<UserProfileResponse | null>(null);
    const [sortOption, setSortOption] = useState<SortOption>("topic-asc");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedSkillFilter, setSelectedSkillFilter] = useState<string>("all");
    const [currentPage, setCurrentPage] = useState(1);

    const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);
    const [selectedDetail, setSelectedDetail] = useState<LessonQuizResultDetailResponse | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const loadProfile = async () => {
            try {
                const response = await fetchCurrentUserProfile();
                if (isMounted) {
                    setProfile(response);
                }
            } catch {
                if (isMounted) {
                    setProfile(null);
                }
            }
        };

        void loadProfile();

        const handleProfileUpdated = (event: Event) => {
            const customEvent = event as CustomEvent<UserProfileResponse>;
            if (isMounted) {
                setProfile(customEvent.detail);
            }
        };

        window.addEventListener("careerpath:profile-updated", handleProfileUpdated);
        return () => {
            isMounted = false;
            window.removeEventListener("careerpath:profile-updated", handleProfileUpdated);
        };
    }, []);

    useEffect(() => {
        const handlePopState = () => {
            if (selectedLessonId !== null) {
                setSelectedLessonId(null);
                setSelectedDetail(null);
                setDetailError(null);
            }
        };

        if (selectedLessonId !== null) {
            window.history.pushState({ isLessonDetailModalOpen: true }, "");
            window.addEventListener("popstate", handlePopState);
        }

        return () => {
            window.removeEventListener("popstate", handlePopState);
        };
    }, [selectedLessonId]);

    const lessonQuizHistory = useMemo(
        () => profile?.lesson_quiz_history ?? [],
        [profile],
    );

    const visibleLessonQuizHistory = useMemo(() => {
        if (excludedStatuses.length === 0) {
            return lessonQuizHistory;
        }

        const excludedStatusSet = new Set(excludedStatuses);
        return lessonQuizHistory.filter(
            (entry) => !excludedStatusSet.has(entry.status),
        );
    }, [excludedStatuses, lessonQuizHistory]);

    const filteredLessonQuizHistory = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();

        return visibleLessonQuizHistory.filter((entry) => {
            if (normalizedSearch) {
                const haystack = [
                    entry.topic_name ?? "",
                    entry.lesson_title,
                    entry.skill,
                    entry.difficulty_tier,
                    entry.topic_sort_order ? `topic ${entry.topic_sort_order}` : "",
                ]
                    .join(" ")
                    .toLowerCase();

                if (!haystack.includes(normalizedSearch)) {
                    return false;
                }
            }

            if (selectedSkillFilter !== "all" && entry.skill !== selectedSkillFilter) {
                return false;
            }

            return true;
        });
    }, [searchTerm, selectedSkillFilter, visibleLessonQuizHistory]);

    const sortedLessonQuizHistory = useMemo(() => {
        return [...filteredLessonQuizHistory].sort((left, right) => {
            if (sortOption === "title-asc") {
                return left.lesson_title.localeCompare(right.lesson_title);
            }
            if (sortOption === "title-desc") {
                return right.lesson_title.localeCompare(left.lesson_title);
            }
            if (sortOption === "newest" || sortOption === "oldest") {
                const leftDate = left.recorded_at ?? left.completed_at ?? left.last_submitted_at ?? "";
                const rightDate = right.recorded_at ?? right.completed_at ?? right.last_submitted_at ?? "";
                const dateComp = leftDate.localeCompare(rightDate);
                if (dateComp !== 0) {
                    return sortOption === "newest" ? -dateComp : dateComp;
                }
                return left.lesson_title.localeCompare(right.lesson_title);
            }
            if (sortOption === "topic-desc") {
                const leftTopic = left.topic_sort_order ?? Number.MAX_SAFE_INTEGER;
                const rightTopic = right.topic_sort_order ?? Number.MAX_SAFE_INTEGER;
                if (leftTopic !== rightTopic) return rightTopic - leftTopic;
                return left.lesson_title.localeCompare(right.lesson_title);
            }
            // topic-asc (default)
            const leftTopic = left.topic_sort_order ?? Number.MAX_SAFE_INTEGER;
            const rightTopic = right.topic_sort_order ?? Number.MAX_SAFE_INTEGER;
            if (leftTopic !== rightTopic) return leftTopic - rightTopic;
            return left.lesson_title.localeCompare(right.lesson_title);
        });
    }, [filteredLessonQuizHistory, sortOption]);

    const paginatedHistoryPages = useMemo(() => {
        if (compact) {
            return [sortedLessonQuizHistory.slice(0, 3)];
        }

        const topicGroups: LessonQuizHistoryEntryResponse[][] = [];
        for (const entry of sortedLessonQuizHistory) {
            const lastGroup = topicGroups[topicGroups.length - 1];
            if (
                lastGroup
                && lastGroup[0]?.topic_sort_order === entry.topic_sort_order
            ) {
                lastGroup.push(entry);
            } else {
                topicGroups.push([entry]);
            }
        }

        const remainingGroups = topicGroups.map((group) => [...group]);
        const pages: LessonQuizHistoryEntryResponse[][] = [];
        let index = 0;

        while (index < remainingGroups.length) {
            const currentGroup = remainingGroups[index];
            const nextGroup = remainingGroups[index + 1];
            const currentIsFullTopic = currentGroup.length >= 6;
            const nextIsFullTopic = Boolean(nextGroup && nextGroup.length >= 6);

            if (currentIsFullTopic && nextIsFullTopic && nextGroup) {
                pages.push([...currentGroup, ...nextGroup]);
                index += TOPICS_PER_PAGE;
                continue;
            }

            const page: LessonQuizHistoryEntryResponse[] = [];

            while (index < remainingGroups.length && page.length < LESSONS_PER_PAGE) {
                const group = remainingGroups[index];
                const remainingSlots = LESSONS_PER_PAGE - page.length;

                if (group.length <= remainingSlots) {
                    page.push(...group);
                    index += 1;
                    continue;
                }

                page.push(...group.slice(0, remainingSlots));
                remainingGroups[index] = group.slice(remainingSlots);
            }

            pages.push(page);
        }
        return pages;
    }, [compact, sortedLessonQuizHistory]);

    const totalPages = Math.max(1, paginatedHistoryPages.length);
    const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

    const paginatedHistory = useMemo(
        () => paginatedHistoryPages[validCurrentPage - 1] ?? [],
        [paginatedHistoryPages, validCurrentPage],
    );

    const displayedLessonRange = useMemo(() => {
        if (sortedLessonQuizHistory.length === 0 || paginatedHistory.length === 0) {
            return { start: 0, end: 0 };
        }

        const previousLessons = paginatedHistoryPages
            .slice(0, Math.max(0, validCurrentPage - 1))
            .reduce((sum, page) => sum + page.length, 0);

        return {
            start: previousLessons + 1,
            end: previousLessons + paginatedHistory.length,
        };
    }, [paginatedHistory, paginatedHistoryPages, sortedLessonQuizHistory.length, validCurrentPage]);

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        setCurrentPage(1);
    };

    const handleSortChange = (newSort: SortOption) => {
        setSortOption(newSort);
        setCurrentPage(1);
    };

    const handleSkillFilterChange = (skill: string) => {
        setSelectedSkillFilter(skill);
        setCurrentPage(1);
    };

    const handleResetFilters = () => {
        setSearchTerm("");
        setSortOption("topic-asc");
        setSelectedSkillFilter("all");
        setCurrentPage(1);
    };

    const isFilterActive =
        searchTerm !== "" ||
        sortOption !== "topic-asc" ||
        selectedSkillFilter !== "all";

    const openLessonDetail = async (lessonId: number) => {
        setSelectedLessonId(lessonId);
        setSelectedDetail(null);
        setDetailError(null);
        setDetailLoading(true);

        try {
            const detail = await fetchLessonQuizResultDetail(lessonId);
            setSelectedDetail(detail);
        } catch (error) {
            setDetailError(
                error instanceof Error
                    ? error.message
                    : "Could not load the saved lesson quiz answers.",
            );
        } finally {
            setDetailLoading(false);
        }
    };

    if (compact) {
        return (
            <Card className="flex min-w-0 flex-col border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.07)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_16px_40px_rgba(0,0,0,0.35)]">
                <CardHeader className="pb-3">
                    <CardTitle className="text-xl text-slate-950 dark:text-white">
                        {t("quizHistory", { defaultValue: "Quiz History" })}
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                    {paginatedHistory.map((entry: LessonQuizHistoryEntryResponse) => (
                        <div
                            key={entry.lesson_id}
                            className="rounded-2xl border border-slate-300 bg-slate-100 p-4 dark:border-slate-800 dark:bg-slate-800/70"
                        >
                            <p className="text-base font-bold text-slate-950 dark:text-white">{entry.lesson_title}</p>
                            <p className="text-sm font-semibold text-[#0072BB] dark:text-cyan-400">
                                {formatPercent(entry.best_score_percent)}
                            </p>
                        </div>
                    ))}
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 items-start">
                {/* LEFT SIDEBAR: Filters */}
                <LessonQuizFilterSidebar
                    searchTerm={searchTerm}
                    onSearchChange={handleSearchChange}
                    sortOption={sortOption}
                    onSortChange={handleSortChange}
                    selectedSkillFilter={selectedSkillFilter}
                    onSkillFilterChange={handleSkillFilterChange}
                    isFilterActive={isFilterActive}
                    onResetFilters={handleResetFilters}
                />

                {/* RIGHT CONTENT AREA: Lesson Quiz List */}
                <div className="lg:col-span-3 min-w-0 space-y-4">
                    <Card className={`flex min-w-0 flex-col ${lessonHistoryUi.panel}`}>
                        <CardHeader className={`${lessonHistoryUi.header} px-5 py-4 sm:px-6`}>
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <CardTitle className="text-2xl font-black text-white sm:text-3xl">
                                        {t("list.title", { defaultValue: "Best Lesson Quiz Scores" })}
                                    </CardTitle>
                                    <p className="mt-1 text-base text-cyan-100">
                                        {t("list.subtitle", { defaultValue: "Highest weighted score saved for each lesson, including hint mode." })}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 self-start sm:self-auto">
                                    <span className="whitespace-nowrap rounded-xl border border-white/30 bg-white/20 px-3 py-1.5 text-sm font-black uppercase tracking-[0.14em] text-white shadow-sm">
                                        {t("list.totalQuizzes", { count: sortedLessonQuizHistory.length, defaultValue: `${sortedLessonQuizHistory.length} Quizzes` })}
                                    </span>
                                    <div className="rounded-xl bg-amber-400 p-2 text-white shadow-sm">
                                        <Medal className="h-5 w-5" />
                                    </div>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-5 sm:p-6">
                            {visibleLessonQuizHistory.length === 0 ? (
                                <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-cyan-100 bg-cyan-50/60 px-4 py-6 text-center dark:border-cyan-900/40 dark:bg-cyan-950/20">
                                    <Sparkles className="h-10 w-10 text-cyan-500" />
                                    <div className="w-full flex flex-col items-center justify-center text-center">
                                        <p className="w-full text-center text-lg font-bold text-slate-900 dark:text-white" style={{ textAlign: "center" }}>
                                            {t("empty.noScoresTitle", { defaultValue: "No quiz score history yet" })}
                                        </p>
                                        <p className="mt-2 w-full text-center text-base leading-7 text-slate-500 dark:text-slate-400" style={{ textAlign: "center" }}>
                                            {t("empty.noScoresDesc", { defaultValue: "Pass or retry lesson quizzes to start building your best-score history." })}
                                        </p>
                                    </div>
                                </div>
                            ) : sortedLessonQuizHistory.length === 0 ? (
                                <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-cyan-100 bg-cyan-50/60 px-4 py-8 text-center dark:border-cyan-900/40 dark:bg-cyan-950/20">
                                    <Search className="h-8 w-8 text-cyan-500" />
                                    <div className="w-full flex flex-col items-center justify-center text-center">
                                        <p className="w-full text-center text-lg font-bold text-slate-900 dark:text-white" style={{ textAlign: "center" }}>
                                            {t("empty.noMatchTitle", { defaultValue: "No matching lessons found" })}
                                        </p>
                                        <p className="mt-2 w-full text-center text-base leading-7 text-slate-500 dark:text-slate-400" style={{ textAlign: "center" }}>
                                            {t("empty.noMatchDesc", { defaultValue: "No lessons match your current search & filter criteria." })}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="grid gap-3 sm:grid-cols-1 xl:grid-cols-2">
                                        {paginatedHistory.map((entry: LessonQuizHistoryEntryResponse, index) => {
                                            const topicHeader = entry.topic_name ?? "Lesson quiz history";
                                            const topicLabel = entry.topic_sort_order
                                                ? t("list.topic", { count: entry.topic_sort_order, defaultValue: `Topic ${entry.topic_sort_order}` })
                                                : t("list.topicFallback", { defaultValue: "Topic" });
                                            const showTopicSectionHeader =
                                                index === 0
                                                || paginatedHistory[index - 1]?.topic_sort_order !== entry.topic_sort_order;

                                            return (
                                                <div key={entry.lesson_id} className="contents">
                                                    {showTopicSectionHeader ? (
                                                        <TopicHistoryHeader
                                                            topicLabel={topicLabel}
                                                            topicName={topicHeader}
                                                            className="mt-3 xl:col-span-2 first:mt-0"
                                                        />
                                                    ) : null}

                                                    <LessonQuizCardItem
                                                        entry={entry}
                                                        onClick={() => void openLessonDetail(entry.lesson_id)}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Pagination Controls */}
                                    <LessonQuizPagination
                                        totalPages={totalPages}
                                        validCurrentPage={validCurrentPage}
                                        onPageChange={setCurrentPage}
                                        displayedLessonRange={displayedLessonRange}
                                        totalLessonsCount={sortedLessonQuizHistory.length}
                                    />
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <LessonQuizDetailDialog
                isOpen={selectedLessonId !== null}
                onClose={() => {
                    if (window.history.state?.isLessonDetailModalOpen) {
                        window.history.back();
                    }
                    setSelectedLessonId(null);
                    setSelectedDetail(null);
                    setDetailError(null);
                }}
                detail={selectedDetail}
                isLoading={detailLoading}
                error={detailError}
            />
        </>
    );
}
