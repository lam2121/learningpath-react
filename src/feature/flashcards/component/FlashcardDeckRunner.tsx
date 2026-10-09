import React from "react";
import {
    ChevronLeft,
    ChevronRight,
    RotateCw,
    Shuffle,
    Trash2,
    Volume2,
} from "lucide-react";
import { Button } from "@/shadcn/component/ui/button";
import type { Flashcard } from "@/feature/lesson-workspace/api/flashcardApi";
import { RubyText } from "@/common/component/RubyText";
import { userProfileTexts } from "@/feature/user-profile/userProfileTexts";

interface FlashcardDeckRunnerProps {
    activeCard: Flashcard;
    currentIndex: number;
    totalCards: number;
    isFlipped: boolean;
    onFlip: () => void;
    onPrev: () => void;
    onNext: () => void;
    onShuffle: () => void;
    onDelete: (id: number, e?: React.MouseEvent) => void;
    onSpeak: (text: string, e?: React.MouseEvent) => void;
    speakingText: string | null;
    isVI: boolean;
    isJA: boolean;
    isEN: boolean;
}

export function FlashcardDeckRunner({
    activeCard,
    currentIndex,
    totalCards,
    isFlipped,
    onFlip,
    onPrev,
    onNext,
    onShuffle,
    onDelete,
    onSpeak,
    speakingText,
    isVI,
    isJA,
    isEN,
}: FlashcardDeckRunnerProps) {
    return (
        <div className="space-y-4">
            {/* Top Stats & Shuffle */}
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                <div className="flex items-center gap-2">
                    <span className="font-mono text-indigo-600">
                        {userProfileTexts.cardCounter(currentIndex + 1, totalCards)}
                    </span>
                    <div className="h-1.5 w-24 sm:w-36 rounded-full bg-slate-200 overflow-hidden">
                        <div
                            className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
                            style={{
                                width: `${((currentIndex + 1) / totalCards) * 100}%`,
                            }}
                        />
                    </div>
                </div>

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onShuffle}
                    className="h-8 gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600"
                    title={userProfileTexts.shuffleCards()}
                >
                    <Shuffle className="h-3.5 w-3.5" />
                    <span>{userProfileTexts.shuffleCards()}</span>
                </Button>
            </div>

            {/* 3D Flip Card Container */}
            <div
                className="relative w-full h-[340px] sm:h-[370px] select-none cursor-pointer"
                style={{ perspective: "1000px" }}
                onClick={onFlip}
            >
                <div
                    className="w-full h-full relative"
                    style={{
                        transformStyle: "preserve-3d",
                        transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                        transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                    }}
                >
                    {/* FRONT SIDE */}
                    <div
                        className="absolute inset-0 rounded-3xl p-7 sm:p-9 flex flex-col justify-between items-center text-center bg-white border-2 border-indigo-100/90 shadow-[0_12px_36px_rgba(79,70,229,0.08)] hover:border-indigo-300 hover:shadow-[0_18px_45px_rgba(79,70,229,0.14)] transition-all dark:bg-slate-900 dark:border-indigo-900/60 dark:hover:border-indigo-700 dark:shadow-[0_12px_36px_rgba(0,0,0,0.4)]"
                        style={{
                            backfaceVisibility: "hidden",
                            WebkitBackfaceVisibility: "hidden",
                        }}
                    >
                        {/* Front Top */}
                        <div className="w-full flex items-center justify-between">
                            <span className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:bg-indigo-950/80 dark:text-indigo-300">
                                Vocabulary
                            </span>
                            <span className="font-mono text-xs text-slate-400 dark:text-slate-500">
                                #{currentIndex + 1}
                            </span>
                        </div>

                        {/* Front Center: Word & IPA */}
                        <div className="flex flex-col items-center gap-3">
                            <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white break-words max-w-full">
                                {activeCard.word_eng}
                            </h3>

                            {activeCard.transcription && (
                                <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3.5 py-1 text-sm font-mono text-indigo-700 dark:bg-slate-800 dark:text-indigo-300">
                                    <span>{activeCard.transcription}</span>
                                </div>
                            )}

                            {/* Audio Speaker Button */}
                            <button
                                type="button"
                                onClick={(e) => onSpeak(activeCard.word_eng, e)}
                                className={`mt-2 flex h-11 w-11 items-center justify-center rounded-full transition-all shadow-sm ${
                                    speakingText === activeCard.word_eng
                                        ? "bg-indigo-600 text-white scale-110 ring-4 ring-indigo-200"
                                        : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:scale-105 dark:bg-indigo-950/60 dark:text-indigo-400 dark:hover:bg-indigo-900"
                                }`}
                                title={userProfileTexts.listenPronunciation()}
                            >
                                <Volume2 className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Front Bottom: Flip Instruction */}
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 transition-colors">
                            <RotateCw className="h-3.5 w-3.5" />
                            <span>{userProfileTexts.clickToFlip()}</span>
                        </div>
                    </div>

                    {/* BACK SIDE */}
                    <div
                        className="absolute inset-0 rounded-3xl p-6 sm:p-8 flex flex-col justify-between bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white border-2 border-indigo-500/30 shadow-[0_18px_45px_rgba(15,23,42,0.3)] transition-all overflow-y-auto"
                        style={{
                            backfaceVisibility: "hidden",
                            WebkitBackfaceVisibility: "hidden",
                            transform: "rotateY(180deg)",
                        }}
                    >
                        {/* Back Top: English reminder & Delete */}
                        <div className="w-full flex items-center justify-between border-b border-white/10 pb-3">
                            <span className="font-semibold text-xs tracking-wider uppercase text-indigo-300">
                                {activeCard.word_eng}
                            </span>
                            <button
                                type="button"
                                onClick={(e) => onDelete(activeCard.id, e)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-white/10 transition-colors"
                                title={userProfileTexts.deleteFlashcard()}
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Back Middle: Meaning, Context, Example based on active language */}
                        <div className="my-auto space-y-3.5 text-left py-2">
                            {/* Meaning for Vietnamese mode */}
                            {isVI && activeCard.word_vi && (
                                <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                        🇻🇳 {userProfileTexts.vietnameseMeaning()}
                                    </span>
                                    <p className="text-xl sm:text-2xl font-bold text-emerald-400">
                                        {activeCard.word_vi}
                                    </p>
                                </div>
                            )}

                            {/* Meaning for Japanese mode */}
                            {isJA && (
                                <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                        🇯🇵 {userProfileTexts.japaneseMeaning()}
                                    </span>
                                    <div className="text-xl sm:text-2xl font-bold text-emerald-400">
                                        {activeCard.word_ja ? (
                                            <RubyText text={activeCard.word_ja} />
                                        ) : (
                                            <span className="text-slate-300 italic text-sm font-normal">
                                                —
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* English mode: Target English word prominently without VI or JA meanings */}
                            {isEN && (
                                <div className="bg-white/5 rounded-xl p-3.5 border border-white/10 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <h4 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                                            {activeCard.word_eng}
                                        </h4>
                                        <button
                                            type="button"
                                            onClick={(e) => onSpeak(activeCard.word_eng, e)}
                                            className="p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
                                            title={userProfileTexts.listenPronunciation()}
                                        >
                                            <Volume2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                    {activeCard.transcription && (
                                        <p className="mt-1 font-mono text-xs text-indigo-300">
                                            {activeCard.transcription}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Context */}
                            {activeCard.context && (
                                <div className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-white/5 rounded-xl p-3 border border-white/10">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 block mb-1">
                                        {userProfileTexts.contextExplanation()}
                                    </span>
                                    {activeCard.context}
                                </div>
                            )}

                            {/* Workplace Example */}
                            {activeCard.workspace_example && (
                                <div className="rounded-xl bg-indigo-950/60 p-3.5 border border-indigo-500/20 backdrop-blur-xs">
                                    <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-indigo-300 mb-1">
                                        <span>{userProfileTexts.workplaceExample()}</span>
                                        <button
                                            type="button"
                                            onClick={(e) =>
                                                onSpeak(activeCard.workspace_example!, e)
                                            }
                                            className={`p-1 rounded transition-colors ${
                                                speakingText === activeCard.workspace_example
                                                    ? "text-emerald-400 scale-110"
                                                    : "text-slate-300 hover:text-white"
                                            }`}
                                            title={userProfileTexts.listenExample()}
                                        >
                                            <Volume2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                    <p className="text-xs sm:text-sm italic text-slate-100 leading-relaxed">
                                        "{activeCard.workspace_example}"
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Back Bottom */}
                        <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-400 pt-2 border-t border-white/10">
                            <RotateCw className="h-3.5 w-3.5" />
                            <span>{userProfileTexts.clickToFlipBack()}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Deck Controls (Prev, Flip, Next) */}
            <div className="flex items-center justify-between pt-2">
                <Button
                    variant="outline"
                    onClick={onPrev}
                    disabled={currentIndex === 0}
                    className="h-10 px-4 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    <span>{userProfileTexts.previousCard()}</span>
                </Button>

                <Button
                    variant="outline"
                    onClick={onFlip}
                    className="h-10 px-5 rounded-xl border-indigo-200 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100 font-semibold"
                >
                    <RotateCw className="h-4 w-4 mr-1.5" />
                    <span>{userProfileTexts.flipCard()}</span>
                </Button>

                <Button
                    variant="outline"
                    onClick={onNext}
                    disabled={currentIndex >= totalCards - 1}
                    className="h-10 px-4 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                >
                    <span>{userProfileTexts.nextCard()}</span>
                    <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
            </div>

            <p className="text-center text-[11px] text-slate-400 font-medium">
                {userProfileTexts.keyboardHint()}
            </p>
        </div>
    );
}
