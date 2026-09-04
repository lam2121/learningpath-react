import { History, Medal } from "lucide-react";
import { useTranslation } from "react-i18next";

import { MainNavigationMenu } from "@/common/component/MainNavigationMenu";
import { LessonQuizHistoryCard } from "@/feature/user-profile/component/LearningHistoryChart";

export function HistoryPage() {
    const { t } = useTranslation("history");
    return (
        <div className="min-h-screen w-full bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.12),_transparent_28%),linear-gradient(180deg,_#fbfdff_0%,_#f2f7ff_100%)]">
            <MainNavigationMenu />

            <div className="mx-auto w-full max-w-[1480px] px-3 pb-5 pt-3 sm:px-5 lg:px-8">
                <div className="mt-2 space-y-4">
                    <section className="relative overflow-hidden rounded-[28px] border border-sky-100 bg-[linear-gradient(135deg,#f6fbff_0%,#ffffff_42%,#eaf4ff_100%)] p-4 shadow-[0_20px_56px_rgba(96,165,250,0.12)] sm:p-5">
                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(125,211,252,0.16),_transparent_26%),radial-gradient(circle_at_bottom_left,_rgba(186,230,253,0.18),_transparent_24%)]" />

                        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="max-w-3xl">
                                <p className="inline-flex rounded-full bg-cyan-600 px-3 py-1 text-sm font-semibold uppercase tracking-[0.14em] text-white shadow-sm">
                                    {t("page.badge")}
                                </p>
                                <h1 className="mt-3 text-5xl font-black tracking-tight text-slate-950 sm:text-6xl">
                                    {t("page.title")}
                                </h1>
                                <p className="mt-3 text-lg font-medium leading-8 text-slate-600 sm:text-xl">
                                    {t("page.subtitle")}
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

                    <LessonQuizHistoryCard excludedStatuses={["in_progress"]} />
                </div>
            </div>
        </div>
    );
}
