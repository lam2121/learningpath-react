import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ArrowLeft,
    BookOpen,
    Check,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    CircleHelp,
    Clock3,
    FileText,
    List,
    Menu,
    PlayCircle,
    Search,
    Sparkles,
    Star,
    Volume2,
    X,
} from "lucide-react";

import { MainNavigationMenu } from "@/common/component/MainNavigationMenu";
import { Button } from "@/shadcn/component/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/shadcn/component/ui/sheet";

type ActivityType = "vocabulary" | "practice" | "quiz" | "reference";

type Activity = {
    id: string;
    title: string;
    type: ActivityType;
    status?: "generating" | "ready";
};

type Unit = {
    id: string;
    title: string;
    lectures: number;
    durationMinutes: number;
    activities: readonly Activity[];
};

type CourseModule = {
    id: string;
    title: string;
    dateRange: string;
    units: readonly Unit[];
};

type Vocabulary = {
    id: string;
    word: string;
    wordForms: readonly string[];
    description: string;
    meanings: number;
    domains: readonly string[];
};

type VocabularyMeaning = {
    partOfSpeech: string;
    definition: string;
    example?: string;
};

const COURSE = {
    title: "Communicating Technical Information Clearly",
    progress: 0,
    modules: [
        {
            id: "simplifying-complex-concepts",
            title: "Simplifying Complex IT Concepts",
            dateRange: "03/08/2026 - 03/08/2026",
            units: [
                {
                    id: "identifying-key-concepts",
                    title: "Identifying Key Concepts for Explanation",
                    lectures: 4,
                    durationMinutes: 60,
                    activities: [
                        {
                            id: "technical-terms",
                            title: "Technical Terms Simplification",
                            type: "vocabulary",
                            status: "ready",
                        },
                        {
                            id: "cloud-computing",
                            title: "Explaining Cloud Computing to Non-Experts",
                            type: "practice",
                            status: "generating",
                        },
                        {
                            id: "key-concept-quiz",
                            title: "Key Concept Identification Quiz",
                            type: "quiz",
                            status: "generating",
                        },
                        {
                            id: "reference-content",
                            title: "Reference Content",
                            type: "reference",
                            status: "generating",
                        },
                    ],
                },
                {
                    id: "using-analogies",
                    title: "Using Analogies to Enhance Understanding",
                    lectures: 3,
                    durationMinutes: 60,
                    activities: [
                        {
                            id: "analogy-patterns",
                            title: "Analogy Patterns for Technical Topics",
                            type: "practice",
                            status: "ready",
                        },
                        {
                            id: "analogy-practice",
                            title: "Build Your Own Analogy",
                            type: "quiz",
                            status: "ready",
                        },
                    ],
                },
            ],
        },
        {
            id: "clear-presentations",
            title: "Structuring Clear Presentations",
            dateRange: "04/08/2026 - 05/08/2026",
            units: [
                {
                    id: "presentation-flow",
                    title: "Building a Logical Presentation Flow",
                    lectures: 5,
                    durationMinutes: 90,
                    activities: [],
                },
            ],
        },
        {
            id: "technical-processes",
            title: "Explaining Technical Processes",
            dateRange: "06/08/2026 - 07/08/2026",
            units: [
                {
                    id: "process-breakdown",
                    title: "Breaking Complex Processes into Steps",
                    lectures: 4,
                    durationMinutes: 75,
                    activities: [],
                },
            ],
        },
        {
            id: "questions-feedback",
            title: "Handling Questions and Feedback",
            dateRange: "08/08/2026 - 08/08/2026",
            units: [
                {
                    id: "qa-confidence",
                    title: "Answering Technical Questions with Confidence",
                    lectures: 4,
                    durationMinutes: 60,
                    activities: [],
                },
            ],
        },
        {
            id: "diverse-audiences",
            title: "Adapting Content for Diverse Audiences",
            dateRange: "09/08/2026 - 10/08/2026",
            units: [
                {
                    id: "audience-awareness",
                    title: "Understanding Audience Knowledge Levels",
                    lectures: 5,
                    durationMinutes: 80,
                    activities: [],
                },
            ],
        },
        {
            id: "confident-delivery",
            title: "Delivering Confident Technical Presentations",
            dateRange: "11/08/2026 - 12/08/2026",
            units: [
                {
                    id: "delivery-skills",
                    title: "Voice, Pace and Body Language",
                    lectures: 4,
                    durationMinutes: 70,
                    activities: [],
                },
            ],
        },
        {
            id: "cultural-considerations",
            title: "Cultural Considerations in IT Communication",
            dateRange: "13/08/2026 - 13/08/2026",
            units: [
                {
                    id: "cross-cultural",
                    title: "Communicating Across Cultures",
                    lectures: 3,
                    durationMinutes: 55,
                    activities: [],
                },
            ],
        },
    ] satisfies readonly CourseModule[],
};

const VOCABULARY: readonly Vocabulary[] = [
    {
        id: "server",
        word: "server",
        wordForms: ["Nouns", "Verbs"],
        description:
            "A computer or system that provides data, resources, or services to other computers, known as clients, over a network.",
        meanings: 11,
        domains: ["Marketing & Sales", "Software Development", "Cloud Computing"],
    },
    {
        id: "application",
        word: "application",
        wordForms: ["Nouns", "Verbs"],
        description:
            "A software program designed to perform a specific function directly for the user.",
        meanings: 20,
        domains: ["Marketing & Sales", "Software Development", "Product"],
    },
    {
        id: "software",
        word: "software",
        wordForms: ["Nouns", "Verbs"],
        description:
            "A program or set of programs used to operate computers and execute specific tasks.",
        meanings: 16,
        domains: ["Marketing & Sales", "Software Development", "IT Operations"],
    },
    {
        id: "protocol",
        word: "protocol",
        wordForms: ["Nouns", "Verbs"],
        description:
            "A set of rules or standards that defines how data is transmitted over a network.",
        meanings: 19,
        domains: ["Marketing & Sales", "Software Development", "Networking"],
    },
    {
        id: "repository",
        word: "repository",
        wordForms: ["Nouns", "Verbs"],
        description:
            "A storage location for software packages or code, typically used in version control systems.",
        meanings: 12,
        domains: ["Marketing & Sales", "Software Development", "DevOps"],
    },
    {
        id: "framework",
        word: "framework",
        wordForms: ["Nouns"],
        description:
            "A reusable structure that provides tools and conventions for building software applications.",
        meanings: 9,
        domains: ["Software Development", "Architecture"],
    },
    {
        id: "database",
        word: "database",
        wordForms: ["Nouns"],
        description:
            "An organized collection of structured information that can be stored, searched, and updated.",
        meanings: 8,
        domains: ["Data", "Software Development"],
    },
    {
        id: "deployment",
        word: "deployment",
        wordForms: ["Nouns"],
        description:
            "The process of making a software application available for users in a target environment.",
        meanings: 7,
        domains: ["DevOps", "Cloud Computing"],
    },
];

