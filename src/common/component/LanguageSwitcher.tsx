import { Globe, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/shadcn/component/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/shadcn/component/ui/dropdown-menu";

const LANGUAGES = [
    { code: "en", label: "English", flag: "🇺🇸", short: "EN" },
    { code: "vi", label: "Tiếng Việt", flag: "🇻🇳", short: "VI" },
    { code: "jp", label: "日本語", flag: "🇯🇵", short: "JP" },
] as const;

export function LanguageSwitcher({
    variant = "outline",
    className = "",
    showLabel = true,
}: {
    variant?: "outline" | "ghost";
    className?: string;
    showLabel?: boolean;
}) {
    const { i18n } = useTranslation();
    const currentLang = i18n.language || "en";
    const currentConfig =
        LANGUAGES.find((l) => l.code === currentLang) ?? LANGUAGES[0];

    const handleSelectLanguage = (code: string) => {
        i18n.changeLanguage(code);
        localStorage.setItem("app_language", code);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant={variant}
                    aria-label="Change language"
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium transition-colors hover:bg-slate-100 ${className}`}
                >
                    <Globe className="h-4 w-4 text-slate-600" />
                    {showLabel ? (
                        <span className="text-xs font-semibold text-slate-700 sm:text-sm">
                            {currentConfig.short}
                        </span>
                    ) : null}
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="min-w-[140px] p-1">
                {LANGUAGES.map((lang) => {
                    const isSelected = lang.code === currentLang;
                    return (
                        <DropdownMenuItem
                            key={lang.code}
                            onClick={() => handleSelectLanguage(lang.code)}
                            className={`flex cursor-pointer items-center justify-between px-3 py-2 text-sm ${
                                isSelected
                                    ? "bg-blue-50 font-semibold text-blue-700"
                                    : "text-slate-700"
                            }`}
                        >
                            <span className="flex items-center gap-2">
                                <span>{lang.flag}</span>
                                <span>{lang.label}</span>
                            </span>
                            {isSelected ? (
                                <Check className="h-4 w-4 text-blue-600" />
                            ) : null}
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
