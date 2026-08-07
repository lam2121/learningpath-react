import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/shadcn/component/ui/card";
import { LearningCalendar } from "./LearningCalendar";
import { SkillsOverview } from '../component/SkillsOverview'

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";
import { BarChart2 } from "lucide-react";
import { useAuth } from "@/common/context/AuthContext";
import { getLoginDays } from "@/feature/user-profile/utils/StudyActivity";
import { useMemo } from "react";

// ─── TODO: Study-time data (restore when API is ready) ───────────────────────
// Replace `loginData` below with real study-hour data fetched from the backend.
// Shape expected by the chart:
//   const data: { day: string; hour: number }[] = [
//       { day: "Mon", hour: 1 },
//       { day: "Tue", hour: 2 },
//       { day: "Wed", hour: 1.5 },
//       { day: "Thu", hour: 3 },
//       { day: "Fri", hour: 2 },
//       { day: "Sat", hour: 4 },
//       { day: "Sun", hour: 2.5 },
//   ];
// Also switch the chart <Line dataKey="hour" /> and Tooltip formatter back to
// `${value} hours` / "Study time" when restoring.
// ─────────────────────────────────────────────────────────────────────────────

/** Build a per-day login count array for the current month from localStorage. */
function buildLoginData(loginDays: string[]): { day: string; logins: number }[] {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const loginSet = new Set(loginDays);

    return Array.from({ length: daysInMonth }, (_, i) => {
        const dayNum = i + 1;
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

    // Only show days up to today so the chart doesn't have trailing zeros
    const today = new Date().getDate();
    const chartData = loginData.slice(0, today);

    const hasLogins = chartData.some((d) => d.logins > 0);

    return (
        <div className="space-y-6">
            <SkillsOverview />
            <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
                {/* Learning history chart — currently shows login days */}
                <Card className="flex h-full min-w-0 flex-col overflow-hidden border-white/70 bg-white/90 shadow-[0_16px_40px_rgba(15,23,42,0.07)]">
                    <CardHeader className="px-5 pb-2 pt-4">
                        <CardTitle className="text-lg">
                            Login History
                        </CardTitle>
                        <p className="text-xs text-slate-400">Days logged in this month</p>
                    </CardHeader>

                    <CardContent className="flex flex-1 flex-col px-4 pb-4 pt-0">
                        <div className="min-h-[224px] w-full min-w-0 flex-1">
                            {!hasLogins ? (
                                <div className="flex h-full min-h-[224px] flex-col items-center justify-center gap-3 text-slate-400">
                                    <BarChart2 className="h-10 w-10 opacity-30" />
                                    <p className="text-sm font-medium">No login data yet</p>
                                    <p className="text-xs text-slate-400">Log in each day to build your history</p>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart
                                        data={chartData}
                                        margin={{
                                            top: 10,
                                            right: 15,
                                            bottom: 0,
                                            left: -15,
                                        }}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke="#e2e8f0"
                                            vertical={false}
                                        />

                                        <XAxis
                                            dataKey="day"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{
                                                fill: "#64748b",
                                                fontSize: 11,
                                            }}
                                            interval={Math.floor(chartData.length / 7)}
                                        />

                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{
                                                fill: "#64748b",
                                                fontSize: 12,
                                            }}
                                            tickCount={2}
                                            domain={[0, 1]}
                                            tickFormatter={(v) => (v === 1 ? "✓" : "")}
                                        />

                                        <Tooltip
                                            formatter={(value) => [
                                                value === 1 ? "Logged in" : "No login",
                                                "Status",
                                            ]}
                                            contentStyle={{
                                                borderRadius: "12px",
                                                border: "1px solid #e2e8f0",
                                                boxShadow:
                                                    "0 8px 24px rgba(15, 23, 42, 0.08)",
                                            }}
                                        />

                                        <Line
                                            type="monotone"
                                            dataKey="logins"
                                            stroke="#2563eb"
                                            strokeWidth={3}
                                            dot={{
                                                r: 4,
                                                fill: "#ffffff",
                                                stroke: "#2563eb",
                                                strokeWidth: 2,
                                            }}
                                            activeDot={{
                                                r: 6,
                                            }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Learning calendar */}
                <Card className="flex h-full min-w-0 flex-col overflow-hidden border-white/70 bg-white/90 shadow-[0_16px_40px_rgba(15,23,42,0.07)]">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-xl">
                            Learning Calendar
                        </CardTitle>
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