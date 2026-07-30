import { useState } from "react";
import { LessonSidebar } from "./LessonSidebar";
import { LessonHeader } from "./LessonHeader";
import { TheoryView } from "./TheoryView";
import { AICoachPanel } from "./AICoachPanel";
import { LessonBottomNav } from "./LessonBottomNav";
import { Button } from "@/shadcn/component/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/shadcn/component/ui/sheet";
import { BookOpen, Bot, Sparkles } from "lucide-react";

export function LessonWorkspace() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [aiCoachOpen, setAiCoachOpen] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="mx-auto w-full max-w-screen-2xl px-3 py-4 sm:px-6 sm:py-6 xl:px-8">
                {/* Mobile & Tablet Control Bar (< xl) */}
                <div className="sticky top-0 z-20 mb-0 flex items-center justify-between gap-2 rounded-2xl border border-slate-200/80 bg-white/95 backdrop-blur-md p-3 shadow-xs xl:hidden">
                    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="sm" className="flex items-center gap-2 text-xs sm:text-sm font-medium">
                                <BookOpen className="size-4 text-blue-600" />
                                <span>Lesson Outline</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[88vw] max-w-sm overflow-y-auto p-4 sm:p-6">
                            <SheetHeader className="mb-4">
                                <SheetTitle className="flex items-center gap-2 text-base font-semibold">
                                    <BookOpen className="size-5 text-blue-600" />
                                    Lesson Outline
                                </SheetTitle>
                            </SheetHeader>
                            <LessonSidebar />
                        </SheetContent>
                    </Sheet>

                    <div className="text-xs font-medium text-slate-500 hidden sm:block">
                        Lesson 3 / 8: SQL JOIN
                    </div>

                    <Sheet open={aiCoachOpen} onOpenChange={setAiCoachOpen}>
                        <SheetTrigger asChild>
                            <Button size="sm" className="flex items-center gap-2 text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-xs">
                                <Bot className="size-4" />
                                <span>AI Coach</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-[88vw] max-w-sm overflow-y-auto p-4 sm:p-6">
                            <SheetHeader className="mb-4">
                                <SheetTitle className="flex items-center gap-2 text-base font-semibold">
                                    <Sparkles className="size-5 text-blue-600" />
                                    AI Assistant
                                </SheetTitle>
                            </SheetHeader>
                            <AICoachPanel />
                        </SheetContent>
                    </Sheet>
                </div>

                <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
                    {/* Left Sidebar */}
                    <aside className="hidden xl:block">
                        <LessonSidebar />
                    </aside>

                    {/* Main Workspace */}
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