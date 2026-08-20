import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";
import { CalendarClock, CheckCircle2, Clock3, Eye, Loader2, Medal, Sparkles } from "lucide-react";

import { fetchCurrentUserProfile } from "@/feature/auth/api/authAPI";
import type {
    LessonQuizHistoryEntryResponse,
    StudyHistoryEntryResponse,
    UserProfileResponse,
} from "@/feature/auth/type/Auth";
import { useAuth } from "@/common/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/shadcn/component/ui/card";
import { Button } from "@/shadcn/component/ui/button";
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
    getTrackedStudyMinutesByDay,
    getTrackedStudyMinutesTotal,
} from "@/feature/user-profile/utils/StudyActivity";
import {
    fetchLessonQuizResultDetail,
    type LessonQuizQuestionResult,
    type LessonQuizResultDetailResponse,
} from "@/feature/learning-path/roadmapApi";
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
                onAnswer={() => {}}
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
                onAnswerChange={() => {}}
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
            onAnswerChange={() => {}}
            isSubmitted
            isCorrect={result.is_correct}
            explanation={result.explanation}
            revealAnswer
        />
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
    const activeDays = chartData.filter((item) => item.minutes > 0).length;
    const totalMinutes = chartData.reduce((sum, item) => sum + item.minutes, 0);
    const todayMinutes = chartData[chartData.length - 1]?.minutes ?? 0;
    const hasActivity = totalMinutes > 0;
    const trackedStudyMinutes = Number.isFinite(userId)
        ? getTrackedStudyMinutesTotal(userId)
        : 0;
    const totalTrackedMinutes = Math.max(
        0,
        (profile?.total_studied_minutes ?? 0) + trackedStudyMinutes,
    );
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
                    Study Time History
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

                            <div className={`flex shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 sm:rounded-2xl ${compact ? "h-9 w-9 sm:h-10 sm:w-10" : "h-10 w-10 sm:h-12 sm:w-12"}`}>
                                <Clock3 className="h-4 w-4 sm:h-5 sm:w-5" />
                            </div>
                        </div>

                        <div className="flex min-w-0 flex-wrap gap-1.5 text-[11px] font-semibold sm:gap-2 sm:text-xs">
                            <span className="max-w-full truncate rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">
                                Active days: {activeDays}
                            </span>
                            <span className="max-w-full truncate rounded-full bg-blue-50 px-2.5 py-1 text-blue-700">
                                Total tracked: {formatStudyDuration(totalTrackedMinutes)}
                            </span>
                        </div>

                        <div className={`${chartHeightClass} min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 sm:rounded-2xl sm:px-4 sm:py-3`}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <Tooltip
                                        content={<StudyTimeTooltip />}
                                        cursor={{ stroke: "#93c5fd", strokeWidth: 1.5 }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="minutes"
                                        stroke="#2563eb"
                                        strokeWidth={2.5}
                                        fill="rgba(37,99,235,0.14)"
                                        activeDot={{
                                            r: 5,
                                            fill: "#2563eb",
                                            stroke: "#ffffff",
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
};

export function LessonQuizHistoryCard({
    compact = false,
}: LessonQuizHistoryCardProps) {
    const [profile, setProfile] = useState<UserProfileResponse | null>(null);
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

    const lessonQuizHistory = useMemo(
        () => profile?.lesson_quiz_history ?? [],
        [profile],
    );

    const topAttempts = useMemo(
        () => (compact ? lessonQuizHistory.slice(0, 3) : lessonQuizHistory),
        [compact, lessonQuizHistory],
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

    return (
        <>
            <Card className="flex min-w-0 flex-col border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.07)]">
                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <CardTitle className="text-xl text-slate-950">Best Lesson Quiz Scores</CardTitle>
                            <p className="mt-1 text-sm text-slate-500">
                                Highest weighted score saved for each lesson, including hint mode.
                            </p>
                        </div>
                        <div className="rounded-2xl bg-amber-50 p-3 text-amber-700">
                            <Medal className="h-5 w-5" />
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="pt-0">
                    {topAttempts.length === 0 ? (
                        <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center">
                            <Sparkles className="h-10 w-10 text-slate-300" />
                            <div>
                                <p className="font-semibold text-slate-900">
                                    No quiz score history yet
                                </p>
                                <p className="mt-2 text-sm leading-6 text-slate-500">
                                    Pass or retry lesson quizzes to start building your best-score history.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {topAttempts.map((entry: LessonQuizHistoryEntryResponse) => {
                                const recordedLabel = formatHistoryDate(entry.recorded_at);
                                const completedLabel = formatHistoryDate(entry.completed_at);
                                const submittedLabel = formatHistoryDate(entry.last_submitted_at);
                                const statusLabel = formatStatusLabel(entry.status);
                                const statusClasses = entry.status === "passed"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : entry.status === "failed"
                                        ? "bg-rose-100 text-rose-700"
                                        : "bg-amber-100 text-amber-700";

                                return (
                                    <div
                                        key={entry.lesson_id}
                                        className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
                                    >
                                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="text-base font-bold text-slate-950">
                                                        {entry.lesson_title}
                                                    </p>
                                                    <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                                                        {formatLabel(entry.skill)}
                                                    </span>
                                                    <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700">
                                                        {formatLabel(entry.difficulty_tier)}
                                                    </span>
                                                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses}`}>
                                                        {entry.status === "passed" ? (
                                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                                        ) : null}
                                                        {statusLabel}
                                                    </span>
                                                </div>
                                                <p className="mt-2 text-sm text-slate-500">
                                                    {entry.topic_name ? `Topic: ${entry.topic_name}` : "Lesson quiz history"}
                                                </p>
                                            </div>

                                            <div className="flex flex-col items-start gap-3 lg:items-end">
                                                <div className="rounded-2xl bg-white px-4 py-3 text-left shadow-sm lg:min-w-[160px] lg:text-right">
                                                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                                        Best score
                                                    </p>
                                                    <p className="mt-1 text-2xl font-black text-slate-950">
                                                        {formatPercent(entry.best_score_percent)}
                                                    </p>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="rounded-xl border-slate-300 bg-white"
                                                    onClick={() => void openLessonDetail(entry.lesson_id)}
                                                >
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    View saved answers
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                                            <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                                                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                                    Attempts
                                                </p>
                                                <p className="mt-1 font-semibold text-slate-950">
                                                    {entry.attempt_count}
                                                </p>
                                            </div>
                                            <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                                                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                                    Failed attempts
                                                </p>
                                                <p className="mt-1 font-semibold text-slate-950">
                                                    {entry.failed_attempts}
                                                </p>
                                            </div>
                                            <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                                                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                                    Correct no hint
                                                </p>
                                                <p className="mt-1 font-semibold text-slate-950">
                                                    {entry.correct_no_hint_count} / {entry.total_no_hint_questions}
                                                </p>
                                            </div>
                                            <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                                                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                                    Correct with hint
                                                </p>
                                                <p className="mt-1 font-semibold text-slate-950">
                                                    {entry.correct_with_hint_count} / {entry.total_with_hint_questions}
                                                </p>
                                            </div>
                                            <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                                                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                                    Recorded
                                                </p>
                                                <p className="mt-1 font-semibold text-slate-950">
                                                    {recordedLabel ?? completedLabel ?? submittedLabel ?? "Unknown"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog
                open={selectedLessonId !== null}
                onOpenChange={(open) => {
                    if (!open) {
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
                                                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
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
};

export function LearningHistoryChart({
    showLoginHistory = true,
}: LearningHistoryChartProps) {
    const auth = useAuth();
    const userId = Number(auth.user?.id);

    return (
        <div className="space-y-6">
            <SkillsOverview />

            <div className={`grid grid-cols-1 gap-4 ${showLoginHistory ? "items-stretch lg:grid-cols-2" : "items-start"}`}>
                {showLoginHistory ? <LoginHistoryCard stretch /> : null}

                <Card className="flex h-full min-w-0 flex-col border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.07)]">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-xl">Learning Calendar</CardTitle>
                    </CardHeader>

                    <CardContent className="flex flex-1 flex-col pt-0">
                        <div className="flex-1">
                            <LearningCalendar embedded userId={userId} />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
