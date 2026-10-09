import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Layers3, Loader2, Play, Sparkles } from "lucide-react";

import { MainNavigationMenu } from "@/common/component/MainNavigationMenu";
import { Button } from "@/shadcn/component/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shadcn/component/ui/card";
import {
    fetchRoadmap,
    type RoadmapResponse,
} from "@/feature/learning-path/api/roadmapApi";
import { getNextAssignedLesson } from "@/feature/learning-path/lessonAccess";
import { fetchCurrentUserProfile } from "@/feature/auth/api/authAPI";
import type { UserProfileResponse } from "@/feature/auth/type/Auth";
import { DailyPlanView } from "@/feature/daily-plan";
import {
    LearningHistoryChart,
    LoginHistoryCard,
} from "@/feature/user-profile/component/LearningHistoryChart";
import { UserProfileCard } from "@/feature/user-profile/component/UserProfileCard";
import { useTranslation } from "react-i18next";
import { userProfileTexts } from "../userProfileTexts";
import { getTrackBadgeClasses } from "@/common/utils/historyBadgeStyles";


function formatHours(minutes: number | null | undefined) {
    return userProfileTexts.formatEstimatedHours(minutes);
}

export function UserProfile() {
    useTranslation("profile");
    const [roadmap, setRoadmap] = useState<RoadmapResponse | null>(null);
    const [profile, setProfile] = useState<UserProfileResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true); const [isStudyPlanExpanded, setIsStudyPlanExpanded] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const loadProfileAndRoadmap = async () => {
            try {
                const [roadmapData, profileData] = await Promise.all([
                    fetchRoadmap(),
                    fetchCurrentUserProfile(),
                ]);
                if (!isMounted) {
                    return;
                }
                setRoadmap(roadmapData);
                setProfile(profileData);
            } catch {
                if (isMounted) {
                    setRoadmap(null);
                    setProfile(null);
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        void loadProfileAndRoadmap();

        const handleProfileUpdated = (event: Event) => {
            const customEvent = event as CustomEvent<UserProfileResponse>;
            if (isMounted) {
                setProfile(customEvent.detail);
            }
        };
        window.addEventListener("careerpath:profile-updated", handleProfileUpdated);

        return () => {
            isMounted = false;
            window.removeEventListener(
                "careerpath:profile-updated",
                handleProfileUpdated,
            );
        };
    }, []);

    const passedLessonIds = useMemo(
        () =>
            new Set(
                (profile?.lesson_quiz_history ?? [])
                    .filter((entry) => entry.passed)
                    .map((entry) => entry.lesson_id),
            ),
        [profile?.lesson_quiz_history],
    );
    const totalAssignedLessons = useMemo(
        () =>
            roadmap?.topics.reduce(
                (sum, topic) => sum + topic.lessons.length,
                0,
            ) ?? 0,
        [roadmap],
    );
    const completedLessonCount = passedLessonIds.size;
    const allAssignedLessonsCompleted =
        totalAssignedLessons > 0 && completedLessonCount >= totalAssignedLessons;
    const nextAssigned = useMemo(
        () => getNextAssignedLesson(roadmap, passedLessonIds),
        [roadmap, passedLessonIds],
    );
    const nextLesson = nextAssigned?.lesson ?? null;
    const nextTopic = nextAssigned?.topic ?? null;
    const progressPercent = useMemo(
        () =>
            totalAssignedLessons > 0
                ? Math.min(100, Math.round((completedLessonCount / totalAssignedLessons) * 100))
                : 0,
        [completedLessonCount, totalAssignedLessons],
    );

    return (
        <div className="min-h-screen w-full bg-[radial-gradient(ellipse_at_top,_rgba(0,114,187,0.08),_transparent_50%),linear-gradient(180deg,#f8faff_0%,#f0f4fc_100%)] transition-colors dark:bg-[radial-gradient(ellipse_at_top,_rgba(0,114,187,0.12),_transparent_50%),linear-gradient(180deg,#090d16_0%,#0f172a_100%)]">
            <MainNavigationMenu />

            <div className="w-full px-3 pb-8 pt-3 sm:px-5 lg:px-8">
                <div className="mt-2 space-y-6">
                    <UserProfileCard />

                    <div
                        className="
                            grid items-stretch gap-6
                            xl:grid-cols-[minmax(0,2fr)_minmax(340px,1fr)]
                            2xl:gap-8
                        "
                    >
                        <div className="flex min-w-0 flex-col space-y-6">
                            {/* Highlighted Hero: Explore Learning Path with Blink Blink Effects */}
                            <div className="relative">
                                {/* Blink Blink Twinkling Stars around the card */}
                                <div className="pointer-events-none absolute -top-3 -right-2 z-20 animate-blink-twinkle-1 text-cyan-400">
                                    <svg className="h-6 w-6 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
                                    </svg>
                                </div>
                                <div className="pointer-events-none absolute -top-2.5 left-1/4 z-20 animate-blink-twinkle-2 text-amber-400">
                                    <svg className="h-4.5 w-4.5 drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
                                    </svg>
                                </div>
                                <div className="pointer-events-none absolute -bottom-2.5 -left-2 z-20 animate-blink-twinkle-3 text-blue-500 dark:text-cyan-300">
                                    <svg className="h-5 w-5 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
                                    </svg>
                                </div>
                                <div className="pointer-events-none absolute -bottom-2 right-1/3 z-20 animate-blink-twinkle-4 text-amber-300">
                                    <svg className="h-4 w-4 drop-shadow-[0_0_6px_rgba(252,211,77,0.8)]" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
                                    </svg>
                                </div>
                                <div className="pointer-events-none absolute top-1/2 -right-2.5 z-20 animate-blink-twinkle-2 text-sky-400">
                                    <svg className="h-4 w-4 drop-shadow-[0_0_6px_rgba(56,189,248,0.8)]" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
                                    </svg>
                                </div>
                                <div className="pointer-events-none absolute top-1/3 -left-2 z-20 animate-blink-twinkle-4 text-yellow-300">
                                    <svg className="h-3.5 w-3.5 drop-shadow-[0_0_5px_rgba(253,224,71,0.8)]" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
                                    </svg>
                                </div>

                                <Card className="group relative overflow-hidden rounded-3xl border border-blue-300 bg-gradient-to-br from-blue-50/70 via-indigo-50/20 to-white py-0 gap-0 shadow-[0_12px_36px_rgba(37,99,235,0.08)] transition-all duration-300 hover:shadow-[0_20px_50px_rgba(37,99,235,0.14)] dark:border-blue-700 dark:bg-[linear-gradient(135deg,_rgba(30,58,138,0.2)_0%,_rgba(15,23,42,0.95)_45%,_rgba(15,23,42,1)_100%)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.4)] animate-border-blink">
                                    {/* Top Brand Highlight Accent Bar: Flush at top to cap the section without white space */}
                                    <div className="h-2 w-full bg-gradient-to-r from-[#005596] via-[#0072BB] to-[#00A9CE]" />

                                    {/* Ambient light blooms */}
                                    <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-400/10 blur-3xl dark:bg-blue-600/10" />
                                    <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl dark:bg-cyan-600/10" />

                                    <CardHeader className="relative px-6 pb-4 pt-4 sm:px-8 sm:pt-5">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="space-y-3">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-300 bg-blue-100/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-900 shadow-2xs dark:border-blue-700 dark:bg-blue-950/80 dark:text-blue-200">
                                                        <span className="relative flex h-2 w-2">
                                                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500 opacity-75" />
                                                            <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-600" />
                                                        </span>
                                                        <Sparkles className="h-3.5 w-3.5 text-blue-700 dark:text-blue-400" />
                                                        {userProfileTexts.nextStepBadge()}
                                                    </span>

                                                    {totalAssignedLessons > 0 ? (
                                                        <span className="rounded-full border border-slate-300/80 bg-white/95 px-3 py-1 text-xs font-bold text-slate-800 shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                                            {userProfileTexts.lessonProgressFraction(completedLessonCount, totalAssignedLessons, progressPercent)}
                                                        </span>
                                                    ) : null}
                                                </div>

                                                <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                                                    <span className="relative inline-block">
                                                        <span className="relative z-10">{userProfileTexts.exploreLearningPath()}</span>
                                                        {/* Authentic Highlighter Marker Stroke */}
                                                        <span
                                                            aria-hidden="true"
                                                            className="absolute bottom-1 sm:bottom-1.5 left-0 right-0 h-3.5 sm:h-4.5 -rotate-0.5 rounded-sm bg-gradient-to-r from-yellow-300/70 via-yellow-200/80 to-amber-200/60 dark:from-yellow-400/35 dark:via-yellow-300/25 dark:to-transparent -z-0 pointer-events-none"
                                                        />
                                                    </span>
                                                </CardTitle>

                                                <p className="max-w-2xl text-sm sm:text-base font-medium leading-relaxed text-slate-700 dark:text-slate-200">
                                                    {userProfileTexts.continueRoadmap()}
                                                </p>

                                                {/* Mini curriculum progress bar */}
                                                {totalAssignedLessons > 0 ? (
                                                    <div className="pt-1 max-w-md">
                                                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800">
                                                            <div
                                                                className="h-full rounded-full bg-gradient-to-r from-blue-600 to-[#00A9CE] transition-all duration-700 ease-out"
                                                                style={{ width: `${progressPercent}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                ) : null}
                                            </div>

                                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#005596] via-[#0072BB] to-[#00A9CE] text-white shadow-md shadow-blue-500/20">
                                                <BookOpen className="h-5 w-5" />
                                            </div>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="relative px-6 pb-6 pt-0 sm:px-8 sm:pb-8">
                                        {isLoading ? (
                                            <div className="flex min-h-[120px] items-center gap-3 rounded-2xl border border-blue-200 bg-white/85 px-5 text-slate-600 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300 font-medium">
                                                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                                                {userProfileTexts.loadingLearningPath()}
                                            </div>
                                        ) : (
                                            <div className="rounded-2xl border border-slate-300 bg-white/95 p-5 shadow-xs backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/85">
                                                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                                                    <div className="space-y-3.5">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            {roadmap?.track ? (
                                                                <>
                                                                    <span className={`rounded-full px-3.5 py-1 text-xs font-bold uppercase tracking-wider ${getTrackBadgeClasses(roadmap.track)}`}>
                                                                        {userProfileTexts.trackName(roadmap.track)}
                                                                    </span>
                                                                    <span className="rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                                                        {userProfileTexts.topicsCount(roadmap.topics.length)}
                                                                    </span>
                                                                    {roadmap.total_estimated_minutes > 0 ? (
                                                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                                                            <Layers3 className="h-3.5 w-3.5 text-blue-700 dark:text-blue-400" />
                                                                            {formatHours(roadmap.total_estimated_minutes)}
                                                                        </span>
                                                                    ) : null}
                                                                </>
                                                            ) : (
                                                                <span className="rounded-full bg-slate-100 px-3.5 py-1 text-xs font-bold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                                                                    {userProfileTexts.exploreTopics()}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Up Next Lesson & Topic Callout Strip */}
                                                        {nextLesson ? (
                                                            <div className="flex flex-wrap items-center gap-2.5 rounded-2xl border border-blue-300 bg-blue-50/90 p-3 text-xs text-slate-900 shadow-2xs dark:border-blue-700 dark:bg-blue-950/60 dark:text-slate-100">
                                                                <div className="flex items-center gap-1.5 font-black uppercase tracking-wider text-blue-800 dark:text-blue-300">
                                                                    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-2xs">
                                                                        <Play className="ml-0.5 h-2.5 w-2.5 fill-current" />
                                                                    </span>
                                                                    <span>{userProfileTexts.upNextLabel()}</span>
                                                                </div>

                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-blue-300 bg-white/95 px-2.5 py-1 text-xs font-bold text-slate-900 shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                                                                        <span className="text-blue-700 dark:text-blue-400 font-extrabold uppercase text-[11px] tracking-wide">
                                                                            {userProfileTexts.lessonLabelPrefix()}
                                                                        </span>
                                                                        <span>'{nextLesson.title}'</span>
                                                                    </span>

                                                                    {nextTopic ? (
                                                                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-300 bg-indigo-50/90 px-2.5 py-1 text-xs font-bold text-slate-900 shadow-2xs dark:border-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-100">
                                                                            <span className="text-indigo-700 dark:text-indigo-300 font-extrabold uppercase text-[11px] tracking-wide">
                                                                                {userProfileTexts.topicLabelPrefix()}
                                                                            </span>
                                                                            <span>{nextTopic.name}</span>
                                                                        </span>
                                                                    ) : null}
                                                                </div>
                                                            </div>
                                                        ) : null}

                                                        <p className="max-w-3xl text-sm sm:text-base font-medium leading-relaxed text-slate-700 dark:text-slate-200">
                                                            {roadmap?.topics.length
                                                                ? userProfileTexts.openRoadmapDesc()
                                                                : userProfileTexts.openRoadmapPendingDesc()}
                                                        </p>
                                                    </div>

                                                    <Button asChild className="group h-13 min-w-[220px] rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-base font-bold text-white shadow-lg shadow-blue-500/25 transition-all duration-200 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/35 active:scale-[0.99]">
                                                        <Link to="/lessons/learning-path">
                                                            {userProfileTexts.openLearningPath()}
                                                            <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="flex-1 min-h-0">
                                <LearningHistoryChart showLoginHistory={isStudyPlanExpanded} />
                            </div>
                        </div>

                        <aside className="flex h-full min-w-0 flex-col gap-3">
                            <div className={isStudyPlanExpanded ? "flex-1 min-h-0" : ""}>
                                <DailyPlanView
                                    nextTopic={nextTopic}
                                    nextLesson={nextLesson}
                                    hasRoadmap={Boolean(roadmap?.topics.length)}
                                    completedLessonCount={completedLessonCount}
                                    totalAssignedLessons={totalAssignedLessons}
                                    allAssignedLessonsCompleted={allAssignedLessonsCompleted}
                                    onStudyPlanExpandedChange={setIsStudyPlanExpanded}
                                />
                            </div>

                            {!isStudyPlanExpanded ? (
                                <div className="flex flex-1 min-h-0 flex-col">
                                    <LoginHistoryCard compact stretch />
                                </div>
                            ) : null}
                        </aside>
                    </div>
                </div>
            </div>
        </div>
    );
}
