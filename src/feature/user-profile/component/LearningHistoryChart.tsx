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
import { Progress } from "@/shadcn/component/ui/progress"
import { Award, Code2, Database, Layout, Server, Sparkles } from "lucide-react"

const data = [
    { day: "Mon", hour: 1 },
    { day: "Tue", hour: 2 },
    { day: "Wed", hour: 1.5 },
    { day: "Thu", hour: 3 },
    { day: "Fri", hour: 2 },
    { day: "Sat", hour: 4 },
    { day: "Sun", hour: 2.5 },
];
const skills = [
    { name: "Frontend Development", level: 85, icon: Layout, color: "text-blue-500", bg: "bg-blue-100", progressClass: "bg-blue-500" },
    { name: "Backend Development", level: 60, icon: Server, color: "text-green-500", bg: "bg-green-100", progressClass: "bg-green-500" },
    { name: "Database & SQL", level: 75, icon: Database, color: "text-amber-500", bg: "bg-amber-100", progressClass: "bg-amber-500" },
    { name: "System Design", level: 40, icon: Code2, color: "text-purple-500", bg: "bg-purple-100", progressClass: "bg-purple-500" },
]
export function LearningHistoryChart() {
    return (
        <div className="space-y-6">
            <SkillsOverview />
            <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
                {/* Learning history chart */}
                <Card className="flex h-full min-w-0 flex-col overflow-hidden border-white/70 bg-white/90 shadow-[0_16px_40px_rgba(15,23,42,0.07)]">
                    <CardHeader className="px-5 pb-2 pt-4">
                        <CardTitle className="text-lg">
                            Learning History
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="flex flex-1 flex-col px-4 pb-4 pt-0">
                        <div className="min-h-[224px] w-full min-w-0 flex-1">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                    data={data}
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
                                            fontSize: 12,
                                        }}
                                    />

                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{
                                            fill: "#64748b",
                                            fontSize: 12,
                                        }}
                                    />

                                    <Tooltip
                                        formatter={(value) => [
                                            `${value} hours`,
                                            "Study time",
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
                                        dataKey="hour"
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
                            <LearningCalendar embedded />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}