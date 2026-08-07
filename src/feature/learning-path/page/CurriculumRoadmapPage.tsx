import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
    ArrowRight,
    BookOpen,
    CheckCircle2,
    ChevronRight,
    Clock3,
    Info,
    Layers3,
    LockKeyhole,
    Presentation,
} from "lucide-react";

import { MainNavigationMenu } from "@/common/component/MainNavigationMenu";
import { Button } from "@/shadcn/component/ui/button";

type ItemStatus = "completed" | "current" | "locked";

type Course = {
    id: string;
    title: string;
    description: string;
    durationHours: number;
    status: ItemStatus;
};

type RoadmapLevel = {
    id: string;
    code: string;
    title: string;
    status: ItemStatus;
    courses: readonly Course[];
};

const LEARNING_PATH = {
    title: "Mastering IT Presentations for Subject Matter Experts",
    status: "Not started",
    levels: [
        {
            id: "b1",
            code: "Level B1",
            title: "Building Confidence in IT Presentations",
            status: "current",
            courses: [
                {
                    id: "intro-presentation",
                    title: "Introduction to IT Presentation Skills",
                    description:
                        "Learn how to structure and deliver basic IT presentations, focusing on clear communication of technical concepts.",
                    durationHours: 13,
                    status: "current",
                },
                {
                    id: "technical-information",
                    title: "Communicating Technical Information Clearly",
                    description:
                        "Develop skills to present technical information in an understandable way for diverse audiences.",
                    durationHours: 16,
                    status: "current",
                },
            ],
        },
        {
            id: "b2",
            code: "Level B2",
            title: "Enhancing Presentation Techniques",
            status: "locked",
            courses: [
                {
                    id: "audience-engagement",
                    title: "Audience Engagement and Presentation Flow",
                    description:
                        "Refine delivery techniques, engage the audience, and manage presentation flow effectively.",
                    durationHours: 12,
                    status: "locked",
                },
            ],
        },
        {
            id: "c1",
            code: "Level C1",
            title: "Mastering Advanced IT Presentation Skills",
            status: "locked",
            courses: [
                {
                    id: "advanced-strategy",
                    title: "Advanced IT Presentation Strategy",
                    description:
                        "Build persuasive technical narratives and confidently handle complex questions.",
                    durationHours: 9,
                    status: "locked",
                },
            ],
        },
        {
            id: "c2",
            code: "Level C2",
            title: "Excellence in IT Public Speaking",
            status: "locked",
            courses: [
                {
                    id: "public-speaking",
                    title: "IT Public Speaking Excellence",
                    description:
                        "Present with authority, clarity, and confidence in professional IT settings.",
                    durationHours: 8,
                    status: "locked",
                },
            ],
        },
    ] satisfies readonly RoadmapLevel[],
};

function pluralize(
    value: number,
    singular: string,
    plural = `${singular}s`,
) {
    return `${value} ${value === 1 ? singular : plural}`;
}

function getLevelDuration(level: RoadmapLevel) {
    return level.courses.reduce(
        (total, course) => total + course.durationHours,
        0,
    );
}

function LevelStatusIcon({ status }: { status: ItemStatus }) {
    if (status === "completed") {
        return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
    }

    if (status === "locked") {
        return <LockKeyhole className="h-4 w-4 text-slate-400" />;
    }

    return null;
}