/*
 * These are preview meanings for the modal. Replace this object with the
 * dictionary meanings returned by your API when the backend is connected.
 */
const VOCABULARY_MEANINGS: Readonly<
    Record<string, readonly VocabularyMeaning[]>
> = {
    server: [
        {
            partOfSpeech: "Nouns",
            definition:
                "A central computer from which other computers get information, files, or services.",
            example: "The application stores its data on a secure server.",
        },
        {
            partOfSpeech: "Nouns",
            definition:
                "A computer program that responds to requests from another program called a client.",
            example: "The web server sends the requested page to the browser.",
        },
        {
            partOfSpeech: "Nouns",
            definition: "A person whose job is to serve food in a restaurant.",
            example: "The server brought the menu to our table.",
        },
        {
            partOfSpeech: "Verbs",
            definition: "To provide something that is useful or needed.",
            example: "This tool serves several development teams.",
        },
    ],
    application: [
        {
            partOfSpeech: "Nouns",
            definition:
                "A software program designed to perform a particular task for a user.",
            example: "Open the application and sign in with your work account.",
        },
        {
            partOfSpeech: "Nouns",
            definition: "A formal request for something, such as a job or service.",
            example: "Her application was reviewed by the hiring team.",
        },
        {
            partOfSpeech: "Nouns",
            definition: "The practical use of an idea, method, or technology.",
            example: "The course explains the application of AI in healthcare.",
        },
    ],
    software: [
        {
            partOfSpeech: "Nouns",
            definition:
                "Programs and operating information used by a computer or electronic device.",
            example: "The team released a new version of the software.",
        },
        {
            partOfSpeech: "Nouns",
            definition:
                "A collection of instructions that tells hardware what tasks to perform.",
            example: "Install the software before connecting the device.",
        },
    ],
    protocol: [
        {
            partOfSpeech: "Nouns",
            definition:
                "A set of technical rules that controls how data is exchanged between systems.",
            example: "HTTPS is a protocol for secure communication on the web.",
        },
        {
            partOfSpeech: "Nouns",
            definition:
                "An accepted procedure for dealing with a particular situation.",
            example: "Follow the incident-response protocol during an outage.",
        },
    ],
    repository: [
        {
            partOfSpeech: "Nouns",
            definition:
                "A place where code, documents, or software packages are stored and managed.",
            example: "Push the latest changes to the shared repository.",
        },
        {
            partOfSpeech: "Nouns",
            definition: "A large collection of information or resources.",
            example: "The portal is a repository of technical guidance.",
        },
    ],
    framework: [
        {
            partOfSpeech: "Nouns",
            definition:
                "A reusable structure that provides tools and conventions for building software.",
            example: "The project uses a React framework for the user interface.",
        },
        {
            partOfSpeech: "Nouns",
            definition: "A basic system of rules, ideas, or principles.",
            example: "The framework helps the team evaluate technical risks.",
        },
    ],
    database: [
        {
            partOfSpeech: "Nouns",
            definition:
                "An organized collection of information that can be stored, searched, and updated.",
            example: "Customer records are saved in the database.",
        },
        {
            partOfSpeech: "Nouns",
            definition:
                "Software used to create, maintain, and query structured information.",
            example: "The service reads product data from the database.",
        },
    ],
    deployment: [
        {
            partOfSpeech: "Nouns",
            definition:
                "The process of making software available in a target environment.",
            example: "The production deployment is scheduled for Friday.",
        },
        {
            partOfSpeech: "Nouns",
            definition:
                "The act of moving people or resources into position for use.",
            example: "The deployment of the support team reduced response time.",
        },
    ],
};

type WorkspaceHistorySnapshot = {
    moduleId: string;
    unitId: string | null;
    activityId: string | null;
    vocabId: string | null;
};

const WORKSPACE_HISTORY_KEY = "__careerPathLessonWorkspace";
const REVIEWED_VOCABULARY_STORAGE_KEY = "__careerPathReviewedVocabulary";

const DEFAULT_WORKSPACE_SNAPSHOT: WorkspaceHistorySnapshot = {
    moduleId: COURSE.modules[0].id,
    unitId: null,
    activityId: null,
    vocabId: null,
};

function readWorkspaceSnapshot(
    browserState: unknown,
): WorkspaceHistorySnapshot | null {
    if (!browserState || typeof browserState !== "object") return null;

    const candidate = (browserState as Record<string, unknown>)[
        WORKSPACE_HISTORY_KEY
    ];

    if (!candidate || typeof candidate !== "object") return null;

    const raw = candidate as Record<string, unknown>;
    if (typeof raw.moduleId !== "string") return null;

    const module = COURSE.modules.find((item) => item.id === raw.moduleId);
    if (!module) return null;

    const unitId = typeof raw.unitId === "string" ? raw.unitId : null;
    const activityId = typeof raw.activityId === "string" ? raw.activityId : null;
    const vocabId = typeof raw.vocabId === "string" ? raw.vocabId : null;

    if (!unitId && (activityId || vocabId)) return null;

    const unit = unitId ? module.units.find((item) => item.id === unitId) : null;
    if (unitId && !unit) return null;

    const activity = activityId
        ? unit?.activities.find((item) => item.id === activityId)
        : null;
    if (activityId && !activity) return null;

    if (
        vocabId &&
        (activity?.type !== "vocabulary" ||
            !VOCABULARY.some((item) => item.id === vocabId))
    ) {
        return null;
    }

    return {
        moduleId: module.id,
        unitId: unit?.id ?? null,
        activityId: activity?.id ?? null,
        vocabId,
    };
}

const activityIcon = {
    vocabulary: List,
    practice: Star,
    quiz: CircleHelp,
    reference: FileText,
};

function formatDuration(minutes: number) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours === 0) return `${remainingMinutes} min`;
    if (remainingMinutes === 0) return `${hours} hour${hours > 1 ? "s" : ""}`;
    return `${hours}h ${remainingMinutes}m`;
}

function getModuleDuration(module: CourseModule) {
    return module.units.reduce((total, unit) => total + unit.durationMinutes, 0);
}

