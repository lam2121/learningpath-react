import { useCallback, useEffect, useState, type MouseEvent } from "react";
import { Mic, RotateCcw, Volume2 } from "lucide-react";
import { Badge } from "@/shadcn/component/ui/badge";
import { RubyText } from "@/common/component/RubyText";
import { deleteFlashcard, fetchFlashcards, saveFlashcard } from "@/feature/lesson-workspace/api/flashcardApi";
import { usePronunciationRecorder } from "@/feature/audio/usePronunciationRecorder";
import { PronunciationFeedbackDialog, PronunciationPractice } from "../audio";
import type { PronunciationResponse } from "@/feature/audio/audioApi";
import { renderInlineTokens } from "../../util/documentTokenUtils";
import { useLessonLanguage } from "../../context/LessonLanguageContext";
import type { ParsedTheorySection } from "../../type/lessonWorkspace";
import {
    getSectionEyebrowNumber,
    getSectionTitle,
    localizeField,
    renderBilingualNote,
} from "../../util/lessonFormatters";
import { AudioSpeakButton, PanelShell } from "../shared";
import { VocabularyHeartButton } from "./VocabularyHeartButton";

const VOCAB_TEXTS = {
    nuance: { en: "Nuance & Context: ", vi: "Sắc thái & Ngữ cảnh: ", ja: "ニュアンスとコンテキスト: " },
    workplaceExample: { en: "Workplace Example", vi: "Ví dụ nơi làm việc", ja: "職場での使用例" },
    readSentence: { en: "Read sentence", vi: "Nghe câu ví dụ", ja: "例文を聞く" },
    clickToPractise: { en: "Click the card to practise saying it", vi: "Nhấp vào thẻ để luyện phát âm", ja: "カードをクリックして発音練習" },
    sayAloudDesc: {
        en: "Say the word aloud, then get sound-by-sound feedback on how you said it.",
        vi: "Nói to từ này, sau đó nhận phản hồi chi tiết về cách bạn phát âm.",
        ja: "単語を声に出して発音し、発音フィードバックを確認してください。",
    },
    clickToFlipBack: { en: "Click the card to flip back", vi: "Nhấp vào thẻ để lật lại", ja: "カードをクリックして戻る" },
    speakingDrillsEyebrow: { en: "Speaking & Pronunciation Drills", vi: "Luyện Nói & Phát Âm", ja: "スピーキング＆発音ドリル" },
    speakingDrillsTitle: {
        en: "Pronunciation Tips & Spoken Repetition (Shadowing)",
        vi: "Mẹo phát âm & Luyện nói lặp lại (Shadowing)",
        ja: "発音のヒントとシャドーイング練習",
    },
    phoneticGuidance: { en: "Phonetic Guidance: ", vi: "Hướng dẫn phiên âm: ", ja: "音声ガイダンス: " },
    readAloudPractice: { en: "Read aloud practice:", vi: "Luyện đọc to:", ja: "音読の練習:" },
};

