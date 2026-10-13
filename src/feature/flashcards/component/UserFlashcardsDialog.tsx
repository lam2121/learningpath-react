import {
    Brain,
    Layers,
    ListFilter,
    Sparkles,
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
import { Badge } from "@/shadcn/component/ui/badge";
import {
    fetchFlashcards,
    deleteFlashcard,
    type Flashcard,
} from "@/feature/lesson-workspace/api/flashcardApi";
import { userProfileTexts } from "@/feature/user-profile/userProfileTexts";
import { FlashcardDeckRunner } from "./FlashcardDeckRunner";
import { FlashcardTableList } from "./FlashcardTableList";

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
    const { i18n } = useTranslation("profile");
    const currentLang = i18n.language || "en";
    const isVI = currentLang === "vi";
    const isJA = currentLang === "jp" || currentLang.startsWith("ja");
    const isEN = !isVI && !isJA;

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
    }, [open, i18n.language, loadCards]);

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
                (c.word_ja && c.word_ja.toLowerCase().includes(query)) ||
                (c.transcription && c.transcription.toLowerCase().includes(query)) ||
                (c.context && c.context.toLowerCase().includes(query)) ||
                (c.workspace_example && c.workspace_example.toLowerCase().includes(query)),
        );
    }, [cards, searchQuery]);

    const activeCard = cards[currentIndex] ?? null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl sm:max-w-3xl overflow-hidden p-0 border-border bg-card/95 shadow-elevation-5 rounded-3xl backdrop-blur-md">
                {/* Header */}
                <div className="border-b border-border/70 bg-card px-6 py-5">
                    <DialogHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 space-y-0 text-left">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
                                <Brain className="h-5 w-5 sm:h-6 sm:w-6" />
                            </div>
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <DialogTitle className="font-display text-lg sm:text-xl font-bold tracking-tight text-foreground">
                                        {userProfileTexts.flashcardsTitle()}
                                    </DialogTitle>
                                    {!isLoading && cards.length > 0 && (
                                        <Badge
                                            variant="secondary"
                                            className="bg-primary/10 text-primary font-semibold px-2 py-0.5 text-xs border border-primary/20"
                                        >
                                            {userProfileTexts.savedWordsCount(cards.length)}
                                        </Badge>
                                    )}
                                </div>
                                <DialogDescription className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
                                    {userProfileTexts.flashcardsSubtitle()}
                                </DialogDescription>
                            </div>
                        </div>

                        {/* Mode Switcher Tabs */}
                        {cards.length > 0 && (
                            <div className="flex items-center rounded-2xl bg-muted p-1 border border-border/60 w-full sm:w-auto justify-center">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("deck")}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                                        activeTab === "deck"
                                            ? "bg-card text-primary shadow-xs font-bold"
                                            : "text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    <Layers className="h-3.5 w-3.5" />
                                    <span>{userProfileTexts.deckMode()}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("list")}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                                        activeTab === "list"
                                            ? "bg-card text-primary shadow-xs font-bold"
                                            : "text-muted-foreground hover:text-foreground"
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
                                {userProfileTexts.tryAgain()}
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
                        <FlashcardDeckRunner
                            activeCard={activeCard}
                            currentIndex={currentIndex}
                            totalCards={cards.length}
                            isFlipped={isFlipped}
                            onFlip={handleFlip}
                            onPrev={handlePrev}
                            onNext={handleNext}
                            onShuffle={handleShuffle}
                            onDelete={handleDelete}
                            onSpeak={handleSpeak}
                            speakingText={speakingText}
                            isVI={isVI}
                            isJA={isJA}
                            isEN={isEN}
                        />
                    ) : (
                        /* Word List Mode */
                        <FlashcardTableList
                            cards={cards}
                            filteredCards={filteredCards}
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            onSpeak={(text) => handleSpeak(text)}
                            speakingText={speakingText}
                            onSelectCard={(originalIndex) => {
                                setCurrentIndex(originalIndex);
                                setIsFlipped(false);
                                setActiveTab("deck");
                            }}
                            onDelete={handleDelete}
                            isVI={isVI}
                            isJA={isJA}
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
