import { Heart } from "lucide-react";

export function VocabularyHeartButton({
    saved,
    pending,
    onToggle,
}: {
    saved: boolean;
    pending: boolean;
    onToggle: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onToggle}
            disabled={pending}
            aria-pressed={saved}
            aria-label={saved ? "Remove from flashcards" : "Save to flashcards"}
            title={saved ? "Remove from flashcards" : "Save to flashcards"}
            className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-60 ${saved
                ? "bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/50"
                : "bg-slate-100 text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:bg-slate-800 dark:text-slate-500 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
                }`}
        >
            <Heart
                className={`h-4 w-4 ${saved ? "fill-current" : ""} ${pending ? "animate-pulse" : ""}`}
            />
        </button>
    );
}
