import { SidebarSkeleton } from "./SidebarSkeleton";
import { LessonHeaderSkeleton } from "./LessonHeaderSkeleton";
import { TheorySkeleton } from "./TheorySkeleton";
import { AICoachSkeleton } from "./AICoachSkeleton";

export function LessonSkeleton() {
    return (
        <div className="min-h-screen bg-slate-50">
            <div className="mx-auto flex max-w-screen-2xl gap-6 px-3 py-4 sm:px-6 sm:py-6 xl:px-8">

                <aside className="hidden xl:block w-72 shrink-0">
                    <SidebarSkeleton />
                </aside>

                <main className="flex-1">

                    <LessonHeaderSkeleton />

                    <div className="mt-6">

                        <TheorySkeleton />

                    </div>

                </main>

                <aside className="hidden xl:block w-80 shrink-0">

                    <AICoachSkeleton />

                </aside>

            </div>
        </div>
    );
}