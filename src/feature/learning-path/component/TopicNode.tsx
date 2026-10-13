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
    Clock3,
} from "lucide-react";

export type TopicNodeProps = {
    id: number;
    onClick?: () => void;
    title: string;
    subtitle?: string;
    description?: string;
    lessonsCount: number;
    durationMinutes: number;
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

function formatDuration(totalMinutes: number) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours === 0) return `${minutes} phút`;
    if (minutes === 0) return `${hours} giờ`;

    return `${hours} giờ ${minutes} phút`;
}
export function TopicNode({
    id,
    onClick,
    title,
    subtitle,
    description,
    lessonsCount,
    durationMinutes,
    status,
    color,
    icon,
}: TopicNodeProps) {

    const Icon = iconMap[icon];

    const statusConfig = {
        completed: {
            label: "Hoàn thành",
            icon: CheckCircle2,
            className:
                "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
        },
        current: {
            label: "Đang học",
            icon: Play,
            className:
                "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
        },
        locked: {
            label: "Chưa mở",
            icon: Lock,
            className:
                "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
        },
    };

    const currentStatus = statusConfig[status];
    const StatusIcon = currentStatus.icon;

    return (
        <button
            type="button"
            onClick={onClick}
            className={`
                relative flex min-h-[210px] w-full flex-col rounded-2xl
                border bg-card p-5 text-left
                card-interactive
                ${status === "current"
                    ? "border-primary ring-2 ring-primary/25 glow-primary"
                    : "border-border/80 hover:border-border"
                }
            `}
        >
            {/* Header */}
            <div className="flex w-full items-start justify-between gap-3">
                <div
                    className={`
                        flex h-12 w-12 items-center justify-center
                        rounded-xl text-white shadow-sm ${color}
                    `}
                >
                    <Icon className="h-6 w-6" />
                </div>

                <div
                    className={`
                        flex items-center gap-1.5 rounded-full
                        px-2.5 py-1 text-xs font-semibold
                        ${currentStatus.className}
                    `}
                >
                    <StatusIcon className="h-3.5 w-3.5" />
                    {currentStatus.label}
                </div>
            </div>

            {/* Information */}
            <div className="mt-4 flex-1">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Chương {String(id).padStart(2, "0")}
                </div>

                <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                    {title}
                </h3>

                {subtitle && (
                    <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                        {subtitle}
                    </p>
                )}

                {description && (
                    <p className="mt-2 line-clamp-2 text-sm leading-5 text-slate-500 dark:text-slate-400">
                        {description}
                    </p>
                )}
            </div>

            {/* Lesson count and total time */}
            <div className="mt-4 flex w-full items-center gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                <div className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    <BookOpen className="h-3.5 w-3.5" />
                    {lessonsCount} bài học
                </div>

                <div className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    <Clock3 className="h-3.5 w-3.5" />
                    {formatDuration(durationMinutes)}
                </div>
            </div>
        </button>
    );
}