function CourseCard({ course }: { course: Course }) {
    const content = (
        <>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 sm:h-14 sm:w-14 dark:bg-blue-950/60 dark:text-blue-400">
                <Presentation className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>

            <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-slate-900 sm:text-lg dark:text-white">
                    {course.title}
                </h3>

                <p className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-400">
                    {course.description}
                </p>

                <div className="mt-3 flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                    <Clock3 className="h-4 w-4" />
                    {pluralize(course.durationHours, "Hour")}
                </div>
            </div>

            <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors ${course.status === "locked"
                    ? "border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-700 dark:bg-slate-800"
                    : "border-blue-200 text-blue-600 group-hover:bg-blue-600 group-hover:text-white dark:border-blue-800 dark:text-blue-400"
                    }`}
            >
                {course.status === "locked" ? (
                    <LockKeyhole className="h-4 w-4" />
                ) : (
                    <ChevronRight className="h-5 w-5" />
                )}
            </div>
        </>
    );

    const className =
        "group flex h-full w-full min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all dark:border-slate-800 dark:bg-slate-900 sm:gap-4 sm:p-5";

    if (course.status === "locked") {
        return <div className={`${className} opacity-75`}>{content}</div>;
    }

    return (
        <Link
            to="/lessons/lesson"
            className={`${className} hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:hover:border-blue-700`}
        >
            {content}
        </Link>
    );
}

export function CurriculumRoadmapPage() {
    const [selectedLevelId, setSelectedLevelId] = useState(
        LEARNING_PATH.levels[0].id,
    );

    const selectedLevel =
        LEARNING_PATH.levels.find(
            (level) => level.id === selectedLevelId,
        ) ?? LEARNING_PATH.levels[0];

    const summary = useMemo(() => {
        const courses = LEARNING_PATH.levels.flatMap(
            (level) => level.courses,
        );

        const completedCourses = courses.filter(
            (course) => course.status === "completed",
        ).length;

        return {
            totalCourses: courses.length,

            totalHours: courses.reduce(
                (total, course) => total + course.durationHours,
                0,
            ),

            progress:
                courses.length === 0
                    ? 0
                    : Math.round(
                        (completedCourses / courses.length) * 100,
                    ),
        };
    }, []);

    const selectedLevelDuration = getLevelDuration(selectedLevel);

    const selectedIndex = LEARNING_PATH.levels.findIndex(
        (level) => level.id === selectedLevel.id,
    );

    const nextLevel = LEARNING_PATH.levels[selectedIndex + 1];

    return (
        <div className="min-h-screen w-full bg-blue-50/60 text-slate-950 dark:bg-slate-950 dark:text-white">
            <MainNavigationMenu />

            <main className="w-full max-w-none px-2 py-3 sm:px-3 lg:px-4">
                {/* Course overview */}
                <section
                    className="
        w-full overflow-hidden rounded-2xl
        border border-blue-200 bg-white shadow-sm
        ring-1 ring-blue-100/80
        dark:border-blue-900 dark:bg-slate-900 dark:ring-blue-950
    "
                >
                    {/* Thanh Learning Paths phủ kín đầu card */}
                    <div
                        className="
            flex w-full items-center gap-2
            border-b border-blue-200
            bg-blue-50 px-5 py-3.5
            text-sm font-bold text-blue-700
            dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300
            sm:px-6
        "
                    >
                        <ChevronRight className="h-4 w-4 rotate-180" />
                        <span>Learning Paths</span>
                    </div>

                    <div
                        className="
            grid w-full gap-5 p-5
            sm:p-6
            lg:grid-cols-[minmax(0,1fr)_minmax(240px,320px)_auto]
            lg:items-center
        "
                    >
                        {/* Thông tin Learning Path */}
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
                                    {LEARNING_PATH.title}
                                </h1>

                                <span
                                    className="
                        rounded-full border border-red-300
                        bg-red-50 px-3 py-1
                        text-xs font-semibold text-red-600
                        dark:border-red-900 dark:bg-red-950/40
                        dark:text-red-400
                    "
                                >
                                    {LEARNING_PATH.status}
                                </span>
                            </div>

                            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-medium text-slate-600 dark:text-slate-300">
                                <span className="flex items-center gap-2">
                                    <Layers3 className="h-4 w-4 text-blue-600" />

                                    {pluralize(
                                        LEARNING_PATH.levels.length,
                                        "Level",
                                    )}
                                </span>

                                <span className="flex items-center gap-2">
                                    <BookOpen className="h-4 w-4 text-blue-600" />

                                    {pluralize(
                                        summary.totalCourses,
                                        "Course",
                                    )}
                                </span>

                                <span className="flex items-center gap-2">
                                    <Clock3 className="h-4 w-4 text-blue-600" />

                                    {pluralize(
                                        summary.totalHours,
                                        "Hour",
                                    )}
                                </span>
                            </div>
                        </div>

                        {/* Tiến độ */}
                        <div className="min-w-0 rounded-xl bg-blue-50/70 p-4 dark:bg-blue-950/30">
                            <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                                <span className="font-medium text-slate-600 dark:text-slate-300">
                                    Overall progress
                                </span>

                                <span className="font-bold text-slate-900 dark:text-white">
                                    {summary.progress}%
                                </span>
                            </div>

                            <div
                                className="h-2 overflow-hidden rounded-full bg-blue-100 dark:bg-slate-800"
                                role="progressbar"
                                aria-label="Course progress"
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-valuenow={summary.progress}
                            >
                                <div
                                    className="h-full rounded-full bg-blue-600 transition-[width] duration-500"
                                    style={{
                                        width: `${summary.progress}%`,
                                    }}
                                />
                            </div>
                        </div>

                        {/* Nút bắt đầu */}
                        <Button
                            asChild
                            size="lg"
                            className="
                h-12 w-full rounded-xl bg-blue-600 px-7
                font-semibold text-white shadow-sm
                hover:bg-blue-700 lg:w-auto
            "
                        >
                            <Link to="/lessons/lesson">
                                Start learning
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </section>

                {/* Hai bảng trái - phải */}
                <div
                    className="
        mt-5 grid w-full grid-cols-1 items-stretch gap-5
        lg:grid-cols-[minmax(340px,0.9fr)_minmax(0,1.1fr)]
    "
                >
                    {/* Bảng roadmap bên trái */}
                    <section className="flex h-full min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="mb-4 flex shrink-0 items-center justify-between gap-4">
                            <h2 className="text-xl font-bold text-slate-950 sm:text-2xl dark:text-white">
                                Course roadmap
                            </h2>

                            <span className="shrink-0 text-sm font-semibold text-slate-500 dark:text-slate-400">
                                {pluralize(LEARNING_PATH.levels.length, "level")}
                            </span>
                        </div>

                        {/* Các level tự chia đều chiều cao */}
                        <div className="grid min-h-0 w-full flex-1 grid-cols-1 auto-rows-fr gap-3">
                            {LEARNING_PATH.levels.map((level, index) => {
                                const isSelected = level.id === selectedLevel.id;
                                const duration = getLevelDuration(level);

                                return (
                                    <button
                                        key={level.id}
                                        type="button"
                                        onClick={() => setSelectedLevelId(level.id)}
                                        aria-pressed={isSelected}
                                        className={[
                                            "h-full w-full min-w-0 rounded-xl border p-4 text-left",
                                            "transition-all duration-200",
                                            "focus-visible:outline-none focus-visible:ring-2",
                                            "focus-visible:ring-blue-500 focus-visible:ring-offset-2",
                                            "dark:focus-visible:ring-offset-slate-900",
                                            isSelected
                                                ? "border-blue-500 bg-blue-50/80 shadow-sm dark:bg-blue-950/30"
                                                : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-900 dark:hover:bg-slate-800/60",
                                        ].join(" ")}
                                    >
                                        <div className="flex h-full min-w-0 items-start gap-3">
                                            <span
                                                className={[
                                                    "flex h-10 w-10 shrink-0 items-center justify-center",
                                                    "rounded-full border text-sm font-bold",
                                                    isSelected
                                                        ? "border-blue-600 bg-blue-600 text-white"
                                                        : "border-slate-300 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
                                                ].join(" ")}
                                            >
                                                {index + 1}
                                            </span>

                                            <div className="flex h-full min-w-0 flex-1 flex-col">
                                                <div className="flex min-w-0 items-start justify-between gap-3">
                                                    <h3 className="min-w-0 break-words font-bold leading-5 text-slate-900 dark:text-white">
                                                        {level.code}: {level.title}
                                                    </h3>

                                                    {isSelected ? (
                                                        <span className="shrink-0 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                                                            Selected
                                                        </span>
                                                    ) : (
                                                        <LevelStatusIcon
                                                            status={level.status}
                                                        />
                                                    )}
                                                </div>

                                                <div className="mt-auto flex flex-wrap items-center gap-4 pt-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                                                    <span className="flex items-center gap-1.5">
                                                        <BookOpen className="h-4 w-4 shrink-0" />

                                                        {pluralize(
                                                            level.courses.length,
                                                            "Course",
                                                        )}
                                                    </span>

                                                    <span className="flex items-center gap-1.5">
                                                        <Clock3 className="h-4 w-4 shrink-0" />

                                                        {pluralize(duration, "Hour")}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    {/* Bảng chi tiết bên phải */}
                    <section
                        className="flex h-full min-w-0 flex-col rounded-2xl border border-blue-200 bg-white p-5 shadow-sm ring-1 ring-blue-100/70 dark:border-blue-900 dark:bg-slate-900 dark:ring-blue-950 sm:p-6">
                        <div className="shrink-0 border-b border-slate-200 pb-5 dark:border-slate-800">
                            <p className="font-bold text-blue-600 dark:text-blue-400">
                                {selectedLevel.code}
                            </p>

                            <h2 className="mt-1 break-words text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl dark:text-white">
                                {selectedLevel.title}
                            </h2>

                            <div className="mt-4 flex flex-wrap gap-2">
                                <span className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                    <BookOpen className="h-4 w-4 shrink-0" />

                                    {pluralize(
                                        selectedLevel.courses.length,
                                        "Course",
                                    )}
                                </span>

                                <span className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                    <Clock3 className="h-4 w-4 shrink-0" />

                                    {pluralize(selectedLevelDuration, "Hour")}
                                </span>
                            </div>
                        </div>

                        {/* Course tự giãn cho tất cả level */}
                        <div className="mt-4 grid min-h-0 w-full flex-1 grid-cols-1 auto-rows-fr gap-3">
                            {selectedLevel.courses.map((course) => (
                                <CourseCard
                                    key={course.id}
                                    course={course}
                                />
                            ))}
                        </div>

                        <div className="mt-4 shrink-0">
                            <div className="flex items-start gap-2.5 rounded-xl bg-blue-50 px-4 py-3 text-sm font-medium text-blue-900 dark:bg-blue-950/50 dark:text-blue-200">
                                <Info className="mt-0.5 h-4 w-4 shrink-0" />

                                <p className="min-w-0 break-words">
                                    {nextLevel
                                        ? `Complete all courses to unlock ${nextLevel.code}.`
                                        : "Complete these courses to finish the learning path."}
                                </p>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}