import { History, Medal } from "lucide-react";

import { MainNavigationMenu } from "@/common/component/MainNavigationMenu";
import { LessonQuizHistoryCard } from "@/feature/user-profile/component/LearningHistoryChart";

export function HistoryPage() {
    return (
        <div className="min-h-screen w-full bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),_transparent_28%),linear-gradient(180deg,_#f8fbff_0%,_#eef4ff_100%)]">
            <MainNavigationMenu />

            <div className="mx-auto w-full max-w-[1480px] px-3 pb-5 pt-3 sm:px-5 lg:px-8">
                <div className="mt-2 space-y-4">
                    <section className="relative overflow-hidden rounded-[28px] border border-blue-200 bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_42%,#dbeafe_100%)] p-4 shadow-[0_24px_70px_rgba(37,99,235,0.14)] sm:p-5">
                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.2),_transparent_26%),radial-gradient(circle_at_bottom_left,_rgba(125,211,252,0.2),_transparent_24%)]" />

                        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="max-w-3xl">
                                <p className="inline-flex rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-white shadow-sm">
                                    History
                                </p>
                                <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                                    Best lesson quiz scores
                                </h1>
                                <p className="mt-3 text-base font-medium leading-7 text-slate-600">
                                    Review the highest weighted score saved for each lesson, grouped more tightly so you can scan topic progress faster.
                                </p>
                            </div>

                            <div className="flex items-center gap-3 self-start rounded-2xl bg-white px-4 py-3 shadow-[0_12px_30px_rgba(37,99,235,0.18)] ring-1 ring-blue-100">
                                <div className="rounded-xl bg-amber-50 p-2 text-amber-700">
                                    <Medal className="h-5 w-5" />
                                </div>
                                <div className="rounded-xl bg-blue-50 p-2 text-blue-700">
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
