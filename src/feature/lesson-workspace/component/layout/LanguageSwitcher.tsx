import React from "react";
import { useLessonLanguage } from "@/feature/lesson-workspace/context/LessonLanguageContext";
import { Eye, EyeOff } from "lucide-react";

interface FuriganaToggleProps {
    className?: string;
}

/**
 * FuriganaToggle renders a quick toggle for Japanese furigana readings.
 * Language selection itself is unified at the main navigator.
 */
export const FuriganaToggle: React.FC<FuriganaToggleProps> = ({ className = "" }) => {
    const { language, showFurigana, setShowFurigana } = useLessonLanguage();

    // Only visible when viewing Japanese
    if (language !== "ja") {
        return null;
    }

    return (
        <button
            type="button"
            onClick={() => setShowFurigana(!showFurigana)}
            title={showFurigana ? "ふりがなを非表示" : "ふりがなを表示"}
            className={`inline-flex items-center gap-1.5 rounded-2xl border px-3 py-1.5 text-xs font-semibold transition-all shadow-sm ${
                showFurigana
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : "border-slate-200 bg-white text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
            } ${className}`}
        >
            {showFurigana ? (
                <>
                    <Eye className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>ふりがな: ON</span>
                </>
            ) : (
                <>
                    <EyeOff className="h-3.5 w-3.5 text-slate-400" />
                    <span>ふりがな: OFF</span>
                </>
            )}
        </button>
    );
};

export const LanguageSwitcher = FuriganaToggle;
export default FuriganaToggle;
