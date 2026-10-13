import React from "react";
import { BookOpen, Play, Search, Trash2, Volume2, VolumeX } from "lucide-react";
import { Input } from "@/shadcn/component/ui/input";
import type { Flashcard } from "@/feature/lesson-workspace/api/flashcardApi";
import { RubyText } from "@/common/component/RubyText";
import { userProfileTexts } from "@/feature/user-profile/userProfileTexts";

interface FlashcardTableListProps {
    cards: Flashcard[];
    filteredCards: Flashcard[];
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    onSpeak: (text: string) => void;
    speakingText: string | null;
    onSelectCard: (originalIndex: number) => void;
    onDelete: (id: number, e?: React.MouseEvent) => void;
    isVI: boolean;
    isJA: boolean;
}

export function FlashcardTableList({
    cards,
    filteredCards,
    searchQuery,
    setSearchQuery,
    onSpeak,
    speakingText,
    onSelectCard,
    onDelete,
    isVI,
    isJA,
}: FlashcardTableListProps) {
    return (
        <div className="space-y-4">
            {/* Search Filter */}
            <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={userProfileTexts.searchFlashcards()}
                    className="pl-9 pr-9 h-11 bg-card border-border rounded-2xl text-sm shadow-elevation-1 focus-visible:ring-primary"
                />
                {searchQuery && (
                    <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs font-bold"
                    >
                        <VolumeX className="h-3.5 w-3.5 hidden" />
                        <span>✕</span>
                    </button>
                )}
            </div>

            {/* List Content */}
            <div className="max-h-[380px] overflow-y-auto space-y-2.5 pr-1">
                {filteredCards.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm font-medium">
                            {userProfileTexts.noMatchingWords()}
                        </p>
                    </div>
                ) : (
                    filteredCards.map((card) => {
                        const originalIndex = cards.findIndex(
                            (c) => c.id === card.id,
                        );
                        return (
                            <div
                                key={card.id}
                                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-card border border-border/80 shadow-elevation-1 hover:border-primary/40 hover:shadow-elevation-2 transition-all duration-200"
                            >
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-baseline gap-2">
                                        <h5 className="font-display font-bold text-foreground text-base">
                                            {card.word_eng}
                                        </h5>
                                        {card.transcription && (
                                            <span className="text-xs font-mono text-primary font-medium">
                                                {card.transcription}
                                            </span>
                                        )}
                                        {isVI && card.word_vi && (
                                            <span className="text-xs font-semibold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md dark:text-emerald-400">
                                                🇻🇳 {card.word_vi}
                                            </span>
                                        )}
                                        {isJA && (
                                            <span className="text-xs font-semibold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md dark:text-emerald-400">
                                                🇯🇵 <RubyText text={card.word_ja || "—"} />
                                            </span>
                                        )}
                                    </div>

                                    {card.workspace_example && (
                                        <p className="mt-1 text-xs text-muted-foreground italic line-clamp-2">
                                            "{card.workspace_example}"
                                        </p>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                                    {/* Pronounce */}
                                    <button
                                        type="button"
                                        onClick={() => onSpeak(card.word_eng)}
                                        className={`p-2 rounded-xl border border-border transition-colors ${
                                            speakingText === card.word_eng
                                                ? "bg-primary text-primary-foreground border-primary"
                                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                        }`}
                                        title={userProfileTexts.listenPronunciation()}
                                    >
                                        <Volume2 className="h-4 w-4" />
                                    </button>

                                    {/* Jump to practice */}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onSelectCard(originalIndex >= 0 ? originalIndex : 0);
                                        }}
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
                                        title={userProfileTexts.practiceThisWord()}
                                    >
                                        <Play className="h-3 w-3 fill-current" />
                                        <span>{userProfileTexts.practiceThisWord()}</span>
                                    </button>

                                    {/* Delete */}
                                    <button
                                        type="button"
                                        onClick={(e) => onDelete(card.id, e)}
                                        className="p-2 rounded-xl text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                                        title={userProfileTexts.deleteFlashcard()}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
