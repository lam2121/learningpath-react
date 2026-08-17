import { useMemo } from "react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { CalendarClock, TrendingUp } from "lucide-react";

import { useAuth } from "@/common/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/shadcn/component/ui/card";
import { getLoginDays } from "@/feature/user-profile/utils/StudyActivity";

import { LearningCalendar } from "./LearningCalendar";
import { SkillsOverview } from "../component/SkillsOverview";

function buildLoginData(loginDays: string[]): { day: string; logins: number }[] {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const loginSet = new Set(loginDays);

    return Array.from({ length: daysInMonth }, (_, index) => {
        const dayNum = index + 1;
        const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
        return { day: String(dayNum), logins: loginSet.has(key) ? 1 : 0 };
    });
}

export function LearningHistoryChart() {
    const auth = useAuth();
    const userId = Number(auth.user?.id);

    const loginData = useMemo(() => {
        const loginDays = getLoginDays(userId);
        return buildLoginData(loginDays);
    }, [userId]);

    const today = new Date().getDate();
    const chartData = loginData.slice(0, today);
    const activeDays = chartData.filter((item) => item.logins > 0).length;
    const hasActivity = activeDays > 0;

    return (
        <div className="space-y-6">
            <SkillsOverview />

            <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
                <Card className="flex h-full min-w-0 flex-col border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.07)]">
                    <CardHeader className="px-6 pb-3 pt-5">
                        <CardTitle className="text-lg text-slate-950">
                            Login History
                        </CardTitle>
                        <p className="text-sm text-slate-500">
                            A compact view of how many days you studied this month.
                        </p>
                    </CardHeader>

                    <CardContent className="flex flex-1 flex-col justify-between px-6 pb-6 pt-0">
                        {!hasActivity ? (
                            <div className="flex min-h-[220px] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 text-center">
                                <CalendarClock className="h-10 w-10 text-slate-300" />
                                <div>
                                    <p className="font-semibold text-slate-900">
                                        No activity yet
                                    </p>
                                    <p className="mt-2 text-sm leading-6 text-slate-500">
                                        Complete your first lesson to start building a clearer activity pattern.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-5">
                                <div className="flex items-end justify-between gap-4">
                                    <div>
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                            Active this month
                                        </p>
                                        <p className="mt-2 text-4xl font-bold tracking-tight text-slate-950">
                                            {activeDays}
                                        </p>
                                        <p className="mt-2 text-sm text-slate-500">
                                            days with learning activity
                                        </p>
                                    </div>

                                    <div className="rounded-2xl bg-blue-50 px-4 py-3 text-blue-700">
                                        <TrendingUp className="h-5 w-5" />
                                    </div>
                                </div>

                                <div className="h-24 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData}>
                                            <Area
                                                type="monotone"
                                                dataKey="logins"
                                                stroke="#2563eb"
                                                strokeWidth={2.5}
                                                fill="rgba(37,99,235,0.14)"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="flex h-full min-w-0 flex-col border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.07)]">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-xl">Learning Calendar</CardTitle>
                    </CardHeader>

                    <CardContent className="flex flex-1 flex-col pt-0">
                        <div className="flex-1">
                            <LearningCalendar embedded userId={userId} />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
