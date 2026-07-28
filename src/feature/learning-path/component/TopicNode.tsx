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
} from "lucide-react";

type TopicNodeProps = {
    onClick?: () => void;
    title: string;
    subtitle?: string;

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
    status,
    color,
    icon,
}: TopicNodeProps) {

    const Icon = iconMap[icon];

    return (
        <div className="w-[128px]">

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

            <h3 className="mt-5 text-center text-xl font-bold">
                {title}
            </h3>

            <p className="mt-1 text-center text-sm text-slate-500">
                {subtitle}
            </p>

        </div>
    );
}