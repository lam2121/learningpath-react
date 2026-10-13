import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Layers3, Loader2, Play, Sparkles, Target, BarChart2 } from "lucide-react";
import { cn } from "@/shadcn/lib/util";

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
    const [isLoading, setIsLoading] = useState(true);
    const [isStudyPlanExpanded, setIsStudyPlanExpanded] = useState(false);
    const [mobileTab, setMobileTab] = useState<'roadmap' | 'plan' | 'stats'>('roadmap');

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
        <div className="min-h-screen bg-background text-foreground relative transition-colors">
            <MainNavigationMenu />

            <div className="w-full px-3 pb-8 pt-3 sm:px-5 lg:px-8 mobile-page-bottom mobile-page-enter">
                {/* ── PHONE MODE (md:hidden) ── */}
                <div className="md:hidden mt-1 space-y-3">
                    {/* Native App-Style Segment Switcher */}
                    <div className="flex p-1 rounded-2xl bg-card border border-border shadow-elevation-1">
                        <button
                            type="button"
                            onClick={() => setMobileTab('roadmap')}
                            className={cn(
                                "flex-1 py-2 px-2 text-xs font-bold rounded-xl transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-1.5",
                                mobileTab === 'roadmap'
                                    ? "bg-primary text-primary-foreground shadow-xs font-bold"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <BookOpen className="h-3.5 w-3.5" />
                            <span>Lộ trình</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setMobileTab('plan')}
                            className={cn(
                                "flex-1 py-2 px-2 text-xs font-bold rounded-xl transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-1.5",
                                mobileTab === 'plan'
                                    ? "bg-blue-600 text-white shadow-xs"
                                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                            )}
                        >
                            <Target className="h-3.5 w-3.5" />
                            <span>Mục tiêu</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setMobileTab('stats')}
                            className={cn(
                                "flex-1 py-2 px-2 text-xs font-bold rounded-xl transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-1.5",
                                mobileTab === 'stats'
                                    ? "bg-blue-600 text-white shadow-xs"
                                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                            )}
                        >
                            <BarChart2 className="h-3.5 w-3.5" />
                            <span>Hồ sơ & Kỹ năng</span>
                        </button>
                    </div>

                    {/* Tab 1: Roadmap & Up Next Lesson */}
                    {mobileTab === 'roadmap' && (
                        <div className="space-y-3">
                            <div className="rounded-2xl border border-blue-200 bg-white dark:border-blue-900/80 dark:bg-slate-900 p-4 shadow-sm">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-950/80 px-2.5 py-0.5 text-[11px] font-bold text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                        <Sparkles className="h-3 w-3" />
                                        {userProfileTexts.nextStepBadge()}
                                    </span>
                                    {totalAssignedLessons > 0 && (
                                        <span className="text-xs font-bold text-slate-500">
                                            {completedLessonCount}/{totalAssignedLessons} bài ({progressPercent}%)
                                        </span>
                                    )}
                                </div>

                                {nextLesson ? (
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                                                {nextTopic?.name || 'Topic'}
                                            </p>
                                            <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                                                {nextLesson.title}
                                            </h3>
                                        </div>

                                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-500"
                                                style={{ width: `${progressPercent}%` }}
                                            />
                                        </div>

                                        <Button asChild className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold text-sm shadow-md shadow-blue-500/20">
                                            <Link to={`/lessons/${nextLesson.id}`}>
                                                <Play className="h-4 w-4 mr-1.5 fill-current" />
                                                Học bài tiếp theo ngay
                                            </Link>
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="text-center py-3">
                                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                            {allAssignedLessonsCompleted ? "Chúc mừng! Bạn đã hoàn thành tất cả bài học." : "Lộ trình đang được cập nhật."}
                                        </p>
                                    </div>
                                )}

                                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                    <span className="text-xs text-slate-500">
                                        {roadmap?.topics?.length ?? 0} chủ đề · {formatHours(roadmap?.total_estimated_minutes)}
                                    </span>
                                    <Button asChild variant="ghost" size="sm" className="h-7 text-xs font-bold text-blue-600 hover:text-blue-800 dark:text-blue-400 p-0">
                                        <Link to="/lessons/learning-path" className="flex items-center gap-1">
                                            Toàn bộ lộ trình
                                            <ArrowRight className="h-3 w-3" />
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab 2: Daily Plan & AI Coach */}
                    {mobileTab === 'plan' && (
                        <div>
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
                    )}

                    {/* Tab 3: Profile, Skills Radar & History */}
                    {mobileTab === 'stats' && (
                        <div className="space-y-4">
                            <UserProfileCard />
                            <LearningHistoryChart showLoginHistory />
                            <LoginHistoryCard compact stretch />
                        </div>
                    )}
                </div>

                {/* ── DESKTOP MODE (hidden md:block) ── */}
                <div className="hidden md:block mt-2 space-y-6">
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

                                <Card className="group relative overflow-hidden rounded-3xl border border-border/80 bg-card py-0 gap-0 shadow-elevation-2 transition-all duration-300 hover:shadow-elevation-4">
                                    {/* Top Brand Highlight Accent Bar */}
                                    <div className="h-2 w-full bg-gradient-to-r from-primary via-accent-violet to-primary" />

                                    {/* Ambient light blooms */}
                                    <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
                                    <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-accent-violet/10 blur-3xl" />

                                    <CardHeader className="relative px-6 pb-4 pt-4 sm:px-8 sm:pt-5">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="space-y-3">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary shadow-2xs">
                                                        <span className="relative flex h-2 w-2">
                                                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                                                            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                                                        </span>
                                                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                                                        {userProfileTexts.nextStepBadge()}
                                                    </span>

                                                    {totalAssignedLessons > 0 ? (
                                                        <span className="rounded-full border border-border bg-card px-3 py-1 text-xs font-bold text-foreground shadow-2xs">
                                                            {userProfileTexts.lessonProgressFraction(completedLessonCount, totalAssignedLessons, progressPercent)}
                                                        </span>
                                                    ) : null}
                                                </div>

                                                <CardTitle className="font-display text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-foreground">
                                                    <span className="relative inline-block">
                                                        <span className="relative z-10">{userProfileTexts.exploreLearningPath()}</span>
                                                        {/* Authentic Highlighter Marker Stroke */}
                                                        <span
                                                            aria-hidden="true"
                                                            className="absolute bottom-1 sm:bottom-1.5 left-0 right-0 h-3.5 sm:h-4.5 -rotate-0.5 rounded-sm bg-gradient-to-r from-yellow-300/70 via-yellow-200/80 to-amber-200/60 dark:from-yellow-400/30 dark:via-yellow-300/20 dark:to-transparent -z-0 pointer-events-none"
                                                        />
                                                    </span>
                                                </CardTitle>

                                                <p className="max-w-2xl text-sm sm:text-base font-medium leading-relaxed text-muted-foreground">
                                                    {userProfileTexts.continueRoadmap()}
                                                </p>

                                                {/* Mini curriculum progress bar */}
                                                {totalAssignedLessons > 0 ? (
                                                    <div className="pt-1 max-w-md">
                                                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                                                            <div
                                                                className="h-full rounded-full bg-gradient-to-r from-primary to-accent-violet transition-all duration-700 ease-out"
                                                                style={{ width: `${progressPercent}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                ) : null}
                                            </div>

                                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
                                                <BookOpen className="h-5 w-5" />
                                            </div>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="relative px-6 pb-6 pt-0 sm:px-8 sm:pb-8">
                                        {isLoading ? (
                                            <div className="flex min-h-[120px] items-center gap-3 rounded-2xl border border-border bg-card px-5 text-muted-foreground font-medium">
                                                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                                {userProfileTexts.loadingLearningPath()}
                                            </div>
                                        ) : (
                                            <div className="rounded-2xl border border-border bg-card/90 p-5 shadow-xs backdrop-blur-md">
                                                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                                                    <div className="space-y-3.5">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            {roadmap?.track ? (
                                                                <>
                                                                    <span className={`rounded-full px-3.5 py-1 text-xs font-bold uppercase tracking-wider ${getTrackBadgeClasses(roadmap.track)}`}>
                                                                        {userProfileTexts.trackName(roadmap.track)}
                                                                    </span>
                                                                    <span className="rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-bold text-foreground">
                                                                        {userProfileTexts.topicsCount(roadmap.topics.length)}
                                                                    </span>
                                                                    {roadmap.total_estimated_minutes > 0 ? (
                                                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-bold text-foreground">
                                                                            <Layers3 className="h-3.5 w-3.5 text-primary" />
                                                                            {formatHours(roadmap.total_estimated_minutes)}
                                                                        </span>
                                                                    ) : null}
                                                                </>
                                                            ) : (
                                                                <span className="rounded-full bg-muted px-3.5 py-1 text-xs font-bold text-foreground">
                                                                    {userProfileTexts.exploreTopics()}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Up Next Lesson & Topic Callout Strip */}
                                                        {nextLesson ? (
                                                            <div className="flex flex-wrap items-center gap-2.5 rounded-2xl border border-primary/20 bg-primary/5 p-3 text-xs text-foreground shadow-2xs backdrop-blur-xs">
                                                                <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-primary">
                                                                    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xs">
                                                                        <Play className="ml-0.5 h-2.5 w-2.5 fill-current" />
                                                                    </span>
                                                                    <span>{userProfileTexts.upNextLabel()}</span>
                                                                </div>

                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <span className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-2.5 py-1 text-xs font-bold text-foreground shadow-2xs">
                                                                        <span className="text-primary font-extrabold uppercase text-[11px] tracking-wide">
                                                                            {userProfileTexts.lessonLabelPrefix()}
                                                                        </span>
                                                                        <span>'{nextLesson.title}'</span>
                                                                    </span>

                                                                    {nextTopic ? (
                                                                        <span className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-muted/60 px-2.5 py-1 text-xs font-bold text-foreground shadow-2xs">
                                                                            <span className="text-primary font-extrabold uppercase text-[11px] tracking-wide">
                                                                                {userProfileTexts.topicLabelPrefix()}
                                                                            </span>
                                                                            <span>{nextTopic.name}</span>
                                                                        </span>
                                                                    ) : null}
                                                                </div>
                                                            </div>
                                                        ) : null}

                                                        <p className="max-w-3xl text-sm sm:text-base font-medium leading-relaxed text-muted-foreground">
                                                            {roadmap?.topics.length
                                                                ? userProfileTexts.openRoadmapDesc()
                                                                : userProfileTexts.openRoadmapPendingDesc()}
                                                        </p>
                                                    </div>

                                                    <Button asChild className="group h-12 min-w-[220px] rounded-2xl bg-primary hover:bg-primary/90 text-base font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-200 active:scale-95">
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
