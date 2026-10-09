export const LESSONS_PER_PAGE = 12;
export const TOPICS_PER_PAGE = 2;

export const lessonHistoryUi = {
    panel: "gap-0 overflow-hidden rounded-2xl border border-cyan-200 bg-slate-50 py-0 shadow-[0_12px_32px_rgba(0,114,187,0.14)] dark:border-cyan-900/40 dark:bg-slate-900 dark:shadow-[0_12px_32px_rgba(0,0,0,0.4)]",
    header: "border-b border-cyan-200/70 bg-gradient-to-r from-[#005596] via-[#0072BB] to-[#00A9CE] dark:border-cyan-900/60",
    activeControl: "bg-[#0072BB] text-white shadow-md shadow-cyan-200/70 dark:bg-blue-600 dark:shadow-none",
    inactiveControl: "bg-slate-100 text-slate-800 hover:bg-cyan-100 hover:text-[#005596] dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:text-cyan-300",
} as const;

export const lessonSkillFilters = [
    {
        value: "all",
        label: "All",
        activeClass: "bg-[#0072BB] text-white shadow-sm",
        inactiveClass: "bg-cyan-50 text-[#005596] hover:bg-cyan-100 dark:bg-cyan-950/60 dark:text-cyan-300 dark:hover:bg-cyan-900/60",
    },
    {
        value: "D_doc",
        label: "Doc (D)",
        activeClass: "bg-[#0072BB] text-white shadow-sm",
        inactiveClass: "bg-cyan-50 text-[#005596] hover:bg-cyan-100 dark:bg-cyan-950/60 dark:text-cyan-300 dark:hover:bg-cyan-900/60",
    },
    {
        value: "C_comm",
        label: "Comm (C)",
        activeClass: "bg-teal-600 text-white shadow-sm",
        inactiveClass: "bg-teal-50 text-teal-700 hover:bg-teal-100 dark:bg-teal-950/60 dark:text-teal-300 dark:hover:bg-teal-900/60",
    },
    {
        value: "T_trouble",
        label: "Trouble (T)",
        activeClass: "bg-rose-600 text-white shadow-sm",
        inactiveClass: "bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300 dark:hover:bg-rose-900/60",
    },
    {
        value: "G_custom",
        label: "Business (G)",
        activeClass: "bg-amber-600 text-white shadow-sm",
        inactiveClass: "bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300 dark:hover:bg-amber-900/60",
    },
] as const;

export type SortOption = "topic-asc" | "topic-desc" | "title-asc" | "title-desc" | "newest" | "oldest";

export function TopicHistoryHeader({
    topicLabel,
    topicName,
    lessonCountLabel,
    className = "",
}: {
    topicLabel: string;
    topicName: string;
    lessonCountLabel?: string;
    className?: string;
}) {
    return (
        <div
            className={`flex flex-wrap items-center gap-3 rounded-2xl border border-cyan-200 bg-gradient-to-r from-cyan-100 via-sky-50 to-cyan-200 px-4 py-3 shadow-[0_10px_22px_rgba(0,169,206,0.18)] dark:border-cyan-900/40 dark:from-slate-800 dark:via-cyan-950/40 dark:to-slate-800 dark:shadow-[0_10px_22px_rgba(0,0,0,0.3)] ${className}`.trim()}
        >
            <span className="rounded-full border border-cyan-300 bg-cyan-200 px-3.5 py-1.5 text-sm font-black uppercase tracking-[0.18em] text-[#004a82] shadow-sm dark:border-cyan-700 dark:bg-cyan-900 dark:text-cyan-200">
                {topicLabel}
            </span>
            <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white sm:text-xl">
                {topicName}
            </span>
            {lessonCountLabel ? (
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {lessonCountLabel}
                </span>
            ) : null}
        </div>
    );
}
