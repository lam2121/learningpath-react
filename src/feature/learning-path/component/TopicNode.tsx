import {
    CheckCircle2,
    Lock,
    Play,
    Globe,
    Code2,
    Database,
    ShieldCheck,
    Rocket,
    Cpu,
    BookOpen,
    Clock
} from "lucide-react";

type TopicNodeProps = {
    onClick?: () => void;
    title: string;
    subtitle?: string;
    description?: string;
    lessonsCount?: number;
    duration?: string;

    status: "completed" | "current" | "locked";

    color: string;

    icon:
    | "code"
    | "html"
    | "react"
    | "backend"
    | "database"
    | "security"
    | "project";
};

const iconMap = {
    code: Cpu,
    html: Globe,
    react: Code2,
    backend: Rocket,
    database: Database,
    security: ShieldCheck,
    project: Rocket,
};

export function TopicNode({
    onClick,
    title,
    subtitle,
    description,
    lessonsCount,
    duration,
    status,
    color,
    icon,
}: TopicNodeProps) {

    const Icon = iconMap[icon];

    return (
        <div className="group w-[300px] flex flex-col items-center -ml-[86px]">
            {/* The Node Icon Circle */}
            <div
                onClick={onClick}
                className={`
                    relative
                    h-[128px]
                    w-[128px]
                    rounded-full
                    flex
                    items-center
                    justify-center
                    shadow-xl
                    transition-all
                    duration-300
                    hover:scale-110
                    cursor-pointer
                    ${color}
                `}
            >
                <Icon className="h-14 w-14 text-white" />

                {status === "completed" && (
                    <CheckCircle2
                        className="
                            absolute
                            -right-1
                            -top-1
                            h-8
                            w-8
                            rounded-full
                            bg-white
                            text-green-600
                        "
                    />
                )}

                {status === "locked" && (
                    <Lock
                        className="
                            absolute
                            -right-1
                            -top-1
                            h-7
                            w-7
                            rounded-full
                            bg-white
                            p-1
                            text-slate-600
                        "
                    />
                )}

                {status === "current" && (
                    <Play
                        className="
                            absolute
                            -right-1
                            -top-1
                            h-7
                            w-7
                            rounded-full
                            bg-white
                            p-1
                            text-blue-600
                        "
                    />
                )}
            </div>

            {/* Info Card - Hidden by default, shown on group hover */}
            <div className="opacity-0 group-hover:opacity-100 mt-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm text-center w-full relative z-10 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                    {title}
                </h3>
                
                {subtitle && (
                    <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {subtitle}
                    </p>
                )}

                {description && (
                    <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        {description}
                    </p>
                )}
                
                {(lessonsCount || duration) && (
                    <div className="mt-4 flex items-center justify-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {lessonsCount && (
                            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                                <BookOpen className="w-3.5 h-3.5" />
                                <span>{lessonsCount} bài học</span>
                            </div>
                        )}
                        {duration && (
                            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                                <Clock className="w-3.5 h-3.5" />
                                <span>{duration}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}