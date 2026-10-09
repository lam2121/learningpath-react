import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/shadcn/component/ui/button";

interface LessonQuizPaginationProps {
    totalPages: number;
    validCurrentPage: number;
    onPageChange: (page: number) => void;
    displayedLessonRange: { start: number; end: number };
    totalLessonsCount: number;
}

export function LessonQuizPagination({
    totalPages,
    validCurrentPage,
    onPageChange,
    displayedLessonRange,
    totalLessonsCount,
}: LessonQuizPaginationProps) {
    const { t } = useTranslation("history");

    if (totalPages <= 1) {
        return null;
    }

    return (
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-cyan-100 dark:border-slate-800">
            <p className="text-sm font-bold text-[#005596]/60 dark:text-cyan-400/70">
                {t("pagination.showing", {
                    start: displayedLessonRange.start,
                    end: displayedLessonRange.end,
                    total: totalLessonsCount,
                    defaultValue: `Showing ${displayedLessonRange.start}–${displayedLessonRange.end} of ${totalLessonsCount} lessons`,
                })}
            </p>
            <div className="flex items-center gap-1.5">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={validCurrentPage <= 1}
                    onClick={() => onPageChange(Math.max(1, validCurrentPage - 1))}
                    className="h-9 px-3 text-sm font-bold rounded-lg border-cyan-200 text-[#005596] hover:bg-cyan-50 dark:border-slate-700 dark:text-cyan-300 dark:hover:bg-slate-800"
                >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    {t("pagination.previous", { defaultValue: "Previous" })}
                </Button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <Button
                        key={pageNum}
                        type="button"
                        variant={validCurrentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => onPageChange(pageNum)}
                        className={`h-9 w-9 p-0 text-sm font-black rounded-lg transition-all ${
                            validCurrentPage === pageNum
                                ? "bg-[#0072BB] text-white shadow-md scale-105 dark:bg-blue-600"
                                : "border-cyan-200 text-[#005596] hover:bg-cyan-50 dark:border-slate-700 dark:text-cyan-300 dark:hover:bg-slate-800"
                        }`}
                    >
                        {pageNum}
                    </Button>
                ))}

                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={validCurrentPage >= totalPages}
                    onClick={() => onPageChange(Math.min(totalPages, validCurrentPage + 1))}
                    className="h-9 px-3 text-sm font-bold rounded-lg border-cyan-200 text-[#005596] hover:bg-cyan-50 dark:border-slate-700 dark:text-cyan-300 dark:hover:bg-slate-800"
                >
                    {t("pagination.next", { defaultValue: "Next" })}
                    <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
            </div>
        </div>
    );
}
