import {
    Target,
    BookOpen,
    Clock3,
    Layers3,
} from "lucide-react";

import {
    Card,
    CardContent,
} from "@/shadcn/component/ui/card";

export function RoadmapStats() {

    const items = [
        {
            icon: Target,
            title: "Goal",
            value: "Full Stack Developer",
            color: "text-blue-600",
        },
        {
            icon: Layers3,
            title: "Topics",
            value: "8",
            color: "text-green-600",
        },
        {
            icon: BookOpen,
            title: "Lessons",
            value: "96",
            color: "text-orange-600",
        },
        {
            icon: Clock3,
            title: "Duration",
            value: "12 Weeks",
            color: "text-violet-600",
        },
    ];

    return (
        <div className="mx-auto grid max-w-7xl grid-cols-2 lg:grid-cols-4 gap-6 px-8">

            {items.map((item) => {

                const Icon = item.icon;

                return (

                    <Card
                        key={item.title}
                        className="transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm"
                    >
                        <CardContent className="p-6">

                            <Icon
                                className={`mb-4 h-8 w-8 ${item.color}`}
                            />

                            <p className="text-xs uppercase font-semibold tracking-wider text-slate-500 dark:text-slate-400">
                                {item.title}
                            </p>

                            <h3 className="mt-2 text-xl font-bold text-slate-800 dark:text-slate-100">
                                {item.value}
                            </h3>

                        </CardContent>

                    </Card>

                );

            })}

        </div>
    );
}