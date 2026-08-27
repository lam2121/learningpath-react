import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
    Bell,
    BookOpen,
    FileText,
    type LucideIcon,
} from "lucide-react";

import { getStoredToken, useAuth } from "@/common/context/AuthContext";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/shadcn/component/ui/dropdown-menu";
import { Button } from "@/shadcn/component/ui/button";
import { isLessonReadyToStudy } from "@/feature/learning-path/lessonAccess";
import {
    buildRoadmapNotificationStreamUrl,
    fetchRoadmap,
    type RoadmapResponse,
} from "@/feature/learning-path/roadmapApi";

type NotificationItem = {
    id: string;
    title: string;
    description: string;
    time: string;
    unread: boolean;
    topicId?: number;
    icon: LucideIcon;
};

function getSeenStorageKey(userId: number) {
    return `learning-path-notification-seen:${userId}`;
}

function readSeenIds(userId: number): string[] {
    try {
        const raw: unknown = JSON.parse(
            localStorage.getItem(getSeenStorageKey(userId)) ?? "[]",
        );
        return Array.isArray(raw)
            ? raw.filter((value): value is string => typeof value === "string")
            : [];
    } catch {
        return [];
    }
}

function writeSeenIds(userId: number, ids: string[]) {
    try {
        localStorage.setItem(
            getSeenStorageKey(userId),
            JSON.stringify([...new Set(ids)]),
        );
    } catch {
        // Ignore storage errors and keep the menu usable.
    }
}

function buildNotifications(
    roadmap: RoadmapResponse | null,
    seenIds: Set<string>,
): NotificationItem[] {
    if (!roadmap) {
        return [];
    }

    const topicNotifications = roadmap.topics
        .slice()
        .sort((left, right) => right.sort_order - left.sort_order)
        .map((topic) => ({
            id: `topic-${topic.id}`,
            title: "New Topic In Your Path",
            description: `Topic ${topic.sort_order}: ${topic.name} is available in your learning path.`,
            time: "Learning path updated",
            icon: FileText,
            unread: !seenIds.has(`topic-${topic.id}`),
        }));

    const lessonNotifications = roadmap.topics
        .flatMap((topic) =>
            topic.lessons
                .filter((lesson) => lesson.is_generated)
                .map((lesson) => {
                    const isReady = isLessonReadyToStudy(lesson);

                    return {
                        id: `lesson-${lesson.id}`,
                        title: isReady
                            ? "New Lesson Ready"
                            : "New Lesson Generated",
                        description: `${lesson.title} is generated in ${topic.name}.`,
                        time: isReady ? "Ready to study" : "Generated in your path",
                        topicId: topic.id,
                        icon: BookOpen,
                        unread: !seenIds.has(`lesson-${lesson.id}`),
                    };
                }),
        )
        .reverse();

    return [...lessonNotifications, ...topicNotifications];
}

