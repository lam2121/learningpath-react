import { useState } from "react";
import { Link, useNavigate, useRouter } from "@tanstack/react-router";

import { useAuth } from "@/common/context/AuthContext";

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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/shadcn/component/ui/dropdown-menu";

import {
    BookOpen,
    Bot,
    Sparkles,
    User,
    CircleUser,
    History,
    LogOut,
} from "lucide-react";

import { NotificationDropdown } from "@/feature/user-profile/component/NotificationDropdown";
import { StreakDropdown } from "@/feature/user-profile/component/StreakDropdown";

export function LessonWorkspace() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [aiCoachOpen, setAiCoachOpen] = useState(false);

    const auth = useAuth();
    const router = useRouter();
    const navigate = useNavigate();

    const handleLogout = async () => {
        if (window.confirm("Are you sure you want to logout?")) {
            try {
                auth.logout();
                await router.invalidate();
                await navigate({ to: "/home" });
            } catch (error) {
                console.error("Logout error:", error);
            }
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* ================= Top Control Bar ================= */}
            <div className="sticky top-0 z-20 flex w-full items-center justify-between gap-2 border-b border-slate-200/80 bg-white/95 px-4 py-3 shadow-sm backdrop-blur-md sm:px-6 xl:hidden relative">

                {/* --- KHU VỰC BÊN TRÁI: Lesson Outline --- */}
                <div className="flex items-center z-10">
                    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                        <SheetTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-2 text-xs font-medium sm:text-sm"
                            >
                                <BookOpen className="size-4 text-blue-600" />
                                <span>Lesson Outline</span>
                            </Button>
                        </SheetTrigger>

                        <SheetContent
                            side="left"
                            className="w-[88vw] max-w-sm overflow-y-auto p-4 sm:p-6"
                        >
                            <SheetHeader className="mb-4">
                                <SheetTitle className="flex items-center gap-2 text-base font-semibold">
                                    <BookOpen className="size-5 text-blue-600" />
                                    Lesson Outline
                                </SheetTitle>
                            </SheetHeader>

                            <LessonSidebar />
                        </SheetContent>
                    </Sheet>
                </div>

                {/* --- KHU VỰC CHÍNH GIỮA: Tiêu đề bài học --- */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block z-0 pointer-events-none">
                    <span className="text-sm font-semibold text-slate-700">
                        Lesson 3 / 8: SQL JOIN
                    </span>
                </div>

                {/* --- KHU VỰC BÊN PHẢI: AI Coach + Nhóm công cụ User --- */}
                <div className="flex items-center gap-2 sm:gap-3 z-10">
                    {/* Đã giảm gap xuống gap-2 sm:gap-3 để AI Coach gần hơn với nhóm User */}

                    {/* AI Coach */}
                    <Sheet open={aiCoachOpen} onOpenChange={setAiCoachOpen}>
                        <SheetTrigger asChild>
                            <Button
                                size="sm"
                                className="flex items-center gap-2 bg-blue-600 text-xs text-white shadow-xs hover:bg-blue-700 sm:text-sm"
                            >
                                <Bot className="size-4" />
                                <span className="hidden sm:inline">AI Coach</span>
                            </Button>
                        </SheetTrigger>

                        <SheetContent
                            side="right"
                            className="w-[88vw] max-w-sm overflow-y-auto p-4 sm:p-6"
                        >
                            <SheetHeader className="mb-4">
                                <SheetTitle className="flex items-center gap-2 text-base font-semibold">
                                    <Sparkles className="size-5 text-blue-600" />
                                    AI Assistant
                                </SheetTitle>
                            </SheetHeader>

                            <AICoachPanel />
                        </SheetContent>
                    </Sheet>

                    {/* User Menu & Indicators */}
                    {auth.isAuthenticated && (
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            {/* Đã giảm gap xuống gap-1.5 sm:gap-2 để Chuông, Lửa, Avatar sát nhau hơn */}
                            <NotificationDropdown />
                            <StreakDropdown />

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="flex items-center space-x-2 text-[15px]"
                                    >
                                        <User className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent
                                    align="end"
                                    className="w-52"
                                >
                                    <DropdownMenuLabel className="text-center">
                                        <div className="space-y-1">
                                            <p className="text-base font-semibold">
                                                {auth.user?.username || "User"}
                                            </p>

                                            <p className="text-xs text-muted-foreground">
                                                {auth.user?.email}
                                            </p>
                                        </div>
                                    </DropdownMenuLabel>

                                    <DropdownMenuSeparator />

                                    <DropdownMenuItem asChild>
                                        <Link
                                            to="/profile"
                                            className="cursor-pointer text-base font-medium"
                                        >
                                            <CircleUser className="mr-2 h-4 w-4" />
                                            Profile
                                        </Link>
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator />

                                    <DropdownMenuItem asChild>
                                        <Link
                                            to="/history"
                                            className="cursor-pointer text-base font-medium"
                                        >
                                            <History className="mr-2 h-4 w-4" />
                                            History
                                        </Link>
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator />

                                    <DropdownMenuItem
                                        asChild
                                        className="hover:!bg-red-50"
                                    >
                                        <button
                                            onClick={handleLogout}
                                            className="flex w-full cursor-pointer items-center text-base font-medium text-red-600 transition-colors duration-200 hover:!text-red-600"
                                        >
                                            <LogOut className="mr-2 h-4 w-4 text-red-600" />
                                            <span>Log-out</span>
                                        </button>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    )}
                </div>
            </div>

            {/* ================= Main Content ================= */}
            <div className="mx-auto w-full px-3 py-4 sm:px-6 sm:py-6 xl:px-8">
                <div className="mb-6">
                    <LessonHeader />
                </div>

                <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
                    {/* Sidebar */}
                    <aside className="hidden xl:block">
                        <LessonSidebar />
                    </aside>

                    {/* Theory */}
                    <main className="min-w-0">
                        <TheoryView />

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