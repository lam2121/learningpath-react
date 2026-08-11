import { Card, CardContent, CardHeader, CardTitle } from "@/shadcn/component/ui/card"
import { Progress } from "@/shadcn/component/ui/progress"
import { Code2, Database, Layout, Server } from "lucide-react"

export function SkillsOverview() {
    const skills = [
        { name: "D", level: 85, icon: Layout, color: "text-blue-500", bg: "bg-blue-100", progressClass: "bg-blue-500" },
        { name: "C", level: 60, icon: Server, color: "text-green-500", bg: "bg-green-100", progressClass: "bg-green-500" },
        { name: "T", level: 75, icon: Database, color: "text-amber-500", bg: "bg-amber-100", progressClass: "bg-amber-500" },
        { name: "G", level: 40, icon: Code2, color: "text-purple-500", bg: "bg-purple-100", progressClass: "bg-purple-500" },
    ]

    return (
        <Card className="w-full min-w-0 overflow-hidden border-white/70 bg-white/90 shadow-[0_16px_40px_rgba(15,23,42,0.07)]">
            <CardHeader className="px-5 pb-3 pt-4">
                <CardTitle className="text-lg">
                    Skills Overview
                </CardTitle>
            </CardHeader>

            <CardContent className="px-5 pb-5 pt-0">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                    {skills.map((skill) => {
                        const Icon = skill.icon;

                        return (
                            <div
                                key={skill.name}
                                className="min-w-0 space-y-3"
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`shrink-0 rounded-lg p-2 ${skill.bg}`}
                                    >
                                        <Icon
                                            className={`h-5 w-5 ${skill.color}`}
                                        />
                                    </div>

                                    <span className="min-w-0 flex-1 text-sm font-semibold leading-5 text-slate-700">
                                        {skill.name}
                                    </span>

                                    <span className="shrink-0 text-sm font-bold text-slate-900">
                                        {skill.level}%
                                    </span>
                                </div>

                                <Progress
                                    value={skill.level}
                                    className="h-2 bg-slate-100"
                                    indicatorClassName={
                                        skill.progressClass
                                    }
                                />
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
