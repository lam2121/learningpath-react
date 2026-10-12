import {
    Brain,
    ArrowLeft,
    RotateCw,
    Sparkles,
    BookOpen,
    Search,
    Shuffle,
    Layers,
    Loader2,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
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
import { userProfileTexts } from "@/feature/user-profile/userProfileTexts";
import { UserFlashcardsDialog, FlashcardGridItem } from "../component";
import {
    getPaginationItems,
    getStudyModeFromLanguage,
    checkVietnameseMatch,
    checkJapaneseMatch,
    checkEnglishMatch,
} from "../utils/flashcardMatching";

const ITEMS_PER_PAGE = 12;

export function FlashcardsPage() {
    const { t, i18n } = useTranslation("profile");

    const [cards, setCards] = useState<Flashcard[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Study mode directly follows the language selected on the Main Navigation Menu
    const studyMode: "vi" | "ja" | "en" = getStudyModeFromLanguage(i18n.language);
    // Revealed hints in EN mode: card.id -> boolean
    const [revealedHints, setRevealedHints] = useState<Record<number, boolean>>({});

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

    // Reset inputs, results, hints, and flip states whenever i18n language changes on Main Navigation, and fetch cards
    useEffect(() => {
        recognitionRef.current?.stop();
        setListeningCardId(null);
        setSpeechError(null);
        setUserInputs({});
        setSubmissionResults({});
        setFlippedCards({});
        setRevealedHints({});
        void loadFlashcards();

        const handleLanguageChange = () => {
            void loadFlashcards();
        };
        window.addEventListener("careerpath:language-changed", handleLanguageChange);
        return () => {
            window.removeEventListener("careerpath:language-changed", handleLanguageChange);
        };
    }, [i18n.language, loadFlashcards]);

    // Stop any running recognition when the page unmounts
    useEffect(() => {
        return () => {
            recognitionRef.current?.stop();
        };
    }, []);

    const handleSubmitAnswer = (cardId: number, card: Flashcard) => {
        const input = userInputs[cardId]?.trim() ?? "";
        if (!input) return;

        if (listeningCardId === cardId) {
            recognitionRef.current?.stop();
            setListeningCardId(null);
        }

        let isCorrect = false;
        if (studyMode === "vi") {
            isCorrect = checkVietnameseMatch(input, card.word_vi || "");
        } else if (studyMode === "ja") {
            isCorrect = checkJapaneseMatch(input, card.word_ja || "");
        } else {
            isCorrect = checkEnglishMatch(input, card.word_eng);
        }

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

    // Speech-to-text for quiz input (dynamic language based on studyMode)
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
        recognition.lang =
            studyMode === "ja" ? "ja-JP" : studyMode === "en" ? "en-US" : "vi-VN";
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
        } catch (recognitionError) {
            console.error("Speech recognition error:", recognitionError);
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
                (c.word_ja && c.word_ja.toLowerCase().includes(query)) ||
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
        <div className="min-h-screen w-full bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.08),_transparent_28%),linear-gradient(180deg,_#fbfdff_0%,_#f4f7fe_100%)]">
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

                        {/* Top Action & Stat Pill (Mobile compact grid) */}
                        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5 w-full sm:w-auto">
                            {!isLoading && cards.length > 0 && (
                                <div className="flex items-center gap-2.5 rounded-2xl bg-white/95 p-3 sm:px-4 sm:py-3 shadow-xs ring-1 ring-indigo-100">
                                    <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 font-bold shrink-0">
                                        <Brain className="h-4 w-4 sm:h-5 sm:w-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
                                            {userProfileTexts.totalDeck()}
                                        </p>
                                        <p className="text-sm sm:text-lg font-black text-slate-900 truncate">
                                            {cards.length} {userProfileTexts.flashcards()}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {!isLoading && Object.keys(submissionResults).length > 0 && (
                                <div className="flex items-center gap-2.5 rounded-2xl bg-white/95 p-3 sm:px-4 sm:py-3 shadow-xs ring-1 ring-emerald-100">
                                    <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 font-bold shrink-0">
                                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
                                            {userProfileTexts.quizScore()}
                                        </p>
                                        <p className="text-sm sm:text-lg font-black text-emerald-600 truncate">
                                            {Object.values(submissionResults).filter((r) => r.isCorrect).length} / {Object.keys(submissionResults).length}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {cards.length > 0 && (
                                <Button
                                    onClick={() => setPracticeModalOpen(true)}
                                    className="col-span-2 sm:col-span-1 h-11 gap-2 rounded-2xl bg-indigo-600 px-5 font-bold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-all w-full sm:w-auto"
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

                        {/* Controls: Shuffle, Flip All (Full-width side-by-side on mobile) */}
                        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center w-full sm:w-auto">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleShuffle}
                                className="h-11 px-3 sm:px-4 gap-1.5 rounded-2xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-semibold shadow-2xs w-full sm:w-auto justify-center"
                                title={userProfileTexts.shuffleCards()}
                            >
                                <Shuffle className="h-4 w-4 text-slate-500 shrink-0" />
                                <span className="truncate">{userProfileTexts.shuffleCards()}</span>
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleFlipAll}
                                className="h-11 px-3 sm:px-4 gap-1.5 rounded-2xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-semibold shadow-2xs w-full sm:w-auto justify-center"
                                title={userProfileTexts.flipCard()}
                            >
                                <RotateCw className="h-4 w-4 text-slate-500 shrink-0" />
                                <span className="truncate">{userProfileTexts.flipCardAll()}</span>
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
                                {userProfileTexts.tryAgain()}
                            </Button>
                        </div>
                    ) : cards.length === 0 ? (
                        /* Empty State */
                        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white/70 py-20 px-6 text-center shadow-2xs">
                            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600 ring-8 ring-indigo-50/50 mb-5 shadow-inner">
                                <Sparkles className="h-10 w-10" />
                            </div>
                            <h3 className="text-center text-2xl font-bold text-slate-900">
                                {userProfileTexts.noFlashcardsTitle()}
                            </h3>
                            <p className="mt-2 text-center max-w-md text-base leading-relaxed text-slate-600">
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

                                    return (
                                        <FlashcardGridItem
                                            key={card.id}
                                            card={card}
                                            cardIndex={cardIndex}
                                            studyMode={studyMode}
                                            isFlipped={isFlipped}
                                            onToggleFlip={handleToggleFlip}
                                            onDelete={handleDelete}
                                            result={result}
                                            userInput={userInputs[card.id] || ""}
                                            onUserInputChange={(cardId, val) =>
                                                setUserInputs((prev) => ({ ...prev, [cardId]: val }))
                                            }
                                            onSubmitAnswer={handleSubmitAnswer}
                                            onResetAnswer={handleResetAnswer}
                                            onShowAnswer={handleShowAnswer}
                                            isListening={isListening}
                                            cardSpeechError={cardSpeechError}
                                            onToggleDictation={toggleDictation}
                                            speakingText={speakingText}
                                            onSpeak={handleSpeak}
                                            revealedHint={Boolean(revealedHints[card.id])}
                                            onToggleHint={(cardId) =>
                                                setRevealedHints((prev) => ({
                                                    ...prev,
                                                    [cardId]: !prev[cardId],
                                                }))
                                            }
                                        />
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
                                        aria-label={t("previousPage", { defaultValue: "Previous page" })}
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
                                        aria-label={t("nextPage", { defaultValue: "Next page" })}
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
