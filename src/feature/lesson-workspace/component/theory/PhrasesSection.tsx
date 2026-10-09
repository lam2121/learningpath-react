import { useState } from "react";
import { NotebookPen, Sparkles } from "lucide-react";
import { Badge } from "@/shadcn/component/ui/badge";
import { RubyText } from "@/common/component/RubyText";
import { usePronunciationRecorder } from "@/feature/audio/usePronunciationRecorder";
import type { PronunciationResponse } from "@/feature/audio/audioApi";
import { PronunciationFeedbackDialog, PronunciationPractice } from "../audio";
import { renderInlineTokens } from "../../util/documentTokenUtils";
import { useLessonLanguage, type LessonLanguage } from "../../context/LessonLanguageContext";
import type { ParsedTheorySection } from "../../type/lessonWorkspace";
import {
    getSectionEyebrowNumber,
    getSectionTitle,
    localizeField,
    renderBilingualNote,
} from "../../util/lessonFormatters";
import { AudioSpeakButton, PanelShell } from "../shared";

export function buildLocalizedPhraseExample(item: any, lang: LessonLanguage): string | null {
    if (lang === "en" || !item) return null;

    let storedExample = item.example_translations?.[lang] || item[`example_${lang}`];
    if (typeof item.example === "object" && item.example?.[lang]) {
        storedExample = item.example[lang];
    }

    if (storedExample && typeof storedExample === "string") {
        // Defensively strip any legacy parentheses `(...)` from stored examples and merge cleanly
        const cleaned = storedExample.replace(/\s*\(([^)]+)\)\s*([?.!]*)$/, " $1$2").replace(/\s+/g, " ").trim();
        return cleaned;
    }

    const localizedMeaning = localizeField(item.meaning, lang);
    const localizedComp = typeof item.example_completion === "object"
        ? (item.example_completion[lang] || "")
        : "";

    if (localizedMeaning && localizedComp) {
        if (localizedMeaning.includes("{{completion}}")) {
            return localizedMeaning.replace("{{completion}}", localizedComp);
        }
        if (localizedMeaning.includes("{completion}")) {
            return localizedMeaning.replace("{completion}", localizedComp);
        }
        if (localizedMeaning.includes("...")) {
            return localizedMeaning.replace("...", localizedComp);
        }
        if (localizedMeaning.includes("…")) {
            return localizedMeaning.replace("…", localizedComp);
        }
        const cleanMeaning = localizedMeaning.replace(/[?.!。]+$/, "").trim();
        const punct = localizedMeaning.endsWith("?") ? "?" : (localizedMeaning.endsWith("。") ? "。" : (localizedMeaning.endsWith("!") ? "!" : "."));
        return `${cleanMeaning} ${localizedComp}${punct}`;
    }

    return null;
}

