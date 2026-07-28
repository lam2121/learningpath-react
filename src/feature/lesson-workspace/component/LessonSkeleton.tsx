import { SidebarSkeleton } from "./SidebarSkeleton";
import { LessonHeaderSkeleton } from "./LessonHeaderSkeleton";
import { TheorySkeleton } from "./TheorySkeleton";
import { AICoachSkeleton } from "./AICoachSkeleton";

export function LessonSkeleton() {
    return (
        <div className="min-h-screen bg-slate-50">
            <div className="mx-auto flex max-w-screen-xl gap-6 px-6 py-6">

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