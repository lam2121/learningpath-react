import { useEffect, useState } from "react";
import { Award, BookOpen, GraduationCap, History, Medal } from "lucide-react";
import { useTranslation } from "react-i18next";

import { MainNavigationMenu } from "@/common/component/MainNavigationMenu";
import { LessonQuizHistoryCard } from "../component/lesson";
import { TopicQuizHistoryCard } from "../component/topic";
import { FinalQuizHistoryCard } from "../component/final";
import { fetchCurrentUserProfile } from "@/feature/auth/api/authAPI";
import type { UserProfileResponse } from "@/feature/auth/type/Auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shadcn/component/ui/tabs";

export function HistoryPage() {
    const { t } = useTranslation("history");
    const [profile, setProfile] = useState<UserProfileResponse | null>(null);

    useEffect(() => {
        let isMounted = true;
        const load = async () => {
            try {
                const res = await fetchCurrentUserProfile();
                if (isMounted) setProfile(res);
            } catch {
                if (isMounted) setProfile(null);
            }
        };
        void load();
        return () => {
            isMounted = false;
        };
    }, []);

    const lessonCount = profile?.lesson_quiz_history?.length ?? 0;
    const topicCount = profile?.topic_quiz_history?.length ?? 0;
    const finalStatus = profile?.final_quiz_history?.[0]?.status ?? null;

    return (
        <div className="min-h-screen bg-background text-foreground relative transition-colors">
            <MainNavigationMenu />

            <div className="mx-auto w-full max-w-[1480px] px-3 pb-8 pt-3 sm:px-5 lg:px-8 mobile-page-bottom mobile-page-enter">
                <div className="mt-2 space-y-5">
                    {/* Header Banner */}
                    <section className="relative overflow-hidden rounded-3xl border border-border/80 bg-card p-5 sm:p-8 shadow-elevation-2">
                        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
                        <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-accent-violet/10 blur-3xl" />

                        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="max-w-3xl space-y-2">
                                <p className="inline-flex rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary shadow-2xs">
                                    {t("page.badge", { defaultValue: "History" })}
                                </p>
                                <h1 className="font-display text-2xl font-black tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                                    {t("page.title", { defaultValue: "Assessment History" })}
                                </h1>
                                <p className="text-sm sm:text-base font-normal leading-relaxed text-muted-foreground">
                                    {t("page.subtitle", { defaultValue: "Review the highest saved attempt for your lesson quizzes, topic assessments, and final graduation examination." })}
                                </p>
                            </div>

                            <div className="hidden sm:flex items-center gap-3 self-start rounded-2xl bg-card border border-border px-4 py-3 shadow-elevation-1">
                                <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-600 dark:text-amber-400">
                                    <Medal className="h-5 w-5" />
                                </div>
                                <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                                    <History className="h-5 w-5" />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Quiz Type Tabs: Lessons, Topics, Final Course Quiz */}
                    <Tabs defaultValue="lessons" className="w-full">
                        <div className="flex justify-start">
                            <TabsList className="h-12 w-full grid grid-cols-3 sm:w-auto sm:flex p-1 bg-muted/60 border border-border shadow-elevation-1 rounded-2xl gap-1.5">
                                <TabsTrigger
                                    value="lessons"
                                    className="h-10 rounded-xl px-4 text-xs font-bold sm:text-sm text-muted-foreground hover:text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-xs transition-all active:scale-95"
                                >
                                    <BookOpen className="mr-1.5 h-4 w-4" />
                                    {t("page.tabs.lessons", { count: lessonCount, defaultValue: `Lesson Quizzes (${lessonCount})` })}
                                </TabsTrigger>

                                <TabsTrigger
                                    value="topics"
                                    className="h-10 rounded-xl px-4 text-xs font-bold sm:text-sm text-muted-foreground hover:text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-xs transition-all active:scale-95"
                                >
                                    <GraduationCap className="mr-1.5 h-4 w-4" />
                                    {t("page.tabs.topics", { count: topicCount, defaultValue: `Topic Quizzes (${topicCount})` })}
                                </TabsTrigger>

                                <TabsTrigger
                                    value="final"
                                    className="h-10 rounded-xl px-4 text-xs font-bold sm:text-sm text-muted-foreground hover:text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-xs transition-all active:scale-95"
                                >
                                    <Award className="mr-1.5 h-4 w-4" />
                                    {t("page.tabs.final", { defaultValue: "Final Course Quiz" })}
                                    {finalStatus && (
                                        <span className="ml-1.5 rounded-full bg-white/20 px-2 py-0.5 text-[10px] uppercase">
                                            {finalStatus === "passed"
                                                ? t("topicQuiz.filters.passed", { defaultValue: "Passed" })
                                                : finalStatus === "failed"
                                                    ? t("topicQuiz.filters.failed", { defaultValue: "Failed" })
                                                    : finalStatus}
                                        </span>
                                    )}
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="lessons" className="mt-4 focus-visible:outline-none">
                            <LessonQuizHistoryCard excludedStatuses={["in_progress"]} />
                        </TabsContent>

                        <TabsContent value="topics" className="mt-4 focus-visible:outline-none">
                            <TopicQuizHistoryCard />
                        </TabsContent>

                        <TabsContent value="final" className="mt-4 focus-visible:outline-none">
                            <FinalQuizHistoryCard />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}

