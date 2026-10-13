import {
    Volume2,
    RotateCw,
    Trash2,
    Lightbulb,
    Mic,
    MicOff,
    Send,
    CheckCircle2,
    RotateCcw,
    XCircle,
} from "lucide-react";
import React from "react";
import { RubyText } from "@/common/component/RubyText";
import { Button } from "@/shadcn/component/ui/button";
import { Input } from "@/shadcn/component/ui/input";
import type { Flashcard } from "@/feature/lesson-workspace/api/flashcardApi";
import { userProfileTexts } from "@/feature/user-profile/userProfileTexts";
import { maskTargetWord } from "../utils/flashcardMatching";

export interface FlashcardGridItemProps {
    card: Flashcard;
    cardIndex: number;
    studyMode: "vi" | "ja" | "en";
    isFlipped: boolean;
    onToggleFlip: (cardId: number, e: React.MouseEvent) => void;
    onDelete: (cardId: number, e: React.MouseEvent) => void;
    result?: { isSubmitted: boolean; isCorrect: boolean };
    userInput: string;
    onUserInputChange: (cardId: number, value: string) => void;
    onSubmitAnswer: (cardId: number, card: Flashcard) => void;
    onResetAnswer: (cardId: number) => void;
    onShowAnswer: (cardId: number) => void;
    isListening: boolean;
    cardSpeechError?: string | null;
    onToggleDictation: (cardId: number) => void;
    speakingText: string | null;
    onSpeak: (text: string, e?: React.MouseEvent) => void;
    revealedHint: boolean;
    onToggleHint: (cardId: number) => void;
}

