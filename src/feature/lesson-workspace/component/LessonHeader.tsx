import {
    Card,
    CardContent,
} from "@/shadcn/component/ui/card";

import { Progress } from "@/shadcn/component/ui/progress";

import { Badge } from "@/shadcn/component/ui/badge";

import { Button } from "@/shadcn/component/ui/button";

import {
    Clock3,
    GraduationCap,
    Bookmark,
    CheckCircle2,
    ChevronRight,
} from "lucide-react";

export function LessonHeader() {
    return (
        <Card className="rounded-3xl border-0 shadow-sm">

            <CardContent className="p-5 sm:p-6 lg:p-8">

                {/* Breadcrumb */}

                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-500">

                    <span>SQL Fundamentals</span>

                    <ChevronRight className="size-4" />

                    <span>Topic 2</span>

                    <ChevronRight className="size-4" />

                    <span className="font-medium text-blue-600">
                        SQL JOIN
                    </span>

                </div>

                {/* Title */}

                <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

                    <div>

                        <h1 className="text-2xl font-bold sm:text-3xl xl:text-4xl">

                            SQL JOIN

                        </h1>

                        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500 sm:text-base">

                            Learn how SQL JOIN combines data from multiple
                            tables using INNER JOIN, LEFT JOIN, RIGHT JOIN,
                            and FULL JOIN.

                        </p>

                    </div>

                    <Button
                        variant="outline"
                        className="w-full sm:w-auto"
                    >

                        <Bookmark className="size-5" />

                        Bookmark

                    </Button>

                </div>

                {/* Lesson Info */}

                <div className="mt-8 flex flex-wrap gap-2">

                    <Badge
                        variant="secondary"
                        className="flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm"
                    >
                        <Clock3 className="size-4" />
                        12 min
                    </Badge>

                    <Badge
                        variant="secondary"
                        className="flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm sm:px-4 sm:py-2"
                    >
                        <GraduationCap className="size-4" />
                        Intermediate
                    </Badge>

                    <Badge
                        className="bg-blue-100 text-blue-700 hover:bg-blue-100 px-3 py-1.5 text-xs sm:text-sm sm:px-4 sm:py-2"
                    >
                        Lesson 3 / 8
                    </Badge>

                </div>

                {/* Progress */}

                <div className="mt-8">

                    <div className="mb-2 flex justify-between">

                        <span className="text-sm text-slate-500">

                            Reading Progress

                        </span>

                        <span className="font-semibold">

                            45%

                        </span>

                    </div>

                    <Progress value={45} />

                </div>

                {/* Bottom */}

                <div
                    className="
        mt-8
        flex
        flex-col
        gap-4
        sm:flex-row
        sm:items-center
        sm:justify-between
    "
                >

                    <div className="text-sm text-slate-500">

                        Last opened 3 minutes ago

                    </div>

                    <Button className="w-full sm:w-auto">

                        <CheckCircle2 className="size-5" />

                        Mark as Completed

                    </Button>

                </div>

            </CardContent>

        </Card>
    );
}