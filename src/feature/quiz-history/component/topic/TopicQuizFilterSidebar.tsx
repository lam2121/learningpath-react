import {
    ArrowUpDown,
    CheckCircle2,
    Clock3,
    RotateCcw,
    Search,
    SlidersHorizontal,
    TrendingUp,
    X,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/shadcn/component/ui/card";
import { Input } from "@/shadcn/component/ui/input";

export type TopicQuizSortOption = "topic-asc" | "topic-desc" | "score-desc" | "title-asc" | "newest" | "oldest";

interface TopicQuizFilterSidebarProps {
    searchTerm: string;
    onSearchTermChange: (term: string) => void;
    sortOption: TopicQuizSortOption;
    onSortOptionChange: (sort: TopicQuizSortOption) => void;
    onReset: () => void;
    isFilterActive: boolean;
    uiTokens: {
        panel: string;
        header: string;
        activeControl: string;
        inactiveControl: string;
    };
}

export function TopicQuizFilterSidebar({
    searchTerm,
    onSearchTermChange,
    sortOption,
    onSortOptionChange,
    onReset,
    isFilterActive,
    uiTokens,
}: TopicQuizFilterSidebarProps) {
    const { t } = useTranslation(["history", "profile"]);

    return (
        <div className="space-y-4 lg:col-span-1">
            <Card className={uiTokens.panel}>
                <CardHeader className={`${uiTokens.header} px-4 py-3 sm:px-5`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="rounded-lg bg-white/25 p-1 text-white">
                                <SlidersHorizontal className="h-3.5 w-3.5" />
                            </div>
                            <CardTitle className="text-lg font-bold text-white">
                                {t("filters.title", { defaultValue: "Search & Filter" })}
                            </CardTitle>
                        </div>
                        {isFilterActive && (
                            <button
                                type="button"
                                onClick={onReset}
                                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-bold text-cyan-50 transition-colors hover:bg-white/15"
                            >
                                <RotateCcw className="h-3 w-3" />
                                {t("filters.reset", { defaultValue: "Reset" })}
                            </button>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-5 p-4 sm:p-5">
                    {/* Search */}
                    <div>
                        <label className="mb-2 block text-sm font-bold uppercase tracking-[0.14em] text-[#005596]/60 dark:text-cyan-400/80">
                            {t("filters.search", { defaultValue: "Search" })}
                        </label>
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-500" />
                            <Input
                                type="search"
                                value={searchTerm}
                                onChange={(e) => onSearchTermChange(e.target.value)}
                                placeholder={t("topicQuiz.filters.searchPlaceholder", {
                                    defaultValue: "Search topic name...",
                                })}
                                className="h-11 rounded-xl border-cyan-100 bg-cyan-50/60 pl-9 pr-8 text-base focus-visible:border-cyan-300 focus-visible:bg-white dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder-slate-400 dark:focus-visible:bg-slate-800 dark:focus-visible:border-cyan-500"
                            />
                            {searchTerm && (
                                <button
                                    type="button"
                                    onClick={() => onSearchTermChange("")}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-cyan-500 hover:bg-cyan-100 dark:hover:bg-slate-700 dark:hover:text-cyan-300"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Sort */}
                    <div>
                        <label className="mb-2 block text-sm font-bold uppercase tracking-[0.14em] text-[#005596]/60 dark:text-cyan-400/80">
                            {t("filters.sortBy", { defaultValue: "Sort By" })}
                        </label>
                        <div className="grid grid-cols-1 gap-1.5">
                            <button
                                type="button"
                                onClick={() => onSortOptionChange("topic-asc")}
                                className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-all ${
                                    sortOption === "topic-asc"
                                        ? `${uiTokens.activeControl} font-bold`
                                        : uiTokens.inactiveControl
                                }`}
                            >
                                <span className="flex items-center gap-2">
                                    <ArrowUpDown className="h-4 w-4" />
                                    {t("sort.topicAscDefault", { defaultValue: "Topic 1 → 8 (Default)" })}
                                </span>
                                {sortOption === "topic-asc" && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />}
                            </button>

                            <button
                                type="button"
                                onClick={() => onSortOptionChange("topic-desc")}
                                className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-all ${
                                    sortOption === "topic-desc"
                                        ? `${uiTokens.activeControl} font-bold`
                                        : uiTokens.inactiveControl
                                }`}
                            >
                                <span className="flex items-center gap-2">
                                    <ArrowUpDown className="h-4 w-4" />
                                    {t("sort.topicDesc", { defaultValue: "Topic 8 → 1" })}
                                </span>
                                {sortOption === "topic-desc" && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />}
                            </button>

                            <button
                                type="button"
                                onClick={() => onSortOptionChange("score-desc")}
                                className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-all ${
                                    sortOption === "score-desc"
                                        ? `${uiTokens.activeControl} font-bold`
                                        : uiTokens.inactiveControl
                                }`}
                            >
                                <span className="flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4" />
                                    {t("sort.highestScore", { defaultValue: "Highest Score" })}
                                </span>
                                {sortOption === "score-desc" && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />}
                            </button>

                            <button
                                type="button"
                                onClick={() => onSortOptionChange("newest")}
                                className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-all ${
                                    sortOption === "newest"
                                        ? `${uiTokens.activeControl} font-bold`
                                        : uiTokens.inactiveControl
                                }`}
                            >
                                <span className="flex items-center gap-2">
                                    <Clock3 className="h-4 w-4" />
                                    {t("sort.newest", { defaultValue: "Newest First" })}
                                </span>
                                {sortOption === "newest" && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />}
                            </button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
