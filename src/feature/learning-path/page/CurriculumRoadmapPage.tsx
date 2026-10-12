import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearch } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
    BookOpen,
    CheckCircle2,
    Clock3,
    Info,
    Loader2,
} from "lucide-react";

import { MainNavigationMenu } from "@/common/component/MainNavigationMenu";
import {
    buildRoadmapNotificationStreamUrl,
    fetchRoadmap,
    type RoadmapTopic,
} from "@/feature/learning-path/api/roadmapApi";
import {
    findLatestReadyLessonInTopic,
} from "@/feature/learning-path/lessonAccess";
import { fetchPlacementTestResult } from "@/feature/onboarding/api/onboardingApi";
import {
    FinalCourseQuizCard,
    LessonCard,
    RoadmapSummaryHeader,
    TopicButton,
    TopicQuizCard,
} from "@/feature/learning-path/component";
import {
    formatLabel,
    formatMinutes,
    getGeneratedLessonsCount,
    findRequestedTopicId,
    pluralize,
} from "@/feature/learning-path/utils/roadmapFormatters";

export function CurriculumRoadmapPage() {
    const { t } = useTranslation("profile");
    const { topicId: requestedTopicId } = useSearch({
        from: "/_protected/_user/_enrolled/lessons/learning-path",
    });
    const [roadmapTrack, setRoadmapTrack] = useState<string | null>(null);
    const [careerTrackName, setCareerTrackName] = useState<string | null>(null);
    const [topics, setTopics] = useState<RoadmapTopic[]>([]);
    const [finalQuizStatus, setFinalQuizStatus] = useState<'locked' | 'ready' | 'passed' | 'failed'>('locked');
    const [finalQuizScore, setFinalQuizScore] = useState<number | null>(null);
    const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
    const [mobileTab, setMobileTab] = useState<'topics' | 'lessons'>('topics');
    const lastAppliedParamRef = useRef<number | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadRoadmap = useCallback(async (silent = false) => {
        if (!silent) {
            setIsLoading(true);
            setError(null);
        }

        try {
            const [data, placementResult] = await Promise.all([
                fetchRoadmap(),
                fetchPlacementTestResult(),
            ]);

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
            if (!silent) {
                setRoadmapTrack(null);
                setCareerTrackName(null);
                setTopics([]);
                setSelectedTopicId(null);
                setError(
                    loadError instanceof Error
                        ? loadError.message
                        : "Failed to load roadmap.",
                );
            }
        } finally {
            if (!silent) {
                setIsLoading(false);
            }
        }
    }, [requestedTopicId]);

    useEffect(() => {
        void loadRoadmap();
    }, [loadRoadmap]);

    useEffect(() => {
        let stream: EventSource | null = null;
        try {
            stream = new EventSource(buildRoadmapNotificationStreamUrl(), {
                withCredentials: true,
            });
            stream.addEventListener("roadmap_updated", () => {
                void loadRoadmap(true);
            });
        } catch {
            // Ignore if stream fails
        }

        return () => {
            stream?.close();
        };
    }, [loadRoadmap]);

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

    const learningPathSuffix = t("learningPathTitle", { defaultValue: "Learning Path" });
    const pageTitle = roadmapTrack
        ? `${formatLabel(roadmapTrack)}${careerTrackName ? ` ${careerTrackName}` : ""} ${learningPathSuffix}`
        : learningPathSuffix;

    return (
        <div className="min-h-screen bg-blue-50/60 text-slate-950 dark:bg-slate-950 dark:text-white mobile-page-enter">
            <MainNavigationMenu />

            <main className="mx-auto w-full max-w-[1480px] px-3 py-3 sm:px-5 sm:py-4 lg:px-6 mobile-page-bottom">
                <RoadmapSummaryHeader
                    pageTitle={pageTitle}
                    error={error}
                    summary={summary}
                    startLesson={startLesson}
                />

                {/* Mobile Mode Switcher Tabs — Premium segmented control */}
                <div className="lg:hidden relative flex p-1 mt-3 mb-2 rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2)]">
                    {/* Sliding background indicator */}
                    <div
                        className="absolute top-1 bottom-1 rounded-xl bg-blue-600 shadow-sm transition-all duration-300 ease-out"
                        style={{
                            left: mobileTab === 'topics' ? '0.25rem' : '50%',
                            right: mobileTab === 'lessons' ? '0.25rem' : '50%',
                        }}
                    />
                    <button
                        type="button"
                        onClick={() => setMobileTab('topics')}
                        className={`relative z-10 flex-1 py-2.5 px-3 text-xs font-bold rounded-xl transition-colors duration-200 ${
                            mobileTab === 'topics'
                                ? 'text-white'
                                : 'text-slate-600 dark:text-slate-400 active:text-slate-900'
                        }`}
                    >
                        Danh sách chủ đề ({topics.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setMobileTab('lessons')}
                        className={`relative z-10 flex-1 py-2.5 px-3 text-xs font-bold rounded-xl transition-colors duration-200 ${
                            mobileTab === 'lessons'
                                ? 'text-white'
                                : 'text-slate-600 dark:text-slate-400 active:text-slate-900'
                        }`}
                    >
                        Bài học chi tiết {selectedTopic ? `· Topic ${selectedTopic.sort_order}` : ''}
                    </button>
                </div>

                <div
                    className="
                        mt-2 sm:mt-5 grid w-full grid-cols-1 items-stretch gap-5
                        lg:grid-cols-[minmax(340px,0.9fr)_minmax(0,1.1fr)]
                    "
                >
                    <section className={`${mobileTab === 'topics' ? 'flex' : 'hidden lg:flex'} h-full min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900`}>
                        <div className="mb-4 flex shrink-0 items-center justify-between gap-4">
                            <h2 className="text-xl font-bold text-slate-950 sm:text-2xl dark:text-white">
                                {t("topicRoadmap", { defaultValue: "Topic roadmap" })}
                            </h2>

                            <span className="shrink-0 text-sm font-semibold text-slate-500 dark:text-slate-400">
                                {t("topicCount", { count: topics.length, defaultValue: pluralize(topics.length, "topic") })}
                            </span>
                        </div>

                        {isLoading ? (
                            <div className="flex min-h-[320px] flex-1 items-center justify-center">
                                <div className="flex items-center gap-3 text-sm font-medium text-slate-500 dark:text-slate-400">
                                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                                    {t("loadingTopics", { defaultValue: "Loading topics..." })}
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
                                             onClick={() => {
                                                 setSelectedTopicId(topic.id);
                                                 setMobileTab('lessons');
                                             }}
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
                                {t("noTopicsAvailable", { defaultValue: "No topics are available for this roadmap yet." })}
                            </div>
                        )}
                    </section>

                    <section className={`${mobileTab === 'lessons' ? 'flex' : 'hidden lg:flex'} h-full min-w-0 flex-col rounded-2xl border border-blue-200 bg-white p-4 sm:p-6 shadow-sm ring-1 ring-blue-100/70 dark:border-blue-900 dark:bg-slate-900 dark:ring-blue-950`}>
                        {/* Mobile back to topics button */}
                        <div className="lg:hidden mb-3">
                            <button
                                type="button"
                                onClick={() => setMobileTab('topics')}
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 dark:text-blue-400 py-1 px-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/60"
                            >
                                ← Quay lại danh sách chủ đề
                            </button>
                        </div>
                        {isLoading ? (
                            <div className="flex min-h-[320px] flex-1 items-center justify-center">
                                <div className="flex items-center gap-3 text-sm font-medium text-slate-500 dark:text-slate-400">
                                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                                    {t("loadingLessons", { defaultValue: "Loading lessons..." })}
                                </div>
                            </div>
                        ) : selectedTopic ? (
                            <>
                                <div className="shrink-0 border-b border-slate-200 pb-5 dark:border-slate-800">
                                    <p className="font-bold text-blue-600 dark:text-blue-400">
                                        {t("topicWithOrder", { order: selectedTopic.sort_order, defaultValue: `Topic ${selectedTopic.sort_order}` })}
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
                                            {t("lessonCount", { count: selectedTopic.lessons.length, defaultValue: pluralize(selectedTopic.lessons.length, "Lesson") })}
                                        </span>

                                        <span className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                            <Clock3 className="h-4 w-4 shrink-0" />
                                            {formatMinutes(selectedTopic.total_estimated_minutes)}
                                        </span>

                                        <span className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                            <CheckCircle2 className="h-4 w-4 shrink-0" />
                                            {t("generatedCount", { count: selectedTopicGeneratedLessons, defaultValue: `${selectedTopicGeneratedLessons} generated` })}
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
                                            {t("selectTopicDesc", { defaultValue: "Select a topic on the left to inspect its lessons. Generated lessons can be opened directly from this panel." })}
                                        </p>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex min-h-[320px] flex-1 items-center justify-center rounded-xl border border-dashed border-slate-300 px-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                                {t("chooseTopicPrompt", { defaultValue: "Choose a topic from the left panel to view its lessons." })}
                            </div>
                        )}
                    </section>
                </div>

                {error ? (
                    <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-medium text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                        {t("roadmapApiError", { defaultValue: "Could not load roadmap data from the roadmap API:" })}{" "}
                        {error}
                    </div>
                ) : null}
            </main>
        </div>
    );
}
