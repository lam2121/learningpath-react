import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearch } from "@tanstack/react-router";
import {
    ArrowRight,
    Award,
    BookOpen,
    CheckCircle2,
    ChevronRight,
    Clock3,
    GraduationCap,
    Info,
    Layers3,
    Loader2,
    Lock,
    Presentation,
} from "lucide-react";
import { Progress } from "@/shadcn/component/ui/progress";

import { MainNavigationMenu } from "@/common/component/MainNavigationMenu";
import {
    fetchRoadmap,
    type RoadmapLesson,
    type RoadmapTopic,
} from "@/feature/learning-path/api/roadmapApi";
import {
    findLatestReadyLessonInTopic,
    isLessonGeneratedButLocked,
    isLessonReadyToStudy,
} from "@/feature/learning-path/lessonAccess";
import { fetchPlacementTestResult } from "@/feature/onboarding/api/onboardingApi";
import { Button } from "@/shadcn/component/ui/button";
import { getDifficultyBadgeClasses, getSkillBadgeClasses } from "@/feature/user-profile/component/LearningHistoryChart";

const FALLBACK_TITLE = "Learning Path";

function pluralize(
    value: number,
    singular: string,
    plural = `${singular}s`,
) {
    return `${value} ${value === 1 ? singular : plural}`;
}

