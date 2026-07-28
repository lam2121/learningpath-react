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
        <div className="mx-auto grid max-w-5xl grid-cols-4 gap-4">

            {items.map((item) => {

                const Icon = item.icon;

                return (

                    <Card
                        key={item.title}
                        className="transition hover:-translate-y-1 hover:shadow-lg"
                    >
                        <CardContent className="p-4">

                            <Icon
                                className={`mb-3 h-6 w-6 ${item.color}`}
                            />

                            <p className="text-xs uppercase tracking-wide text-slate-500">
                                {item.title}
                            </p>

                            <h3 className="mt-1 text-base font-semibold">
                                {item.value}
                            </h3>

                        </CardContent>

                    </Card>

                );

            })}

        </div>
    );
}