import { useEffect, useState } from "react";
import { Award, BookOpen, GraduationCap, History, Medal } from "lucide-react";
import { useTranslation } from "react-i18next";

import { MainNavigationMenu } from "@/common/component/MainNavigationMenu";
import { LessonQuizHistoryCard } from "@/feature/user-profile/component/LearningHistoryChart";
import { TopicQuizHistoryCard } from "@/feature/user-profile/component/TopicQuizHistoryCard";
import { FinalQuizHistoryCard } from "@/feature/user-profile/component/FinalQuizHistoryCard";
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
        <div className="min-h-screen w-full bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.12),_transparent_28%),linear-gradient(180deg,_#fbfdff_0%,_#f2f7ff_100%)]">
            <MainNavigationMenu />

            <div className="mx-auto w-full max-w-[1480px] px-3 pb-5 pt-3 sm:px-5 lg:px-8">
                <div className="mt-2 space-y-4">
                    {/* Header Banner */}
                    <section className="relative overflow-hidden rounded-[28px] border border-sky-100 bg-[linear-gradient(135deg,#f6fbff_0%,#ffffff_42%,#eaf4ff_100%)] p-4 shadow-[0_20px_56px_rgba(96,165,250,0.12)] sm:p-5">
                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(125,211,252,0.16),_transparent_26%),radial-gradient(circle_at_bottom_left,_rgba(186,230,253,0.18),_transparent_24%)]" />

                        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="max-w-3xl">
                                <p className="inline-flex rounded-full bg-cyan-600 px-3 py-1 text-sm font-semibold uppercase tracking-[0.14em] text-white shadow-sm">
                                    {t("page.badge", { defaultValue: "History" })}
                                </p>
                                <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                                    Assessment History
                                </h1>
                                <p className="mt-2 text-base font-medium leading-7 text-slate-600 sm:text-lg">
                                    Review the highest saved attempt for your lesson quizzes, topic assessments, and final graduation examination.
                                </p>
                            </div>

                            <div className="flex items-center gap-3 self-start rounded-2xl bg-white/90 px-4 py-3 shadow-[0_10px_24px_rgba(96,165,250,0.12)] ring-1 ring-sky-100">
                                <div className="rounded-xl bg-amber-50 p-2 text-amber-700">
                                    <Medal className="h-5 w-5" />
                                </div>
                                <div className="rounded-xl bg-sky-50 p-2 text-sky-600">
                                    <History className="h-5 w-5" />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Quiz Type Tabs: Lessons, Topics, Final Course Quiz */}
                    <Tabs defaultValue="lessons" className="w-full">
                        <div className="flex justify-start">
                            <TabsList className="h-12 w-full flex-wrap sm:w-auto p-1 bg-white/90 border border-cyan-100 shadow-[0_8px_20px_rgba(96,165,250,0.12)] rounded-2xl gap-1">
                                <TabsTrigger
                                    value="lessons"
                                    className="h-10 rounded-xl px-4 text-xs font-bold sm:text-sm data-[state=active]:bg-[#0072BB] data-[state=active]:text-white data-[state=active]:shadow-md"
                                >
                                    <BookOpen className="mr-1.5 h-4 w-4" />
                                    Lesson Quizzes ({lessonCount})
                                </TabsTrigger>

                                <TabsTrigger
                                    value="topics"
                                    className="h-10 rounded-xl px-4 text-xs font-bold sm:text-sm data-[state=active]:bg-[#0072BB] data-[state=active]:text-white data-[state=active]:shadow-md"
                                >
                                    <GraduationCap className="mr-1.5 h-4 w-4" />
                                    Topic Quizzes ({topicCount})
                                </TabsTrigger>

                                <TabsTrigger
                                    value="final"
                                    className="h-10 rounded-xl px-4 text-xs font-bold sm:text-sm data-[state=active]:bg-[#0072BB] data-[state=active]:text-white data-[state=active]:shadow-md"
                                >
                                    <Award className="mr-1.5 h-4 w-4" />
                                    Final Course Quiz
                                    {finalStatus && (
                                        <span className="ml-1.5 rounded-full bg-white/20 px-2 py-0.5 text-[10px] uppercase">
                                            {finalStatus}
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