function formatLabel(value: string) {
    return value
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function formatMinutes(minutes: number) {
    if (minutes <= 0) {
        return "Estimate pending";
    }
    if (minutes < 60) {
        return `${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    if (remainder === 0) {
        return `${hours}h`;
    }
    return `${hours}h ${remainder}m`;
}

function getGeneratedLessonsCount(topic: RoadmapTopic) {
    return topic.lessons.filter((lesson) => lesson.is_generated).length;
}

function findRequestedTopicId(
    topics: RoadmapTopic[],
    requestedTopicId: number | undefined,
) {
    if (requestedTopicId === undefined) {
        return null;
    }

    return topics.some((topic) => topic.id === requestedTopicId)
        ? requestedTopicId
        : null;
}

function TopicButton({
    topic,
    isSelected,
    onClick,
}: {
    topic: RoadmapTopic;
    isSelected: boolean;
    onClick: () => void;
}) {
    const generatedLessons = getGeneratedLessonsCount(topic);

    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={isSelected}
            className={[
                "w-full min-w-0 rounded-xl border p-4 text-left transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2",
                "focus-visible:ring-blue-500 focus-visible:ring-offset-2",
                "dark:focus-visible:ring-offset-slate-900",
                isSelected
                    ? "border-blue-500 bg-blue-50/80 shadow-sm dark:border-blue-900 dark:bg-blue-950/30"
                    : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-900 dark:hover:bg-slate-800/60",
            ].join(" ")}
        >
            <div className="flex items-start gap-3">
                <span
                    className={[
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-bold",
                        isSelected
                            ? "border-blue-600 bg-blue-600 text-white"
                            : "border-slate-300 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
                    ].join(" ")}
                >
                    {topic.sort_order}
                </span>

                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <h3 className="break-words font-bold leading-5 text-slate-900 dark:text-white">
                                {topic.name}
                            </h3>

                            <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                                {formatLabel(topic.primary_skill)} ·{" "}
                                {formatLabel(topic.seed_tier)}
                            </p>
                        </div>

                        <div className="flex flex-col items-end gap-1.5">
                            {isSelected ? (
                                <span className="shrink-0 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                                    Selected
                                </span>
                            ) : (
                                <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                            )}

                            {topic.topic_quiz_status === 'passed' && (
                                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                    Quiz Passed
                                </span>
                            )}
                            {topic.topic_quiz_status === 'ready' && (
                                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                                    Quiz Ready
                                </span>
                            )}
                            {topic.topic_quiz_status === 'failed' && (
                                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                                    Quiz Retry
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-1.5">
                            <BookOpen className="h-4 w-4 shrink-0" />
                            {pluralize(topic.lessons.length, "Lesson")}
                        </span>

                        <span className="flex items-center gap-1.5">
                            <Clock3 className="h-4 w-4 shrink-0" />
                            {formatMinutes(topic.total_estimated_minutes)}
                        </span>

                        <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                            {generatedLessons} generated
                        </span>
                    </div>
                </div>
            </div>
        </button>
    );
}

function LessonCard({
    lesson,
    isWeakestReview = false,
}: {
    lesson: RoadmapLesson;
    isWeakestReview?: boolean;
}) {
    const isReadyToStudy = isLessonReadyToStudy(lesson);
    const isGeneratedButLocked = isLessonGeneratedButLocked(lesson);
    const content = (
        <>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 sm:h-14 sm:w-14 dark:bg-blue-950/60 dark:text-blue-400">
                <Presentation className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>

            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 sm:text-lg dark:text-white">
                        {lesson.title}
                    </h3>

                    <span
                        className={[
                            "rounded-full px-2.5 py-1 text-xs font-semibold",
                            !lesson.is_generated
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                                : isReadyToStudy
                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                                    : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
                        ].join(" ")}
                    >
                        {!lesson.is_generated
                            ? "Pending generation"
                            : isReadyToStudy
                                ? "Generated"
                                : "Generated · Locked"}
                    </span>

                    {lesson.is_completed && (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                            ✓ Passed
                        </span>
                    )}

                    {isWeakestReview && (
                        <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                            🚩 Needs Review
                        </span>
                    )}
                </div>

                <div className="mt-2 flex flex-wrap gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getSkillBadgeClasses(lesson.primary_skill)}`}>
                        {formatLabel(lesson.primary_skill)}
                    </span>

                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getDifficultyBadgeClasses(lesson.difficulty_tier)}`}>
                        {formatLabel(lesson.difficulty_tier)}
                    </span>

                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        {formatMinutes(lesson.estimated_minutes ?? 0)}
                    </span>
                </div>

                <p className="mt-3 text-sm leading-5 text-slate-600 dark:text-slate-400">
                    {!lesson.is_generated
                        ? "This lesson exists in the roadmap but its content has not been generated yet."
                        : isGeneratedButLocked
                            ? "This lesson is generated, but you need to pass the previous lesson in this topic to unlock it."
                            : "Theory and quiz content are ready for this lesson."}
                </p>
            </div>

            <div
                className={[
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors",
                    isReadyToStudy
                        ? "border-blue-200 text-blue-600 group-hover:bg-blue-600 group-hover:text-white dark:border-blue-800 dark:text-blue-400"
                        : "border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-700 dark:bg-slate-800",
                ].join(" ")}
            >
                <ChevronRight className="h-5 w-5" />
            </div>
        </>
    );

    const className =
        "group flex h-full w-full min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all dark:border-slate-800 dark:bg-slate-900 sm:gap-4 sm:p-5";

    if (!isReadyToStudy) {
        return <div className={`${className} opacity-80`}>{content}</div>;
    }

    return (
        <Link
            to="/lessons/$lessonId"
            params={{ lessonId: String(lesson.id) }}
            className={`${className} hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:hover:border-blue-700`}
        >
            {content}
        </Link>
    );
}

function TopicQuizCard({ topic }: { topic: RoadmapTopic }) {
    const quizStatus = topic.topic_quiz_status ?? "locked";

    if (quizStatus === "locked") {
        return (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-800/40">
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-400 dark:bg-slate-700 dark:text-slate-500">
                        <Lock className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-bold text-slate-600 dark:text-slate-300">
                            Topic Quiz — Locked
                        </h3>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Complete and pass all lessons in this topic to unlock the Topic Quiz.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const isPassed = quizStatus === "passed";
    const isFailed = quizStatus === "failed";
    const score = topic.topic_quiz_score;
    const weakestIds = topic.weakest_lesson_ids ?? [];

    return (
        <div
            className={[
                "mt-5 rounded-2xl border p-5 transition-all",
                isPassed
                    ? "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/60 dark:bg-emerald-950/20"
                    : isFailed
                      ? "border-amber-200 bg-amber-50/50 dark:border-amber-900/60 dark:bg-amber-950/20"
                      : "border-blue-200 bg-blue-50/60 dark:border-blue-900/60 dark:bg-blue-950/20",
            ].join(" ")}
        >
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                    <div
                        className={[
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                            isPassed
                                ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/60 dark:text-emerald-400"
                                : isFailed
                                  ? "bg-amber-100 text-amber-600 dark:bg-amber-900/60 dark:text-amber-400"
                                  : "bg-blue-100 text-blue-600 dark:bg-blue-900/60 dark:text-blue-400",
                        ].join(" ")}
                    >
                        <Award className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-bold text-slate-900 dark:text-white">
                            Topic Quiz
                        </h3>
                        <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
                            {isPassed
                                ? `Passed with ${score ?? 0}%`
                                : isFailed
                                  ? `Last attempt: ${score ?? 0}% — Retry available`
                                  : "30 questions · 75% to pass · No hints"}
                        </p>

                        {isFailed && weakestIds.length > 0 && (
                            <p className="mt-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
                                🚩 {weakestIds.length} lesson{weakestIds.length > 1 ? "s" : ""} flagged for review
                            </p>
                        )}
                    </div>
                </div>

                {isPassed ? (
                    <div className="flex items-center gap-2">
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                            ✓ Passed
                        </span>
                        <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="h-9 rounded-xl px-4 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                            <Link
                                to="/quiz/$quizType/$targetId"
                                params={{
                                    quizType: "topic",
                                    targetId: String(topic.id),
                                }}
                            >
                                Retake Quiz
                                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <Button
                        asChild
                        size="sm"
                        className={[
                            "h-9 rounded-xl px-5 font-bold text-white shadow-sm",
                            isFailed
                                ? "bg-amber-600 hover:bg-amber-700"
                                : "bg-blue-600 hover:bg-blue-700",
                        ].join(" ")}
                    >
                        <Link
                            to="/quiz/$quizType/$targetId"
                            params={{
                                quizType: "topic",
                                targetId: String(topic.id),
                            }}
                        >
                            {isFailed ? "Retry Topic Quiz" : "Take Topic Quiz"}
                            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                        </Link>
                    </Button>
                )}
            </div>
        </div>
    );
}

function FinalCourseQuizCard({
    status = "locked",
    score = null,
    totalTopics = 8,
    passedTopicsCount = 0,
}: {
    status?: 'locked' | 'ready' | 'passed' | 'failed';
    score?: number | null;
    totalTopics: number;
    passedTopicsCount: number;
}) {
    if (status === "locked") {
        const progressPercent = totalTopics > 0 ? Math.round((passedTopicsCount / totalTopics) * 100) : 0;
        return (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/40">
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                        <Lock className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                Final Course Quiz
                            </h3>
                            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                Locked
                            </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Pass all {totalTopics} topic quizzes to unlock the Final Course Quiz.
                        </p>
                        <div className="mt-2 flex items-center gap-2 text-xs font-medium text-slate-500">
                            <Progress value={progressPercent} className="h-1.5 flex-1" />
                            <span className="shrink-0">{passedTopicsCount}/{totalTopics} passed</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const isPassed = status === "passed";
    const isFailed = status === "failed";

    return (
        <div
            className={[
                "mt-4 rounded-2xl border p-4 shadow-sm transition-all",
                isPassed
                    ? "border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/60 dark:bg-emerald-950/20"
                    : isFailed
                        ? "border-amber-200 bg-amber-50/60 dark:border-amber-900/60 dark:bg-amber-950/20"
                        : "border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50/60 dark:border-blue-800 dark:from-blue-950/40 dark:to-indigo-950/30",
            ].join(" ")}
        >
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div
                        className={[
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                            isPassed
                                ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/60 dark:text-emerald-400"
                                : isFailed
                                    ? "bg-amber-100 text-amber-600 dark:bg-amber-900/60 dark:text-amber-400"
                                    : "bg-blue-600 text-white shadow-md shadow-blue-500/20",
                        ].join(" ")}
                    >
                        {isPassed ? <Award className="h-5 w-5" /> : <GraduationCap className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                Final Course Quiz
                            </h3>
                            <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                    isPassed
                                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200"
                                        : isFailed
                                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200"
                                            : "bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200"
                                }`}
                            >
                                {isPassed ? "Graduated" : isFailed ? "Retry Available" : "Ready to Take"}
                            </span>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                            {isPassed
                                ? `Graduated with ${score ?? 0}% overall score!`
                                : isFailed
                                    ? `Last attempt: ${score ?? 0}% — 80% overall & 60% per skill section required.`
                                    : "50 cumulative questions · 80% overall & 60% per skill section to graduate"}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <Button
                        asChild
                        size="sm"
                        className={[
                            "h-9 rounded-xl px-4 text-xs font-bold text-white shadow-md",
                            isPassed
                                ? "bg-emerald-600 hover:bg-emerald-700"
                                : isFailed
                                    ? "bg-amber-600 hover:bg-amber-700"
                                    : "bg-blue-600 hover:bg-blue-700",
                        ].join(" ")}
                    >
                        <Link
                            to="/quiz/$quizType/$targetId"
                            params={{
                                quizType: "final",
                                targetId: "course",
                            }}
                        >
                            {isPassed ? "Review" : isFailed ? "Retry Final Quiz" : "Take Final Quiz"}
                            <ArrowRight className="ml-1 h-3.5 w-3.5" />
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}

