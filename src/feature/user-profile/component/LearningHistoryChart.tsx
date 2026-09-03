import { useEffect, useMemo, useRef, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";
import { useTranslation } from "react-i18next";
import {
    ArrowDownAZ,
    ArrowUpDown,
    ArrowUpZA,
    CalendarClock,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock3,
    Loader2,
    Medal,
    RotateCcw,
    Search,
    SlidersHorizontal,
    Sparkles,
    X,
} from "lucide-react";

import { fetchCurrentUserProfile } from "@/feature/auth/api/authAPI";
import type {
    LessonQuizHistoryEntryResponse,
    StudyHistoryEntryResponse,
    UserProfileResponse,
} from "@/feature/auth/type/Auth";
import { useAuth } from "@/common/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/shadcn/component/ui/card";
import { Button } from "@/shadcn/component/ui/button";
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
import {
    getTrackedStudyMinutesByDay
} from "@/feature/user-profile/utils/StudyActivity";
import {
    fetchLessonQuizResultDetail,
    type LessonQuizQuestionResult,
    type LessonQuizResultDetailResponse,
} from "@/feature/learning-path/api/roadmapApi";
import { FillBlankQuestion } from "@/feature/quiz-engine/component/FillBlankQuestion";
import { MultiSelectQuestion } from "@/feature/quiz-engine/component/MultiSelectQuestion";
import { OrderingQuestion } from "@/feature/quiz-engine/component/OrderingQuestion";
import type {
    FillBlankQuestionData,
    MultiSelectQuestionData,
    OrderingQuestionData,
} from "@/feature/quiz-engine/type/Quiz";

import { LearningCalendar } from "./LearningCalendar";
import { SkillsOverview } from "../component/SkillsOverview";

const LESSONS_PER_PAGE = 12;
const TOPICS_PER_PAGE = 2;

/**
 * Shared visual primitives for the La Vie-inspired quiz-history surface.
 * Keeping complete Tailwind strings here makes the palette consistent while
 * allowing Tailwind to discover every class at build time.
 */
const lessonHistoryUi = {
    panel: "gap-0 overflow-hidden rounded-2xl border border-cyan-200 bg-slate-50 py-0 shadow-[0_12px_32px_rgba(0,114,187,0.14)]",
    header: "border-b border-cyan-200/70 bg-gradient-to-r from-[#005596] via-[#0072BB] to-[#00A9CE]",
    activeControl: "bg-[#0072BB] text-white shadow-md shadow-cyan-200/70",
    inactiveControl: "bg-slate-100 text-slate-800 hover:bg-cyan-100 hover:text-[#005596]",
} as const;

const lessonSkillFilters = [
    {
        value: "all",
        label: "All",
        activeClass: "bg-[#0072BB] text-white shadow-sm",
        inactiveClass: "bg-cyan-50 text-[#005596] hover:bg-cyan-100",
    },
    {
        value: "D_doc",
        label: "Doc (D)",
        activeClass: "bg-[#0072BB] text-white shadow-sm",
        inactiveClass: "bg-cyan-50 text-[#005596] hover:bg-cyan-100",
    },
    {
        value: "C_comm",
        label: "Comm (C)",
        activeClass: "bg-teal-600 text-white shadow-sm",
        inactiveClass: "bg-teal-50 text-teal-700 hover:bg-teal-100",
    },
    {
        value: "T_trouble",
        label: "Trouble (T)",
        activeClass: "bg-rose-600 text-white shadow-sm",
        inactiveClass: "bg-rose-50 text-rose-700 hover:bg-rose-100",
    },
    {
        value: "G_custom",
        label: "Business (G)",
        activeClass: "bg-amber-600 text-white shadow-sm",
        inactiveClass: "bg-amber-50 text-amber-700 hover:bg-amber-100",
    },
] as const;

const studyChartColors = {
    cursor: "#7DDCEB",
    line: "#0072BB",
    area: "rgba(0, 169, 206, 0.18)",
    dotBorder: "#FFFFFF",
} as const;

type StudyTimeChartPoint = {
    day: string;
    dateKey: string;
    minutes: number;
};

function buildStudyTimeData(
    studyHistory: StudyHistoryEntryResponse[],
    trackedStudyMinutesByDay: Record<string, number>,
): StudyTimeChartPoint[] {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const minutesByDay = new Map<number, number>();

    studyHistory.forEach((entry) => {
        const parsed = new Date(entry.studied_on);
        if (
            Number.isNaN(parsed.getTime())
            || parsed.getFullYear() !== year
            || parsed.getMonth() !== month
        ) {
            return;
        }

        const day = parsed.getDate();
        minutesByDay.set(day, (minutesByDay.get(day) ?? 0) + Math.max(0, entry.minutes));
    });

    Object.entries(trackedStudyMinutesByDay).forEach(([dateKey, minutes]) => {
        const parsed = new Date(dateKey);
        if (
            Number.isNaN(parsed.getTime())
            || parsed.getFullYear() !== year
            || parsed.getMonth() !== month
        ) {
            return;
        }

        const day = parsed.getDate();
        minutesByDay.set(day, (minutesByDay.get(day) ?? 0) + Math.max(0, minutes));
    });

    return Array.from({ length: daysInMonth }, (_, index) => {
        const dayNum = index + 1;
        const minutes = minutesByDay.get(dayNum) ?? 0;
        return {
            day: String(dayNum),
            dateKey: `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`,
            minutes,
        };
    });
}

function formatStudyDuration(minutes: number) {
    if (minutes <= 0) {
        return "0 min";
    }

    if (minutes < 60) {
        return minutes === 1 ? "1 min" : `${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
        return hours === 1 ? "1h" : `${hours}h`;
    }

    return `${hours}h ${remainingMinutes}m`;
}

function formatPercent(value: number | null) {
    if (value == null) {
        return "—";
    }
    return Number.isInteger(value) ? `${value}%` : `${value.toFixed(1)}%`;
}

function formatLabel(value: string) {
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

function formatHistoryDate(value: string | null) {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return null;
    }
    return parsed.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function formatQuestionTypeLabel(value: string) {
    return value
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function buildReadonlyQuestionData(
    result: LessonQuizQuestionResult,
): FillBlankQuestionData | MultiSelectQuestionData | OrderingQuestionData {
    const base = [
        result.question_text,
        result.options.join("|"),
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
    ] as const;

    return [...base] as FillBlankQuestionData | MultiSelectQuestionData | OrderingQuestionData;
}

function ReadonlyLessonQuizQuestion({
    result,
    questionNumber,
    totalQuestions,
}: {
    result: LessonQuizQuestionResult;
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
                explanation={result.explanation}
                revealAnswer
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
            explanation={result.explanation}
            revealAnswer
        />
    );
}

function TopicHistoryHeader({
    topicLabel,
    topicName,
    lessonCountLabel,
    className = "",
}: {
    topicLabel: string;
    topicName: string;
    lessonCountLabel?: string;
    className?: string;
}) {
    return (
        <div
            className={`flex flex-wrap items-center gap-3 rounded-2xl border border-cyan-200 bg-gradient-to-r from-cyan-100 via-sky-50 to-cyan-200 px-4 py-3 shadow-[0_10px_22px_rgba(0,169,206,0.18)] ${className}`.trim()}
        >
            <span className="rounded-full border border-cyan-300 bg-cyan-200 px-3.5 py-1.5 text-sm font-black uppercase tracking-[0.18em] text-[#004a82] shadow-sm">
                {topicLabel}
            </span>
            <span className="text-lg font-black tracking-tight text-slate-900 sm:text-xl">
                {topicName}
            </span>
            {lessonCountLabel ? (
                <span className="text-sm font-medium text-slate-500">
                    {lessonCountLabel}
                </span>
            ) : null}
        </div>
    );
}

function StudyTimeTooltip({
    active,
    payload,
}: {
    active?: boolean;
    payload?: Array<{ payload: StudyTimeChartPoint }>;
}) {
    if (!active || !payload?.length) {
        return null;
    }

    const point = payload[0]?.payload;
    if (!point) {
        return null;
    }

    const parsedDate = new Date(point.dateKey);
    const label = Number.isNaN(parsedDate.getTime())
        ? point.day
        : parsedDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        });

    return (
        <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-[0_12px_30px_rgba(15,23,42,0.12)]">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                {label}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
                {formatStudyDuration(point.minutes)}
            </p>
        </div>
    );
}

type LoginHistoryCardProps = {
    compact?: boolean;
    stretch?: boolean;
};

export function LoginHistoryCard({
    compact = false,
    stretch = false,
}: LoginHistoryCardProps) {
    const { t } = useTranslation("profile");
    const auth = useAuth();
    const userId = Number(auth.user?.id);
    const [profile, setProfile] = useState<UserProfileResponse | null>(null);
    const [trackedStudyMinutesByDay, setTrackedStudyMinutesByDay] = useState<Record<string, number>>(
        () => (Number.isFinite(userId) ? getTrackedStudyMinutesByDay(userId) : {}),
    );

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
        if (Number.isFinite(userId)) {
            setTrackedStudyMinutesByDay(getTrackedStudyMinutesByDay(userId));
        }

        const handleProfileUpdated = (event: Event) => {
            const customEvent = event as CustomEvent<UserProfileResponse>;
            if (isMounted) {
                setProfile(customEvent.detail);
            }
        };
        const handleStudyActivityUpdated = (event: Event) => {
            const customEvent = event as CustomEvent<{
                userId?: number;
                studyMinutesByDay?: Record<string, number>;
            }>;

            if (!isMounted || customEvent.detail.userId !== userId) {
                return;
            }

            setTrackedStudyMinutesByDay(
                customEvent.detail.studyMinutesByDay ?? getTrackedStudyMinutesByDay(userId),
            );
        };
        window.addEventListener("careerpath:profile-updated", handleProfileUpdated);
        window.addEventListener("careerpath:study-activity-updated", handleStudyActivityUpdated);

        return () => {
            isMounted = false;
            window.removeEventListener(
                "careerpath:profile-updated",
                handleProfileUpdated,
            );
            window.removeEventListener(
                "careerpath:study-activity-updated",
                handleStudyActivityUpdated,
            );
        };
    }, [userId]);

    const studyTimeData = useMemo(() => {
        return buildStudyTimeData(
            profile?.study_history ?? [],
            trackedStudyMinutesByDay,
        );
    }, [profile, trackedStudyMinutesByDay]);

    const today = new Date().getDate();
    const chartData = studyTimeData.slice(0, today);
    const totalMinutes = chartData.reduce((sum, item) => sum + item.minutes, 0);
    const todayMinutes = chartData[chartData.length - 1]?.minutes ?? 0;
    const hasActivity = totalMinutes > 0;
    const activeStudyMinutes = chartData
        .filter((item) => item.minutes > 0)
        .map((item) => item.minutes);
    const shortestStudyMinutes = activeStudyMinutes.length > 0
        ? Math.min(...activeStudyMinutes)
        : 0;
    const longestStudyMinutes = activeStudyMinutes.length > 0
        ? Math.max(...activeStudyMinutes)
        : 0;
    const shouldStretch = compact || stretch;
    const chartHeightClass = shouldStretch
        ? "min-h-28 flex-1 sm:min-h-32"
        : "h-28 sm:h-32 xl:h-36";
    const cardHeaderClassName = compact
        ? "px-4 pb-2 pt-4 sm:px-5 sm:pt-5"
        : "px-4 pb-2 pt-4 sm:px-6 sm:pt-5";
    const cardContentClassName = shouldStretch
        ? "flex min-h-0 flex-1 flex-col px-4 pb-4 pt-0 sm:px-5 sm:pb-5"
        : "min-w-0 px-4 pb-4 pt-0 sm:px-6 sm:pb-6";
    const emptyStateClassName = shouldStretch
        ? "flex min-h-36 flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center sm:min-h-40"
        : "flex min-h-40 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center sm:min-h-44 sm:px-6";

    return (
        <Card className={`flex min-w-0 flex-col overflow-hidden border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.07)] ${shouldStretch ? "h-full" : "h-fit self-start"}`}>
            <CardHeader className={cardHeaderClassName}>
                <CardTitle className="text-base text-slate-950 sm:text-lg">
                    {t("studyActivity", { defaultValue: "Study Time History" })}
                </CardTitle>
                <p className="text-xs leading-5 text-slate-500 sm:text-sm">
                    A monthly view of the time you have already logged from completed lessons.
                </p>
            </CardHeader>

            <CardContent className={cardContentClassName}>
                {!hasActivity ? (
                    <div className={emptyStateClassName}>
                        <CalendarClock className="h-10 w-10 text-slate-300" />
                        <div>
                            <p className="font-semibold text-slate-900">
                                No study time yet
                            </p>
                            <p className="mt-2 text-sm leading-6 text-slate-500">
                                Complete your first lesson to start building your study-time history.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className={shouldStretch
                        ? "flex min-h-0 flex-1 flex-col gap-3 sm:gap-4"
                        : "space-y-4 sm:space-y-5"
                    }>
                        <div className="flex items-start justify-between gap-3 sm:items-end sm:gap-4">
                            <div className="min-w-0">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                    Studied today
                                </p>
                                <p className={`mt-1.5 font-bold tracking-tight text-slate-950 sm:mt-2 ${compact ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl"}`}>
                                    {formatStudyDuration(todayMinutes)}
                                </p>
                                <p className="mt-1.5 text-xs text-slate-500 sm:mt-2 sm:text-sm">
                                    {todayMinutes > 0
                                        ? "Logged so far today"
                                        : "No study time logged today yet"}
                                </p>
                            </div>

                            <div className={`flex shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-[#005596] sm:rounded-2xl ${compact ? "h-9 w-9 sm:h-10 sm:w-10" : "h-10 w-10 sm:h-12 sm:w-12"}`}>
                                <Clock3 className="h-4 w-4 sm:h-5 sm:w-5" />
                            </div>
                        </div>

                        <div className="flex min-w-0 flex-wrap gap-1.5 text-[11px] font-semibold sm:gap-2 sm:text-xs">
                            <span className="max-w-full truncate rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">
                                Shortest time: {formatStudyDuration(shortestStudyMinutes)}
                            </span>
                            <span className="max-w-full truncate rounded-full bg-cyan-50 px-2.5 py-1 text-[#005596]">
                                Longest time: {formatStudyDuration(longestStudyMinutes)}
                            </span>
                        </div>

                        <div className={`${chartHeightClass} min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 sm:rounded-2xl sm:px-4 sm:py-3`}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <Tooltip
                                        content={<StudyTimeTooltip />}
                                        cursor={{ stroke: studyChartColors.cursor, strokeWidth: 1.5 }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="minutes"
                                        stroke={studyChartColors.line}
                                        strokeWidth={2.5}
                                        fill={studyChartColors.area}
                                        activeDot={{
                                            r: 5,
                                            fill: studyChartColors.line,
                                            stroke: studyChartColors.dotBorder,
                                            strokeWidth: 2,
                                        }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

type LessonQuizHistoryCardProps = {
    compact?: boolean;
    excludedStatuses?: string[];
};

type SortOption = "topic-asc" | "topic-desc" | "title-asc" | "title-desc" | "newest" | "oldest";

export function LessonQuizHistoryCard({
    compact = false,
    excludedStatuses = [],
}: LessonQuizHistoryCardProps) {
    const { t } = useTranslation("profile");
    const [profile, setProfile] = useState<UserProfileResponse | null>(null);
    const [sortOption, setSortOption] = useState<SortOption>("topic-asc");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedSkillFilter, setSelectedSkillFilter] = useState<string>("all");
    const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("all");
    const [selectedTopicFilter, setSelectedTopicFilter] = useState<number | null>(null);
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

    const topicList = useMemo(() => {
        const seen = new Map<number, string>();
        for (const entry of visibleLessonQuizHistory) {
            const order = entry.topic_sort_order;
            if (order != null && !seen.has(order)) {
                seen.set(order, entry.topic_name ?? `Topic ${order}`);
            }
        }
        return Array.from(seen.entries())
            .sort((a, b) => a[0] - b[0])
            .map(([order, name]) => ({ order, name }));
    }, [visibleLessonQuizHistory]);

    const topicFilterBaseHistory = useMemo(() => {
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

            if (selectedStatusFilter !== "all" && entry.status !== selectedStatusFilter) {
                return false;
            }

            return true;
        });
    }, [searchTerm, selectedSkillFilter, selectedStatusFilter, visibleLessonQuizHistory]);

    const filteredLessonQuizHistory = useMemo(() => {
        if (selectedTopicFilter === null) {
            return topicFilterBaseHistory;
        }

        return topicFilterBaseHistory.filter(
            (entry) => entry.topic_sort_order === selectedTopicFilter,
        );
    }, [selectedTopicFilter, topicFilterBaseHistory]);

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

        if (selectedTopicFilter !== null) {
            const pages: LessonQuizHistoryEntryResponse[][] = [];
            for (let index = 0; index < sortedLessonQuizHistory.length; index += LESSONS_PER_PAGE) {
                pages.push(sortedLessonQuizHistory.slice(index, index + LESSONS_PER_PAGE));
            }
            return pages;
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
    }, [compact, selectedTopicFilter, sortedLessonQuizHistory]);

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

    const handleTopicFilterChange = (order: number | null) => {
        setSelectedTopicFilter(order);
        setCurrentPage(1);
    };

    const handleResetFilters = () => {
        setSearchTerm("");
        setSortOption("topic-asc");
        setSelectedSkillFilter("all");
        setSelectedStatusFilter("all");
        setSelectedTopicFilter(null);
        setCurrentPage(1);
    };

    const isFilterActive =
        searchTerm !== "" ||
        sortOption !== "topic-asc" ||
        selectedSkillFilter !== "all" ||
        selectedStatusFilter !== "all" ||
        selectedTopicFilter !== null;

    const selectedTopicMeta = useMemo(
        () => topicList.find((topic) => topic.order === selectedTopicFilter) ?? null,
        [selectedTopicFilter, topicList],
    );

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

    const selectedRecordedLabel = formatHistoryDate(selectedDetail?.recorded_at ?? null);

    if (compact) {
        return (
            <Card className="flex min-w-0 flex-col border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.07)]">
                <CardHeader className="pb-3">
                    <CardTitle className="text-xl text-slate-950">{t("quizHistory", { defaultValue: "Best Lesson Quiz Scores" })}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                    {paginatedHistory.map((entry: LessonQuizHistoryEntryResponse) => (
                        <div
                            key={entry.lesson_id}
                            className="rounded-2xl border border-slate-300 bg-slate-100 p-4"
                        >
                            <p className="text-base font-bold text-slate-950">{entry.lesson_title}</p>
                            <p className="text-sm font-semibold text-[#0072BB]">{formatPercent(entry.best_score_percent)}</p>
                        </div>
                    ))}
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 items-start">
                {/* LEFT SIDEBAR: 1 Part (~25%) */}
                <div className="lg:col-span-1 space-y-4">
                    <Card className={lessonHistoryUi.panel}>
                        <CardHeader className={`${lessonHistoryUi.header} px-4 py-3 sm:px-5`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="rounded-lg bg-white/25 p-1 text-white">
                                        <SlidersHorizontal className="h-3.5 w-3.5" />
                                    </div>
                                    <CardTitle className="text-lg font-bold text-white">
                                        Search & Filter
                                    </CardTitle>
                                </div>
                                {isFilterActive ? (
                                    <button
                                        type="button"
                                        onClick={handleResetFilters}
                                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-bold text-cyan-50 transition-colors hover:bg-white/15"
                                    >
                                        <RotateCcw className="h-3 w-3" />
                                        Reset
                                    </button>
                                ) : null}
                            </div>
                        </CardHeader>

                        <CardContent className="p-4 sm:p-5 space-y-5">
                            {/* Keyword Search */}
                            <div>
                                <label className="mb-2 block text-sm font-bold uppercase tracking-[0.14em] text-[#005596]/60">
                                    Search
                                </label>
                                <div className="relative">
                                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-500" />
                                    <Input
                                        type="search"
                                        value={searchTerm}
                                        onChange={(event) => handleSearchChange(event.target.value)}
                                        placeholder="Search topic, lesson..."
                                        className="h-11 rounded-xl border-cyan-100 bg-cyan-50/60 pl-9 pr-8 text-base focus-visible:bg-white focus-visible:border-cyan-300 focus-visible:ring-cyan-100"
                                    />
                                    {searchTerm ? (
                                        <button
                                            type="button"
                                            onClick={() => handleSearchChange("")}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-cyan-500 hover:bg-cyan-100 hover:text-[#0072BB]"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    ) : null}
                                </div>
                            </div>

                            {/* Sort Options */}
                            <div>
                                <label className="mb-2 block text-sm font-bold uppercase tracking-[0.14em] text-[#005596]/60">
                                    Sort By
                                </label>
                                <div className="grid grid-cols-1 gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => handleSortChange("title-asc")}
                                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${sortOption === "title-asc"
                                            ? `${lessonHistoryUi.activeControl} font-bold`
                                            : lessonHistoryUi.inactiveControl
                                            }`}
                                    >
                                        <span className="flex items-center gap-2">
                                            <ArrowDownAZ className="h-4 w-4" />
                                            A → Z (Alphabetical)
                                        </span>
                                        {sortOption === "title-asc" ? (
                                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                                        ) : null}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleSortChange("title-desc")}
                                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${sortOption === "title-desc"
                                            ? `${lessonHistoryUi.activeControl} font-bold`
                                            : lessonHistoryUi.inactiveControl
                                            }`}
                                    >
                                        <span className="flex items-center gap-2">
                                            <ArrowUpZA className="h-4 w-4" />
                                            Z → A (Alphabetical)
                                        </span>
                                        {sortOption === "title-desc" ? (
                                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                                        ) : null}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleSortChange("newest")}
                                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${sortOption === "newest"
                                            ? `${lessonHistoryUi.activeControl} font-bold`
                                            : lessonHistoryUi.inactiveControl
                                            }`}
                                    >
                                        <span className="flex items-center gap-2">
                                            <Clock3 className="h-4 w-4" />
                                            Newest First
                                        </span>
                                        {sortOption === "newest" ? (
                                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                                        ) : null}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleSortChange("oldest")}
                                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${sortOption === "oldest"
                                            ? `${lessonHistoryUi.activeControl} font-bold`
                                            : lessonHistoryUi.inactiveControl
                                            }`}
                                    >
                                        <span className="flex items-center gap-2">
                                            <CalendarClock className="h-4 w-4" />
                                            Oldest First
                                        </span>
                                        {sortOption === "oldest" ? (
                                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                                        ) : null}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleSortChange("topic-asc")}
                                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${sortOption === "topic-asc"
                                            ? `${lessonHistoryUi.activeControl} font-bold`
                                            : lessonHistoryUi.inactiveControl
                                            }`}
                                    >
                                        <span className="flex items-center gap-2">
                                            <ArrowUpDown className="h-4 w-4" />
                                            Topic 1 → 8
                                        </span>
                                        {sortOption === "topic-asc" ? (
                                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                                        ) : null}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleSortChange("topic-desc")}
                                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${sortOption === "topic-desc"
                                            ? `${lessonHistoryUi.activeControl} font-bold`
                                            : lessonHistoryUi.inactiveControl
                                            }`}
                                    >
                                        <span className="flex items-center gap-2">
                                            <ArrowUpDown className="h-4 w-4" />
                                            Topic 8 → 1
                                        </span>
                                        {sortOption === "topic-desc" ? (
                                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                                        ) : null}
                                    </button>
                                </div>
                            </div>

                            {/* Filter by Skill */}
                            <div>
                                <label className="mb-2 block text-sm font-bold uppercase tracking-[0.14em] text-[#005596]/60">
                                    Filter by Skill
                                </label>
                                <div className="flex flex-wrap gap-1.5">
                                    {lessonSkillFilters.map((skill) => (
                                        <button
                                            key={skill.value}
                                            type="button"
                                            onClick={() => handleSkillFilterChange(skill.value)}
                                            className={`px-2.5 py-1.5 rounded-xl text-sm font-bold transition-all ${selectedSkillFilter === skill.value
                                                ? skill.activeClass
                                                : skill.inactiveClass
                                                }`}
                                        >
                                            {skill.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* RIGHT CONTENT AREA: 3 Parts (~75%) */}
                <div className="lg:col-span-3 min-w-0 space-y-4">
                    <Card className={`flex min-w-0 flex-col ${lessonHistoryUi.panel}`}>
                        <CardHeader className={`${lessonHistoryUi.header} px-5 py-4 sm:px-6`}>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div>
                                    <CardTitle className="text-2xl sm:text-3xl font-black text-white">
                                        Best Lesson Quiz Scores
                                    </CardTitle>
                                    <p className="mt-1 text-base text-cyan-100">
                                        Highest weighted score saved for each lesson, including hint mode.
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 self-start sm:self-auto">
                                    <span className="rounded-xl border border-white/30 bg-white/20 px-3 py-1.5 text-sm font-black uppercase tracking-[0.14em] text-white shadow-sm whitespace-nowrap">
                                        {sortedLessonQuizHistory.length} lesson{sortedLessonQuizHistory.length === 1 ? "" : "s"}
                                    </span>
                                    <div className="rounded-xl bg-amber-400 p-2 text-white shadow-sm">
                                        <Medal className="h-5 w-5" />
                                    </div>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-5 sm:p-6">
                            {visibleLessonQuizHistory.length === 0 ? (
                                <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-cyan-100 bg-cyan-50/60 px-4 py-6 text-center">
                                    <Sparkles className="h-10 w-10 text-cyan-500" />
                                    <div>
                                        <p className="text-lg font-bold text-slate-900">
                                            No quiz score history yet
                                        </p>
                                        <p className="mt-2 text-base leading-7 text-slate-500">
                                            Pass or retry lesson quizzes to start building your best-score history.
                                        </p>
                                    </div>
                                </div>
                            ) : sortedLessonQuizHistory.length === 0 ? (
                                <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-cyan-100 bg-cyan-50/60 px-4 py-8 text-center">
                                    <Search className="h-8 w-8 text-cyan-500" />
                                    <div>
                                        <p className="text-lg font-bold text-slate-900">
                                            No matching lessons found
                                        </p>
                                        <p className="mt-2 text-base leading-7 text-slate-500">
                                            No lessons match your current search &amp; filter criteria.
                                        </p>
                                        {isFilterActive ? (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={handleResetFilters}
                                                className="mt-4 rounded-xl border-cyan-200 text-sm font-bold text-[#005596] hover:bg-cyan-50"
                                            >
                                                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                                                Reset Filters
                                            </Button>
                                        ) : null}
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Topic Selector Bar */}
                                    {topicList.length > 0 ? (
                                        <div className="mb-4">
                                            <div className="flex flex-wrap gap-2.5">
                                                <button
                                                    type="button"
                                                    onClick={() => handleTopicFilterChange(null)}
                                                    className={`flex min-h-[74px] min-w-[110px] flex-col items-center justify-center rounded-2xl border px-3 py-3 text-center transition-all ${selectedTopicFilter === null
                                                        ? "border-cyan-500 bg-cyan-500 text-white shadow-sm"
                                                        : "border-cyan-100 bg-white text-[#005596] hover:bg-cyan-50"
                                                        }`}
                                                >
                                                    <span className="text-sm font-black uppercase tracking-[0.14em] leading-none">
                                                        All Topics
                                                    </span>
                                                    <span className={`mt-2 text-sm font-semibold leading-none ${selectedTopicFilter === null ? "text-cyan-50" : "text-cyan-500"}`}>
                                                        {topicFilterBaseHistory.length} lessons
                                                    </span>
                                                </button>
                                                {topicList.map((topic) => {
                                                    const totalCount = visibleLessonQuizHistory.filter(
                                                        (e) => e.topic_sort_order === topic.order,
                                                    ).length;
                                                    const isActive = selectedTopicFilter === topic.order;
                                                    return (
                                                        <button
                                                            key={topic.order}
                                                            type="button"
                                                            onClick={() => handleTopicFilterChange(topic.order)}
                                                            className={`flex min-h-[74px] min-w-[110px] flex-col items-center justify-center rounded-2xl border px-3 py-3 text-center transition-all ${isActive
                                                                ? "border-cyan-500 bg-cyan-500 text-white shadow-sm"
                                                                : "border-cyan-100 bg-white text-[#005596] hover:bg-cyan-50"
                                                                }`}
                                                        >
                                                            <span className="text-sm font-black uppercase tracking-[0.14em] leading-none">
                                                                Topic {topic.order}
                                                            </span>
                                                            <span className={`mt-2 text-sm font-semibold leading-none ${isActive ? "text-cyan-50" : "text-cyan-500"}`}>
                                                                {totalCount} lessons
                                                            </span>

                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            {selectedTopicMeta ? (
                                                <TopicHistoryHeader
                                                    topicLabel={`Topic ${selectedTopicFilter}`}
                                                    topicName={selectedTopicMeta.name}
                                                    lessonCountLabel={`${sortedLessonQuizHistory.length} lesson${sortedLessonQuizHistory.length === 1 ? "" : "s"}`}
                                                    className="mt-3"
                                                />
                                            ) : null}
                                        </div>
                                    ) : null}

                                    <div className="grid gap-3 sm:grid-cols-1 xl:grid-cols-2">
                                        {paginatedHistory.map((entry: LessonQuizHistoryEntryResponse, index) => {
                                            const recordedLabel = formatHistoryDate(entry.recorded_at);
                                            const completedLabel = formatHistoryDate(entry.completed_at);
                                            const submittedLabel = formatHistoryDate(entry.last_submitted_at);
                                            const statusLabel = formatStatusLabel(entry.status);
                                            const topicHeader = entry.topic_name ?? "Lesson quiz history";
                                            const topicLabel = entry.topic_sort_order
                                                ? `Topic ${entry.topic_sort_order}`
                                                : "Topic";
                                            const showTopicSectionHeader =
                                                selectedTopicFilter === null
                                                && (index === 0
                                                    || paginatedHistory[index - 1]?.topic_sort_order !== entry.topic_sort_order);
                                            const statusClasses =
                                                entry.status === "passed"
                                                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold"
                                                    : entry.status === "failed"
                                                        ? "bg-rose-100 text-rose-800 border border-rose-200 font-bold"
                                                        : "bg-amber-100 text-amber-800 border border-amber-200 font-bold";

                                            return (
                                                <div key={entry.lesson_id} className="contents">
                                                    {showTopicSectionHeader ? (
                                                        <TopicHistoryHeader
                                                            topicLabel={topicLabel}
                                                            topicName={topicHeader}
                                                            className="mt-3 xl:col-span-2 first:mt-0"
                                                        />
                                                    ) : null}

                                                    <button
                                                        type="button"
                                                        onClick={() => void openLessonDetail(entry.lesson_id)}
                                                        aria-label={`View quiz details for ${entry.lesson_title}`}
                                                        className="group flex w-full cursor-pointer flex-col rounded-xl border border-cyan-200 bg-[#eef7ff] p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-400 hover:bg-white hover:shadow-[0_8px_20px_rgba(0,169,206,0.22)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2"
                                                    >
                                                        {/* Top row: badges + best score */}
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                                                                <span className="rounded-full bg-cyan-200 px-2.5 py-1 text-xs font-bold text-[#004a82]">
                                                                    {topicLabel}
                                                                </span>
                                                                <span className="rounded-full border border-cyan-200 bg-cyan-100 px-2.5 py-1 text-xs font-bold text-[#004a82]">
                                                                    {formatLabel(entry.skill)}
                                                                </span>
                                                                <span className="rounded-full border border-slate-300 bg-slate-200 px-2.5 py-1 text-xs font-bold text-slate-700">
                                                                    {formatLabel(entry.difficulty_tier)}
                                                                </span>
                                                                <span className={`inline-flex items-center gap-0.5 rounded-full px-2.5 py-1 text-xs ${statusClasses}`}>
                                                                    {entry.status === "passed" ? (
                                                                        <CheckCircle2 className="h-3 w-3" />
                                                                    ) : null}
                                                                    {statusLabel}
                                                                </span>
                                                            </div>
                                                            {/* Enlarged best score */}
                                                            <div className="min-w-[84px] shrink-0 rounded-xl bg-[#0082c9] px-3 py-2 text-center shadow-md transition-colors group-hover:bg-[#0069aa]">
                                                                <p className="text-[10px] font-black uppercase leading-none tracking-[0.16em] text-cyan-50">
                                                                    Best
                                                                </p>
                                                                <p className="mt-1 text-2xl font-black leading-none text-white">
                                                                    {formatPercent(entry.best_score_percent)}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <p className="mt-2.5 line-clamp-1 text-base font-bold text-slate-800 transition-colors group-hover:text-[#005596]">
                                                            {entry.lesson_title}
                                                        </p>

                                                        {/* Stats row: all in one compact line */}
                                                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-slate-200 pt-2">
                                                            <span className="text-xs text-slate-600">
                                                                <span className="font-bold text-slate-700">{entry.attempt_count}</span> attempts
                                                            </span>
                                                            <span className="text-xs text-slate-600">
                                                                <span className="font-bold text-rose-600">{entry.failed_attempts}</span> failed
                                                            </span>
                                                            <span className="text-xs text-slate-600">
                                                                No hint: <span className="font-bold text-teal-700">{entry.correct_no_hint_count}/{entry.total_no_hint_questions}</span>
                                                            </span>
                                                            <span className="text-xs text-slate-600">
                                                                With hint: <span className="font-bold text-amber-700">{entry.correct_with_hint_count}/{entry.total_with_hint_questions}</span>
                                                            </span>
                                                            <span className="ml-auto text-xs text-slate-500">
                                                                {recordedLabel ?? completedLabel ?? submittedLabel ?? "Unknown"}
                                                            </span>
                                                        </div>
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Pagination Controls */}
                                    {totalPages > 1 ? (
                                        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-cyan-100">
                                            <p className="text-sm font-bold text-[#005596]/60">
                                                Showing {displayedLessonRange.start}–{displayedLessonRange.end} of {sortedLessonQuizHistory.length} lessons
                                            </p>
                                            <div className="flex items-center gap-1.5">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={validCurrentPage <= 1}
                                                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                                    className="h-9 px-3 text-sm font-bold rounded-lg border-cyan-200 text-[#005596] hover:bg-cyan-50"
                                                >
                                                    <ChevronLeft className="h-4 w-4 mr-1" />
                                                    Previous
                                                </Button>

                                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                                                    <Button
                                                        key={pageNum}
                                                        type="button"
                                                        variant={validCurrentPage === pageNum ? "default" : "outline"}
                                                        size="sm"
                                                        onClick={() => setCurrentPage(pageNum)}
                                                        className={`h-9 w-9 p-0 text-sm font-black rounded-lg transition-all ${validCurrentPage === pageNum
                                                            ? "bg-[#0072BB] text-white shadow-md scale-105"
                                                            : "border-cyan-200 text-[#005596] hover:bg-cyan-50"
                                                            }`}
                                                    >
                                                        {pageNum}
                                                    </Button>
                                                ))}

                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={validCurrentPage >= totalPages}
                                                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                                    className="h-9 px-3 text-sm font-bold rounded-lg border-cyan-200 text-[#005596] hover:bg-cyan-50"
                                                >
                                                    Next
                                                    <ChevronRight className="h-4 w-4 ml-1" />
                                                </Button>
                                            </div>
                                        </div>
                                    ) : null}
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Dialog
                open={selectedLessonId !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        if (window.history.state?.isLessonDetailModalOpen) {
                            window.history.back();
                        }
                        setSelectedLessonId(null);
                        setSelectedDetail(null);
                        setDetailError(null);
                    }
                }}
            >
                <DialogContent className="!w-[98vw] !max-w-[calc(100vw-1rem)] sm:!max-w-[110rem] max-h-[92vh] overflow-y-auto p-6 sm:p-8">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedDetail?.lesson_title ?? "Saved lesson quiz answers"}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedDetail
                                ? `${selectedDetail.topic_name ? `${selectedDetail.topic_name} · ` : ""}${formatLabel(selectedDetail.skill)} · ${formatLabel(selectedDetail.difficulty_tier)}`
                                : "Loading the saved lesson quiz result from the database."}
                        </DialogDescription>
                    </DialogHeader>

                    {detailLoading ? (
                        <div className="flex min-h-48 items-center justify-center gap-3 text-slate-500">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Loading saved quiz answers...
                        </div>
                    ) : detailError ? (
                        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-5 text-sm text-rose-700">
                            {detailError}
                        </div>
                    ) : selectedDetail ? (
                        <div className="space-y-5">
                            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Status</p>
                                    <p className="mt-1 font-semibold text-slate-950">{formatStatusLabel(selectedDetail.status)}</p>
                                </div>
                                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Best score</p>
                                    <p className="mt-1 font-semibold text-slate-950">{formatPercent(selectedDetail.best_score_percent)}</p>
                                </div>
                                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Attempts</p>
                                    <p className="mt-1 font-semibold text-slate-950">{selectedDetail.attempt_count}</p>
                                </div>
                                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Failed attempts</p>
                                    <p className="mt-1 font-semibold text-slate-950">{selectedDetail.failed_attempts}</p>
                                </div>
                                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Correct no hint</p>
                                    <p className="mt-1 font-semibold text-slate-950">{selectedDetail.correct_no_hint_count} / {selectedDetail.total_no_hint_questions}</p>
                                </div>
                                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Correct with hint</p>
                                    <p className="mt-1 font-semibold text-slate-950">{selectedDetail.correct_with_hint_count} / {selectedDetail.total_with_hint_questions}</p>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Recorded</p>
                                <p className="mt-1 font-semibold text-slate-950">{selectedRecordedLabel ?? "Unknown"}</p>
                            </div>

                            {selectedDetail.question_results.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                                    No saved question results are available for this lesson yet.
                                </div>
                            ) : (
                                <Accordion type="multiple" className="rounded-2xl border border-slate-200 bg-white px-4">
                                    {selectedDetail.question_results.map((result: LessonQuizQuestionResult, index) => (
                                        <AccordionItem
                                            key={`${result.question_id}-${index}`}
                                            value={`${result.question_id}-${index}`}
                                        >
                                            <AccordionTrigger className="hover:no-underline">
                                                <div className="min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                                                            Question {index + 1}
                                                        </span>
                                                        <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-[#005596]">
                                                            {formatQuestionTypeLabel(result.question_type)}
                                                        </span>
                                                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${result.is_correct ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                                                            {result.is_correct ? "Correct" : "Incorrect"}
                                                        </span>
                                                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${result.used_hint ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-700"}`}>
                                                            {result.used_hint ? "Hint used" : "No hint"}
                                                        </span>
                                                    </div>
                                                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-900">
                                                        {result.question_text || "Question text unavailable"}
                                                    </p>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent className="pt-4">
                                                <ReadonlyLessonQuizQuestion
                                                    result={result}
                                                    questionNumber={index + 1}
                                                    totalQuestions={selectedDetail.question_results.length}
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

type LearningHistoryChartProps = {
    showLoginHistory?: boolean;
    supplementaryPanelBottom?: number | null;
};

export function LearningHistoryChart({
    showLoginHistory = true,
    supplementaryPanelBottom = null,
}: LearningHistoryChartProps) {
    const { t } = useTranslation("profile");
    const auth = useAuth();
    const userId = Number(auth.user?.id);
    const layoutRef = useRef<HTMLDivElement | null>(null);
    const panelsRowRef = useRef<HTMLDivElement | null>(null);
    const [syncedPanelsHeight, setSyncedPanelsHeight] = useState<number | null>(null);
    const syncedPanelStyle =
        showLoginHistory && syncedPanelsHeight && syncedPanelsHeight > 0
            ? { height: `${syncedPanelsHeight}px` }
            : undefined;

    useEffect(() => {
        if (!showLoginHistory || !supplementaryPanelBottom || supplementaryPanelBottom <= 0) {
            setSyncedPanelsHeight(null);
            return;
        }

        const panelsRowNode = panelsRowRef.current;
        if (!panelsRowNode) {
            setSyncedPanelsHeight(null);
            return;
        }

        const updateHeight = () => {
            if (window.innerWidth < 1024) {
                setSyncedPanelsHeight(null);
                return;
            }

            const panelsRowTop = panelsRowNode.getBoundingClientRect().top;
            const remainingHeight =
                supplementaryPanelBottom
                - Math.round(panelsRowTop);

            setSyncedPanelsHeight(remainingHeight > 0 ? remainingHeight : null);
        };

        updateHeight();

        const observer = typeof ResizeObserver !== "undefined"
            ? new ResizeObserver(updateHeight)
            : null;

        observer?.observe(panelsRowNode);
        window.addEventListener("resize", updateHeight);

        return () => {
            observer?.disconnect();
            window.removeEventListener("resize", updateHeight);
        };
    }, [showLoginHistory, supplementaryPanelBottom]);

    return (
        <div ref={layoutRef} className="space-y-6">
            <div>
                <SkillsOverview />
            </div>

            <div
                ref={panelsRowRef}
                className={`grid grid-cols-1 gap-4 ${showLoginHistory ? "items-stretch lg:grid-cols-2" : "items-start"}`}
            >
                {showLoginHistory ? (
                    <div className="min-w-0" style={syncedPanelStyle}>
                        <LoginHistoryCard stretch />
                    </div>
                ) : null}

                <div className="min-w-0" style={syncedPanelStyle}>
                    <Card className="flex h-full min-w-0 flex-col border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.07)]">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-xl">{t("learningCalendar", { defaultValue: "Learning Calendar" })}</CardTitle>
                        </CardHeader>

                        <CardContent className="flex flex-1 flex-col pt-0">
                            <div className="flex-1">
                                <LearningCalendar embedded userId={userId} />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
