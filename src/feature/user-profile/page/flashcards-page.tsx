import {
    Brain,
    ArrowLeft,
    Volume2,
    RotateCw,
    Trash2,
    Sparkles,
    BookOpen,
    Search,
    Shuffle,
    Layers,
    Loader2,
    CheckCircle2,
    XCircle,
    RotateCcw,
    Send,
    Mic,
    MicOff,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";

import { MainNavigationMenu } from "@/common/component/MainNavigationMenu";
import { Button } from "@/shadcn/component/ui/button";
import { Input } from "@/shadcn/component/ui/input";
import {
    fetchFlashcards,
    deleteFlashcard,
    type Flashcard,
} from "@/feature/lesson-workspace/api/flashcardApi";
import { userProfileTexts } from "../userProfileTexts";
import { UserFlashcardsDialog } from "../component/UserFlashcardsDialog";

const ITEMS_PER_PAGE = 12;

function getPaginationItems(current: number, total: number): (number | "...")[] {
    if (total <= 10) {
        return Array.from({ length: total }, (_, i) => i + 1);
    }

    const items: (number | "...")[] = [];

    // Near start
    if (current <= 6) {
        for (let i = 1; i <= Math.min(8, total); i++) {
            items.push(i);
        }
        if (total > 8) {
            items.push("...");
            items.push(total - 1);
            items.push(total);
        }
    }
    // Near end
    else if (current >= total - 5) {
        items.push(1);
        items.push(2);
        items.push("...");
        for (let i = total - 7; i <= total; i++) {
            items.push(i);
        }
    }
    // In middle
    else {
        items.push(1);
        items.push("...");
        for (let i = current - 2; i <= current + 2; i++) {
            items.push(i);
        }
        items.push("...");
        items.push(total);
    }

    return items;
}

export function FlashcardsPage() {
    useTranslation("profile");

    const [cards, setCards] = useState<Flashcard[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Individual flip state for each card in the grid: card.id -> boolean
    const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});
    const [searchQuery, setSearchQuery] = useState("");
    const [speakingText, setSpeakingText] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    // Quiz inputs and results per card (card.id -> text / result)
    const [userInputs, setUserInputs] = useState<Record<number, string>>({});
    const [submissionResults, setSubmissionResults] = useState<
        Record<number, { isSubmitted: boolean; isCorrect: boolean }>
    >({});

    // Speech-to-text state: which card is currently recording, plus any error
    const [listeningCardId, setListeningCardId] = useState<number | null>(null);
    const [speechError, setSpeechError] = useState<
        { cardId: number; message: string } | null
    >(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Web SpeechRecognition API has no TS types
    const recognitionRef = useRef<any>(null);

    // Practice Deck Dialog state
    const [practiceModalOpen, setPracticeModalOpen] = useState(false);

    // Load flashcards from API
    const loadFlashcards = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchFlashcards();
            setCards(data);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to load flashcards.",
            );
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadFlashcards();
    }, [loadFlashcards]);

    // Comparison function for Vietnamese meanings
    const checkVietnameseMatch = (userGuess: string, expected: string): boolean => {
        if (!userGuess || !expected) return false;

        const normalize = (str: string) =>
            str
                .trim()
                .toLowerCase()
                .normalize("NFC")
                .replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g, "")
                .replace(/\s+/g, " ");

        const cleanGuess = normalize(userGuess);
        const cleanExpected = normalize(expected);

        if (!cleanGuess || !cleanExpected) return false;
        if (cleanGuess === cleanExpected) return true;

        // Check alternatives separated by commas, semicolons, slashes, or 'hoặc'
        const alternatives = expected
            .split(/[,;/]+|\s+hoặc\s+/i)
            .map((part) => normalize(part))
            .filter(Boolean);

        return alternatives.includes(cleanGuess);
    };

    const handleSubmitAnswer = (cardId: number, expected: string) => {
        const input = userInputs[cardId]?.trim() ?? "";
        if (!input) return;

        if (listeningCardId === cardId) {
            recognitionRef.current?.stop();
            setListeningCardId(null);
        }

        const isCorrect = checkVietnameseMatch(input, expected);
        setSubmissionResults((prev) => ({
            ...prev,
            [cardId]: { isSubmitted: true, isCorrect },
        }));
    };

    const handleResetAnswer = (cardId: number) => {
        if (listeningCardId === cardId) {
            recognitionRef.current?.stop();
            setListeningCardId(null);
        }
        setSpeechError(null);
        setSubmissionResults((prev) => {
            const next = { ...prev };
            delete next[cardId];
            return next;
        });
        setUserInputs((prev) => {
            const next = { ...prev };
            delete next[cardId];
            return next;
        });
    };

    // Stop any running recognition when the page unmounts
    useEffect(() => {
        return () => {
            recognitionRef.current?.stop();
        };
    }, []);

    // Vietnamese speech-to-text for the quiz input (second input option)
    const toggleDictation = (cardId: number) => {
        setSpeechError(null);

        // Clicking the mic of the card that is already recording stops it
        if (listeningCardId === cardId) {
            recognitionRef.current?.stop();
            setListeningCardId(null);
            return;
        }

        recognitionRef.current?.stop();

        /* eslint-disable @typescript-eslint/no-explicit-any -- Web SpeechRecognition API has no TS types */
        const SpeechRecognition =
            (window as any).SpeechRecognition ||
            (window as any).webkitSpeechRecognition;
        /* eslint-enable @typescript-eslint/no-explicit-any */

        if (!SpeechRecognition) {
            setSpeechError({
                cardId,
                message: userProfileTexts.speechNotSupported(),
            });
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = "vi-VN";
        recognition.continuous = false;
        recognition.interimResults = true;

        // Dictation appends to whatever the user already typed
        let initialText = userInputs[cardId] || "";
        if (initialText && !initialText.endsWith(" ")) {
            initialText += " ";
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Web SpeechRecognitionEvent has no TS types
        recognition.onresult = (event: any) => {
            let sessionTranscript = "";
            for (let i = 0; i < event.results.length; ++i) {
                sessionTranscript += event.results[i][0].transcript;
            }
            setUserInputs((prev) => ({
                ...prev,
                [cardId]: initialText + sessionTranscript,
            }));
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Web SpeechRecognitionErrorEvent has no TS types
        recognition.onerror = (event: any) => {
            if (event.error !== "aborted" && event.error !== "no-speech") {
                setSpeechError({ cardId, message: userProfileTexts.speechError() });
            }
            setListeningCardId((prev) => (prev === cardId ? null : prev));
        };

        recognition.onend = () => {
            setListeningCardId((prev) => (prev === cardId ? null : prev));
        };

        try {
            recognition.start();
            recognitionRef.current = recognition;
            setListeningCardId(cardId);
        } catch (error) {
            console.error("Speech recognition error:", error);
            setSpeechError({ cardId, message: userProfileTexts.speechError() });
            setListeningCardId(null);
        }
    };

    const handleShowAnswer = (cardId: number) => {
        setSubmissionResults((prev) => ({
            ...prev,
            [cardId]: { isSubmitted: true, isCorrect: false },
        }));
    };

    // Audio speech synthesis helper
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

    // Toggle flip for an individual card in the grid
    const handleToggleFlip = (cardId: number, e: React.MouseEvent) => {
        // Ignore clicks inside input, form, button, or link
        const target = e.target as HTMLElement;
        if (
            target.closest("button") ||
            target.closest("a") ||
            target.closest("input") ||
            target.closest("form")
        ) {
            return;
        }

        setFlippedCards((prev) => ({
            ...prev,
            [cardId]: !prev[cardId],
        }));
    };

    // Flip all cards simultaneously
    const handleFlipAll = () => {
        const allFlipped = cards.length > 0 && cards.every((c) => flippedCards[c.id]);
        const next: Record<number, boolean> = {};
        for (const card of cards) {
            next[card.id] = !allFlipped;
        }
        setFlippedCards(next);
    };

    // Shuffle the cards in the grid
    const handleShuffle = () => {
        setCards((prev) => {
            const copy = [...prev];
            for (let i = copy.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [copy[i], copy[j]] = [copy[j], copy[i]];
            }
            return copy;
        });
    };

    // Delete a flashcard
    const handleDelete = async (cardId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (deletingId != null) return;

        const confirmed = window.confirm(userProfileTexts.confirmDeleteFlashcard());
        if (!confirmed) return;

        setDeletingId(cardId);
        try {
            await deleteFlashcard(cardId);
            setCards((prev) => prev.filter((c) => c.id !== cardId));
        } catch (err) {
            alert(
                err instanceof Error ? err.message : "Failed to delete flashcard.",
            );
        } finally {
            setDeletingId(null);
        }
    };

    // Filter cards by search query
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

    const [currentPage, setCurrentPage] = useState(1);

    // Reset to page 1 whenever user searches
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const totalPages = Math.max(1, Math.ceil(filteredCards.length / ITEMS_PER_PAGE));

    // Ensure currentPage is within bounds
    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const paginatedCards = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredCards.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredCards, currentPage]);

    const paginationItems = useMemo(() => {
        return getPaginationItems(currentPage, totalPages);
    }, [currentPage, totalPages]);

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.08),_transparent_28%),linear-gradient(180deg,_#fbfdff_0%,_#f4f7fe_100%)]">
            <MainNavigationMenu />

            <div className="mx-auto w-full max-w-[1800px] px-3 pb-16 pt-3 sm:px-5 lg:px-8">
                {/* Back to Profile Link */}
                <div className="mb-3">
                    <Link
                        to="/profile"
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span>{userProfileTexts.backToProfile()}</span>
                    </Link>
                </div>

                {/* Hero Header Banner */}
                <section className="relative overflow-hidden rounded-[28px] border border-indigo-100 bg-[linear-gradient(135deg,#f8faff_0%,#ffffff_42%,#eef2ff_100%)] p-5 sm:p-7 shadow-[0_20px_56px_rgba(99,102,241,0.1)]">
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(165,180,252,0.18),_transparent_26%),radial-gradient(circle_at_bottom_left,_rgba(199,210,254,0.2),_transparent_24%)]" />

                    <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="max-w-3xl">
                            <p className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-white shadow-xs">
                                <Brain className="h-3.5 w-3.5" />
                                <span>{userProfileTexts.flashcards()}</span>
                            </p>
                            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
                                {userProfileTexts.flashcardsTitle()}
                            </h1>
                            <p className="mt-2 text-base font-medium leading-7 text-slate-600 sm:text-lg">
                                {userProfileTexts.flashcardsSubtitle()}
                            </p>
                        </div>

                        {/* Top Action & Stat Pill */}
                        <div className="flex flex-wrap items-center gap-3 self-start sm:self-center">
                            {!isLoading && cards.length > 0 && (
                                <div className="flex items-center gap-3 rounded-2xl bg-white/95 px-4 py-3 shadow-[0_10px_24px_rgba(99,102,241,0.1)] ring-1 ring-indigo-100">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 font-bold">
                                        <Brain className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                            Total Deck
                                        </p>
                                        <p className="text-lg font-black text-slate-900">
                                            {cards.length} {userProfileTexts.flashcards()}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {!isLoading && Object.keys(submissionResults).length > 0 && (
                                <div className="flex items-center gap-3 rounded-2xl bg-white/95 px-4 py-3 shadow-[0_10px_24px_rgba(16,185,129,0.1)] ring-1 ring-emerald-100">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 font-bold">
                                        <CheckCircle2 className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                            Quiz Score
                                        </p>
                                        <p className="text-lg font-black text-emerald-600">
                                            {Object.values(submissionResults).filter((r) => r.isCorrect).length} / {Object.keys(submissionResults).length}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {cards.length > 0 && (
                                <Button
                                    onClick={() => setPracticeModalOpen(true)}
                                    className="h-11 gap-2 rounded-2xl bg-indigo-600 px-5 font-bold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-all"
                                >
                                    <Layers className="h-4 w-4" />
                                    <span>{userProfileTexts.deckMode()}</span>
                                </Button>
                            )}
                        </div>
                    </div>
                </section>

                {/* Toolbar: Search and Filter Controls */}
                {!isLoading && cards.length > 0 && (
                    <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        {/* Search Bar */}
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={userProfileTexts.searchFlashcards()}
                                className="pl-9 pr-9 h-11 bg-white border-slate-200 rounded-2xl text-sm shadow-2xs focus-visible:ring-indigo-500"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        {/* Controls: Shuffle, Flip All */}
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleShuffle}
                                className="h-11 px-4 gap-1.5 rounded-2xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-semibold shadow-2xs"
                                title={userProfileTexts.shuffleCards()}
                            >
                                <Shuffle className="h-4 w-4 text-slate-500" />
                                <span>{userProfileTexts.shuffleCards()}</span>
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleFlipAll}
                                className="h-11 px-4 gap-1.5 rounded-2xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-semibold shadow-2xs"
                                title={userProfileTexts.flipCard()}
                            >
                                <RotateCw className="h-4 w-4 text-slate-500" />
                                <span>{userProfileTexts.flipCard()} All</span>
                            </Button>
                        </div>
                    </div>
                )}

                {/* Main Content Area */}
                <div className="mt-6">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                            <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
                            <p className="mt-3 text-base font-semibold text-slate-600">
                                {userProfileTexts.flashcards()}...
                            </p>
                        </div>
                    ) : error ? (
                        <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center text-red-700 max-w-lg mx-auto">
                            <p className="font-bold text-lg">{error}</p>
                            <Button
                                variant="outline"
                                onClick={() => void loadFlashcards()}
                                className="mt-4 border-red-200 text-red-700 hover:bg-red-100 rounded-xl"
                            >
                                Try Again
                            </Button>
                        </div>
                    ) : cards.length === 0 ? (
                        /* Empty State */
                        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white/70 py-20 px-6 text-center shadow-2xs">
                            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600 ring-8 ring-indigo-50/50 mb-5 shadow-inner">
                                <Sparkles className="h-10 w-10" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900">
                                {userProfileTexts.noFlashcardsTitle()}
                            </h3>
                            <p className="mt-2 max-w-md text-base leading-relaxed text-slate-600">
                                {userProfileTexts.noFlashcardsDesc()}
                            </p>
                            <Link to="/profile">
                                <Button
                                    variant="default"
                                    className="mt-6 rounded-2xl bg-indigo-600 px-6 font-semibold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700"
                                >
                                    {userProfileTexts.backToProfile()}
                                </Button>
                            </Link>
                        </div>
                    ) : filteredCards.length === 0 ? (
                        /* Search No Results */
                        <div className="rounded-3xl border border-slate-200 bg-white py-16 text-center text-slate-400 shadow-2xs">
                            <BookOpen className="h-10 w-10 mx-auto mb-2 opacity-50" />
                            <p className="text-base font-medium">
                                {userProfileTexts.noMatchingWords()}
                            </p>
                        </div>
                    ) : (
                        /* The Vocabulary Card Grid (W1, W2, ..., Wn) */
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {paginatedCards.map((card, idx) => {
                                    const isFlipped = Boolean(flippedCards[card.id]);
                                    const cardIndex = (currentPage - 1) * ITEMS_PER_PAGE + idx + 1;
                                    const result = submissionResults[card.id];
                                    const isListening = listeningCardId === card.id;
                                    const cardSpeechError =
                                        speechError?.cardId === card.id ? speechError.message : null;

                                const frontBorderClass = result
                                    ? result.isCorrect
                                        ? "border-emerald-300 ring-2 ring-emerald-100 shadow-[0_12px_36px_rgba(16,185,129,0.14)]"
                                        : "border-rose-300 ring-2 ring-rose-100 shadow-[0_12px_36px_rgba(244,63,94,0.14)]"
                                    : "border-slate-200/90 shadow-[0_10px_30px_rgba(15,23,42,0.06)] group-hover:border-indigo-300 group-hover:shadow-[0_16px_40px_rgba(99,102,241,0.12)]";

                                return (
                                    <div
                                        key={card.id}
                                        onClick={(e) => handleToggleFlip(card.id, e)}
                                        className="relative h-[390px] w-full select-none cursor-pointer group"
                                        style={{ perspective: "1000px" }}
                                    >
                                        <div
                                            className="w-full h-full relative"
                                            style={{
                                                transformStyle: "preserve-3d",
                                                transition:
                                                    "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                                                transform: isFlipped
                                                    ? "rotateY(180deg)"
                                                    : "rotateY(0deg)",
                                            }}
                                        >
                                            {/* FRONT FACE (W1, W2, ... Wn) */}
                                            <div
                                                className={`absolute inset-0 rounded-3xl p-5 flex flex-col justify-between items-center text-center bg-white border-2 transition-all ${frontBorderClass}`}
                                                style={{
                                                    backfaceVisibility: "hidden",
                                                    WebkitBackfaceVisibility: "hidden",
                                                }}
                                            >
                                                {/* Top Header: Word Index Badge & Options */}
                                                <div className="w-full flex items-center justify-between">
                                                    <span className="inline-flex items-center font-mono font-bold text-xs px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-700">
                                                        W{cardIndex}
                                                    </span>

                                                    {/* Pronunciation Audio Button */}
                                                    <button
                                                        type="button"
                                                        onClick={(e) =>
                                                            handleSpeak(card.word_eng, e)
                                                        }
                                                        className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
                                                            speakingText === card.word_eng
                                                                ? "bg-indigo-600 text-white scale-110 shadow-md ring-2 ring-indigo-300"
                                                                : "bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600"
                                                        }`}
                                                        title={userProfileTexts.listenPronunciation()}
                                                    >
                                                        <Volume2 className="h-4 w-4" />
                                                    </button>
                                                </div>

                                                {/* Center Content: Word & IPA */}
                                                <div className="flex flex-col items-center gap-2 px-2">
                                                    <h3 className="text-2xl font-black tracking-tight text-slate-900 break-words max-w-full">
                                                        {card.word_eng}
                                                    </h3>

                                                    {card.transcription && (
                                                        <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-0.5 text-xs font-mono text-indigo-700 font-medium">
                                                            <span>{card.transcription}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Interactive Vietnamese Quiz Input / Compared Answer */}
                                                <div className="w-full px-1">
                                                    {!result ? (
                                                        <form
                                                            onSubmit={(e) => {
                                                                e.preventDefault();
                                                                handleSubmitAnswer(card.id, card.word_vi || "");
                                                            }}
                                                            className="space-y-2"
                                                        >
                                                            <div className="flex items-center gap-1.5">
                                                                <Input
                                                                    type="text"
                                                                    value={userInputs[card.id] || ""}
                                                                    onChange={(e) =>
                                                                        setUserInputs((prev) => ({
                                                                            ...prev,
                                                                            [card.id]: e.target.value,
                                                                        }))
                                                                    }
                                                                    placeholder={userProfileTexts.enterVietnamesePlaceholder()}
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
                                                                        toggleDictation(card.id);
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
                                                                    disabled={!userInputs[card.id]?.trim()}
                                                                    className="h-9 px-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-all shrink-0"
                                                                >
                                                                    <Send className="h-3.5 w-3.5 sm:mr-1" />
                                                                    <span className="text-xs">{userProfileTexts.submitAnswer()}</span>
                                                                </Button>
                                                            </div>

                                                            <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400 px-1">
                                                                {isListening ? (
                                                                    <span className="inline-flex items-center gap-1 font-medium text-rose-500">
                                                                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                                                                        {userProfileTexts.listeningHint()}
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
                                                                        handleShowAnswer(card.id);
                                                                    }}
                                                                    className="hover:text-indigo-600 underline font-medium transition-colors"
                                                                >
                                                                    {userProfileTexts.showAnswer()}
                                                                </button>
                                                            </div>
                                                        </form>
                                                    ) : result.isCorrect ? (
                                                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-2.5 text-center transition-all animate-in fade-in zoom-in-95">
                                                            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-700">
                                                                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                                                                <span>{userProfileTexts.correct()}</span>
                                                            </div>
                                                            <p className="mt-1 text-sm font-bold text-emerald-900 break-words">
                                                                {card.word_vi}
                                                            </p>
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleResetAnswer(card.id);
                                                                }}
                                                                className="mt-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 underline inline-flex items-center gap-1"
                                                            >
                                                                <RotateCcw className="h-3 w-3" />
                                                                <span>{userProfileTexts.tryAgain()}</span>
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="rounded-2xl border border-rose-200 bg-rose-50/90 p-2.5 text-center transition-all animate-in fade-in zoom-in-95">
                                                            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-rose-700">
                                                                <XCircle className="h-4 w-4 text-rose-600 shrink-0" />
                                                                <span>{userProfileTexts.incorrect()}</span>
                                                            </div>
                                                            {userInputs[card.id] && (
                                                                <p className="mt-0.5 text-[11px] text-rose-500 line-through truncate max-w-full">
                                                                    "{userInputs[card.id]}"
                                                                </p>
                                                            )}
                                                            <p className="mt-0.5 text-xs text-slate-700">
                                                                <span className="text-[10px] uppercase font-semibold text-slate-400 mr-1">
                                                                    {userProfileTexts.expectedAnswer()}
                                                                </span>
                                                                <span className="font-bold text-emerald-700">{card.word_vi}</span>
                                                            </p>
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleResetAnswer(card.id);
                                                                }}
                                                                className="mt-1 text-[11px] font-semibold text-rose-700 hover:text-rose-900 underline inline-flex items-center gap-1"
                                                            >
                                                                <RotateCcw className="h-3 w-3" />
                                                                <span>{userProfileTexts.tryAgain()}</span>
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Bottom Hint */}
                                                <div className="w-full pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-400">
                                                    <span className="flex items-center gap-1 group-hover:text-indigo-600 transition-colors">
                                                        <RotateCw className="h-4 w-4" />
                                                        {userProfileTexts.clickToFlip()}
                                                    </span>

                                                    <button
                                                        type="button"
                                                        onClick={(e) => handleDelete(card.id, e)}
                                                        className="p-1 text-red-500 hover:text-red-600 transition-colors"
                                                        title={userProfileTexts.deleteFlashcard()}
                                                    >
                                                        <Trash2 className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* BACK FACE (Meaning, Context, Workplace Example) */}
                                            <div
                                                className="absolute inset-0 rounded-3xl p-6 flex flex-col justify-between bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white border-2 border-indigo-500/30 shadow-[0_16px_40px_rgba(15,23,42,0.25)] transition-all overflow-y-auto"
                                                style={{
                                                    backfaceVisibility: "hidden",
                                                    WebkitBackfaceVisibility: "hidden",
                                                    transform: "rotateY(180deg)",
                                                }}
                                            >
                                                {/* Back Top: Index & Delete */}
                                                <div className="w-full flex items-center justify-between border-b border-white/10 pb-2.5">
                                                    <span className="font-mono text-xs text-indigo-300 font-bold">
                                                        W{cardIndex} • {card.word_eng}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => handleDelete(card.id, e)}
                                                        className="p-1 rounded-lg text-red-400 hover:text-red-400 hover:bg-white/10 transition-colors"
                                                        title={userProfileTexts.deleteFlashcard()}
                                                    >
                                                        <Trash2 className="h-5 w-5" />
                                                    </button>
                                                </div>

                                                {/* Back Middle Content */}
                                                <div className="my-auto space-y-3 text-left py-2">
                                                    {/* Meaning */}
                                                    {card.word_vi && (
                                                        <div>
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                                                                {userProfileTexts.vietnameseMeaning()}
                                                            </span>
                                                            <p className="text-lg sm:text-xl font-bold text-emerald-400">
                                                                {card.word_vi}
                                                            </p>
                                                        </div>
                                                    )}

                                                    {/* Workplace Example */}
                                                    {card.workspace_example && (
                                                        <div className="rounded-xl bg-white/10 p-3 border border-white/10 text-xs text-slate-200">
                                                            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-indigo-300 mb-1">
                                                                <span>
                                                                    {userProfileTexts.workplaceExample()}
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) =>
                                                                        handleSpeak(
                                                                            card.workspace_example!,
                                                                            e,
                                                                        )
                                                                    }
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
                            })}
                            </div>

                            {/* Pagination Controls Footer */}
                            {totalPages > 0 && filteredCards.length > 0 && (
                                <div className="mt-12 mb-6 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
                                    {/* Previous Page Button */}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (currentPage > 1) {
                                                setCurrentPage((p) => p - 1);
                                                window.scrollTo({ top: 200, behavior: "smooth" });
                                            }
                                        }}
                                        disabled={currentPage <= 1}
                                        className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-500 hover:border-slate-400 hover:text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs"
                                        aria-label="Previous page"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>

                                    {/* Page Number Buttons */}
                                    {paginationItems.map((item, i) =>
                                        item === "..." ? (
                                            <span
                                                key={`ellipsis-${i}`}
                                                className="flex h-9 min-w-9 sm:h-10 sm:min-w-10 px-2 items-center justify-center rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-400 select-none shadow-2xs"
                                            >
                                                ...
                                            </span>
                                        ) : (
                                            <button
                                                key={item}
                                                type="button"
                                                onClick={() => {
                                                    setCurrentPage(item);
                                                    window.scrollTo({ top: 200, behavior: "smooth" });
                                                }}
                                                className={`flex h-9 min-w-9 sm:h-10 sm:min-w-10 px-2.5 sm:px-3 items-center justify-center rounded-lg border text-sm font-semibold transition-colors shadow-2xs ${
                                                    item === currentPage
                                                        ? "border-blue-600 text-blue-600 bg-white font-bold ring-1 ring-blue-600/20"
                                                        : "border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-900"
                                                }`}
                                            >
                                                {item}
                                            </button>
                                        ),
                                    )}

                                    {/* Next Page Button */}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (currentPage < totalPages) {
                                                setCurrentPage((p) => p + 1);
                                                window.scrollTo({ top: 200, behavior: "smooth" });
                                            }
                                        }}
                                        disabled={currentPage >= totalPages}
                                        className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-500 hover:border-slate-400 hover:text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs"
                                        aria-label="Next page"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Focused Practice Deck Modal (available for sequential drill practice) */}
            <UserFlashcardsDialog
                open={practiceModalOpen}
                onOpenChange={setPracticeModalOpen}
                onCountChange={(count) => {
                    if (count !== cards.length) {
                        void loadFlashcards();
                    }
                }}
            />
        </div>
    );
}