export function PhrasesSection({ section }: { section: ParsedTheorySection }) {
    const { language, showFurigana } = useLessonLanguage();
    const rawItems = Array.isArray(section.raw?.items) ? section.raw.items : [];
    const patterns = rawItems.map((item: any, index: number) => {
        const rawStem = typeof item.stem_template === "object" ? item.stem_template.en || "" : (typeof item.phrase === "object" ? item.phrase.en || "" : String(item.stem_template || item.phrase || ""));
        const cleanStem = rawStem.replace(/\{\{completion\}\}/g, "...");
        const exampleCompletion = typeof item.example_completion === "object" ? item.example_completion.en || "" : String(item.example_completion || "");
        const example = item.example || (exampleCompletion ? rawStem.replace(/\{\{completion\}\}/g, exampleCompletion) : "");
        const exampleTranslation = buildLocalizedPhraseExample(item, language);
        const rawMeaning = language !== "en" ? (localizeField(item.meaning, language) || item.vn_meaning || item.ja_meaning || "") : "";
        let meaning = rawMeaning;
        if (meaning && !meaning.includes("...") && !meaning.includes("…") && !meaning.includes("{{completion}}")) {
            if (meaning.endsWith("?")) {
                meaning = `${meaning.slice(0, -1).trim()} ...?`;
            } else if (meaning.endsWith("。")) {
                meaning = `${meaning.slice(0, -1).trim()} ...。`;
            } else {
                meaning = `${meaning.replace(/\.+$/, "").trim()} ...`;
            }
        }
        const usageEn = localizeField(item.when_to_use, "en") || item.usage || "";
        const usageLocalized = language !== "en" ? (localizeField(item.when_to_use, language) || item.usage || "") : null;
        return {
            id: item.id || `${index}-${cleanStem}`,
            frame: cleanStem,
            meaning,
            usageEn,
            usageLocalized: (usageLocalized && usageLocalized !== usageEn) ? usageLocalized : null,
            example,
            exampleTranslation,
        };
    });

    // One microphone shared by every phrase example in this section.
    const recorder = usePronunciationRecorder();

    // State for the pronunciation feedback pop-up dialog, same as Section 2.
    const [feedbackDialog, setFeedbackDialog] = useState<{
        pattern: typeof patterns[number];
        result: PronunciationResponse;
        audioUrl?: string;
    } | null>(null);

    const miniScenarios = Array.isArray(section.raw?.mini_scenarios)
        ? section.raw.mini_scenarios
        : [];

    return (
        <PanelShell
            eyebrow={getSectionEyebrowNumber(3, language)}
            title={getSectionTitle("phrases", language)}
            note={renderBilingualNote(section.raw?.teacher_note, section.note, language, showFurigana)}
        >
            <div className="space-y-4">
                {patterns.map((pattern: any) => (
                    <article
                        key={pattern.id}
                        className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:border-blue-300 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(37,99,235,0.10)] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-700 dark:hover:shadow-[0_12px_28px_rgba(37,99,235,0.15)]"
                    >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                                <NotebookPen className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                                <h3 className="text-lg font-bold text-slate-950 dark:text-white">
                                    {pattern.frame}
                                </h3>
                                <AudioSpeakButton text={pattern.frame} />
                            </div>
                            {language !== "en" && pattern.meaning && (
                                <Badge variant="secondary" className="text-sm font-semibold whitespace-normal break-words max-w-full text-left px-3 py-1">
                                    {language === "ja" ? (
                                        <RubyText text={pattern.meaning} showFurigana={showFurigana} />
                                    ) : (
                                        pattern.meaning
                                    )}
                                </Badge>
                            )}
                        </div>

                        {pattern.usageEn && (
                            <div className="mt-3 text-sm leading-6 text-slate-800 dark:text-slate-200 space-y-1.5">
                                <div>
                                    <span className="font-bold text-slate-950 dark:text-white">
                                        {language === "ja" ? "使用する場面: " : language === "vi" ? "Khi nào nên dùng: " : "When to use: "}
                                    </span>
                                    {renderInlineTokens(pattern.usageEn)}
                                </div>
                                {pattern.usageLocalized && pattern.usageLocalized !== pattern.usageEn && (
                                    <div className="text-sm font-medium text-slate-700 dark:text-slate-300 border-t border-slate-200/80 dark:border-slate-800 pt-1.5">
                                        {language === "ja" ? (
                                            <RubyText text={pattern.usageLocalized} showFurigana={showFurigana} />
                                        ) : (
                                            renderInlineTokens(pattern.usageLocalized)
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {pattern.example && (
                            <div className="mt-3 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700 dark:bg-slate-800/70 dark:text-slate-200">
                                <div className="mb-2 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                            {language === "ja" ? "職場での使用例" : language === "vi" ? "Ví dụ nơi làm việc" : "Workplace Example"}
                                        </span>
                                    </div>
                                    <AudioSpeakButton
                                        text={pattern.example}
                                        label={language === "ja" ? "例文を聞く" : language === "vi" ? "Nghe câu ví dụ" : "Read example"}
                                    />
                                </div>
                                <p className="text-base font-semibold italic text-slate-950 dark:text-white">"{pattern.example}"</p>
                                {pattern.exampleTranslation && pattern.exampleTranslation !== pattern.example && (
                                    <div className="mt-2.5 border-t border-slate-200/80 pt-2 text-sm font-medium text-slate-700 dark:border-slate-700/60 dark:text-slate-300">
                                        {language === "ja" ? (
                                            <RubyText text={pattern.exampleTranslation} showFurigana={showFurigana} />
                                        ) : (
                                            pattern.exampleTranslation
                                        )}
                                    </div>
                                )}
                                <PronunciationPractice
                                    id={`phrase-${pattern.id}`}
                                    targetText={pattern.example}
                                    recorder={recorder}
                                    onViewDetails={() => {
                                        const practiceId = `phrase-${pattern.id}`;
                                        const result = recorder.results[practiceId];
                                        if (result) {
                                            setFeedbackDialog({
                                                pattern,
                                                result,
                                                audioUrl: recorder.audioUrls[practiceId],
                                            });
                                        }
                                    }}
                                />
                            </div>
                        )}
                    </article>
                ))}
            </div>

            {/* Mini-Scenario Challenges */}
            {miniScenarios.length > 0 && (
                <div className="rounded-3xl border border-dashed border-blue-200 bg-blue-50/50 p-6 dark:border-blue-900 dark:bg-blue-950/20">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300 mb-4 flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4" />
                        Mini-Scenario Challenges
                    </p>
                    <div className="space-y-3">
                        {miniScenarios.map((sc: any, index: number) => {
                            const rawCtxEn = localizeField(sc.context, "en") || (typeof sc === "string" ? sc : "");
                            const cleanCtxEn = rawCtxEn
                                .replace(/^Scenario\s*\d+\s*:\s*/i, "")
                                .replace(/\s*->\s*Best phrase\s*:\s*.*$/i, "")
                                .trim();
                            const rawCtxLoc = language !== "en" ? localizeField(sc.context, language) : null;
                            const cleanCtxLoc = rawCtxLoc
                                ? rawCtxLoc
                                    .replace(/^Scenario\s*\d+\s*:\s*/i, "")
                                    .replace(/\s*->\s*Best phrase\s*:\s*.*$/i, "")
                                    .trim()
                                : null;
                            const bestPhrase = typeof sc === "object" ? (sc.best_phrase || "") : "";
                            return (
                                <div
                                    key={index}
                                    className="rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 space-y-1"
                                >
                                    <div className="mb-1 text-xs font-bold text-blue-600 dark:text-blue-400">
                                        Scenario {index + 1}
                                    </div>
                                    <div className="text-base font-semibold leading-relaxed text-slate-950 dark:text-white">
                                        {renderInlineTokens(cleanCtxEn)}
                                    </div>
                                    {cleanCtxLoc && cleanCtxLoc !== cleanCtxEn && (
                                        <div className="text-sm font-medium text-slate-700 dark:text-slate-300 border-t border-slate-200/80 dark:border-slate-800 pt-1.5">
                                            {language === "ja" ? (
                                                <RubyText text={cleanCtxLoc} showFurigana={showFurigana} />
                                            ) : (
                                                renderInlineTokens(cleanCtxLoc)
                                            )}
                                        </div>
                                    )}
                                    {bestPhrase && (
                                        <div className="mt-2.5 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 pt-1">
                                            <span className="font-bold text-slate-800 dark:text-slate-200">Target Phrase:</span>
                                            <code className="rounded bg-blue-50 px-2 py-0.5 text-sm font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                                {bestPhrase}
                                            </code>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
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
                        term: feedbackDialog.pattern.example,
                        meaning: feedbackDialog.pattern.exampleTranslation || undefined,
                    }}
                    audioUrl={feedbackDialog.audioUrl}
                    onRecordAgain={() => {
                        const practiceId = `phrase-${feedbackDialog.pattern.id}`;
                        recorder.reset(practiceId);
                        setFeedbackDialog(null);
                    }}
                />
            )}
        </PanelShell>
    );
}