export function FlashcardGridItem({
    card,
    cardIndex,
    studyMode,
    isFlipped,
    onToggleFlip,
    onDelete,
    result,
    userInput,
    onUserInputChange,
    onSubmitAnswer,
    onResetAnswer,
    onShowAnswer,
    isListening,
    cardSpeechError,
    onToggleDictation,
    speakingText,
    onSpeak,
    revealedHint,
    onToggleHint,
}: FlashcardGridItemProps) {
    const frontBorderClass = result
        ? result.isCorrect
            ? "border-emerald-500/70 ring-2 ring-emerald-500/20 shadow-elevation-2"
            : "border-rose-500/70 ring-2 ring-rose-500/20 shadow-elevation-2"
        : "border-border/80 shadow-elevation-1 hover:border-primary/50 hover:shadow-elevation-3";

    return (
        <div
            onClick={(e) => onToggleFlip(card.id, e)}
            className="relative h-[400px] w-full select-none cursor-pointer group transition-transform duration-200"
            style={{ perspective: "1000px" }}
        >
            <div
                className="w-full h-full relative"
                style={{
                    transformStyle: "preserve-3d",
                    transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                    transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                }}
            >
                {/* FRONT FACE (W1, W2, ... Wn) */}
                <div
                    className={`absolute inset-0 rounded-3xl p-5 flex flex-col justify-between items-center text-center bg-card text-card-foreground border-2 transition-all duration-300 ${frontBorderClass}`}
                    style={{
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                    }}
                >
                    {/* Top Header: Word Index Badge & Options */}
                    <div className="w-full flex items-center justify-between">
                        <span className="inline-flex items-center font-mono font-bold text-xs px-2.5 py-1 rounded-xl bg-primary/10 text-primary">
                            W{cardIndex}
                        </span>

                        {/* Pronunciation Audio Button: in EN mode, only play after submitting answer */}
                        {studyMode !== "en" || result ? (
                            <button
                                type="button"
                                onClick={(e) => onSpeak(card.word_eng, e)}
                                className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200 ${
                                    speakingText === card.word_eng
                                        ? "bg-primary text-primary-foreground scale-110 shadow-md ring-2 ring-primary/40"
                                        : "bg-muted text-muted-foreground hover:bg-primary/15 hover:text-primary active:scale-95"
                                }`}
                                title={userProfileTexts.listenPronunciation()}
                            >
                                <Volume2 className="h-4 w-4" />
                            </button>
                        ) : (
                            <div className="h-9 w-9" />
                        )}
                    </div>

                    {/* Center Content: Word & IPA or English Challenge */}
                    {studyMode !== "en" ? (
                        <div className="flex flex-col items-center gap-2 px-2">
                            <h3 className="font-display text-2xl font-black tracking-tight text-foreground break-words max-w-full">
                                {card.word_eng}
                            </h3>

                            {card.transcription && (
                                <div className="inline-flex items-center gap-1 rounded-full bg-muted/80 px-3 py-0.5 text-xs font-mono text-primary font-medium border border-border/40">
                                    <span>{card.transcription}</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2 px-2 w-full">
                            {result ? (
                                <div className="flex flex-col items-center gap-1">
                                    <h3
                                        className={`text-2xl font-black tracking-tight break-words max-w-full ${
                                            result.isCorrect ? "text-emerald-600" : "text-rose-600"
                                        }`}
                                    >
                                        {card.word_eng}
                                    </h3>
                                    {card.transcription && (
                                        <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-0.5 text-xs font-mono text-indigo-700 font-medium">
                                            <span>{card.transcription}</span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="w-full flex flex-col items-center gap-1.5">
                                    <div className="w-full rounded-2xl bg-slate-50 border border-slate-200/80 p-2.5 text-left text-xs text-slate-700 shadow-2xs">
                                        <span className="font-bold text-[10px] uppercase tracking-wider text-indigo-600 block mb-0.5">
                                            {userProfileTexts.definitionPrompt()}
                                        </span>
                                        <p className="line-clamp-2 leading-relaxed text-slate-800 font-medium">
                                            {card.context ||
                                                "Recall the workplace English term that matches this definition."}
                                        </p>
                                        {card.workspace_example && (
                                            <p className="mt-1 line-clamp-1 italic text-[11px] text-slate-500">
                                                "{maskTargetWord(card.workspace_example, card.word_eng)}"
                                            </p>
                                        )}
                                    </div>
                                    {/* Hint toggle */}
                                    <div className="flex items-center gap-2 text-[11px]">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onToggleHint(card.id);
                                            }}
                                            className="text-indigo-600 hover:text-indigo-800 underline font-semibold inline-flex items-center gap-1"
                                        >
                                            <Lightbulb className="h-3 w-3" />
                                            <span>
                                                {revealedHint
                                                    ? userProfileTexts.hideHint()
                                                    : userProfileTexts.hint()}
                                            </span>
                                        </button>
                                        {revealedHint && (
                                            <span className="font-mono text-slate-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100 text-[11px]">
                                                {card.transcription ? `${card.transcription} • ` : ""}
                                                {userProfileTexts.startsWith(card.word_eng.charAt(0))}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Interactive Multilingual Quiz Input / Compared Answer */}
                    <div className="w-full px-1">
                        {!result ? (
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    onSubmitAnswer(card.id, card);
                                }}
                                className="space-y-2"
                            >
                                <div className="flex items-center gap-1.5">
                                    <Input
                                        type="text"
                                        value={userInput || ""}
                                        onChange={(e) => onUserInputChange(card.id, e.target.value)}
                                        placeholder={
                                            studyMode === "ja"
                                                ? userProfileTexts.enterJapanesePlaceholder()
                                                : studyMode === "en"
                                                ? userProfileTexts.enterEnglishPlaceholder()
                                                : userProfileTexts.enterVietnamesePlaceholder()
                                        }
                                        className="h-9 text-xs bg-slate-50 border-slate-200 rounded-xl focus-visible:ring-indigo-500"
                                    />
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="outline"
                                        title={
                                            isListening
                                                ? userProfileTexts.stopListening()
                                                : userProfileTexts.speakAnswer()
                                        }
                                        aria-label={
                                            isListening
                                                ? userProfileTexts.stopListening()
                                                : userProfileTexts.speakAnswer()
                                        }
                                        aria-pressed={isListening}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onToggleDictation(card.id);
                                        }}
                                        className={`h-9 w-9 rounded-xl shrink-0 transition-all ${
                                            isListening
                                                ? "border-rose-300 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700"
                                                : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"
                                        }`}
                                    >
                                        {isListening ? (
                                            <MicOff className="h-3.5 w-3.5 animate-pulse" />
                                        ) : (
                                            <Mic className="h-3.5 w-3.5" />
                                        )}
                                    </Button>
                                    <Button
                                        type="submit"
                                        size="sm"
                                        disabled={!userInput?.trim()}
                                        className="h-9 px-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 active:scale-95 transition-all shrink-0 shadow-xs"
                                    >
                                        <Send className="h-3.5 w-3.5 sm:mr-1" />
                                        <span className="text-xs">{userProfileTexts.submitAnswer()}</span>
                                    </Button>
                                </div>

                                <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground px-1">
                                    {isListening ? (
                                        <span className="inline-flex items-center gap-1 font-medium text-rose-500">
                                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                                            {studyMode === "ja"
                                                ? userProfileTexts.listeningHintJA()
                                                : studyMode === "en"
                                                ? userProfileTexts.listeningHintEN()
                                                : userProfileTexts.listeningHint()}
                                        </span>
                                    ) : cardSpeechError ? (
                                        <span className="truncate font-medium text-rose-500">
                                            {cardSpeechError}
                                        </span>
                                    ) : (
                                        <span />
                                    )}
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onShowAnswer(card.id);
                                        }}
                                        className="hover:text-primary underline font-medium transition-colors"
                                    >
                                        {userProfileTexts.showAnswer()}
                                    </button>
                                </div>
                            </form>
                        ) : result.isCorrect ? (
                            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-center transition-all animate-in fade-in zoom-in-95">
                                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                                    <span>{userProfileTexts.correct()}</span>
                                </div>
                                <div className="mt-1 text-sm font-bold text-foreground break-words">
                                    {studyMode === "vi" ? (
                                        card.word_vi || "—"
                                    ) : studyMode === "ja" ? (
                                        <RubyText text={card.word_ja || "—"} />
                                    ) : (
                                        card.word_eng
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onResetAnswer(card.id);
                                    }}
                                    className="mt-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 underline inline-flex items-center gap-1"
                                >
                                    <RotateCcw className="h-3 w-3" />
                                    <span>{userProfileTexts.tryAgain()}</span>
                                </button>
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-2.5 text-center transition-all animate-in fade-in zoom-in-95">
                                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                                    <XCircle className="h-4 w-4 shrink-0" />
                                    <span>{userProfileTexts.incorrect()}</span>
                                </div>
                                <div className="mt-1 text-xs text-muted-foreground flex items-center justify-center gap-1 flex-wrap text-center">
                                    <span className="text-[10px] uppercase font-semibold text-muted-foreground/80">
                                        {userProfileTexts.yourAnswer()}
                                    </span>
                                    {userInput?.trim() ? (
                                        <span className="text-[11px] font-medium text-rose-500 line-through truncate max-w-[200px]">
                                            "{userInput}"
                                        </span>
                                    ) : (
                                        <span className="text-[11px] font-medium text-muted-foreground">—</span>
                                    )}
                                </div>
                                <div className="mt-0.5 text-xs text-muted-foreground flex items-center justify-center gap-1 flex-wrap text-center">
                                    <span className="text-[10px] uppercase font-semibold text-muted-foreground/80">
                                        {userProfileTexts.expectedAnswer()}
                                    </span>
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                        {studyMode === "vi" ? (
                                            card.word_vi || "—"
                                        ) : studyMode === "ja" ? (
                                            <RubyText text={card.word_ja || "—"} />
                                        ) : (
                                            card.word_eng
                                        )}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onResetAnswer(card.id);
                                    }}
                                    className="mt-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 underline inline-flex items-center gap-1"
                                >
                                    <RotateCcw className="h-3 w-3" />
                                    <span>{userProfileTexts.tryAgain()}</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Bottom Hint */}
                    <div className="w-full pt-3 border-t border-border/60 flex items-center justify-between text-xs font-semibold text-muted-foreground">
                        <span className="flex items-center gap-1 group-hover:text-primary transition-colors">
                            <RotateCw className="h-4 w-4" />
                            {userProfileTexts.clickToFlip()}
                        </span>

                        <button
                            type="button"
                            onClick={(e) => onDelete(card.id, e)}
                            className="p-1 text-muted-foreground hover:text-rose-500 transition-colors"
                            title={userProfileTexts.deleteFlashcard()}
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* BACK FACE (Meaning, Context, Workplace Example) */}
                <div
                    className="absolute inset-0 rounded-3xl p-6 flex flex-col justify-between bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white border-2 border-primary/30 shadow-elevation-4 transition-all overflow-y-auto"
                    style={{
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                    }}
                >
                    {/* Back Top: Index & Delete */}
                    <div className="w-full flex items-center justify-between border-b border-white/10 pb-2.5">
                        <span className="font-mono text-xs text-primary-foreground/80 font-bold">
                            {studyMode === "en"
                                ? `W${cardIndex} • ${userProfileTexts.englishSolution()}`
                                : `W${cardIndex} • ${card.word_eng}`}
                        </span>
                        <button
                            type="button"
                            onClick={(e) => onDelete(card.id, e)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/10 transition-colors"
                            title={userProfileTexts.deleteFlashcard()}
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Back Middle Content: Tailored strictly to active language */}
                    <div className="my-auto space-y-3 text-left py-2">
                        {/* Mode VI: ONLY show Vietnamese meaning */}
                        {studyMode === "vi" && card.word_vi && (
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-0.5">
                                    🇻🇳 {userProfileTexts.vietnameseMeaning()}
                                </span>
                                <p className="font-display text-base sm:text-lg font-bold text-emerald-300">
                                    {card.word_vi}
                                </p>
                            </div>
                        )}

                        {/* Mode JA: ONLY show Japanese meaning */}
                        {studyMode === "ja" && (
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-0.5">
                                    🇯🇵 {userProfileTexts.japaneseMeaning()}
                                </span>
                                <div className="font-display text-base sm:text-lg font-bold text-emerald-300">
                                    {card.word_ja ? (
                                        <RubyText text={card.word_ja} />
                                    ) : (
                                        <span className="text-slate-300 italic text-sm font-normal">—</span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Mode EN: Show English word solution (NO VI and NO JA) */}
                        {studyMode === "en" && (
                            <div className="rounded-2xl bg-white/10 p-3.5 border border-white/15 text-center">
                                <div className="flex items-center justify-center gap-2">
                                    <h4 className="font-display text-2xl font-black text-white tracking-tight">
                                        {card.word_eng}
                                    </h4>
                                    <button
                                        type="button"
                                        onClick={(e) => onSpeak(card.word_eng, e)}
                                        className="p-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-transform active:scale-95"
                                        title={userProfileTexts.listenPronunciation()}
                                    >
                                        <Volume2 className="h-4 w-4" />
                                    </button>
                                </div>
                                {card.transcription && (
                                    <p className="mt-1 font-mono text-xs text-indigo-300">
                                        {card.transcription}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Workplace Example */}
                        {card.workspace_example && (
                            <div className="rounded-xl bg-white/10 p-3 border border-white/10 text-xs text-slate-200">
                                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-indigo-300 mb-1">
                                    <span>{userProfileTexts.workplaceExample()}</span>
                                    <button
                                        type="button"
                                        onClick={(e) => onSpeak(card.workspace_example!, e)}
                                        className="p-0.5 text-slate-300 hover:text-white transition-colors"
                                        title={userProfileTexts.listenExample()}
                                    >
                                        <Volume2 className="h-3 w-3" />
                                    </button>
                                </div>
                                <p className="italic leading-relaxed">
                                    "{card.workspace_example}"
                                </p>
                            </div>
                        )}

                        {/* Context */}
                        {card.context && (
                            <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                                {card.context}
                            </p>
                        )}
                    </div>

                    {/* Back Bottom Hint */}
                    <div className="w-full pt-2 border-t border-white/10 flex items-center justify-center text-xs font-semibold text-slate-400">
                        <span className="flex items-center gap-1 hover:text-white transition-colors">
                            <RotateCw className="h-3 w-3" />
                            {userProfileTexts.clickToFlipBack()}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
