import { useMemo, useState } from "react";
import { Check, Copy, FileText, Languages, Target } from "lucide-react";
import { RubyText } from "@/common/component/RubyText";
import { useLessonLanguage } from "../../context/LessonLanguageContext";
import { renderInlineTokens } from "../../util/documentTokenUtils";
import { AudioSpeakButton } from "../shared/AudioSpeakButton";
import { PanelShell } from "../shared/PanelShell";
import type { ParsedTheorySection } from "../../type/lessonWorkspace";
import {
    formatScenarioParagraphs,
    getSectionEyebrowNumber,
    getSectionTitle,
    localizeField,
    renderBilingualNote,
} from "../../util/lessonFormatters";

export function ScenarioSection({ section }: { section: ParsedTheorySection }) {
    const { language, showFurigana } = useLessonLanguage();
    const raw = section.raw || {};
    const english = raw.en || raw.english_text || "";
    const vietnamese = raw.vi || raw.vietnamese_text || "";
    const japanese = raw.ja || raw.japanese_text || "";
    const decisions = Array.isArray(raw.decisions) ? raw.decisions : [];

    const isJa = language === "ja" && Boolean(japanese);
    const isVi = language === "vi" && Boolean(vietnamese);

    const primaryText = english || (isJa ? japanese : isVi ? vietnamese : "");
    const secondaryText = isJa ? japanese : isVi ? vietnamese : null;
    const primaryLabel = language === "ja" ? "英語シナリオ" : language === "vi" ? "Tình huống tiếng Anh" : "English scenario";
    const secondaryLabel = isJa ? "日本語シナリオ (Japanese reference)" : isVi ? "Kịch bản tiếng Việt" : "";

    const primaryParagraphs = useMemo(() => formatScenarioParagraphs(primaryText), [primaryText]);
    const secondaryParagraphs = useMemo(() => formatScenarioParagraphs(secondaryText || ""), [secondaryText]);

    const [copied, setCopied] = useState(false);
    const [copiedSecondary, setCopiedSecondary] = useState(false);

    const handleCopy = () => {
        if (!primaryText) return;
        navigator.clipboard.writeText(primaryText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleCopySecondary = () => {
        if (!secondaryText) return;
        navigator.clipboard.writeText(secondaryText);
        setCopiedSecondary(true);
        setTimeout(() => setCopiedSecondary(false), 2000);
    };

    return (
        <PanelShell
            eyebrow={getSectionEyebrowNumber(1, language)}
            title={getSectionTitle("scenario", language)}
            note={renderBilingualNote(section.raw?.teacher_note, section.note, language, showFurigana)}
        >
            <div className={`grid gap-5 ${secondaryText ? "lg:grid-cols-2" : "grid-cols-1"}`}>
                {/* Primary Scenario Card */}
                <article className="flex flex-col justify-between overflow-hidden rounded-3xl border border-blue-200 bg-blue-50/70 p-6 shadow-sm transition-all duration-200 hover:border-blue-300 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(37,99,235,0.10)] dark:border-blue-900 dark:bg-blue-950/30">
                    <div>
                        <div className="flex items-center justify-between border-b border-blue-200/80 pb-3.5 dark:border-blue-900/60">
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                                    <FileText className="h-4 w-4" />
                                </div>
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">
                                    {primaryLabel}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleCopy}
                                    title="Copy text"
                                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200 bg-white text-slate-500 transition-colors hover:border-blue-300 hover:text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-white"
                                >
                                    {copied ? (
                                        <Check className="h-4 w-4 text-emerald-500" />
                                    ) : (
                                        <Copy className="h-4 w-4" />
                                    )}
                                </button>
                                <AudioSpeakButton text={primaryText} />
                            </div>
                        </div>

                        <div className="mt-4 space-y-3.5 text-base leading-7 text-slate-800 text-justify [text-align:justify] dark:text-slate-100">
                            {primaryParagraphs.map((para, idx) => (
                                <p key={idx} className="leading-relaxed text-justify [text-align:justify]">
                                    {renderInlineTokens(para)}
                                </p>
                            ))}
                        </div>
                    </div>
                </article>

                {/* Secondary Reference Card */}
                {secondaryText && (
                    <article className="flex flex-col justify-between overflow-hidden rounded-3xl border border-blue-200 bg-blue-50/70 p-6 shadow-sm transition-all duration-200 hover:border-blue-300 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(37,99,235,0.10)] dark:border-blue-900 dark:bg-blue-950/30">
                        <div>
                            <div className="flex items-center justify-between border-b border-blue-200/80 pb-3.5 dark:border-blue-900/60">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                                        <Languages className="h-4 w-4" />
                                    </div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">
                                        {secondaryLabel}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handleCopySecondary}
                                        title="Copy text"
                                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200 bg-white text-slate-500 transition-colors hover:border-blue-300 hover:text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-white"
                                    >
                                        {copiedSecondary ? (
                                            <Check className="h-4 w-4 text-emerald-500" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="mt-4 space-y-3.5 text-base leading-7 text-slate-800 dark:text-slate-100 text-justify [text-align:justify]">
                                {secondaryParagraphs.map((para, idx) => (
                                    <p key={idx} className="leading-relaxed text-justify [text-align:justify]">
                                        {isJa ? (
                                            <RubyText text={para} showFurigana={showFurigana} />
                                        ) : (
                                            renderInlineTokens(para)
                                        )}
                                    </p>
                                ))}
                            </div>
                        </div>
                    </article>
                )}
            </div>

            {/* Decision Points to Resolve */}
            {decisions.length > 0 && (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                            <Target className="h-4 w-4" />
                        </div>
                        <div className="space-y-1.5 flex-1">
                            <div>
                                <h4 className="text-base font-bold text-slate-950 dark:text-white">
                                    Decision Points to Resolve
                                </h4>
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                    Key strategic trade-offs and actions identified in this scenario
                                </p>
                            </div>

                            {language !== "en" && (
                                <div className="border-t border-slate-200/60 pt-1.5 dark:border-slate-800">
                                    <h5 className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                                        {language === "ja"
                                            ? "解決すべき決定事項"
                                            : "Các điểm quyết định cần giải quyết"}
                                    </h5>
                                    <p className="text-xs font-normal text-slate-500 dark:text-slate-400">
                                        {language === "ja"
                                            ? "このシナリオで特定された重要な戦略的トレードオフとアクション"
                                            : "Các đánh đổi chiến lược và hành động cốt lõi được xác định trong tình huống này"}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-5 grid gap-3.5">
                        {decisions.map((decision: any, index: number) => {
                            const decTextEn = localizeField(decision, "en");
                            const decTextLocalized = language !== "en" ? localizeField(decision, language) : null;
                            return (
                                <div
                                    key={`${index}-${decTextEn}`}
                                    className="flex items-start gap-3.5 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-sm leading-6 text-slate-700 transition-all duration-200 hover:border-blue-200 hover:bg-blue-50/40 dark:border-slate-800/80 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:border-blue-800"
                                >
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white shadow-sm">
                                        {index + 1}
                                    </span>
                                    <div className="mt-0.5 leading-relaxed text-justify [text-align:justify] space-y-1 flex-1">
                                        <div className="text-base font-semibold text-slate-950 dark:text-white">
                                            {renderInlineTokens(decTextEn)}
                                        </div>
                                        {decTextLocalized && decTextLocalized !== decTextEn && (
                                            <div className="text-sm font-medium text-slate-700 dark:text-slate-300 border-t border-slate-200/60 dark:border-slate-700/60 pt-1">
                                                {isJa ? (
                                                    <RubyText text={decTextLocalized} showFurigana={showFurigana} />
                                                ) : (
                                                    renderInlineTokens(decTextLocalized)
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </PanelShell>
    );
}
