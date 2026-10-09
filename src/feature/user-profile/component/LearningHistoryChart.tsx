import { useAuth } from "@/common/context/AuthContext";
import { Card, CardContent } from "@/shadcn/component/ui/card";
import { LearningCalendar } from "./LearningCalendar";
import { SkillsOverview } from "../component/SkillsOverview";
import { LoginHistoryCard } from "./LoginHistoryCard";

// Re-export for 100% backwards compatibility
export { LoginHistoryCard } from "./LoginHistoryCard";

export type LearningHistoryChartProps = {
    showLoginHistory?: boolean;
    supplementaryPanelBottom?: number | null;
};

export function LearningHistoryChart({
    showLoginHistory = false,
}: LearningHistoryChartProps) {
    const auth = useAuth();
    const userId = Number(auth.user?.id);

    return (
        <div className="flex h-full min-h-0 flex-col gap-6">
            <SkillsOverview />

            <div
                className={`grid min-h-0 flex-1 items-stretch gap-4 ${
                    showLoginHistory ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
                }`}
            >
                {showLoginHistory ? (
                    <div className="flex h-full min-h-0 flex-col">
                        <LoginHistoryCard stretch />
                    </div>
                ) : null}

                <Card className="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-slate-300 bg-white shadow-xs dark:border-slate-700 dark:bg-slate-900">
                    <CardContent className="flex flex-1 min-h-0 flex-col p-6 sm:p-7">
                        <div className="flex-1 min-h-0">
                            <LearningCalendar embedded userId={userId} />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
