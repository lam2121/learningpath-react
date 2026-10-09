import { MainNavigationMenu } from "@/common/component/MainNavigationMenu";
import { Skeleton } from "@/shadcn/component/ui/skeleton";

export function LessonSkeleton() {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
            <MainNavigationMenu />

            {/* Mobile Header */}
            <div className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 px-4 py-3 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95 xl:hidden">
                <div className="flex items-center justify-between gap-3">
                    <Skeleton className="h-9 w-24 rounded-md" />
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-6 w-10 rounded-full sm:hidden" />
                    <Skeleton className="hidden h-10 w-10 rounded-full sm:block" />
                </div>
            </div>

            <main className="mx-auto w-full max-w-[1680px] px-3 py-4 sm:px-6 sm:py-6 xl:px-8">
                {/* Course Header */}
                <header className="mb-4 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:mb-5 sm:flex-row sm:items-center sm:justify-between sm:rounded-2xl sm:p-5">
                    <div className="min-w-0">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="mt-2 h-8 w-64 sm:h-9 sm:w-80" />
                        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
                            <Skeleton className="h-5 w-24" />
                            <Skeleton className="h-5 w-24" />
                            <Skeleton className="h-5 w-24" />
                        </div>
                    </div>

                    <div className="hidden items-center gap-3 xl:flex">
                        <div className="text-right">
                            <Skeleton className="ml-auto h-5 w-28" />
                            <Skeleton className="mt-1 h-4 w-40" />
                        </div>
                        <Skeleton className="h-14 w-14 rounded-full" />
                    </div>
                </header>

                <div className="grid items-start gap-4 xl:grid-cols-[300px_minmax(0,1fr)] xl:gap-5 2xl:grid-cols-[320px_minmax(0,1fr)]">
                    {/* Sidebar */}
                    <aside className="sticky top-5 hidden xl:block">
                        <div className="flex max-h-[min(720px,calc(100dvh-7rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <div className="border-b border-slate-200 bg-slate-100 px-5 py-4 dark:border-slate-800 dark:bg-slate-800/80">
                                <Skeleton className="mx-auto h-5 w-3/4" />
                            </div>
                            <div className="p-2 space-y-1">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="flex gap-3 px-3 py-3 rounded-xl">
                                        <Skeleton className="h-7 w-7 rounded-lg" />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="h-5 w-full" />
                                            <Skeleton className="h-4 w-2/3" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </aside>

                    {/* Main Content - Course Outline */}
                    <div className="min-w-0">
                        <section className="overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-sm dark:border-blue-900 dark:bg-slate-900">
                            <header className="flex flex-col gap-3 border-b border-blue-200 bg-blue-50 px-5 py-4 dark:border-blue-900 dark:bg-blue-950/35 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                                <div className="min-w-0">
                                    <Skeleton className="h-3 w-32" />
                                    <Skeleton className="mt-2 h-7 w-64" />
                                </div>
                                <Skeleton className="h-8 w-32 rounded-full" />
                            </header>

                            <div className="space-y-3 p-3 sm:p-5">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                                        <div className="flex w-full items-center gap-3 border-l-4 border-l-slate-300 px-4 py-3.5 sm:px-5 sm:py-4">
                                            <div className="flex min-w-0 flex-1 items-start gap-3">
                                                <Skeleton className="h-10 min-w-10 rounded-lg" />
                                                <div className="min-w-0 flex-1 space-y-2">
                                                    <Skeleton className="h-3 w-16" />
                                                    <Skeleton className="h-5 w-48" />
                                                    <div className="flex gap-4 sm:hidden">
                                                        <Skeleton className="h-4 w-20" />
                                                        <Skeleton className="h-4 w-16" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="hidden shrink-0 items-center gap-4 sm:flex">
                                                <Skeleton className="h-4 w-20" />
                                                <Skeleton className="h-4 w-16" />
                                            </div>
                                            <Skeleton className="hidden h-4 w-16 lg:block" />
                                            <Skeleton className="h-8 w-8 rounded-full" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}
