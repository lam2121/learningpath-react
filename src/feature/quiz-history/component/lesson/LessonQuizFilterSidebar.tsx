import {
    ArrowDownAZ,
    ArrowUpDown,
    ArrowUpZA,
    CalendarClock,
    CheckCircle2,
    Clock3,
    RotateCcw,
    Search,
    SlidersHorizontal,
    X,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/shadcn/component/ui/card";
import { Input } from "@/shadcn/component/ui/input";
import {
    lessonHistoryUi,
    lessonSkillFilters,
    type SortOption,
} from "./lessonHistoryTypes";

interface LessonQuizFilterSidebarProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    sortOption: SortOption;
    onSortChange: (newSort: SortOption) => void;
    selectedSkillFilter: string;
    onSkillFilterChange: (skill: string) => void;
    isFilterActive: boolean;
    onResetFilters: () => void;
}

export function LessonQuizFilterSidebar({
    searchTerm,
    onSearchChange,
    sortOption,
    onSortChange,
    selectedSkillFilter,
    onSkillFilterChange,
    isFilterActive,
    onResetFilters,
}: LessonQuizFilterSidebarProps) {
    const { t } = useTranslation(["history", "profile"]);

    return (
        <div className="lg:col-span-1 space-y-4">
            <Card className={lessonHistoryUi.panel}>
                <CardHeader className={`${lessonHistoryUi.header} px-4 py-3 sm:px-5`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="rounded-lg bg-white/25 p-1 text-white">
                                <SlidersHorizontal className="h-3.5 w-3.5" />
                            </div>
                            <CardTitle className="text-lg font-bold text-white">
                                {t("filters.title", { defaultValue: "Search & Filter" })}
                            </CardTitle>
                        </div>
                        {isFilterActive ? (
                            <button
                                type="button"
                                onClick={onResetFilters}
                                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-bold text-cyan-50 transition-colors hover:bg-white/15"
                            >
                                <RotateCcw className="h-3 w-3" />
                                {t("filters.reset", { defaultValue: "Reset" })}
                            </button>
                        ) : null}
                    </div>
                </CardHeader>

                <CardContent className="p-4 sm:p-5 space-y-5">
                    {/* Keyword Search */}
                    <div>
                        <label className="mb-2 block text-sm font-bold uppercase tracking-[0.14em] text-[#005596]/60 dark:text-cyan-400/80">
                            {t("filters.search", { defaultValue: "Search" })}
                        </label>
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-500" />
                            <Input
                                type="search"
                                value={searchTerm}
                                onChange={(event) => onSearchChange(event.target.value)}
                                placeholder={t("filters.searchPlaceholder", { defaultValue: "Search topic, lesson..." })}
                                className="h-11 rounded-xl border-cyan-100 bg-cyan-50/60 pl-9 pr-8 text-base focus-visible:bg-white focus-visible:border-cyan-300 focus-visible:ring-cyan-100 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder-slate-400 dark:focus-visible:bg-slate-800 dark:focus-visible:border-cyan-500"
                            />
                            {searchTerm ? (
                                <button
                                    type="button"
                                    onClick={() => onSearchChange("")}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-cyan-500 hover:bg-cyan-100 hover:text-[#0072BB] dark:hover:bg-slate-700 dark:hover:text-cyan-300"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            ) : null}
                        </div>
                    </div>

                    {/* Sort Options */}
                    <div>
                        <label className="mb-2 block text-sm font-bold uppercase tracking-[0.14em] text-[#005596]/60 dark:text-cyan-400/80">
                            {t("filters.sortBy", { defaultValue: "Sort By" })}
                        </label>
                        <div className="grid grid-cols-1 gap-1.5">
                            <button
                                type="button"
                                onClick={() => onSortChange("title-asc")}
                                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${sortOption === "title-asc"
                                    ? `${lessonHistoryUi.activeControl} font-bold`
                                    : lessonHistoryUi.inactiveControl
                                    }`}
                            >
                                <span className="flex items-center gap-2">
                                    <ArrowDownAZ className="h-4 w-4" />
                                    {t("sort.aToZ", { defaultValue: "A → Z (Alphabetical)" })}
                                </span>
                                {sortOption === "title-asc" ? (
                                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                                ) : null}
                            </button>

                            <button
                                type="button"
                                onClick={() => onSortChange("title-desc")}
                                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${sortOption === "title-desc"
                                    ? `${lessonHistoryUi.activeControl} font-bold`
                                    : lessonHistoryUi.inactiveControl
                                    }`}
                            >
                                <span className="flex items-center gap-2">
                                    <ArrowUpZA className="h-4 w-4" />
                                    {t("sort.zToA", { defaultValue: "Z → A (Alphabetical)" })}
                                </span>
                                {sortOption === "title-desc" ? (
                                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                                ) : null}
                            </button>

                            <button
                                type="button"
                                onClick={() => onSortChange("newest")}
                                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${sortOption === "newest"
                                    ? `${lessonHistoryUi.activeControl} font-bold`
                                    : lessonHistoryUi.inactiveControl
                                    }`}
                            >
                                <span className="flex items-center gap-2">
                                    <Clock3 className="h-4 w-4" />
                                    {t("sort.newest", { defaultValue: "Newest First" })}
                                </span>
                                {sortOption === "newest" ? (
                                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                                ) : null}
                            </button>

                            <button
                                type="button"
                                onClick={() => onSortChange("oldest")}
                                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${sortOption === "oldest"
                                    ? `${lessonHistoryUi.activeControl} font-bold`
                                    : lessonHistoryUi.inactiveControl
                                    }`}
                            >
                                <span className="flex items-center gap-2">
                                    <CalendarClock className="h-4 w-4" />
                                    {t("sort.oldest", { defaultValue: "Oldest First" })}
                                </span>
                                {sortOption === "oldest" ? (
                                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                                ) : null}
                            </button>

                            <button
                                type="button"
                                onClick={() => onSortChange("topic-asc")}
                                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${sortOption === "topic-asc"
                                    ? `${lessonHistoryUi.activeControl} font-bold`
                                    : lessonHistoryUi.inactiveControl
                                    }`}
                            >
                                <span className="flex items-center gap-2">
                                    <ArrowUpDown className="h-4 w-4" />
                                    {t("sort.topicAsc", { defaultValue: "Topic 1 → 8" })}
                                </span>
                                {sortOption === "topic-asc" ? (
                                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                                ) : null}
                            </button>

                            <button
                                type="button"
                                onClick={() => onSortChange("topic-desc")}
                                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${sortOption === "topic-desc"
                                    ? `${lessonHistoryUi.activeControl} font-bold`
                                    : lessonHistoryUi.inactiveControl
                                    }`}
                            >
                                <span className="flex items-center gap-2">
                                    <ArrowUpDown className="h-4 w-4" />
                                    {t("sort.topicDesc", { defaultValue: "Topic 8 → 1" })}
                                </span>
                                {sortOption === "topic-desc" ? (
                                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                                ) : null}
                            </button>
                        </div>
                    </div>

                    {/* Skill Filter */}
                    <div>
                        <label className="mb-2 block text-sm font-bold uppercase tracking-[0.14em] text-[#005596]/60 dark:text-cyan-400/80">
                            {t("filters.skill", { defaultValue: "Filter by Skill" })}
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {lessonSkillFilters.map((filter) => {
                                const isActive = selectedSkillFilter === filter.value;
                                return (
                                    <button
                                        key={filter.value}
                                        type="button"
                                        onClick={() => onSkillFilterChange(filter.value)}
                                        className={`rounded-xl px-3.5 py-2 text-sm sm:text-base font-bold transition-all ${
                                            isActive ? filter.activeClass : filter.inactiveClass
                                        }`}
                                    >
                                        {filter.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