export function NotificationDropdown() {
    const auth = useAuth();
    const userId = Number(auth.user?.id);
    const [roadmap, setRoadmap] = useState<RoadmapResponse | null>(null);
    const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
    const hasViewedCurrentOpenRef = useRef(false);

    useEffect(() => {
        let isMounted = true;
        let stream: EventSource | null = null;
        let refreshTimer: number | null = null;

        if (!Number.isFinite(userId)) {
            setRoadmap(null);
            setSeenIds(new Set());
            return;
        }

        setSeenIds(new Set(readSeenIds(userId)));

        const loadRoadmap = async () => {
            try {
                const response = await fetchRoadmap();
                if (isMounted) {
                    setRoadmap(response);
                }
            } catch {
                if (isMounted) {
                    setRoadmap(null);
                }
            }
        };

        void loadRoadmap();

        refreshTimer = window.setInterval(() => {
            void loadRoadmap();
        }, 30_000);

        const token = getStoredToken();
        if (token) {
            stream = new EventSource(buildRoadmapNotificationStreamUrl(token));
            stream.addEventListener("roadmap_updated", () => {
                void loadRoadmap();
            });
        }

        const handleWindowFocus = () => {
            if (document.visibilityState === "hidden") {
                return;
            }
            void loadRoadmap();
        };

        window.addEventListener("focus", handleWindowFocus);
        document.addEventListener("visibilitychange", handleWindowFocus);

        return () => {
            isMounted = false;
            stream?.close();
            if (refreshTimer !== null) {
                window.clearInterval(refreshTimer);
            }
            window.removeEventListener("focus", handleWindowFocus);
            document.removeEventListener("visibilitychange", handleWindowFocus);
        };
    }, [userId]);

    const notifications = useMemo(
        () => buildNotifications(roadmap, seenIds),
        [roadmap, seenIds],
    );
    const unreadCount = notifications.filter((item) => item.unread).length;

    const handleOpenChange = (nextOpen: boolean) => {
        if (nextOpen) {
            hasViewedCurrentOpenRef.current = true;
            return;
        }

        if (
            !hasViewedCurrentOpenRef.current
            || !Number.isFinite(userId)
            || notifications.length === 0
        ) {
            hasViewedCurrentOpenRef.current = false;
            return;
        }

        setSeenIds((current) => {
            const next = new Set(current);
            let changed = false;

            notifications.forEach((item) => {
                if (!next.has(item.id)) {
                    next.add(item.id);
                    changed = true;
                }
            });

            if (!changed) {
                return current;
            }

            writeSeenIds(userId, [...next]);
            return next;
        });
        hasViewedCurrentOpenRef.current = false;
    };

    return (
        <DropdownMenu onOpenChange={handleOpenChange}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="relative"
                    aria-label="Open notifications"
                >
                    <Bell className="size-5" />
                    {unreadCount > 0 ? (
                        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
                    ) : null}
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="end"
                className="max-h-115 w-[22rem] max-w-[92vw] overflow-y-auto"
            >
                <DropdownMenuLabel className="flex items-center justify-between gap-3">
                    <span>Notifications</span>
                    <span className="text-xs font-medium text-slate-500">
                        {unreadCount > 0 ? `${unreadCount} new` : "Up to date"}
                    </span>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                {notifications.length === 0 ? (
                    <div className="px-3 py-6 text-center">
                        <p className="font-medium text-slate-900">
                            No learning-path notices yet
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                            Topic and lesson generation notices will appear here.
                        </p>
                    </div>
                ) : (
                    notifications.map((item) => {
                        const Icon = item.icon;

                        return (
                            <DropdownMenuItem
                                key={item.id}
                                asChild
                                className={`cursor-pointer items-start rounded-lg border px-3 py-3 transition-colors ${
                                    item.unread
                                        ? "border-blue-200 bg-blue-50 focus:bg-blue-100"
                                        : "border-transparent bg-slate-50/70 focus:bg-slate-100"
                                }`}
                            >
                                <Link
                                    to="/lessons/learning-path"
                                    search={
                                        item.topicId !== undefined
                                            ? { topicId: item.topicId }
                                            : {}
                                    }
                                    className="flex w-full gap-3"
                                >
                                    <div
                                        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                                            item.unread
                                                ? "bg-blue-100 text-blue-700"
                                                : "bg-slate-200 text-slate-500"
                                        }`}
                                    >
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p
                                                className={`font-medium ${
                                                    item.unread
                                                        ? "text-slate-950"
                                                        : "text-slate-700"
                                                }`}
                                            >
                                                {item.title}
                                            </p>
                                            {item.unread ? (
                                                <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white">
                                                    New
                                                </span>
                                            ) : null}
                                        </div>
                                        <p
                                            className={`text-sm ${
                                                item.unread
                                                    ? "text-slate-600"
                                                    : "text-slate-500"
                                            }`}
                                        >
                                            {item.description}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-400">
                                            {item.time}
                                        </p>
                                    </div>
                                </Link>
                            </DropdownMenuItem>
                        );
                    })
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}