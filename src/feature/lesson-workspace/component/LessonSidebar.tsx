import { Card } from "@/shadcn/component/ui/card";
import { Progress } from "@/shadcn/component/ui/progress";
import {
    BookOpen,
    CheckCircle2,
    Circle,
    ChevronDown,
    Clock3,
    Trophy,
} from "lucide-react";

const lessons = [
    {
        id: 1,
        title: "Introduction",
        status: "done",
    },
    {
        id: 2,
        title: "Database Basics",
        status: "done",
    },
    {
        id: 3,
        title: "SQL JOIN",
        status: "current",
    },
    {
        id: 4,
        title: "LEFT JOIN",
        status: "todo",
    },
    {
        id: 5,
        title: "RIGHT JOIN",
        status: "todo",
    },
    {
        id: 6,
        title: "FULL JOIN",
        status: "todo",
    },
    {
        id: 7,
        title: "Summary",
        status: "todo",
    },
    {
        id: 8,
        title: "Quiz",
        status: "todo",
    },
];

export function LessonSidebar() {
    return (
        <div className="xl:sticky xl:top-24 space-y-5">

            {/* Progress */}

            <Card className="p-5 rounded-2xl">

                <div className="flex items-center gap-3">

                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100">

                        <BookOpen className="size-6 text-blue-600" />

                    </div>

                    <div>

                        <h3 className="font-semibold">
                            SQL Fundamentals
                        </h3>

                        <p className="text-sm text-slate-500">
                            Lesson 3 / 8
                        </p>

                    </div>

                </div>

                <Progress
                    value={38}
                    className="mt-5"
                />

                <div className="mt-4 flex justify-between text-sm text-slate-500">

                    <div className="flex items-center gap-1">

                        <Clock3 className="size-4" />

                        12 min left

                    </div>

                    <div className="font-medium">

                        38%

                    </div>

                </div>

            </Card>

            {/* Lesson Navigation */}

            <Card className="rounded-2xl p-4">

                <div className="mb-4 flex items-center justify-between">

                    <h3 className="font-semibold">
                        Lesson Outline
                    </h3>

                    <ChevronDown className="size-5 text-slate-500" />

                </div>

                <div className="space-y-1">

                    {lessons.map((lesson) => (

                        <button
                            key={lesson.id}
                            className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition
                            
                            ${lesson.status === "current"
                                    ? "bg-blue-50 border border-blue-200"
                                    : "hover:bg-slate-100"
                                }`}
                        >

                            {lesson.status === "done" ? (
                                <CheckCircle2 className="size-5 text-green-500 shrink-0" />
                            ) : lesson.status === "current" ? (
                                <div className="size-3 rounded-full bg-blue-600 shrink-0" />
                            ) : (
                                <Circle className="size-4 text-slate-300 shrink-0" />
                            )}

                            <span
                                className={`text-sm

                                ${lesson.status === "current"
                                        ? "font-semibold text-blue-700"
                                        : ""
                                    }`}
                            >
                                {lesson.title}
                            </span>

                        </button>

                    ))}

                </div>

            </Card>

            {/* Daily Goal */}

            <Card className="rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-5">

                <div className="flex items-center gap-3">

                    <Trophy className="size-7" />

                    <div>

                        <h3 className="font-semibold">
                            Today's Goal
                        </h3>

                        <p className="text-sm text-blue-100">
                            Finish this lesson
                        </p>

                    </div>

                </div>

                <Progress
                    value={60}
                    className="mt-5 bg-blue-300"
                />

                <p className="mt-3 text-sm text-blue-100">

                    You're almost there 🚀

                </p>

            </Card>

        </div>
    );
}