export function CurriculumRoadmapPage() {
    const { topicId: requestedTopicId } = useSearch({
        from: "/_protected/_user/_enrolled/lessons/learning-path",
    });
    const [roadmapTrack, setRoadmapTrack] = useState<string | null>(null);
    const [careerTrackName, setCareerTrackName] = useState<string | null>(null);
    const [topics, setTopics] = useState<RoadmapTopic[]>([]);
    const [finalQuizStatus, setFinalQuizStatus] = useState<'locked' | 'ready' | 'passed' | 'failed'>('locked');
    const [finalQuizScore, setFinalQuizScore] = useState<number | null>(null);
    const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
    const lastAppliedParamRef = useRef<number | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const loadRoadmap = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const [data, placementResult] = await Promise.all([
                    fetchRoadmap(),
                    fetchPlacementTestResult(),
                ]);

                if (!isMounted) {
                    return;
                }

                setRoadmapTrack(data.track);
                setCareerTrackName(placementResult.role_name?.trim() || null);
                setTopics(data.topics);
                setFinalQuizStatus(data.final_quiz_status ?? (data.all_topic_quizzes_passed ? 'ready' : 'locked'));
                setFinalQuizScore(data.final_quiz_score ?? null);
                setSelectedTopicId((prev) => {
                    const requestedId = findRequestedTopicId(
                        data.topics,
                        requestedTopicId,
                    );
                    if (requestedId !== null) {
                        return requestedId;
                    }

                    if (prev !== null && data.topics.some((topic) => topic.id === prev)) {
                        return prev;
                    }

                    return data.topics[0]?.id ?? null;
                });
            } catch (loadError) {
                if (!isMounted) {
                    return;
                }

                setRoadmapTrack(null);
                setCareerTrackName(null);
                setTopics([]);
                setSelectedTopicId(null);
                setError(
                    loadError instanceof Error
                        ? loadError.message
                        : "Failed to load roadmap.",
                );
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        void loadRoadmap();

        return () => {
            isMounted = false;
        };
    }, [requestedTopicId]);

    useEffect(() => {
        // Only react when the URL param itself changes — user-driven topic
        // clicks must win over the stale param, otherwise arriving from a
        // notification (?topicId=N) would pin the selection permanently.
        if (lastAppliedParamRef.current === requestedTopicId) {
            return;
        }

        const requestedId = findRequestedTopicId(topics, requestedTopicId);
        if (requestedId === null) {
            return;
        }

        lastAppliedParamRef.current = requestedTopicId;

        if (requestedId !== selectedTopicId) {
            setSelectedTopicId(requestedId);
        }
    }, [requestedTopicId, selectedTopicId, topics]);

    const selectedTopic = useMemo(
        () =>
            topics.find((topic) => topic.id === selectedTopicId) ??
            topics[0] ??
            null,
        [topics, selectedTopicId],
    );

    // Keyboard navigation for topics (circular: ArrowUp/ArrowDown)
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;

            const target = event.target instanceof HTMLElement ? event.target : null;
            const tagName = target?.tagName;
            // Allow arrow keys on buttons for topic navigation, but block form inputs
            if (
                target?.isContentEditable
                || tagName === "INPUT"
                || tagName === "TEXTAREA"
                || tagName === "SELECT"
                || tagName === "A"
            ) {
                return;
            }

            event.preventDefault();

            if (topics.length === 0) return;
            const currentIndex = topics.findIndex((t) => t.id === selectedTopicId);
            if (currentIndex === -1) return;

            const nextIndex = event.key === "ArrowUp"
                ? (currentIndex - 1 + topics.length) % topics.length
                : (currentIndex + 1) % topics.length;

            setSelectedTopicId(topics[nextIndex].id);
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [topics, selectedTopicId]);

    const summary = useMemo(() => {
        const totalLessons = topics.reduce(
            (sum, topic) => sum + topic.lessons.length,
            0,
        );
        const generatedLessons = topics.reduce(
            (sum, topic) => sum + getGeneratedLessonsCount(topic),
            0,
        );
        const totalEstimatedMinutes = topics.reduce(
            (sum, topic) => sum + topic.total_estimated_minutes,
            0,
        );

        return {
            totalTopics: topics.length,
            totalLessons,
            generatedLessons,
            totalEstimatedMinutes,
            progress:
                totalLessons === 0
                    ? 0
                    : Math.round((generatedLessons / totalLessons) * 100),
        };
    }, [topics]);

    const selectedTopicGeneratedLessons = selectedTopic
        ? getGeneratedLessonsCount(selectedTopic)
        : 0;

    const startLesson = useMemo(
        () => findLatestReadyLessonInTopic(selectedTopic),
        [selectedTopic],
    );

    const pageTitle = roadmapTrack
        ? `${formatLabel(roadmapTrack)}${careerTrackName ? ` ${careerTrackName}` : ""} Learning Path`
        : FALLBACK_TITLE;

    return (
        <div className="min-h-screen w-full bg-blue-50/60 text-slate-950 dark:bg-slate-950 dark:text-white">
            <MainNavigationMenu />

            <main className="w-full max-w-none px-2 py-3 sm:px-3 lg:px-4">
                <section
                    className="
                        w-full overflow-hidden rounded-2xl
                        border border-blue-200 bg-white shadow-sm
                        ring-1 ring-blue-100/80
                        dark:border-blue-900 dark:bg-slate-900 dark:ring-blue-950
                    "
                >
                    <div
                        className="
                            flex w-full items-center gap-2
                            border-b border-blue-200
                            bg-blue-50 px-5 py-3.5
                            text-sm font-bold text-blue-700
                            dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300
                            sm:px-6
                        "
                    >
                        <ChevronRight className="h-4 w-4 rotate-180" />
                        <span>Learning Paths</span>
                    </div>

                    <div
                        className="
                            grid w-full gap-5 p-5
                            sm:p-6
                            lg:grid-cols-[minmax(0,1fr)_minmax(240px,320px)_auto]
                            lg:items-center
                        "
                    >
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
                                    {pageTitle}
                                </h1>

                                <span
                                    className={[
                                        "rounded-full border px-3 py-1 text-xs font-semibold",
                                        error
                                            ? "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
                                            : "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
                                    ].join(" ")}
                                >
                                    {error ? "Unavailable" : "Roadmap ready"}
                                </span>
                            </div>

                            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-medium text-slate-600 dark:text-slate-300">
                                <span className="flex items-center gap-2">
                                    <Layers3 className="h-4 w-4 text-blue-600" />
                                    {pluralize(summary.totalTopics, "Topic")}
                                </span>

                                <span className="flex items-center gap-2">
                                    <BookOpen className="h-4 w-4 text-blue-600" />
                                    {pluralize(summary.totalLessons, "Lesson")}
                                </span>

                                <span className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                                    {summary.generatedLessons} generated
                                </span>

                                <span className="flex items-center gap-2">
                                    <Clock3 className="h-4 w-4 text-blue-600" />
                                    {formatMinutes(summary.totalEstimatedMinutes)}
                                </span>
                            </div>
                        </div>

                        <div className="min-w-0 rounded-xl bg-blue-50/70 p-4 dark:bg-blue-950/30">
                            <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                                <span className="font-medium text-slate-600 dark:text-slate-300">
                                    Content readiness
                                </span>

                                <span className="font-bold text-slate-900 dark:text-white">
                                    {summary.progress}%
                                </span>
                            </div>

                            <div
                                className="h-2 overflow-hidden rounded-full bg-blue-100 dark:bg-slate-800"
                                role="progressbar"
                                aria-label="Lesson generation progress"
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-valuenow={summary.progress}
                            >
                                <div
                                    className="h-full rounded-full bg-blue-600 transition-[width] duration-500"
                                    style={{ width: `${summary.progress}%` }}
                                />
                            </div>
                        </div>

                        {startLesson ? (
                            <Button
                                asChild
                                size="lg"
                                className="
                                    h-12 w-full rounded-xl bg-blue-600 px-7
                                    font-semibold text-white shadow-sm
                                    hover:bg-blue-700 lg:w-auto
                                "
                            >
                                <Link
                                    to="/lessons/$lessonId"
                                    params={{ lessonId: String(startLesson.id) }}
                                >
                                    Start learning
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        ) : (
                            <Button
                                size="lg"
                                disabled
                                className="
                                    h-12 w-full rounded-xl bg-blue-600 px-7
                                    font-semibold text-white shadow-sm lg:w-auto
                                "
                            >
                                No unlocked lesson ready in this topic
                            </Button>
                        )}
                    </div>
                </section>

                <div
                    className="
                        mt-5 grid w-full grid-cols-1 items-stretch gap-5
                        lg:grid-cols-[minmax(340px,0.9fr)_minmax(0,1.1fr)]
                    "
                >
                    <section className="flex h-full min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="mb-4 flex shrink-0 items-center justify-between gap-4">
                            <h2 className="text-xl font-bold text-slate-950 sm:text-2xl dark:text-white">
                                Topic roadmap
                            </h2>

                            <span className="shrink-0 text-sm font-semibold text-slate-500 dark:text-slate-400">
                                {pluralize(topics.length, "topic")}
                            </span>
                        </div>

                        {isLoading ? (
                            <div className="flex min-h-[320px] flex-1 items-center justify-center">
                                <div className="flex items-center gap-3 text-sm font-medium text-slate-500 dark:text-slate-400">
                                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                                    Loading topics...
                                </div>
                            </div>
                        ) : topics.length > 0 ? (
                            <div className="flex min-h-0 w-full flex-1 flex-col">
                                <div className="grid min-h-0 w-full flex-1 grid-cols-1 gap-3">
                                    {topics.map((topic) => (
                                        <TopicButton
                                            key={topic.id}
                                            topic={topic}
                                            isSelected={topic.id === selectedTopic?.id}
                                            onClick={() => setSelectedTopicId(topic.id)}
                                        />
                                    ))}
                                </div>
                                <FinalCourseQuizCard
                                    status={finalQuizStatus}
                                    score={finalQuizScore}
                                    totalTopics={topics.length}
                                    passedTopicsCount={topics.filter((t) => t.topic_quiz_status === "passed").length}
                                />
                            </div>
                        ) : (
                            <div className="flex min-h-[320px] flex-1 items-center justify-center rounded-xl border border-dashed border-slate-300 px-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                                No topics are available for this roadmap yet.
                            </div>
                        )}
                    </section>

                    <section className="flex h-full min-w-0 flex-col rounded-2xl border border-blue-200 bg-white p-5 shadow-sm ring-1 ring-blue-100/70 dark:border-blue-900 dark:bg-slate-900 dark:ring-blue-950 sm:p-6">
                        {isLoading ? (
                            <div className="flex min-h-[320px] flex-1 items-center justify-center">
                                <div className="flex items-center gap-3 text-sm font-medium text-slate-500 dark:text-slate-400">
                                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                                    Loading lessons...
                                </div>
                            </div>
                        ) : selectedTopic ? (
                            <>
                                <div className="shrink-0 border-b border-slate-200 pb-5 dark:border-slate-800">
                                    <p className="font-bold text-blue-600 dark:text-blue-400">
                                        Topic {selectedTopic.sort_order}
                                    </p>

                                    <h2 className="mt-1 break-words text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl dark:text-white">
                                        {selectedTopic.name}
                                    </h2>

                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                            {formatLabel(selectedTopic.primary_skill)}
                                        </span>

                                        <span className="rounded-full bg-blue-100 px-3 py-1.5 text-sm font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                                            {formatLabel(selectedTopic.seed_tier)}
                                        </span>
                                    </div>

                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <span className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                            <BookOpen className="h-4 w-4 shrink-0" />
                                            {pluralize(
                                                selectedTopic.lessons.length,
                                                "Lesson",
                                            )}
                                        </span>

                                        <span className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                            <Clock3 className="h-4 w-4 shrink-0" />
                                            {formatMinutes(selectedTopic.total_estimated_minutes)}
                                        </span>

                                        <span className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                            <CheckCircle2 className="h-4 w-4 shrink-0" />
                                            {selectedTopicGeneratedLessons} generated
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-4 grid min-h-0 w-full flex-1 grid-cols-1 auto-rows-fr gap-3">
                                    {selectedTopic.lessons.map((lesson) => (
                                        <LessonCard
                                            key={lesson.id}
                                            lesson={lesson}
                                            isWeakestReview={Boolean(selectedTopic.weakest_lesson_ids?.includes(lesson.id))}
                                        />
                                    ))}
                                </div>

                                <TopicQuizCard topic={selectedTopic} />

                                <div className="mt-4 shrink-0">
                                    <div className="flex items-start gap-2.5 rounded-xl bg-blue-50 px-4 py-3 text-sm font-medium text-blue-900 dark:bg-blue-950/50 dark:text-blue-200">
                                        <Info className="mt-0.5 h-4 w-4 shrink-0" />

                                        <p className="min-w-0 break-words">
                                            Select a topic on the left to inspect its
                                            lessons. Generated lessons can be opened
                                            directly from this panel.
                                        </p>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex min-h-[320px] flex-1 items-center justify-center rounded-xl border border-dashed border-slate-300 px-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                                Choose a topic from the left panel to view its
                                lessons.
                            </div>
                        )}
                    </section>
                </div>

                {error ? (
                    <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-medium text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                        Could not load roadmap data from the roadmap API:
                        {" "}
                        {error}
                    </div>
                ) : null}
            </main>
        </div>
    );
}
