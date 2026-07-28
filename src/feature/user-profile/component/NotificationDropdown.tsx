import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/shadcn/component/ui/dropdown-menu";

import { Button } from "@/shadcn/component/ui/button";

import {
    Bell,
    BookOpen,
    FileText,
    Sparkles,
} from "lucide-react";

const notifications = [
    {
        id: 1,
        title: "New Lesson Available",
        description: "SQL JOIN Practice is ready.",
        time: "5 min ago",
        icon: BookOpen,
        unread: true,
    },
    {
        id: 2,
        title: "New Topic Unlocked",
        description: "Database Index",
        time: "20 min ago",
        icon: FileText,
        unread: true,
    },
    {
        id: 3,
        title: "AI Recommendation",
        description: "Review Database Relationship.",
        time: "Yesterday",
        icon: Sparkles,
        unread: false,
    },
];

export function NotificationDropdown() {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>

                <Button
                    variant="ghost"
                    className="relative"
                >
                    <Bell className="size-5" />

                    <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500" />

                </Button>

            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="end"
                className="w-80"
            >

                <DropdownMenuLabel>
                    Notifications
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                {notifications.map((item) => {
                    const Icon = item.icon;

                    return (

                        <div
                            key={item.id}
                            className={`cursor-pointer p-3 hover:bg-slate-50 ${item.unread
                                ? "bg-blue-50"
                                : ""
                                }`}
                        >

                            <div className="flex gap-3">

                                <Icon className="h-5 w-5 text-blue-600 mt-1" />

                                <div>

                                    <p className="font-medium">
                                        {item.title}
                                    </p>

                                    <p className="text-sm text-slate-500">
                                        {item.description}
                                    </p>

                                    <p className="text-xs text-slate-400 mt-1">
                                        {item.time}
                                    </p>

                                </div>

                            </div>

                        </div>

                    );
                })}

            </DropdownMenuContent>

        </DropdownMenu>
    );
}