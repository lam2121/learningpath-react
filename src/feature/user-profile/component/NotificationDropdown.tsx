import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
    Bell,
    BookOpen,
    FileText,
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
import { isLessonReadyToStudy } from "@/feature/learning-path/lessonAccess";
import { fetchRoadmap, type RoadmapResponse } from "@/feature/learning-path/roadmapApi";

type NotificationItem = {
    id: string;
    title: string;
    description: string;
    time: string;
    unread: boolean;
    topicId?: number;
    icon: typeof BookOpen;
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
    const [open, setOpen] = useState(false);
    const [roadmap, setRoadmap] = useState<RoadmapResponse | null>(null);
    const [seenIds, setSeenIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        let isMounted = true;

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

        return () => {
            isMounted = false;
        };
    }, [userId]);

    const notifications = useMemo(
        () => buildNotifications(roadmap, seenIds),
        [roadmap, seenIds],
    );
    const unreadCount = notifications.filter((item) => item.unread).length;
    const unreadNotificationIds = useMemo(
        () => notifications.filter((item) => item.unread).map((item) => item.id),
        [notifications],
    );

    useEffect(() => {
        if (!open || !Number.isFinite(userId) || unreadNotificationIds.length === 0) {
            return;
        }

        setSeenIds((current) => {
            const next = new Set(current);
            let changed = false;

            unreadNotificationIds.forEach((id) => {
                if (!next.has(id)) {
                    next.add(id);
                    changed = true;
                }
            });

            if (!changed) {
                return current;
            }

            writeSeenIds(userId, [...next]);
            return next;
        });
    }, [open, unreadNotificationIds, userId]);

    return (
        <DropdownMenu onOpenChange={setOpen}>
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
                                className={`cursor-pointer items-start rounded-md px-3 py-3 ${item.unread ? "bg-blue-50" : ""
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
                                    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                                    <div className="min-w-0">
                                        <p className="font-medium text-slate-900">
                                            {item.title}
                                        </p>
                                        <p className="text-sm text-slate-500">
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