function getModuleLectures(module: CourseModule) {
    return module.units.reduce((total, unit) => total + unit.lectures, 0);
}

function ProgressRing({ value }: { value: number }) {
    return (
        <div
            className="relative grid h-14 w-14 shrink-0 place-items-center rounded-full"
            style={{
                background: `conic-gradient(#2563eb ${value * 3.6}deg, #dbeafe 0deg)`,
            }}
            role="progressbar"
            aria-label="Course progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={value}
        >
            <div className="grid h-11 w-11 place-items-center rounded-full bg-white text-xs font-bold text-blue-600 dark:bg-slate-900 dark:text-blue-400">
                {value}%
            </div>
        </div>
    );
}

type ModuleSidebarProps = {
    modules: readonly CourseModule[];
    selectedModuleId: string;
    onSelect: (moduleId: string) => void;
};

function ModuleSidebar({
    modules,
    selectedModuleId,
    onSelect,
}: ModuleSidebarProps) {
    return (
        <div className="flex max-h-[min(720px,calc(100dvh-7rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-200 bg-slate-100 px-5 py-4 dark:border-slate-800 dark:bg-slate-800/80">
                <p className="text-center text-sm font-bold leading-5 text-slate-800 dark:text-slate-100">
                    {COURSE.title}
                </p>
            </div>

            <nav
                aria-label="Course modules"
                className="min-h-0 flex-1 overflow-y-auto p-2"
            >
                {modules.map((module, index) => {
                    const isSelected = module.id === selectedModuleId;

                    return (
                        <button
                            key={module.id}
                            type="button"
                            onClick={() => onSelect(module.id)}
                            aria-current={isSelected ? "page" : undefined}
                            className={`group flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${isSelected
                                    ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                                    : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/70"
                                }`}
                        >
                            <span
                                className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-bold ${isSelected
                                        ? "bg-blue-600 text-white"
                                        : "bg-slate-100 text-slate-500 group-hover:bg-white dark:bg-slate-800 dark:text-slate-400"
                                    }`}
                            >
                                {index + 1}
                            </span>

                            <span className="min-w-0 flex-1">
                                <span className="block text-sm font-semibold leading-5">
                                    {module.title}
                                </span>
                                <span className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                                    <span>{getModuleLectures(module)} lectures</span>
                                    <span>{formatDuration(getModuleDuration(module))}</span>
                                </span>
                            </span>

                            <ChevronRight
                                className={`mt-1 h-4 w-4 shrink-0 ${isSelected ? "text-blue-600" : "text-slate-300"
                                    }`}
                            />
                        </button>
                    );
                })}
            </nav>
        </div>
    );
}

type ActivitySidebarProps = {
    unit: Unit;
    activeActivityId: string;
    onSelect: (activityId: string) => void;
    onBack: () => void;
};

function ActivitySidebar({
    unit,
    activeActivityId,
    onSelect,
    onBack,
}: ActivitySidebarProps) {
    return (
        <div className="flex max-h-[min(720px,calc(100dvh-7rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-200 bg-slate-100 px-5 py-4 dark:border-slate-800 dark:bg-slate-800/80">
                <p className="text-center text-sm font-bold leading-5 text-slate-800 dark:text-slate-100">
                    {unit.title}
                </p>
            </div>

            <nav
                aria-label="Unit activities"
                className="min-h-0 flex-1 overflow-y-auto p-2"
            >
                {unit.activities.map((activity) => {
                    const Icon = activityIcon[activity.type];
                    const isSelected = activity.id === activeActivityId;

                    return (
                        <button
                            key={activity.id}
                            type="button"
                            onClick={() => onSelect(activity.id)}
                            className={`flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${isSelected
                                    ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                                    : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/70"
                                }`}
                        >
                            <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                            <span className="flex-1 leading-5">{activity.title}</span>
                            {activity.status === "generating" && (
                                <span className="mt-0.5 h-2 w-2 shrink-0 animate-pulse rounded-full bg-emerald-500" />
                            )}
                        </button>
                    );
                })}
            </nav>

            <div className="border-t border-slate-200 p-2 dark:border-slate-800">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={onBack}
                    className="w-full justify-start gap-2 text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-950/40"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to modules
                </Button>
            </div>
        </div>
    );
}

type CourseOutlineProps = {
    module: CourseModule;
    expandedUnitIds: ReadonlySet<string>;
    onToggleUnit: (unitId: string) => void;
    onOpenActivity: (unitId: string, activityId: string) => void;
};

function CourseOutline({
    module,
    expandedUnitIds,
    onToggleUnit,
    onOpenActivity,
}: CourseOutlineProps) {
    return (
        <section className="overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-sm dark:border-blue-900 dark:bg-slate-900">
            <header className="flex flex-col gap-3 border-b border-blue-200 bg-blue-50 px-5 py-4 dark:border-blue-900 dark:bg-blue-950/35 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600 dark:text-blue-400">
                        Selected module
                    </p>
                    <h2 className="mt-1 break-words text-lg font-bold text-slate-950 dark:text-white sm:text-xl">
                        {module.title}
                    </h2>
                </div>
                <span className="w-fit shrink-0 rounded-full border border-blue-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-600 dark:border-blue-800 dark:bg-slate-900 dark:text-slate-300">
                    {module.dateRange}
                </span>
            </header>

            <div className="space-y-3 p-3 sm:p-5">
                {module.units.map((unit, unitIndex) => {
                    const isExpanded = expandedUnitIds.has(unit.id);

                    return (
                        <article
                            key={unit.id}
                            className={`overflow-hidden rounded-xl border bg-white transition-colors dark:bg-slate-900 ${isExpanded
                                    ? "border-blue-300 dark:border-blue-800"
                                    : "border-slate-200 dark:border-slate-800"
                                }`}
                        >
                            <button
                                type="button"
                                onClick={() => onToggleUnit(unit.id)}
                                aria-expanded={isExpanded}
                                aria-controls={`unit-panel-${unit.id}`}
                                className={`flex w-full items-center gap-3 border-l-4 px-4 py-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 sm:px-5 sm:py-4 ${isExpanded
                                        ? "border-l-blue-600 bg-blue-50/70 text-slate-950 dark:bg-blue-950/30 dark:text-white"
                                        : "border-l-slate-300 bg-white text-slate-900 hover:border-l-blue-400 hover:bg-slate-50 dark:border-l-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800/70"
                                    }`}
                            >
                                <div className="flex min-w-0 flex-1 items-start gap-3">
                                    <span
                                        className={`grid h-10 min-w-10 shrink-0 place-items-center rounded-lg border px-2 text-sm font-extrabold ${isExpanded
                                                ? "border-blue-600 bg-blue-600 text-white"
                                                : "border-slate-300 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                            }`}
                                    >
                                        {String(unitIndex + 1).padStart(2, "0")}
                                    </span>

                                    <div className="min-w-0 flex-1">
                                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-400">
                                            Unit {unitIndex + 1}
                                        </p>
                                        <h3 className="mt-0.5 break-words text-base font-bold leading-5 sm:text-[17px]">
                                            {unit.title}
                                        </h3>

                                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-slate-500 dark:text-slate-400 sm:hidden">
                                            <span className="flex items-center gap-1.5">
                                                <PlayCircle className="h-3.5 w-3.5" />
                                                {unit.lectures} lectures
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <Clock3 className="h-3.5 w-3.5" />
                                                {formatDuration(unit.durationMinutes)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="hidden shrink-0 items-center gap-4 text-sm font-medium text-slate-600 dark:text-slate-300 sm:flex">
                                    <span className="flex items-center gap-1.5">
                                        <PlayCircle className="h-4 w-4" />
                                        {unit.lectures} lectures
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Clock3 className="h-4 w-4" />
                                        {formatDuration(unit.durationMinutes)}
                                    </span>
                                </div>

                                <span className="hidden shrink-0 text-xs font-semibold text-blue-600 dark:text-blue-400 lg:inline">
                                    {isExpanded ? "Expanded" : "Collapsed"}
                                </span>

                                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-blue-200 bg-white text-blue-600 dark:border-blue-800 dark:bg-slate-900 dark:text-blue-400">
                                    <ChevronDown
                                        className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""
                                            }`}
                                    />
                                </span>
                            </button>

                            {isExpanded && (
                                <div
                                    id={`unit-panel-${unit.id}`}
                                    className="border-t border-slate-200 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-950/30"
                                >
                                    {unit.activities.length > 0 ? (
                                        <div className="grid gap-3 md:grid-cols-2">
                                            {unit.activities.map((activity) => {
                                                const Icon = activityIcon[activity.type];

                                                return (
                                                    <button
                                                        key={activity.id}
                                                        type="button"
                                                        onClick={() => onOpenActivity(unit.id, activity.id)}
                                                        className="group flex min-h-[64px] w-full items-center gap-3 rounded-lg border border-slate-200 bg-white p-3.5 text-left text-sm text-slate-700 transition-colors hover:border-blue-300 hover:bg-blue-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-800 dark:hover:bg-blue-950/20"
                                                    >
                                                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                                                            <Icon className="h-4 w-4" />
                                                        </span>

                                                        <span className="min-w-0 flex-1 font-semibold leading-5">
                                                            {activity.title}
                                                        </span>

                                                        {activity.status === "generating" ? (
                                                            <span className="inline-flex shrink-0 items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                                                                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                                                                <span className="hidden 2xl:inline">
                                                                    Generating
                                                                </span>
                                                            </span>
                                                        ) : (
                                                            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-500 transition-colors group-hover:bg-blue-600 group-hover:text-white dark:bg-blue-950/60">
                                                                <ChevronRight className="h-4 w-4" />
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                                            Lesson content will be available soon.
                                        </p>
                                    )}
                                </div>
                            )}
                        </article>
                    );
                })}
            </div>
        </section>
    );
}

type VocabularyTableProps = {
    activityTitle: string;
    selectedVocabularyId: string | null;
    reviewedIds: ReadonlySet<string>;
    onOpenVocabulary: (vocabularyId: string) => void;
    onCloseVocabulary: () => void;
    onNextVocabulary: (vocabularyId: string) => void;
    onCompleteVocabulary: (vocabularyId: string) => void;
};

type VocabularyModalProps = {
    item: Vocabulary;
    onClose: () => void;
    onNext: () => void;
    onComplete: (isCorrect: boolean) => void;
};

type VocabularyAnswerResult = {
    answer: string;
    isCorrect: boolean;
};

function normalizeVocabularyAnswer(value: string) {
    return value.trim().toLocaleLowerCase("en-US").replace(/\s+/g, " ");
}

function VocabularyModal({
    item,
    onClose,
    onNext,
    onComplete,
}: VocabularyModalProps) {
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const answerInputRef = useRef<HTMLInputElement>(null);
    const [answer, setAnswer] = useState("");
    const [result, setResult] = useState<VocabularyAnswerResult | null>(null);
    const meanings = useMemo(
        () =>
            VOCABULARY_MEANINGS[item.id] ?? [
                {
                    partOfSpeech: item.wordForms[0] ?? "Meaning",
                    definition: item.description,
                },
            ],
        [item.description, item.id, item.wordForms],
    );

    const meaningGroups = useMemo(() => {
        const groups = new Map<string, VocabularyMeaning[]>();

        meanings.forEach((meaning) => {
            const current = groups.get(meaning.partOfSpeech) ?? [];
            groups.set(meaning.partOfSpeech, [...current, meaning]);
        });

        return Array.from(groups, ([partOfSpeech, groupMeanings]) => ({
            partOfSpeech,
            meanings: groupMeanings,
        }));
    }, [meanings]);

    useEffect(() => {
        const previousOverflow = document.body.style.overflow;
        const previouslyFocused = document.activeElement as HTMLElement | null;
        const focusFrame = window.requestAnimationFrame(() => {
            answerInputRef.current?.focus();
        });

        document.body.style.overflow = "hidden";

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.cancelAnimationFrame(focusFrame);
            document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", handleKeyDown);
            previouslyFocused?.focus();
        };
    }, [onClose]);

    const speakWord = () => {
        if (!("speechSynthesis" in window)) return;

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(item.word);
        utterance.lang = "en-US";
        window.speechSynthesis.speak(utterance);
    };

    const checkAnswer = (submittedAnswer: string) => {
        if (result) return;

        const isCorrect =
            normalizeVocabularyAnswer(submittedAnswer) ===
            normalizeVocabularyAnswer(item.word);

        setResult({ answer: submittedAnswer.trim(), isCorrect });
        onComplete(isCorrect);
    };

    const promptMeaning = meanings[0];
    const headerAnswer = result?.answer || "No answer";

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-[1px] sm:p-6"
            role="presentation"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby={`vocabulary-dialog-title-${item.id}`}
                className="flex max-h-[min(860px,92dvh)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            >
                <header className="shrink-0 border-b border-slate-200 px-5 py-4 dark:border-slate-800 sm:px-6 sm:py-5">
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-3">
                                {result ? (
                                    <h2
                                        id={`vocabulary-dialog-title-${item.id}`}
                                        className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1 break-words text-2xl font-bold tracking-tight sm:text-3xl"
                                    >
                                        {!result.isCorrect && (
                                            <span className="text-rose-500 line-through decoration-2 dark:text-rose-400">
                                                {headerAnswer}
                                            </span>
                                        )}
                                        <span className="text-emerald-500 dark:text-emerald-400">
                                            {item.word}
                                        </span>
                                    </h2>
                                ) : (
                                    <h2
                                        id={`vocabulary-dialog-title-${item.id}`}
                                        className="break-words text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl"
                                    >
                                        Vocabulary check
                                    </h2>
                                )}

                                {result ? (
                                    <span
                                        className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-sm font-semibold ${result.isCorrect
                                                ? "border-emerald-400 bg-emerald-50 text-emerald-600 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                                                : "border-rose-400 bg-rose-50 text-rose-600 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-400"
                                            }`}
                                    >
                                        {result.isCorrect ? (
                                            <Check className="h-4 w-4" />
                                        ) : (
                                            <X className="h-4 w-4" />
                                        )}
                                        {result.isCorrect ? "Familiar" : "Unfamiliar"}
                                    </span>
                                ) : (
                                    <span className="inline-flex h-9 items-center rounded-full border border-blue-200 bg-blue-50 px-3 text-sm font-semibold text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
                                        Not answered
                                    </span>
                                )}
                            </div>

                            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                                {result
                                    ? `${item.meanings} meanings · ${item.wordForms.length} parts of speech`
                                    : "Read the definition and enter the matching vocabulary word."}
                            </p>
                        </div>

                        <button
                            ref={closeButtonRef}
                            type="button"
                            onClick={onClose}
                            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-slate-800 dark:hover:text-white"
                        >
                            <X className="h-5 w-5" />
                            <span className="sr-only">Close vocabulary</span>
                        </button>
                    </div>
                </header>

                <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/70 p-3 dark:bg-slate-950/35 sm:p-5">
                    {result ? (
                        <div className="space-y-4">
                            <div
                                className={`rounded-xl border px-4 py-3 text-sm font-medium ${result.isCorrect
                                        ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/35 dark:text-emerald-300"
                                        : "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/35 dark:text-rose-300"
                                    }`}
                                role="status"
                            >
                                {result.isCorrect
                                    ? "Correct. You are familiar with this vocabulary word."
                                    : `Not quite. The correct answer is “${item.word}”. Review its meanings below.`}
                            </div>

                            {meaningGroups.map((group) => (
                                <section
                                    key={group.partOfSpeech}
                                    className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
                                >
                                    <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-100 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/80 sm:px-5">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-800 dark:text-slate-100">
                                                {group.partOfSpeech}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={speakWord}
                                                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-white hover:text-blue-600 dark:text-slate-300 dark:hover:bg-slate-900"
                                            >
                                                <Volume2 className="h-4 w-4" />
                                                US
                                            </button>
                                        </div>

                                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                            {group.meanings.length} shown
                                        </span>
                                    </header>

                                    <ol className="space-y-3 p-3 sm:p-4">
                                        {group.meanings.map((meaning, index) => (
                                            <li
                                                key={`${meaning.definition}-${index}`}
                                                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-5"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <span className="mt-0.5 shrink-0 text-sm font-bold text-blue-600 dark:text-blue-400">
                                                        {index + 1}.
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="font-semibold leading-6 text-slate-800 dark:text-slate-100">
                                                            {meaning.definition}
                                                        </p>

                                                        {meaning.example && (
                                                            <div className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                                                                <p className="font-medium not-italic">
                                                                    Example:
                                                                </p>
                                                                <p className="italic">{meaning.example}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ol>
                                </section>
                            ))}
                        </div>
                    ) : (
                        <form
                            className="mx-auto flex min-h-[430px] max-w-2xl flex-col justify-center"
                            onSubmit={(event) => {
                                event.preventDefault();
                                if (answer.trim()) checkAnswer(answer);
                            }}
                        >
                            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-7">
                                <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600 dark:text-blue-400">
                                    Definition
                                </p>
                                <p className="mt-3 text-lg font-semibold leading-8 text-slate-800 dark:text-slate-100 sm:text-xl">
                                    {promptMeaning.definition}
                                </p>

                                <label
                                    htmlFor={`vocabulary-answer-${item.id}`}
                                    className="mt-7 block text-sm font-bold text-slate-700 dark:text-slate-200"
                                >
                                    Your answer
                                </label>
                                <input
                                    ref={answerInputRef}
                                    id={`vocabulary-answer-${item.id}`}
                                    value={answer}
                                    onChange={(event) => setAnswer(event.target.value)}
                                    autoComplete="off"
                                    spellCheck={false}
                                    placeholder="Type the vocabulary word..."
                                    className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-blue-950"
                                />

                                <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => checkAnswer("")}
                                    >
                                        I don&apos;t know
                                    </Button>
                                    <Button type="submit" disabled={!answer.trim()}>
                                        Check answer
                                    </Button>
                                </div>
                            </section>
                        </form>
                    )}
                </div>

                <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900 sm:px-6">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    {result && (
                        <Button type="button" onClick={onNext} className="gap-1.5">
                            Next
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    )}
                </footer>
            </section>
        </div>
    );
}

function VocabularyTable({
    activityTitle,
    selectedVocabularyId,
    reviewedIds,
    onOpenVocabulary,
    onCloseVocabulary,
    onNextVocabulary,
    onCompleteVocabulary,
}: VocabularyTableProps) {
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(1);
    const pageSize = 5;

    const selectedVocabulary = selectedVocabularyId
        ? (VOCABULARY.find((item) => item.id === selectedVocabularyId) ?? null)
        : null;

    const filteredVocabulary = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();

        if (!normalizedQuery) return VOCABULARY;

        return VOCABULARY.filter((item) =>
            [item.word, item.description, ...item.domains]
                .join(" ")
                .toLowerCase()
                .includes(normalizedQuery),
        );
    }, [query]);

    const totalPages = Math.max(
        1,
        Math.ceil(filteredVocabulary.length / pageSize),
    );
    const safePage = Math.min(page, totalPages);
    const pageItems = filteredVocabulary.slice(
        (safePage - 1) * pageSize,
        safePage * pageSize,
    );

    return (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:rounded-2xl">
            <header className="border-b border-slate-200 bg-slate-100 px-4 py-4 dark:border-slate-800 dark:bg-slate-800/80 sm:px-5">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-600 dark:text-blue-400">
                    Vocabulary activity
                </p>
                <h2 className="mt-1 text-lg font-bold text-slate-900 dark:text-white sm:text-xl">
                    {activityTitle}
                </h2>
            </header>

            <div className="p-3 sm:p-4">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                            Technical vocabulary
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                            Review the terms before continuing to the next activity.
                        </p>
                    </div>

                    <label className="relative block w-full sm:w-72">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            value={query}
                            onChange={(event) => {
                                setQuery(event.target.value);
                                setPage(1);
                            }}
                            placeholder="Search vocabulary..."
                            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-blue-950"
                        />
                    </label>
                </div>

                {/* Mobile: cards avoid horizontal table scrolling. */}
                <div className="space-y-3 lg:hidden">
                    {pageItems.map((item) => {
                        const isReviewed = reviewedIds.has(item.id);

                        return (
                            <article
                                key={item.id}
                                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <button
                                            type="button"
                                            onClick={() => onOpenVocabulary(item.id)}
                                            className="break-words text-left text-base font-bold text-slate-900 transition-colors hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-white dark:hover:text-blue-400"
                                        >
                                            {item.word}
                                        </button>
                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                            {item.wordForms.map((form) => (
                                                <span
                                                    key={form}
                                                    className="rounded-md border border-slate-300 px-2 py-1 text-[11px] font-medium text-slate-600 dark:border-slate-600 dark:text-slate-300"
                                                >
                                                    {form}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => onOpenVocabulary(item.id)}
                                        aria-label={`${isReviewed ? "Review again" : "Start review"}: ${item.word}`}
                                        className={`inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${isReviewed
                                                ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400"
                                                : "border-blue-300 text-blue-600 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-950/40"
                                            }`}
                                    >
                                        {isReviewed && <Check className="h-3.5 w-3.5" />}
                                        <span className="hidden min-[390px]:inline">
                                            {isReviewed ? "Reviewed" : "Not reviewed"}
                                        </span>
                                        <span className="min-[390px]:hidden">
                                            {isReviewed ? "Done" : "Review"}
                                        </span>
                                    </button>
                                </div>

                                <p className="mt-3 break-words text-sm leading-6 text-slate-600 dark:text-slate-300">
                                    {item.description}
                                </p>

                                <button
                                    type="button"
                                    onClick={() => onOpenVocabulary(item.id)}
                                    className="mt-2 text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
                                >
                                    +{item.meanings} meanings
                                </button>

                                <div className="mt-3 flex flex-wrap gap-1.5 border-t border-slate-100 pt-3 dark:border-slate-800">
                                    {item.domains.map((domain) => (
                                        <span
                                            key={domain}
                                            className="max-w-full break-words rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                                        >
                                            {domain}
                                        </span>
                                    ))}
                                </div>
                            </article>
                        );
                    })}

                    {pageItems.length === 0 && (
                        <div className="rounded-xl border border-slate-200 px-4 py-12 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                            No vocabulary matches “{query}”.
                        </div>
                    )}
                </div>

                {/* Desktop: keep the information-dense table from the reference UI. */}
                <div className="hidden overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 lg:block">
                    <table className="w-full min-w-[860px] border-collapse text-left text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">
                            <tr>
                                <th className="px-4 py-3 font-bold">Vocab list</th>
                                <th className="px-4 py-3 font-bold">Word form</th>
                                <th className="px-4 py-3 font-bold">Description</th>
                                <th className="px-4 py-3 font-bold">Domain</th>
                                <th className="px-4 py-3 text-center font-bold">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {pageItems.map((item) => {
                                const isReviewed = reviewedIds.has(item.id);

                                return (
                                    <tr
                                        key={item.id}
                                        className="align-middle transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                                    >
                                        <td className="px-4 py-4">
                                            <button
                                                type="button"
                                                onClick={() => onOpenVocabulary(item.id)}
                                                className="font-bold text-slate-900 transition-colors hover:text-blue-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-white dark:hover:text-blue-400"
                                            >
                                                {item.word}
                                            </button>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {item.wordForms.map((form) => (
                                                    <span
                                                        key={form}
                                                        className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-600 dark:border-slate-600 dark:text-slate-300"
                                                    >
                                                        {form}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="max-w-lg px-4 py-4 text-slate-600 dark:text-slate-300">
                                            <p className="leading-5">{item.description}</p>
                                            <button
                                                type="button"
                                                onClick={() => onOpenVocabulary(item.id)}
                                                className="mt-2 text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
                                            >
                                                +{item.meanings} meanings
                                            </button>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex max-w-48 flex-wrap gap-1">
                                                {item.domains.slice(0, 2).map((domain) => (
                                                    <span
                                                        key={domain}
                                                        className="rounded-md border border-slate-300 px-2 py-1 text-[11px] font-medium text-slate-600 dark:border-slate-600 dark:text-slate-300"
                                                    >
                                                        {domain}
                                                    </span>
                                                ))}
                                                {item.domains.length > 2 && (
                                                    <span className="rounded-md border border-slate-300 px-2 py-1 text-[11px] font-medium text-slate-600 dark:border-slate-600 dark:text-slate-300">
                                                        +{item.domains.length - 2}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <button
                                                type="button"
                                                onClick={() => onOpenVocabulary(item.id)}
                                                aria-label={`${isReviewed ? "Review again" : "Start review"}: ${item.word}`}
                                                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${isReviewed
                                                        ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400"
                                                        : "border-blue-300 text-blue-600 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-950/40"
                                                    }`}
                                            >
                                                {isReviewed && <Check className="h-3.5 w-3.5" />}
                                                {isReviewed ? "Reviewed" : "Not reviewed"}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {pageItems.length === 0 && (
                        <div className="px-4 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                            No vocabulary matches “{query}”.
                        </div>
                    )}
                </div>

                <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
                    <p className="text-center text-sm text-slate-500 dark:text-slate-400 sm:text-left">
                        Showing {pageItems.length} of {filteredVocabulary.length} terms
                    </p>

                    <div className="flex w-full items-center justify-center gap-1 sm:w-auto sm:justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-9 w-9"
                            disabled={safePage === 1}
                            onClick={() => setPage((current) => Math.max(1, current - 1))}
                        >
                            <ChevronLeft className="h-4 w-4" />
                            <span className="sr-only">Previous page</span>
                        </Button>

                        {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                            (pageNumber) => (
                                <Button
                                    key={pageNumber}
                                    type="button"
                                    variant={safePage === pageNumber ? "default" : "ghost"}
                                    size="icon"
                                    className="h-9 w-9"
                                    onClick={() => setPage(pageNumber)}
                                >
                                    {pageNumber}
                                </Button>
                            ),
                        )}

                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-9 w-9"
                            disabled={safePage === totalPages}
                            onClick={() =>
                                setPage((current) => Math.min(totalPages, current + 1))
                            }
                        >
                            <ChevronRight className="h-4 w-4" />
                            <span className="sr-only">Next page</span>
                        </Button>
                    </div>
                </div>
            </div>

            {selectedVocabulary && (
                <VocabularyModal
                    key={selectedVocabulary.id}
                    item={selectedVocabulary}
                    onClose={onCloseVocabulary}
                    onComplete={() => onCompleteVocabulary(selectedVocabulary.id)}
                    onNext={() => {
                        const currentIndex = VOCABULARY.findIndex(
                            (item) => item.id === selectedVocabulary.id,
                        );
                        const nextItem = VOCABULARY[(currentIndex + 1) % VOCABULARY.length];
                        onNextVocabulary(nextItem.id);
                    }}
                />
            )}
        </section>
    );
}

function GenericActivity({ activity }: { activity: Activity }) {
    const Icon = activityIcon[activity.type];

    return (
        <section className="grid min-h-[460px] place-items-center rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="max-w-md">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                    <Icon className="h-8 w-8" />
                </div>
                <h2 className="mt-5 text-2xl font-bold text-slate-900 dark:text-white">
                    {activity.title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    {activity.status === "generating"
                        ? "This learning activity is being generated. You can continue exploring the other available content."
                        : "This activity is ready. Connect this panel to your existing lesson component or API response."}
                </p>
                {activity.status === "generating" && (
                    <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                        <Sparkles className="h-4 w-4 animate-pulse" />
                        Generating content...
                    </div>
                )}
            </div>
        </section>
    );
}

export function LessonWorkspace() {
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [reviewedVocabularyIds, setReviewedVocabularyIds] = useState<
        Set<string>
    >(() => {
        if (typeof window === "undefined") return new Set();

        try {
            const storedIds = JSON.parse(
                window.localStorage.getItem(REVIEWED_VOCABULARY_STORAGE_KEY) ?? "[]",
            );

            if (!Array.isArray(storedIds)) return new Set();

            return new Set(
                storedIds.filter(
                    (id): id is string =>
                        typeof id === "string" &&
                        VOCABULARY.some((vocabulary) => vocabulary.id === id),
                ),
            );
        } catch {
            return new Set();
        }
    });
    const [selectedModuleId, setSelectedModuleId] = useState(
        COURSE.modules[0].id,
    );
    const selectedModuleIdRef = useRef(COURSE.modules[0].id);
    const [expandedUnitIds, setExpandedUnitIds] = useState<Set<string>>(
        () => new Set(COURSE.modules[0].units.map((unit) => unit.id)),
    );
    const [activeUnitId, setActiveUnitId] = useState<string | null>(null);
    const [activeActivityId, setActiveActivityId] = useState<string | null>(null);
    const [selectedVocabularyId, setSelectedVocabularyId] = useState<
        string | null
    >(null);

    const applyWorkspaceSnapshot = useCallback(
        (snapshot: WorkspaceHistorySnapshot) => {
            const nextModule =
                COURSE.modules.find((module) => module.id === snapshot.moduleId) ??
                COURSE.modules[0];

            if (selectedModuleIdRef.current !== nextModule.id) {
                selectedModuleIdRef.current = nextModule.id;
                setExpandedUnitIds(new Set(nextModule.units.map((unit) => unit.id)));
            }

            setSelectedModuleId(nextModule.id);
            setActiveUnitId(snapshot.unitId);
            setActiveActivityId(snapshot.activityId);
            setSelectedVocabularyId(snapshot.vocabId);
            setMobileSidebarOpen(false);
        },
        [],
    );

    const navigateWorkspace = useCallback(
        (snapshot: WorkspaceHistorySnapshot, mode: "push" | "replace" = "push") => {
            if (typeof window === "undefined") return;

            const currentBrowserState =
                window.history.state && typeof window.history.state === "object"
                    ? window.history.state
                    : {};
            const nextBrowserState = {
                ...currentBrowserState,
                [WORKSPACE_HISTORY_KEY]: snapshot,
            };

            if (mode === "replace") {
                window.history.replaceState(nextBrowserState, "", window.location.href);
            } else {
                window.history.pushState(nextBrowserState, "", window.location.href);
            }

            applyWorkspaceSnapshot(snapshot);
        },
        [applyWorkspaceSnapshot],
    );

    useEffect(() => {
        const currentSnapshot = readWorkspaceSnapshot(window.history.state);

        if (currentSnapshot) {
            applyWorkspaceSnapshot(currentSnapshot);
        } else {
            const currentBrowserState =
                window.history.state && typeof window.history.state === "object"
                    ? window.history.state
                    : {};

            window.history.replaceState(
                {
                    ...currentBrowserState,
                    [WORKSPACE_HISTORY_KEY]: DEFAULT_WORKSPACE_SNAPSHOT,
                },
                "",
                window.location.href,
            );
        }

        const handlePopState = (event: PopStateEvent) => {
            const snapshot = readWorkspaceSnapshot(event.state);
            if (snapshot) applyWorkspaceSnapshot(snapshot);
        };

        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, [applyWorkspaceSnapshot]);

    const selectedModule =
        COURSE.modules.find((module) => module.id === selectedModuleId) ??
        COURSE.modules[0];

    const activeUnit = activeUnitId
        ? (selectedModule.units.find((unit) => unit.id === activeUnitId) ?? null)
        : null;

    const activeActivity = activeActivityId
        ? (activeUnit?.activities.find(
            (activity) => activity.id === activeActivityId,
        ) ?? null)
        : null;

    const isActivityView = Boolean(activeUnit && activeActivity);

    const courseTotals = useMemo(() => {
        const units = COURSE.modules.flatMap((module) => module.units);

        return {
            modules: COURSE.modules.length,
            lectures: units.reduce((total, unit) => total + unit.lectures, 0),
            minutes: units.reduce((total, unit) => total + unit.durationMinutes, 0),
        };
    }, []);

    const selectModule = (moduleId: string) => {
        const nextModule =
            COURSE.modules.find((module) => module.id === moduleId) ??
            COURSE.modules[0];

        navigateWorkspace({
            moduleId: nextModule.id,
            unitId: null,
            activityId: null,
            vocabId: null,
        });
    };

    const openActivity = (unitId: string, activityId: string) => {
        navigateWorkspace({
            moduleId: selectedModule.id,
            unitId,
            activityId,
            vocabId: null,
        });
    };

    const backToModules = () => {
        navigateWorkspace({
            moduleId: selectedModule.id,
            unitId: null,
            activityId: null,
            vocabId: null,
        });
    };

    const selectActivity = (activityId: string) => {
        if (!activeUnit) return;

        navigateWorkspace({
            moduleId: selectedModule.id,
            unitId: activeUnit.id,
            activityId,
            vocabId: null,
        });
    };

    const openVocabulary = (vocabularyId: string) => {
        if (!activeUnit || !activeActivity) return;

        navigateWorkspace({
            moduleId: selectedModule.id,
            unitId: activeUnit.id,
            activityId: activeActivity.id,
            vocabId: vocabularyId,
        });
    };

    const closeVocabulary = useCallback(() => {
        const currentSnapshot = readWorkspaceSnapshot(window.history.state);

        if (currentSnapshot?.vocabId) {
            window.history.back();
            return;
        }

        navigateWorkspace(
            {
                moduleId: selectedModule.id,
                unitId: activeUnit?.id ?? null,
                activityId: activeActivity?.id ?? null,
                vocabId: null,
            },
            "replace",
        );
    }, [
        activeActivity?.id,
        activeUnit?.id,
        navigateWorkspace,
        selectedModule.id,
    ]);

    const nextVocabulary = (vocabularyId: string) => {
        if (!activeUnit || !activeActivity) return;

        navigateWorkspace(
            {
                moduleId: selectedModule.id,
                unitId: activeUnit.id,
                activityId: activeActivity.id,
                vocabId: vocabularyId,
            },
            "replace",
        );
    };

    const completeVocabulary = useCallback((vocabularyId: string) => {
        setReviewedVocabularyIds((current) => {
            if (current.has(vocabularyId)) return current;

            const next = new Set(current);
            next.add(vocabularyId);

            try {
                window.localStorage.setItem(
                    REVIEWED_VOCABULARY_STORAGE_KEY,
                    JSON.stringify(Array.from(next)),
                );
            } catch {
                // Keep the status in React state when browser storage is unavailable.
            }

            return next;
        });
    }, []);

    const sidebar =
        isActivityView && activeUnit && activeActivity ? (
            <ActivitySidebar
                unit={activeUnit}
                activeActivityId={activeActivity.id}
                onSelect={selectActivity}
                onBack={backToModules}
            />
        ) : (
            <ModuleSidebar
                modules={COURSE.modules}
                selectedModuleId={selectedModule.id}
                onSelect={selectModule}
            />
        );

    return (
        <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
            <MainNavigationMenu />

            <div className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 px-4 py-3 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95 xl:hidden">
                <div className="flex items-center justify-between gap-3">
                    <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2">
                                <Menu className="h-4 w-4 text-blue-600" />
                                {isActivityView ? "Unit outline" : "Modules"}
                            </Button>
                        </SheetTrigger>

                        <SheetContent
                            side="left"
                            className="w-[calc(100vw-1.25rem)] max-w-sm overflow-y-auto p-3 sm:p-4"
                        >
                            <SheetHeader className="mb-4 text-left">
                                <SheetTitle className="flex items-center gap-2">
                                    <BookOpen className="h-5 w-5 text-blue-600" />
                                    {isActivityView ? "Unit outline" : "Course modules"}
                                </SheetTitle>
                            </SheetHeader>
                            {sidebar}
                        </SheetContent>
                    </Sheet>

                    <span className="min-w-0 truncate text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {isActivityView ? activeActivity?.title : selectedModule.title}
                    </span>

                    <div className="hidden sm:block">
                        <ProgressRing value={COURSE.progress} />
                    </div>
                    <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 sm:hidden">
                        {COURSE.progress}%
                    </span>
                </div>
            </div>

            <main className="mx-auto w-full max-w-[1680px] px-3 py-4 sm:px-6 sm:py-6 xl:px-8">
                <header className="mb-4 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:mb-5 sm:flex-row sm:items-center sm:justify-between sm:rounded-2xl sm:p-5">
                    <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-600 dark:text-blue-400">
                            Course workspace
                        </p>
                        <h1 className="mt-1 break-words text-xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
                            {COURSE.title}
                        </h1>
                        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1.5">
                                <BookOpen className="h-4 w-4" />
                                {courseTotals.modules} modules
                            </span>
                            <span className="flex items-center gap-1.5">
                                <PlayCircle className="h-4 w-4" />
                                {courseTotals.lectures} lectures
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Clock3 className="h-4 w-4" />
                                {formatDuration(courseTotals.minutes)}
                            </span>
                        </div>
                    </div>

                    <div className="hidden items-center gap-3 xl:flex">
                        <div className="text-right">
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                Overall progress
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Keep learning to complete this course
                            </p>
                        </div>
                        <ProgressRing value={COURSE.progress} />
                    </div>
                </header>

                <div className="grid items-start gap-4 xl:grid-cols-[300px_minmax(0,1fr)] xl:gap-5 2xl:grid-cols-[320px_minmax(0,1fr)]">
                    <aside className="sticky top-5 hidden xl:block">{sidebar}</aside>

                    <div className="min-w-0">
                        {isActivityView && activeActivity ? (
                            activeActivity.type === "vocabulary" ? (
                                <VocabularyTable
                                    activityTitle={activeActivity.title}
                                    selectedVocabularyId={selectedVocabularyId}
                                    reviewedIds={reviewedVocabularyIds}
                                    onOpenVocabulary={openVocabulary}
                                    onCloseVocabulary={closeVocabulary}
                                    onNextVocabulary={nextVocabulary}
                                    onCompleteVocabulary={completeVocabulary}
                                />
                            ) : (
                                <GenericActivity activity={activeActivity} />
                            )
                        ) : (
                            <CourseOutline
                                module={selectedModule}
                                expandedUnitIds={expandedUnitIds}
                                onToggleUnit={(unitId) => {
                                    setExpandedUnitIds((current) => {
                                        const next = new Set(current);

                                        if (next.has(unitId)) {
                                            next.delete(unitId);
                                        } else {
                                            next.add(unitId);
                                        }

                                        return next;
                                    });
                                }}
                                onOpenActivity={openActivity}
                            />
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}