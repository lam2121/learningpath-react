import { useMemo } from "react";
import { Button } from "@/shadcn/component/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/shadcn/component/ui/dropdown-menu";
import { Flame } from "lucide-react";

import { LearningCalendar } from "./LearningCalendar";
import { useAuth } from "@/common/context/AuthContext";
import { calculateLongestStreak, getLoginDays } from "@/feature/user-profile/utils/StudyActivity";

export function StreakDropdown() {
    const auth = useAuth();
    const userId = Number(auth.user?.id);

    const longestStreak = useMemo(() => {
        const loginDays = getLoginDays(userId);
        return calculateLongestStreak(loginDays);
    }, [userId]);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    className="flex items-center gap-1.5 px-2.5"
                >
                    <Flame className="h-5 w-5 fill-orange-200 text-orange-500" />

                    <span className="font-semibold text-slate-800">
                        {longestStreak}
                    </span>

                    <span className="hidden text-sm text-slate-600 sm:inline">
                        day streak
                    </span>
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="end"
                sideOffset={8}
                className="
                    max-h-[85vh]
                    w-[calc(100vw-2rem)]
                    max-w-[420px]
                    overflow-y-auto
                    rounded-2xl
                    border-slate-200
                    bg-white
                    p-4
                    shadow-[0_20px_50px_rgba(15,23,42,0.15)]
                "
            >
                <LearningCalendar embedded userId={userId} />
            </DropdownMenuContent>
        </DropdownMenu>
    );
}