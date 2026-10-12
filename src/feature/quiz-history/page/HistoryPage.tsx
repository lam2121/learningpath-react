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
        <div className="min-h-[100dvh] w-full max-w-[100vw] overflow-x-hidden bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.12),_transparent_28%),linear-gradient(180deg,_#fbfdff_0%,_#f2f7ff_100%)] transition-colors dark:bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.1),_transparent_28%),linear-gradient(180deg,_#090d16_0%,_#0f172a_100%)]">
            <MainNavigationMenu />

            <div className="mx-auto w-full max-w-[1480px] px-3 pb-5 pt-3 sm:px-5 lg:px-8">
                <div className="mt-2 space-y-4">
                    {/* Header Banner */}
                    <section className="relative overflow-hidden rounded-[28px] border border-sky-100 bg-[linear-gradient(135deg,#f6fbff_0%,#ffffff_42%,#eaf4ff_100%)] p-4 shadow-[0_20px_56px_rgba(96,165,250,0.12)] sm:p-5 dark:border-sky-900/40 dark:bg-[linear-gradient(135deg,_rgba(30,58,138,0.25)_0%,_rgba(15,23,42,0.95)_42%,_rgba(15,23,42,1)_100%)] dark:shadow-[0_20px_56px_rgba(0,0,0,0.45)]">
                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(125,211,252,0.16),_transparent_26%),radial-gradient(circle_at_bottom_left,_rgba(186,230,253,0.18),_transparent_24%)] dark:bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.15),_transparent_26%),radial-gradient(circle_at_bottom_left,_rgba(125,211,252,0.1),_transparent_24%)]" />

                        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="max-w-3xl">
                                <p className="inline-flex rounded-full bg-cyan-600 px-3 py-1 text-sm font-semibold uppercase tracking-[0.14em] text-white shadow-sm dark:bg-cyan-500">
                                    {t("page.badge", { defaultValue: "History" })}
                                </p>
                                <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl dark:text-white">
                                    {t("page.title", { defaultValue: "Assessment History" })}
                                </h1>
                                <p className="mt-2 text-base font-medium leading-7 text-slate-600 sm:text-lg dark:text-slate-300">
                                    {t("page.subtitle", { defaultValue: "Review the highest saved attempt for your lesson quizzes, topic assessments, and final graduation examination." })}
                                </p>
                            </div>

                            <div className="flex items-center gap-3 self-start rounded-2xl bg-white/90 px-4 py-3 shadow-[0_10px_24px_rgba(96,165,250,0.12)] ring-1 ring-sky-100 dark:bg-slate-800/90 dark:ring-slate-700 dark:shadow-[0_10px_24px_rgba(0,0,0,0.3)]">
                                <div className="rounded-xl bg-amber-50 p-2 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
                                    <Medal className="h-5 w-5" />
                                </div>
                                <div className="rounded-xl bg-sky-50 p-2 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400">
                                    <History className="h-5 w-5" />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Quiz Type Tabs: Lessons, Topics, Final Course Quiz */}
                    <Tabs defaultValue="lessons" className="w-full">
                        <div className="flex justify-start">
                            <TabsList className="h-12 w-full flex-wrap sm:w-auto p-1 bg-white/90 border border-cyan-100 shadow-[0_8px_20px_rgba(96,165,250,0.12)] rounded-2xl gap-1 dark:bg-slate-900/90 dark:border-slate-800 dark:shadow-[0_8px_20px_rgba(0,0,0,0.4)]">
                                <TabsTrigger
                                    value="lessons"
                                    className="h-10 rounded-xl px-4 text-xs font-bold sm:text-sm text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white data-[state=active]:bg-[#0072BB] data-[state=active]:text-white dark:data-[state=active]:bg-blue-600 data-[state=active]:shadow-md"
                                >
                                    <BookOpen className="mr-1.5 h-4 w-4" />
                                    {t("page.tabs.lessons", { count: lessonCount, defaultValue: `Lesson Quizzes (${lessonCount})` })}
                                </TabsTrigger>

                                <TabsTrigger
                                    value="topics"
                                    className="h-10 rounded-xl px-4 text-xs font-bold sm:text-sm text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white data-[state=active]:bg-[#0072BB] data-[state=active]:text-white dark:data-[state=active]:bg-blue-600 data-[state=active]:shadow-md"
                                >
                                    <GraduationCap className="mr-1.5 h-4 w-4" />
                                    {t("page.tabs.topics", { count: topicCount, defaultValue: `Topic Quizzes (${topicCount})` })}
                                </TabsTrigger>

                                <TabsTrigger
                                    value="final"
                                    className="h-10 rounded-xl px-4 text-xs font-bold sm:text-sm text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white data-[state=active]:bg-[#0072BB] data-[state=active]:text-white dark:data-[state=active]:bg-blue-600 data-[state=active]:shadow-md"
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

