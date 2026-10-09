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
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={userProfileTexts.searchFlashcards()}
                    className="pl-9 pr-9 h-10 bg-white border-slate-200 rounded-xl text-sm dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500"
                />
                {searchQuery && (
                    <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                    >
                        <VolumeX className="h-3.5 w-3.5 hidden" />
                        <span className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                            ✕
                        </span>
                    </button>
                )}
            </div>

            {/* List Content */}
            <div className="max-h-[380px] overflow-y-auto space-y-2.5 pr-1">
                {filteredCards.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 dark:text-slate-500">
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
                                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all dark:bg-slate-800/90 dark:border-slate-700 dark:hover:border-indigo-500"
                            >
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-baseline gap-2">
                                        <h5 className="font-bold text-slate-900 dark:text-white text-base">
                                            {card.word_eng}
                                        </h5>
                                        {card.transcription && (
                                            <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400">
                                                {card.transcription}
                                            </span>
                                        )}
                                        {isVI && card.word_vi && (
                                            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md dark:bg-emerald-950/80 dark:text-emerald-400">
                                                🇻🇳 {card.word_vi}
                                            </span>
                                        )}
                                        {isJA && (
                                            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md dark:bg-emerald-950/80 dark:text-emerald-400">
                                                🇯🇵 <RubyText text={card.word_ja || "—"} />
                                            </span>
                                        )}
                                    </div>

                                    {card.workspace_example && (
                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 italic line-clamp-2">
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
                                        className={`p-2 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors ${
                                            speakingText === card.word_eng
                                                ? "bg-indigo-600 text-white border-indigo-600"
                                                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
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
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-600 text-xs font-semibold hover:bg-indigo-100 transition-colors dark:bg-indigo-950/60 dark:text-indigo-400 dark:hover:bg-indigo-900"
                                        title={userProfileTexts.practiceThisWord()}
                                    >
                                        <Play className="h-3 w-3 fill-current" />
                                        <span>{userProfileTexts.practiceThisWord()}</span>
                                    </button>

                                    {/* Delete */}
                                    <button
                                        type="button"
                                        onClick={(e) => onDelete(card.id, e)}
                                        className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
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
