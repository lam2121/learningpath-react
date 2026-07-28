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
                        border-blue-500
                        px-1
                        font-medium
                        text-blue-700
                        transition-all
                        duration-200
                        hover:bg-blue-100
                        hover:text-blue-900
                    "
                >
                    {word}
                </span>
            </HoverCardTrigger>

            <HoverCardContent
                align="start"
                className="w-[360px] space-y-4"
            >
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-lg font-bold">
                            {word}
                        </h3>

                        {pronunciation && (
                            <p className="text-sm text-slate-500">
                                {pronunciation}
                            </p>
                        )}
                    </div>

                    <button
                        onClick={speak}
                        className="
                            rounded-full
                            bg-blue-100
                            p-2
                            transition
                            hover:bg-blue-200
                        "
                    >
                        <Volume2 className="h-4 w-4 text-blue-600" />
                    </button>
                </div>

                {/* Definition */}

                <div>
                    <p className="text-sm font-semibold">
                        Definition
                    </p>

                    <p className="mt-1 text-sm text-slate-600">
                        {definition}
                    </p>
                </div>

                {/* AI Explanation */}

                {aiExplanation && (
                    <div className="rounded-lg bg-blue-50 p-3">
                        <p className="text-xs font-semibold uppercase text-blue-600">
                            AI Explanation
                        </p>

                        <p className="mt-1 text-sm">
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