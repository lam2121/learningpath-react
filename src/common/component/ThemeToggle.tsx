import { Moon, Sun, Laptop, Check } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/shadcn/component/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/shadcn/component/ui/dropdown-menu";

export function ThemeToggle({
    variant = "outline",
    className = "",
    showLabel = false,
}: {
    variant?: "outline" | "ghost";
    className?: string;
    showLabel?: boolean;
}) {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const { t } = useTranslation("nav");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <Button
                variant={variant}
                size="icon"
                aria-label="Toggle theme"
                className={`h-9 w-9 shrink-0 ${className}`}
                disabled
            >
                <Sun className="h-4 w-4 text-slate-400" />
            </Button>
        );
    }

    const currentTheme = theme || "system";
    const isDark = resolvedTheme === "dark";

    const options = [
        {
            value: "light",
            label: t("theme.light", { defaultValue: "Light" }),
            icon: Sun,
        },
        {
            value: "dark",
            label: t("theme.dark", { defaultValue: "Dark" }),
            icon: Moon,
        },
        {
            value: "system",
            label: t("theme.system", { defaultValue: "System" }),
            icon: Laptop,
        },
    ] as const;

    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant={variant}
                    aria-label={t("theme.theme", { defaultValue: "Theme" })}
                    className={`relative flex items-center gap-1.5 h-9 px-2.5 text-sm font-medium transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100 ${className}`}
                >
                    <div className="relative h-4 w-4">
                        <Sun
                            className={`h-4 w-4 transition-all duration-300 ${
                                isDark
                                    ? "scale-0 rotate-90 opacity-0"
                                    : "scale-100 rotate-0 opacity-100 text-amber-500"
                            }`}
                        />
                        <Moon
                            className={`absolute inset-0 h-4 w-4 transition-all duration-300 ${
                                isDark
                                    ? "scale-100 rotate-0 opacity-100 text-blue-400"
                                    : "scale-0 -rotate-90 opacity-0"
                            }`}
                        />
                    </div>
                    {showLabel ? (
                        <span className="text-xs font-semibold capitalize text-slate-700 dark:text-white sm:text-sm">
                            {t(`theme.${currentTheme}`, { defaultValue: currentTheme })}
                        </span>
                    ) : null}
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="min-w-[140px] p-1 dark:border-slate-800 dark:bg-slate-900">
                {options.map((option) => {
                    const Icon = option.icon;
                    const isSelected = currentTheme === option.value;
                    return (
                        <DropdownMenuItem
                            key={option.value}
                            onClick={() => setTheme(option.value)}
                            className={`flex cursor-pointer items-center justify-between px-3 py-2 text-sm ${
                                isSelected
                                    ? "bg-blue-50 font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                                    : "text-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"
                            }`}
                        >
                            <span className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                <span>{option.label}</span>
                            </span>
                            {isSelected ? (
                                <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            ) : null}
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
