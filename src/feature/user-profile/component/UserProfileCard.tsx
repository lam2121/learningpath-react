import { Card, CardContent } from "@/shadcn/component/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/shadcn/component/ui/avatar";
import { Badge } from "@/shadcn/component/ui/badge";
import {
    CalendarDays, Clock3, Target, Camera,
    Flame,
    GraduationCap,
    BookOpen,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useAuth } from "@/common/context/AuthContext";
import { getLoginDays, calculateLongestStreak } from "@/feature/user-profile/utils/StudyActivity";

export function UserProfileCard() {
    const { user } = useAuth();

    // ── Avatar ──────────────────────────────────────────────────────────────
    const [avatarUrl, setAvatarUrl] = useState(() => {
        const savedAvatar = localStorage.getItem("user_avatar");
        return savedAvatar || "/avatar.png";
    });
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !file.type.startsWith("image/")) return;
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === "string") {
                setAvatarUrl(reader.result);
                localStorage.setItem("user_avatar", reader.result);
            }
        };
        reader.readAsDataURL(file);
        event.target.value = "";
    };

    // ── User info ────────────────────────────────────────────────────────────
    const displayName = user?.username ?? user?.email ?? "Anonymous";
    const initials = displayName
        .split(" ")
        .map((w) => w[0]?.toUpperCase() ?? "")
        .slice(0, 2)
        .join("");

    // ── Streak from localStorage ─────────────────────────────────────────────
    const longestStreak = useMemo(() => {
        if (!user?.id) return 0;
        return calculateLongestStreak(getLoginDays(user.id));
    }, [user?.id]);

    // TODO: Replace with real API data when backend endpoints are ready
    const lessonsCompleted = 0;   // fetch from API
    const accuracy = 0;           // fetch from API
    const studyHours = 0;         // fetch from API

    return (
        <Card className="overflow-hidden border-white/70 bg-white/90 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
            <div className="h-28 bg-[linear-gradient(135deg,_rgba(37,99,235,0.95)_0%,_rgba(14,165,233,0.82)_46%,_rgba(226,232,240,0.55)_100%)]" />

            <CardContent className="p-6">
                <div className="-mt-16 flex flex-col gap-6">
                    <div className="flex flex-col gap-5">
                        <div className="flex flex-col gap-4">
                            <div className="relative inline-flex w-fit">
                                <Avatar className="h-20 w-20 border-4 border-white shadow-md">
                                    <AvatarImage
                                        src={avatarUrl}
                                        alt={displayName}
                                        className="object-cover"
                                    />
                                    <AvatarFallback>{initials || "?"}</AvatarFallback>
                                </Avatar>

                                <button
                                    type="button"
                                    aria-label="Change avatar"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-white shadow-md transition hover:bg-blue-700"
                                >
                                    <Camera className="h-4 w-4" />
                                </button>
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                onChange={handleAvatarChange}
                                className="hidden"
                            />

                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                {/* Name */}
                                <div className="min-w-0 space-y-2">
                                    <h2 className="text-2xl font-bold text-slate-900">
                                        {displayName}
                                    </h2>

                                    <div className="flex flex-wrap gap-2">
                                        <Badge className="rounded-full bg-slate-900 px-3 py-1 text-white hover:bg-slate-900">
                                            Full Stack Developer
                                        </Badge>

                                        <Badge
                                            variant="secondary"
                                            className="rounded-full px-3 py-1 text-slate-700"
                                        >
                                            On track for October
                                        </Badge>
                                    </div>
                                </div>

                                {/* Dates next to name */}
                                <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-auto lg:min-w-[390px]">
                                    <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5">
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <CalendarDays className="h-4 w-4 shrink-0" />
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.14em]">
                                                Started
                                            </p>
                                        </div>
                                        <p className="mt-1.5 text-sm font-semibold text-slate-900">
                                            Jul 15, 2026
                                        </p>
                                    </div>

                                    <div className="rounded-xl border border-blue-100 bg-blue-50/70 px-3 py-2.5">
                                        <div className="flex items-center gap-2 text-blue-700">
                                            <Target className="h-4 w-4 shrink-0" />
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.14em]">
                                                Estimated Finish
                                            </p>
                                        </div>
                                        <p className="mt-1.5 text-sm font-semibold text-slate-900">
                                            Oct 18, 2026
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            <div className="flex items-center gap-3 rounded-xl border border-orange-100 bg-orange-50 p-3">
                                <Flame className="h-5 w-5 shrink-0 text-orange-500" />
                                <div>
                                    <p className="text-xl font-bold leading-none text-slate-900">
                                        {longestStreak}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">Day Streak</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 p-3">
                                <BookOpen className="h-5 w-5 shrink-0 text-blue-600" />
                                <div>
                                    <p className="text-xl font-bold leading-none text-slate-900">
                                        {lessonsCompleted}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">Lessons</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 rounded-xl border border-green-100 bg-green-50 p-3">
                                <GraduationCap className="h-5 w-5 shrink-0 text-green-600" />
                                <div>
                                    <p className="text-xl font-bold leading-none text-slate-900">
                                        {accuracy > 0 ? `${accuracy}%` : "—"}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">Accuracy</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 rounded-xl border border-cyan-100 bg-cyan-50 p-3">
                                <Clock3 className="h-5 w-5 shrink-0 text-cyan-600" />
                                <div>
                                    <p className="text-xl font-bold leading-none text-slate-900">
                                        {studyHours > 0 ? `${studyHours}h` : "—"}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">Study Time</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>

        </Card>
    );
}