export function VocabularySection({ section }: { section: ParsedTheorySection }) {
    const { language, showFurigana } = useLessonLanguage();
    const rawItems = Array.isArray(section.raw?.items) ? section.raw.items : [];
    const items = rawItems.map((item: any, index: number) => {
        const termEn =
            (typeof item.term === "object" ? item.term?.en || item.term_display : item.term) ||
            item.term_display ||
            item.word ||
            "";
        const termVi =
            (typeof item.term === "object" ? item.term?.vi : "") ||
            item.vn_meaning ||
            item.term_vi ||
            item.vi ||
            "";
        const termJa =
            (typeof item.term === "object" ? item.term?.ja : "") ||
            item.ja_meaning ||
            item.term_ja ||
            item.ja ||
            (item.reading && item.reading !== termEn ? item.reading : "") ||
            "";
        const reading = item.reading || "";

        const meaning = language === "ja"
            ? termJa
            : language === "vi"
                ? termVi
                : "";

        const explanationEn = typeof item.explanation === "object" ? item.explanation.en || "" : item.explanation || "";
        const explanationLocalized = language !== "en" ? localizeField(item.explanation, language) : null;
        const exampleEn = typeof item.example === "object" ? item.example.en || "" : item.example || "";
        const exampleLocalized = localizeField(item.example, language);
        const exampleTranslation = (language !== "en" && exampleLocalized && exampleLocalized !== exampleEn) ? exampleLocalized : null;

        return {
            id: `${index}-${termEn}`,
            term: termEn,
            termVi,
            termJa,
            reading,
            ipa: item.ipa || "",
            partOfSpeech: item.pos || "",
            meaning,
            explanationEn,
            explanationLocalized: (explanationLocalized && explanationLocalized !== explanationEn) ? explanationLocalized : null,
            example: exampleEn || exampleLocalized,
            exampleTranslation,
            pronunciationGuide: item.pronunciation_guide || "",
        };
    });

    // Flashcard state: word_eng -> saved row id. Loaded once so hearts render
    // filled for words this user has already saved (user_flashcard table).
    const [savedFlashcardIds, setSavedFlashcardIds] = useState<Record<string, number>>({});
    const [pendingWords, setPendingWords] = useState<Record<string, boolean>>({});
    const [flashcardError, setFlashcardError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        void (async () => {
            try {
                const cards = await fetchFlashcards();
                if (cancelled) return;
                setSavedFlashcardIds(
                    Object.fromEntries(cards.map((card) => [card.word_eng, card.id])),
                );
            } catch {
                // Khong chan viec hoc: neu khong tai duoc thi tim de trong.
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const toggleFlashcard = useCallback(
        async (item: {
            term: string;
            termVi?: string;
            termJa?: string;
            ipa: string;
            meaning: string;
            explanationEn?: string;
            explanationLocalized?: string | null;
            example?: string;
        }) => {
            // Cat theo dung gioi han cot cua user_flashcard de tranh loi 422.
            const word = item.term.trim().slice(0, 45);
            if (!word || pendingWords[word]) return;

            setPendingWords((prev) => ({ ...prev, [word]: true }));
            setFlashcardError(null);

            const savedId = savedFlashcardIds[word];
            try {
                if (savedId != null) {
                    await deleteFlashcard(savedId);
                    setSavedFlashcardIds((prev) => {
                        const next = { ...prev };
                        delete next[word];
                        return next;
                    });
                } else {
                    const created = await saveFlashcard({
                        word_eng: word,
                        word_vi: (item.termVi || (language === "vi" ? item.meaning : "")).trim().slice(0, 50) || null,
                        word_ja: (item.termJa || (language === "ja" ? item.meaning : "")).trim().slice(0, 150) || null,
                        transcription: item.ipa.trim().slice(0, 45) || null,
                        context: (item.explanationEn || item.explanationLocalized || "").trim().slice(0, 500) || null,
                        workspace_example: (item.example || "").trim().slice(0, 500) || null,
                    });
                    setSavedFlashcardIds((prev) => ({ ...prev, [word]: created.id }));
                }
            } catch (error) {
                setFlashcardError(
                    error instanceof Error
                        ? error.message
                        : "Could not update your flashcards.",
                );
            } finally {
                setPendingWords((prev) => {
                    const next = { ...prev };
                    delete next[word];
                    return next;
                });
            }
        },
        [pendingWords, savedFlashcardIds, language],
    );

    // One microphone shared by every drill row in this section.
    const recorder = usePronunciationRecorder();

    // Individual flip state per word card, same pattern as the personal flashcard
    // grid in feature/user-profile/page/flashcards-page.tsx.
    const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});
    // A back face mounts on its first flip, so eight recorder subtrees are not built
    // up front and an untouched grid keeps the height it has today. Once mounted it
    // stays mounted, so a take and its feedback survive flipping back and forth.
    const [everFlipped, setEverFlipped] = useState<Record<string, boolean>>({});

    // State for the pronunciation feedback pop-up dialog.
    const [feedbackDialog, setFeedbackDialog] = useState<{
        item: typeof items[number];
        result: PronunciationResponse;
        audioUrl?: string;
    } | null>(null);

    const handleToggleFlip = (cardId: string, e: MouseEvent) => {
        // Clicks on the heart, the Listen / Record buttons or the playback scrubber
        // belong to those controls, not to the card.
        const target = e.target as HTMLElement;
        if (
            target.closest("button") ||
            target.closest("a") ||
            target.closest("input") ||
            target.closest("audio")
        ) {
            return;
        }

        setEverFlipped((prev) => ({ ...prev, [cardId]: true }));
        setFlippedCards((prev) => ({ ...prev, [cardId]: !prev[cardId] }));
    };

    // Parse pronunciation tips and spoken drills
    const pronunciationGuideText = section.raw?.pronunciation_guide || "";
    const drillSentences = Array.isArray(section.raw?.drills)
        ? section.raw.drills
        : [];

    return (
        <PanelShell
            eyebrow={getSectionEyebrowNumber(2, language)}
            title={getSectionTitle("vocab", language)}
            note={renderBilingualNote(section.raw?.teacher_note, section.note, language, showFurigana)}
        >
            {flashcardError && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
                    {flashcardError}
                </div>
            )}
            <div className="grid gap-5 md:grid-cols-2">
                {items.map((item: any) => {
                    const isFlipped = Boolean(flippedCards[item.id]);

                    return (
                        <article
                            key={item.id}
                            onClick={(e) => handleToggleFlip(item.id, e)}
                            className="group cursor-pointer select-none min-w-0"
                            style={{ perspective: "1000px" }}
                        >
                            {/* Both faces sit in the same grid cell, so the card is as
                                tall as the taller of the two and can grow when the
                                pronunciation feedback arrives on the back. */}
                            <div
                                className="grid h-full w-full min-w-0"
                                style={{
                                    transformStyle: "preserve-3d",
                                    transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                                    transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                                }}
                            >
                                {/* FRONT: the word with full trilingual support */}
                                <div
                                    inert={isFlipped}
                                    className="col-start-1 row-start-1 flex flex-col justify-between w-full min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 group-hover:border-blue-300 group-hover:shadow-[0_12px_28px_rgba(37,99,235,0.10)] dark:border-slate-800 dark:bg-slate-900 dark:group-hover:border-blue-700 dark:group-hover:shadow-[0_12px_28px_rgba(37,99,235,0.15)]"
                                    style={{
                                        backfaceVisibility: "hidden",
                                        WebkitBackfaceVisibility: "hidden",
                                    }}
                                >
                                    <div>
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div className="flex items-center gap-2.5">
                                                <h3 className="text-xl font-bold text-slate-950 dark:text-white">
                                                    {item.term}
                                                </h3>
                                                <AudioSpeakButton text={item.term} />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline">{item.partOfSpeech}</Badge>
                                                <VocabularyHeartButton
                                                    saved={savedFlashcardIds[item.term.trim().slice(0, 45)] != null}
                                                    pending={pendingWords[item.term.trim().slice(0, 45)] === true}
                                                    onToggle={() => void toggleFlashcard(item)}
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-1.5 space-y-1.5">
                                            <p className="text-sm font-medium text-blue-600 dark:text-blue-300">
                                                {item.ipa}
                                            </p>
                                            {item.pronunciationGuide && (
                                                <div className="w-fit max-w-full rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium leading-5 text-slate-800 dark:bg-slate-800/80 dark:text-slate-200 break-words whitespace-normal">
                                                    {item.pronunciationGuide}
                                                </div>
                                            )}
                                        </div>

                                        {language !== "en" && item.meaning && (
                                            <div className="mt-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 px-3.5 py-2 text-base font-semibold text-blue-950 dark:text-blue-100 border border-blue-100/60 dark:border-blue-900/40">
                                                {language === "ja" ? (
                                                    <RubyText
                                                        text={item.reading && !item.meaning.includes("|") ? `[${item.meaning}|${item.reading}]` : item.meaning}
                                                        showFurigana={showFurigana}
                                                    />
                                                ) : (
                                                    item.meaning
                                                )}
                                            </div>
                                        )}

                                        {item.explanationEn && (
                                            <div className="mt-3 text-sm leading-6 text-slate-800 dark:text-slate-200 space-y-1.5">
                                                <div>
                                                    <span className="font-bold text-slate-950 dark:text-white">
                                                        {VOCAB_TEXTS.nuance[language]}
                                                    </span>
                                                    {renderInlineTokens(item.explanationEn)}
                                                </div>
                                                {item.explanationLocalized && item.explanationLocalized !== item.explanationEn && (
                                                    <div className="text-sm font-medium text-slate-700 dark:text-slate-300 border-t border-slate-200/80 dark:border-slate-800 pt-1.5">
                                                        {language === "ja" ? (
                                                             <RubyText text={item.explanationLocalized} showFurigana={showFurigana} />
                                                        ) : (
                                                            renderInlineTokens(item.explanationLocalized)
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        {item.example && (
                                            <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/70 p-4 text-sm leading-6 text-slate-800 dark:border-blue-950 dark:bg-blue-950/20 dark:text-slate-200">
                                                <div className="mb-2 flex items-center justify-between">
                                                    <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                                                        {VOCAB_TEXTS.workplaceExample[language]}
                                                    </span>
                                                    <AudioSpeakButton
                                                        text={item.example}
                                                        label={VOCAB_TEXTS.readSentence[language]}
                                                    />
                                                </div>
                                                <p className="text-sm font-semibold italic text-slate-950 dark:text-white">"{item.example}"</p>
                                                {item.exampleTranslation && (
                                                    <div className="mt-2 border-t border-blue-200/60 pt-2 text-sm font-medium text-slate-700 dark:border-blue-900/40 dark:text-slate-300">
                                                        {language === "ja" ? (
                                                            <RubyText text={item.exampleTranslation} showFurigana={showFurigana} />
                                                        ) : (
                                                            item.exampleTranslation
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <p className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-slate-400 dark:text-slate-500">
                                            <Mic className="h-3 w-3" />
                                            {VOCAB_TEXTS.clickToPractise[language]}
                                        </p>
                                    </div>
                                </div>

                                {/* BACK: record yourself saying this word */}
                                <div
                                    inert={!isFlipped}
                                    className="col-start-1 row-start-1 flex flex-col w-full min-w-0 rounded-2xl border border-indigo-200 bg-indigo-50 p-5 shadow-sm dark:border-indigo-900 dark:bg-slate-900"
                                    style={{
                                        backfaceVisibility: "hidden",
                                        WebkitBackfaceVisibility: "hidden",
                                        transform: "rotateY(180deg)",
                                    }}
                                >
                                    {everFlipped[item.id] && (
                                        <>
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <div className="flex items-center gap-2.5">
                                                    <h3 className="text-xl font-bold text-slate-950 dark:text-white">
                                                        {item.term}
                                                    </h3>
                                                    <AudioSpeakButton text={item.term} />
                                                </div>
                                                <Badge variant="outline">{item.partOfSpeech}</Badge>
                                            </div>

                                            <div className="mt-1.5 space-y-1.5">
                                                <p className="text-sm font-medium text-blue-600 dark:text-blue-300">
                                                    {item.ipa}
                                                </p>
                                                {item.pronunciationGuide && (
                                                    <div className="w-fit max-w-full rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium leading-5 text-slate-800 border border-indigo-100/80 dark:bg-slate-800/80 dark:text-slate-200 dark:border-slate-800 break-words whitespace-normal">
                                                        {item.pronunciationGuide}
                                                    </div>
                                                )}
                                            </div>

                                            <p className="mt-3 text-xs leading-5 text-slate-600 dark:text-slate-300">
                                                {VOCAB_TEXTS.sayAloudDesc[language]}
                                            </p>

                                            {/* Scored against the term itself; the card's own
                                                IPA and guidance ride along so the coach can
                                                talk about this word's syllables and stress. */}
                                            <PronunciationPractice
                                                id={`vocab-${item.id}`}
                                                targetText={item.term}
                                                recorder={recorder}
                                                wordContext={{
                                                     term: item.term,
                                                     ipa: item.ipa,
                                                     pos: item.partOfSpeech,
                                                     vn_meaning: item.termVi || item.meaning || "",
                                                     pronunciation_guide: item.pronunciationGuide,
                                                     example: item.example,
                                                }}
                                                onViewDetails={() => {
                                                    const practiceId = `vocab-${item.id}`;
                                                    const result = recorder.results[practiceId];
                                                    if (result) {
                                                        setFeedbackDialog({
                                                            item,
                                                            result,
                                                            audioUrl: recorder.audioUrls[practiceId],
                                                        });
                                                    }
                                                }}
                                            />

                                            <p className="mt-auto flex items-center gap-1.5 pt-4 text-[11px] font-medium text-slate-400 dark:text-slate-500">
                                                <RotateCcw className="h-3 w-3" />
                                                {VOCAB_TEXTS.clickToFlipBack[language]}
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </article>
                    );
                })}
            </div>

            {/* Pronunciation Guide & Speaking Drills */}
            {section.secondary && (
                <div className="rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/60 p-6 dark:border-blue-900 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                            <Volume2 className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">
                                {VOCAB_TEXTS.speakingDrillsEyebrow[language]}
                            </p>
                            <h4 className="text-base font-bold text-slate-950 dark:text-white">
                                {VOCAB_TEXTS.speakingDrillsTitle[language]}
                            </h4>
                        </div>
                    </div>

                    {pronunciationGuideText && (
                        <div className="mt-4 rounded-2xl bg-white p-4 text-sm text-slate-700 shadow-sm dark:bg-slate-800/80 dark:text-slate-200">
                            <span className="font-semibold text-blue-700 dark:text-blue-300">
                                {VOCAB_TEXTS.phoneticGuidance[language]}
                            </span>
                            {pronunciationGuideText}
                        </div>
                    )}

                    {drillSentences.length > 0 && (
                        <div className="mt-4 space-y-2.5">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                {VOCAB_TEXTS.readAloudPractice[language]}
                            </p>
                            {drillSentences.map((drill: any, idx: number) => {
                                const drillTextEn = typeof drill === "object" ? drill.en || "" : String(drill || "");
                                const drillTextLocalized = language !== "en" ? localizeField(drill, language) : null;
                                const audioText = drillTextEn.replace(/^\w+\s*\d*\s*:\s*/i, "").replace(/^\d+\.\s*/, "").trim();
                                return (
                                    <div
                                        key={idx}
                                        className="rounded-2xl border border-slate-200 bg-white p-3.5 text-sm dark:border-slate-800 dark:bg-slate-950"
                                    >
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <div className="space-y-1">
                                                <p className="text-base font-semibold text-slate-950 dark:text-white">
                                                    {drillTextEn}
                                                </p>
                                                {drillTextLocalized && drillTextLocalized !== drillTextEn && (
                                                    <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                        {language === "ja" ? (
                                                            <RubyText text={drillTextLocalized} showFurigana={showFurigana} />
                                                        ) : (
                                                            drillTextLocalized
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <AudioSpeakButton
                                                text={audioText}
                                                label="Listen & Repeat"
                                            />
                                        </div>
                                        {/* Score against the same cleaned string the speak
                                            button uses, so a leading "1. " is not graded. */}
                                        <PronunciationPractice
                                            id={`drill-${idx}`}
                                            targetText={audioText}
                                            recorder={recorder}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* AI Pronunciation Feedback Dialog — rendered once at section level */}
            {feedbackDialog && (
                <PronunciationFeedbackDialog
                    open={true}
                    onOpenChange={(open) => {
                        if (!open) setFeedbackDialog(null);
                    }}
                    result={feedbackDialog.result}
                    item={{
                        term: feedbackDialog.item.term,
                        ipa: feedbackDialog.item.ipa,
                        partOfSpeech: feedbackDialog.item.partOfSpeech,
                        meaning: feedbackDialog.item.meaning || undefined,
                    }}
                    audioUrl={feedbackDialog.audioUrl}
                    onRecordAgain={() => {
                        const practiceId = `vocab-${feedbackDialog.item.id}`;
                        recorder.reset(practiceId);
                        setFeedbackDialog(null);
                    }}
                />
            )}
        </PanelShell>
    );
}
