import {
    Brain,
    Layers,
    ListFilter,
    Volume2,
    RotateCw,
    ChevronLeft,
    ChevronRight,
    Shuffle,
    Search,
    Trash2,
    Sparkles,
    BookOpen,
    VolumeX,
    Play,
    Loader2,
} from "lucide-react";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/shadcn/component/ui/dialog";
import { Button } from "@/shadcn/component/ui/button";
import { Input } from "@/shadcn/component/ui/input";
import { Badge } from "@/shadcn/component/ui/badge";
import {
    fetchFlashcards,
    deleteFlashcard,
    type Flashcard,
} from "@/feature/lesson-workspace/api/flashcardApi";
import { userProfileTexts } from "../userProfileTexts";

interface UserFlashcardsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCountChange?: (count: number) => void;
}

export function UserFlashcardsDialog({
    open,
    onOpenChange,
    onCountChange,
}: UserFlashcardsDialogProps) {
    useTranslation("profile");

    const [cards, setCards] = useState<Flashcard[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [activeTab, setActiveTab] = useState<"deck" | "list">("deck");
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    const [searchQuery, setSearchQuery] = useState("");
    const [speakingText, setSpeakingText] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    // Fetch flashcards when dialog opens
    const loadCards = useCallback(async () => {
        setIsLoading(true);
        setLoadError(null);
        try {
            const data = await fetchFlashcards();
            setCards(data);
            setCurrentIndex(0);
            setIsFlipped(false);
            onCountChange?.(data.length);
        } catch (err) {
            setLoadError(
                err instanceof Error ? err.message : "Failed to load flashcards.",
            );
        } finally {
            setIsLoading(false);
        }
    }, [onCountChange]);

    useEffect(() => {
        if (open) {
            void loadCards();
        } else {
            // Cancel any active speech when closed
            if (typeof window !== "undefined" && "speechSynthesis" in window) {
                window.speechSynthesis.cancel();
            }
            setSpeakingText(null);
        }
    }, [open, loadCards]);

    // Speech synthesis helper
    const handleSpeak = useCallback((text: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

        window.speechSynthesis.cancel();
        const clean = text.trim();
        if (!clean) return;

        setSpeakingText(clean);
        const utterance = new SpeechSynthesisUtterance(clean);
        utterance.lang = "en-US";
        utterance.rate = 0.95;

        utterance.onend = () => setSpeakingText(null);
        utterance.onerror = () => setSpeakingText(null);

        window.speechSynthesis.speak(utterance);
    }, []);

    // Flip & Navigation
    const handleFlip = useCallback(() => {
        setIsFlipped((prev) => !prev);
    }, []);

    const handlePrev = useCallback(() => {
        if (currentIndex > 0) {
            setIsFlipped(false);
            setCurrentIndex((prev) => prev - 1);
        }
    }, [currentIndex]);

    const handleNext = useCallback(() => {
        if (currentIndex < cards.length - 1) {
            setIsFlipped(false);
            setCurrentIndex((prev) => prev + 1);
        }
    }, [currentIndex, cards.length]);

    const handleShuffle = useCallback(() => {
        setIsFlipped(false);
        setCards((prev) => {
            const copy = [...prev];
            for (let i = copy.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [copy[i], copy[j]] = [copy[j], copy[i]];
            }
            return copy;
        });
        setCurrentIndex(0);
    }, []);

    // Delete a flashcard
    const handleDelete = useCallback(
        async (id: number, e?: React.MouseEvent) => {
            if (e) e.stopPropagation();
            if (deletingId != null) return;

            const confirmed = window.confirm(userProfileTexts.confirmDeleteFlashcard());
            if (!confirmed) return;

            setDeletingId(id);
            try {
                await deleteFlashcard(id);
                setCards((prev) => {
                    const next = prev.filter((c) => c.id !== id);
                    onCountChange?.(next.length);
                    return next;
                });
                // Adjust currentIndex if necessary
                setCurrentIndex((prev) =>
                    prev >= cards.length - 1 ? Math.max(0, cards.length - 2) : prev,
                );
                setIsFlipped(false);
            } catch (err) {
                alert(
                    err instanceof Error
                        ? err.message
                        : "Failed to delete the flashcard.",
                );
            } finally {
                setDeletingId(null);
            }
        },
        [cards.length, deletingId, onCountChange],
    );

    // Keyboard navigation (Left/Right Arrow, Space)
    useEffect(() => {
        if (!open || activeTab !== "deck" || cards.length === 0) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (
                e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement
            ) {
                return;
            }

            if (e.key === " " || e.key === "ArrowUp" || e.key === "ArrowDown") {
                e.preventDefault();
                handleFlip();
            } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                handlePrev();
            } else if (e.key === "ArrowRight") {
                e.preventDefault();
                handleNext();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [open, activeTab, cards.length, handleFlip, handlePrev, handleNext]);

    // Filtered cards for list mode
    const filteredCards = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return cards;
        return cards.filter(
            (c) =>
                c.word_eng.toLowerCase().includes(query) ||
                (c.word_vi && c.word_vi.toLowerCase().includes(query)) ||
                (c.transcription && c.transcription.toLowerCase().includes(query)) ||
                (c.context && c.context.toLowerCase().includes(query)) ||
                (c.workspace_example && c.workspace_example.toLowerCase().includes(query)),
        );
    }, [cards, searchQuery]);

    const activeCard = cards[currentIndex] ?? null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl sm:max-w-3xl overflow-hidden p-0 border-slate-200 bg-slate-50/50 shadow-2xl rounded-3xl">
                {/* Header */}
                <div className="border-b border-slate-200/80 bg-white px-6 py-5">
                    <DialogHeader className="flex flex-row items-center justify-between gap-4 space-y-0 text-left">
                        <div className="flex items-center gap-3.5">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-200">
                                <Brain className="h-6 w-6" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <DialogTitle className="text-xl font-bold tracking-tight text-slate-900">
                                        {userProfileTexts.flashcardsTitle()}
                                    </DialogTitle>
                                    {!isLoading && cards.length > 0 && (
                                        <Badge
                                            variant="secondary"
                                            className="bg-indigo-50 text-indigo-700 font-semibold px-2.5 py-0.5"
                                        >
                                            {userProfileTexts.savedWordsCount(cards.length)}
                                        </Badge>
                                    )}
                                </div>
                                <DialogDescription className="mt-0.5 text-xs sm:text-sm text-slate-500">
                                    {userProfileTexts.flashcardsSubtitle()}
                                </DialogDescription>
                            </div>
                        </div>

                        {/* Mode Switcher Tabs */}
                        {cards.length > 0 && (
                            <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200/70 mr-6">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("deck")}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                        activeTab === "deck"
                                            ? "bg-white text-indigo-600 shadow-xs"
                                            : "text-slate-600 hover:text-slate-900"
                                    }`}
                                >
                                    <Layers className="h-3.5 w-3.5" />
                                    <span>{userProfileTexts.deckMode()}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("list")}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                        activeTab === "list"
                                            ? "bg-white text-indigo-600 shadow-xs"
                                            : "text-slate-600 hover:text-slate-900"
                                    }`}
                                >
                                    <ListFilter className="h-3.5 w-3.5" />
                                    <span>{userProfileTexts.listMode()}</span>
                                </button>
                            </div>
                        )}
                    </DialogHeader>
                </div>

                {/* Main Body */}
                <div className="p-6">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                            <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
                            <p className="mt-3 text-sm font-medium">
                                {userProfileTexts.flashcards()}...
                            </p>
                        </div>
                    ) : loadError ? (
                        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
                            <p className="font-semibold">{loadError}</p>
                            <Button
                                variant="outline"
                                onClick={() => void loadCards()}
                                className="mt-4 border-red-200 text-red-700 hover:bg-red-100"
                            >
                                Try Again
                            </Button>
                        </div>
                    ) : cards.length === 0 ? (
                        /* Empty State */
                        <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
                            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600 ring-8 ring-indigo-50/50 mb-5 shadow-inner">
                                <Sparkles className="h-10 w-10" />
                            </div>
                            <h4 className="text-xl font-bold text-slate-900">
                                {userProfileTexts.noFlashcardsTitle()}
                            </h4>
                            <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-600">
                                {userProfileTexts.noFlashcardsDesc()}
                            </p>
                            <Button
                                variant="default"
                                onClick={() => onOpenChange(false)}
                                className="mt-6 rounded-xl bg-indigo-600 px-6 font-semibold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700"
                            >
                                {userProfileTexts.confirm()}
                            </Button>
                        </div>
                    ) : activeTab === "deck" && activeCard ? (
                        /* Practice Deck Mode */
                        <div className="space-y-4">
                            {/* Top Stats & Shuffle */}
                            <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-indigo-600">
                                        {userProfileTexts.cardCounter(
                                            currentIndex + 1,
                                            cards.length,
                                        )}
                                    </span>
                                    <div className="h-1.5 w-24 sm:w-36 rounded-full bg-slate-200 overflow-hidden">
                                        <div
                                            className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
                                            style={{
                                                width: `${((currentIndex + 1) / cards.length) * 100}%`,
                                            }}
                                        />
                                    </div>
                                </div>

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleShuffle}
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
                                onClick={handleFlip}
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
                                        className="absolute inset-0 rounded-3xl p-7 sm:p-9 flex flex-col justify-between items-center text-center bg-white border-2 border-indigo-100/90 shadow-[0_12px_36px_rgba(79,70,229,0.08)] hover:border-indigo-300 hover:shadow-[0_18px_45px_rgba(79,70,229,0.14)] transition-all"
                                        style={{
                                            backfaceVisibility: "hidden",
                                            WebkitBackfaceVisibility: "hidden",
                                        }}
                                    >
                                        {/* Front Top */}
                                        <div className="w-full flex items-center justify-between">
                                            <span className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                                                Vocabulary
                                            </span>
                                            <span className="font-mono text-xs text-slate-400">
                                                #{currentIndex + 1}
                                            </span>
                                        </div>

                                        {/* Front Center: Word & IPA */}
                                        <div className="flex flex-col items-center gap-3">
                                            <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 break-words max-w-full">
                                                {activeCard.word_eng}
                                            </h3>

                                            {activeCard.transcription && (
                                                <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3.5 py-1 text-sm font-mono text-indigo-700">
                                                    <span>{activeCard.transcription}</span>
                                                </div>
                                            )}

                                            {/* Audio Speaker Button */}
                                            <button
                                                type="button"
                                                onClick={(e) => handleSpeak(activeCard.word_eng, e)}
                                                className={`mt-2 flex h-11 w-11 items-center justify-center rounded-full transition-all shadow-sm ${
                                                    speakingText === activeCard.word_eng
                                                        ? "bg-indigo-600 text-white scale-110 ring-4 ring-indigo-200"
                                                        : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:scale-105"
                                                }`}
                                                title={userProfileTexts.listenPronunciation()}
                                            >
                                                <Volume2 className="h-5 w-5" />
                                            </button>
                                        </div>

                                        {/* Front Bottom: Flip Instruction */}
                                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 group-hover:text-indigo-600 transition-colors">
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
                                                onClick={(e) => handleDelete(activeCard.id, e)}
                                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-white/10 transition-colors"
                                                title={userProfileTexts.deleteFlashcard()}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>

                                        {/* Back Middle: Meaning, Context, Example */}
                                        <div className="my-auto space-y-3.5 text-left py-2">
                                            {/* Meaning */}
                                            {activeCard.word_vi && (
                                                <div>
                                                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                                        {userProfileTexts.vietnameseMeaning()}
                                                    </span>
                                                    <p className="text-xl sm:text-2xl font-bold text-emerald-400">
                                                        {activeCard.word_vi}
                                                    </p>
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
                                                                handleSpeak(
                                                                    activeCard.workspace_example!,
                                                                    e,
                                                                )
                                                            }
                                                            className={`p-1 rounded transition-colors ${
                                                                speakingText ===
                                                                activeCard.workspace_example
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
                                    onClick={handlePrev}
                                    disabled={currentIndex === 0}
                                    className="h-10 px-4 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                                >
                                    <ChevronLeft className="h-4 w-4 mr-1" />
                                    <span>{userProfileTexts.previousCard()}</span>
                                </Button>

                                <Button
                                    variant="outline"
                                    onClick={handleFlip}
                                    className="h-10 px-5 rounded-xl border-indigo-200 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100 font-semibold"
                                >
                                    <RotateCw className="h-4 w-4 mr-1.5" />
                                    <span>{userProfileTexts.flipCard()}</span>
                                </Button>

                                <Button
                                    variant="outline"
                                    onClick={handleNext}
                                    disabled={currentIndex >= cards.length - 1}
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
                    ) : (
                        /* Word List Mode */
                        <div className="space-y-4">
                            {/* Search Filter */}
                            <div className="relative">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={userProfileTexts.searchFlashcards()}
                                    className="pl-9 pr-9 h-10 bg-white border-slate-200 rounded-xl text-sm"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery("")}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                                    >
                                        <VolumeX className="h-3.5 w-3.5 hidden" />
                                        <span className="text-xs font-bold text-slate-400 hover:text-slate-600">
                                            ✕
                                        </span>
                                    </button>
                                )}
                            </div>

                            {/* List Content */}
                            <div className="max-h-[380px] overflow-y-auto space-y-2.5 pr-1">
                                {filteredCards.length === 0 ? (
                                    <div className="text-center py-12 text-slate-400">
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
                                                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all"
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-baseline gap-2">
                                                        <h5 className="font-bold text-slate-900 text-base">
                                                            {card.word_eng}
                                                        </h5>
                                                        {card.transcription && (
                                                            <span className="text-xs font-mono text-indigo-600">
                                                                {card.transcription}
                                                            </span>
                                                        )}
                                                        {card.word_vi && (
                                                            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                                                                {card.word_vi}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {card.workspace_example && (
                                                        <p className="mt-1 text-xs text-slate-500 italic line-clamp-2">
                                                            "{card.workspace_example}"
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                                                    {/* Pronounce */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSpeak(card.word_eng)}
                                                        className={`p-2 rounded-xl border border-slate-200 transition-colors ${
                                                            speakingText === card.word_eng
                                                                ? "bg-indigo-600 text-white border-indigo-600"
                                                                : "text-slate-600 hover:bg-slate-100"
                                                        }`}
                                                        title={userProfileTexts.listenPronunciation()}
                                                    >
                                                        <Volume2 className="h-4 w-4" />
                                                    </button>

                                                    {/* Jump to practice */}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setCurrentIndex(
                                                                originalIndex >= 0 ? originalIndex : 0,
                                                            );
                                                            setIsFlipped(false);
                                                            setActiveTab("deck");
                                                        }}
                                                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-600 text-xs font-semibold hover:bg-indigo-100 transition-colors"
                                                        title={userProfileTexts.practiceThisWord()}
                                                    >
                                                        <Play className="h-3 w-3 fill-current" />
                                                        <span>{userProfileTexts.practiceThisWord()}</span>
                                                    </button>

                                                    {/* Delete */}
                                                    <button
                                                        type="button"
                                                        onClick={(e) => handleDelete(card.id, e)}
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
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
