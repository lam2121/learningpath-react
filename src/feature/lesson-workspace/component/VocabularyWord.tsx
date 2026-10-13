import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/shadcn/component/ui/hover-card";

import { Volume2 } from "lucide-react";

type VocabularyWordProps = {
    word: string;
    definition: string;
    pronunciation?: string;
    difficulty?: "Beginner" | "Intermediate" | "Advanced";
    category?: string;
    aiExplanation?: string;
    onSave?: () => void;
};

export function VocabularyWord({
    word,
    definition,
    pronunciation,
    difficulty,
    category,
    aiExplanation,
    onSave,
}: VocabularyWordProps) {
    const speak = () => {
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = "en-US";
        speechSynthesis.speak(utterance);
    };

    return (
        <HoverCard openDelay={150}>
            <HoverCardTrigger asChild>
                <span
                    className="
                        cursor-pointer
                        rounded-md
                        border-b-2
                        border-primary
                        px-1
                        font-medium
                        text-primary
                        transition-all
                        duration-200
                        hover:bg-primary/10
                    "
                >
                    {word}
                </span>
            </HoverCardTrigger>

            <HoverCardContent
                align="start"
                className="w-[360px] space-y-4 rounded-2xl border border-border/80 bg-popover/95 backdrop-blur-md p-4 shadow-xl animate-scale-in"
            >
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="font-display text-lg font-bold text-foreground">
                            {word}
                        </h3>

                        {pronunciation && (
                            <p className="text-sm text-muted-foreground">
                                {pronunciation}
                            </p>
                        )}
                    </div>

                    <button
                        onClick={speak}
                        className="
                            rounded-full
                            bg-primary/10
                            p-2
                            text-primary
                            transition-colors
                            hover:bg-primary/20
                        "
                    >
                        <Volume2 className="h-4 w-4" />
                    </button>
                </div>

                {/* Definition */}

                <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Definition
                    </p>

                    <p className="mt-1 text-sm text-foreground">
                        {definition}
                    </p>
                </div>

                {/* AI Explanation */}

                {aiExplanation && (
                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
                        <p className="text-xs font-bold uppercase tracking-wider text-primary">
                            AI Explanation
                        </p>

                        <p className="mt-1 text-sm text-foreground">
                            {aiExplanation}
                        </p>
                    </div>
                )}

                {/* Footer */}

                <div className="flex items-center justify-between">

                    <div className="flex gap-2">

                        {difficulty && (
                            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                                {difficulty}
                            </span>
                        )}

                        {category && (
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium">
                                {category}
                            </span>
                        )}

                    </div>

                    <button
                        onClick={onSave}
                        className="
                            rounded-md
                            bg-blue-600
                            px-3
                            py-1.5
                            text-sm
                            text-white
                            transition
                            hover:bg-blue-700
                        "
                    >
                        Save
                    </button>

                </div>
            </HoverCardContent>
        </HoverCard>
    );
}