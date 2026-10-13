import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
    AlertTriangle,
    Bell,
    BookOpen,
    FileText,
    Trash2,
    Wrench,
    type LucideIcon,
} from "lucide-react";

import { useAuth } from "@/common/context/AuthContext";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/shadcn/component/ui/dropdown-menu";
import { Button } from "@/shadcn/component/ui/button";
import { isLessonGenerated, isLessonReadyToStudy } from "@/feature/learning-path/lessonAccess";
import {
    buildRoadmapNotificationStreamUrl,
    clearRoadmapNotifications,
    fetchRoadmap,
    type RoadmapResponse,
} from "@/feature/learning-path/api/roadmapApi";
import { fetchFailedLessons, type FailedLesson } from "@/feature/admin/api/adminApi";
import { LessonFixModal } from "@/feature/admin/component";

type NotificationItem = {
    id: string;
    title: string;
    description: string;
    time: string;
    unread: boolean;
    topicId?: number;
    icon: LucideIcon;
    failedLesson?: FailedLesson;
    actionType?: "fix_lesson";
};

function getSeenStorageKey(userId: number) {
    return `learning-path-notification-seen:${userId}`;
}

function getDismissedStorageKey(userId: number) {
    return `learning-path-notification-dismissed:${userId}`;
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

function readDismissedIds(userId: number): string[] {
    try {
        const raw: unknown = JSON.parse(
            localStorage.getItem(getDismissedStorageKey(userId)) ?? "[]",
        );
        return Array.isArray(raw)
            ? raw.filter((value): value is string => typeof value === "string")
            : [];
    } catch {
        return [];
    }
}

function writeDismissedIds(userId: number, ids: string[]) {
    try {
        localStorage.setItem(
            getDismissedStorageKey(userId),
            JSON.stringify([...new Set(ids)]),
        );
    } catch {
        // Ignore storage errors and keep the menu usable.
    }
}

function buildNotifications(
    roadmap: RoadmapResponse | null,
    failedLessons: FailedLesson[],
    seenIds: Set<string>,
    dismissedIds: Set<string>,
): NotificationItem[] {
    const failedNotifications: NotificationItem[] = failedLessons
        .filter((fl) => !dismissedIds.has(`failed-lesson-${fl.id}`))
        .map((fl) => ({
            id: `failed-lesson-${fl.id}`,
            title: `Lesson Failed: ${fl.title}`,
            description: `${fl.roleName || "Track"} • ${
                fl.failedStep === "C2"
                    ? "Quiz failed (Theory saved - saves ~70% tokens on resume)"
                    : fl.errorMessage || "Generation failed at Step C1"
            }`,
            time: "Fix required",
            icon: AlertTriangle,
            unread: !seenIds.has(`failed-lesson-${fl.id}`),
            failedLesson: fl,
            actionType: "fix_lesson",
        }));

    if (!roadmap) {
        return failedNotifications;
    }

    const topicNotifications = roadmap.topics
        .slice()
        .sort((left, right) => right.sort_order - left.sort_order)
        .filter((topic) => !dismissedIds.has(`topic-${topic.id}`))
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
                .filter((lesson) => isLessonGenerated(lesson) && !dismissedIds.has(`lesson-${lesson.id}`))
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

    return [...failedNotifications, ...lessonNotifications, ...topicNotifications];
}

export function NotificationDropdown() {
    const auth = useAuth();
    const userId = Number(auth.user?.id);
    const isAdmin =
        auth.user?.role === "admin"
        || auth.user?.role_id === 2
        || (auth.user as { roleId?: number } | undefined)?.roleId === 2;

    const [roadmap, setRoadmap] = useState<RoadmapResponse | null>(null);
    const [failedLessons, setFailedLessons] = useState<FailedLesson[]>([]);
    const [fixingLesson, setFixingLesson] = useState<FailedLesson | null>(null);
    const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
    const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
    const hasViewedCurrentOpenRef = useRef(false);

    useEffect(() => {
        let isMounted = true;
        let stream: EventSource | null = null;
        let refreshTimer: number | null = null;
        let reconnectTimer: number | null = null;
        let reconnectInFlight = false;

        if (!Number.isFinite(userId)) {
            setRoadmap(null);
            setFailedLessons([]);
            setSeenIds(new Set());
            setDismissedIds(new Set());
            return;
        }

        setSeenIds(new Set(readSeenIds(userId)));
        setDismissedIds(new Set(readDismissedIds(userId)));

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

        const loadFailedLessons = async () => {
            if (!isAdmin) return;
            try {
                const list = await fetchFailedLessons();
                if (isMounted) {
                    setFailedLessons(list);
                }
            } catch {
                if (isMounted) {
                    setFailedLessons([]);
                }
            }
        };

        const loadAll = async () => {
            await Promise.allSettled([loadRoadmap(), loadFailedLessons()]);
        };

        const scheduleReconnect = (delayMs: number) => {
            if (!isMounted || reconnectTimer !== null) {
                return;
            }
            reconnectTimer = window.setTimeout(async () => {
                reconnectTimer = null;
                if (!isMounted || reconnectInFlight) {
                    return;
                }
                reconnectInFlight = true;
                try {
                    await loadAll();
                    if (!isMounted) {
                        return;
                    }
                    connectStream();
                } catch {
                    if (isMounted) {
                        scheduleReconnect(5_000);
                    }
                } finally {
                    reconnectInFlight = false;
                }
            }, delayMs);
        };

        const connectStream = () => {
            if (!isMounted || !Number.isFinite(userId)) {
                return;
            }

            stream?.close();
            stream = new EventSource(buildRoadmapNotificationStreamUrl(), {
                withCredentials: true,
            });

            stream.addEventListener("roadmap_updated", () => {
                void loadAll();
            });

            stream.addEventListener("admin_notification", () => {
                void loadAll();
            });

            stream.onerror = () => {
                stream?.close();
                stream = null;
                scheduleReconnect(1_500);
            };
        };

        void loadAll();

        refreshTimer = window.setInterval(() => {
            void loadAll();
        }, 30_000);

        connectStream();

        const handleWindowFocus = () => {
            if (document.visibilityState === "hidden") {
                return;
            }
            void loadAll();
        };

        window.addEventListener("focus", handleWindowFocus);
        document.addEventListener("visibilitychange", handleWindowFocus);

        return () => {
            isMounted = false;
            stream?.close();
            if (refreshTimer !== null) {
                window.clearInterval(refreshTimer);
            }
            if (reconnectTimer !== null) {
                window.clearTimeout(reconnectTimer);
            }
            window.removeEventListener("focus", handleWindowFocus);
            document.removeEventListener("visibilitychange", handleWindowFocus);
        };
    }, [userId, isAdmin]);

    const notifications = useMemo(
        () => buildNotifications(roadmap, failedLessons, seenIds, dismissedIds),
        [roadmap, failedLessons, seenIds, dismissedIds],
    );
    const unreadCount = notifications.filter((item) => item.unread).length;
    const readCount = notifications.length - unreadCount;

    const handleDeleteAllRead = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!Number.isFinite(userId)) return;

        const readItemIds = notifications.filter((item) => !item.unread).map((item) => item.id);
        if (readItemIds.length === 0) return;

        setDismissedIds((prev) => {
            const next = new Set(prev);
            readItemIds.forEach((id) => next.add(id));
            writeDismissedIds(userId, [...next]);
            return next;
        });

        try {
            await clearRoadmapNotifications();
        } catch {
            // Silently ignore
        }
    };

    const handleClearAll = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!Number.isFinite(userId) || notifications.length === 0) return;

        setDismissedIds((prev) => {
            const next = new Set(prev);
            notifications.forEach((item) => next.add(item.id));
            writeDismissedIds(userId, [...next]);
            return next;
        });

        try {
            await clearRoadmapNotifications();
        } catch {
            // Silently ignore
        }
    };

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
        <>
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
                className="max-h-115 w-[22rem] max-w-[92vw] overflow-y-auto dark:border-slate-800 dark:bg-slate-900"
            >
                <DropdownMenuLabel className="flex items-center justify-between gap-2 dark:text-slate-200">
                    <div className="flex items-center gap-2">
                        <span>Notifications</span>
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            {unreadCount > 0 ? `${unreadCount} new` : "Up to date"}
                        </span>
                    </div>
                    {readCount > 0 ? (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs font-normal text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
                            onClick={handleDeleteAllRead}
                            title="Delete all notifications that have been read"
                        >
                            <Trash2 className="mr-1 h-3.5 w-3.5" />
                            Delete read ({readCount})
                        </Button>
                    ) : notifications.length > 0 ? (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs font-normal text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                            onClick={handleClearAll}
                            title="Clear all notifications"
                        >
                            <Trash2 className="mr-1 h-3.5 w-3.5" />
                            Clear all
                        </Button>
                    ) : null}
                </DropdownMenuLabel>

                <DropdownMenuSeparator className="dark:bg-slate-800" />

                {notifications.length === 0 ? (
                    <div className="px-3 py-6 text-center">
                        <p className="font-medium text-slate-900 dark:text-white">
                            No learning-path notices yet
                        </p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Topic and lesson generation notices will appear here.
                        </p>
                    </div>
                ) : (
                    notifications.map((item) => {
                        const Icon = item.icon;

                        if (item.actionType === "fix_lesson" && item.failedLesson) {
                            const failed = item.failedLesson;
                            return (
                                <DropdownMenuItem
                                    key={item.id}
                                    onSelect={(e) => {
                                        e.preventDefault();
                                        setFixingLesson(failed);
                                    }}
                                    className={`cursor-pointer items-start rounded-lg border px-3 py-3 transition-colors ${
                                        item.unread
                                            ? "border-rose-200 bg-rose-50/80 focus:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/40 dark:focus:bg-rose-900/50"
                                            : "border-transparent bg-slate-50/70 focus:bg-slate-100 dark:bg-slate-800/60 dark:focus:bg-slate-800"
                                    }`}
                                >
                                    <div className="flex w-full gap-3">
                                        <div
                                            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                                                item.unread
                                                    ? "bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300"
                                                    : "bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                                            }`}
                                        >
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <p
                                                    className={`font-medium ${
                                                        item.unread
                                                            ? "text-rose-950 dark:text-rose-200"
                                                            : "text-slate-700 dark:text-slate-300"
                                                    }`}
                                                >
                                                    {item.title}
                                                </p>
                                                <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white">
                                                    Failed
                                                </span>
                                            </div>
                                            <p
                                                className={`text-sm ${
                                                    item.unread
                                                        ? "text-rose-800 dark:text-rose-300"
                                                        : "text-slate-500 dark:text-slate-400"
                                                }`}
                                            >
                                                {item.description}
                                            </p>
                                            <div className="mt-2 flex items-center justify-between gap-2">
                                                <span className="text-xs text-slate-400 dark:text-slate-500">
                                                    {item.time}
                                                </span>
                                                <Button
                                                    size="sm"
                                                    className="h-7 gap-1 bg-amber-600 px-2.5 text-xs font-semibold text-white hover:bg-amber-700"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setFixingLesson(failed);
                                                    }}
                                                >
                                                    <Wrench className="h-3 w-3" />
                                                    Fix Lesson
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </DropdownMenuItem>
                            );
                        }

                        return (
                            <DropdownMenuItem
                                key={item.id}
                                asChild
                                className={`cursor-pointer items-start rounded-lg border px-3 py-3 transition-colors ${item.unread
                                    ? "border-blue-200 bg-blue-50 focus:bg-blue-100 dark:border-blue-900/50 dark:bg-blue-950/50 dark:focus:bg-blue-900/50"
                                    : "border-transparent bg-slate-50/70 focus:bg-slate-100 dark:bg-slate-800/60 dark:focus:bg-slate-800"
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
                                        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${item.unread
                                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300"
                                            : "bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                                            }`}
                                    >
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p
                                                className={`font-medium ${item.unread
                                                    ? "text-slate-950 dark:text-white"
                                                    : "text-slate-700 dark:text-slate-300"
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
                                            className={`text-sm ${item.unread
                                                ? "text-slate-600 dark:text-slate-300"
                                                : "text-slate-500 dark:text-slate-400"
                                                }`}
                                        >
                                            {item.description}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
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

        <LessonFixModal
            isOpen={Boolean(fixingLesson)}
            onClose={() => setFixingLesson(null)}
            lesson={fixingLesson}
            onSuccess={() => {
                if (isAdmin) {
                    void fetchFailedLessons().then(setFailedLessons).catch(() => {});
                }
                void fetchRoadmap().then(setRoadmap).catch(() => {});
            }}
        />
        </>
    );
}
