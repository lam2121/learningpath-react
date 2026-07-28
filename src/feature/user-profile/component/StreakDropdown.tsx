import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/shadcn/component/ui/dropdown-menu";

import { Button } from "@/shadcn/component/ui/button";

import {
    Flame,
} from "lucide-react";

const calendar = [
    true, true, true, false, true, true, true,
    true, false, true, true, true, true, true,
    false, true, true, true, true, false, true,
    true, true, true, false, true, true, true,
    true, false
];

export function StreakDropdown() {

    return (

        <DropdownMenu>

            <DropdownMenuTrigger asChild>

                <Button
                    variant="ghost"
                    className="flex items-center gap-1"
                >

                    <Flame className="size-5 fill-yellow-200 text-orange-500" />

                    <span className="font-semibold">
                        8
                    </span>

                </Button>

            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="end"
                className="w-80"
            >

                <DropdownMenuLabel>

                    🔥 Learning Streak

                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                <div className="space-y-4 p-3">

                    <div className="grid grid-cols-2 gap-3">

                        <div className="rounded-lg bg-orange-50 p-3 text-center">

                            <p className="text-sm text-slate-500">
                                Current
                            </p>

                            <p className="text-2xl font-bold text-orange-600">
                                8 Days
                            </p>

                        </div>

                        <div className="rounded-lg bg-blue-50 p-3 text-center">

                            <p className="text-sm text-slate-500">
                                Longest
                            </p>

                            <p className="text-2xl font-bold text-blue-600">
                                15 Days
                            </p>

                        </div>

                    </div>

                    <div>

                        <p className="font-medium mb-3">
                            July 2026
                        </p>

                        <div className="grid grid-cols-7 gap-2">

                            {calendar.map((done, index) => (

                                <div
                                    key={index}
                                    className={`
                                    h-8
                                    rounded-md
                                    flex
                                    items-center
                                    justify-center
                                    text-xs
                                    ${done
                                            ? "bg-blue-500 text-white"
                                            : "bg-slate-100"
                                        }
                                `}
                                >

                                    {index + 1}

                                </div>

                            ))}

                        </div>

                    </div>

                    <div className="rounded-lg bg-slate-50 p-3">

                        <p className="text-sm">
                            🎯 Keep learning tomorrow to reach a 9-day streak.
                        </p>

                    </div>

                </div>

            </DropdownMenuContent>

        </DropdownMenu>

    );

}