import { LessonSidebar } from "./LessonSidebar";
import { LessonHeader } from "./LessonHeader";
import { TheoryView } from "./TheoryView";
import { AICoachPanel } from "./AICoachPanel";
import { LessonBottomNav } from "./LessonBottomNav";

export function LessonWorkspace() {
    return (
        <div className="min-h-screen bg-slate-50">

            <div
                className="
                    mx-auto
                    w-full
                    max-w-screen-2xl
                    px-4
                    py-6
                    md:px-6
                    xl:px-8
                "
            >
                <div
                    className="
                        grid
                        gap-6
                        xl:grid-cols-[280px_minmax(0,1fr)_320px]
                    "
                >
                    {/* Left Sidebar */}
                    <aside className="hidden xl:block">
                        <LessonSidebar />
                    </aside>

                    {/* Main */}
                    <main className="min-w-0">
                        <LessonHeader />

                        <div className="mt-6">
                            <TheoryView />
                        </div>

                        <div className="mt-8">
                            <LessonBottomNav />
                        </div>
                    </main>

                    {/* AI Coach */}
                    <aside className="hidden xl:block">
                        <AICoachPanel />
                    </aside>
                </div>
            </div>
        </div>
    );
}