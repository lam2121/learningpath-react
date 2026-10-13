import { useEffect, useMemo, useRef, useState } from "react";
import { MessageSquareText, Mic, MicOff, Sparkles, Target, Users } from "lucide-react";
import { Button } from "@/shadcn/component/ui/button";
import { RubyText } from "@/common/component/RubyText";
import { evaluateAnswer } from "@/feature/learning-path/api/roadmapApi";
import { renderInlineTokens } from "../../util/documentTokenUtils";
import { useLessonLanguage } from "../../context/LessonLanguageContext";
import type { ParsedTheorySection } from "../../type/lessonWorkspace";
import {
    getSectionEyebrowNumber,
    getSectionTitle,
    localizeField,
    renderBilingualNote,
} from "../../util/lessonFormatters";
import { AudioSpeakButton, getDialogueVoiceForSpeaker } from "../shared/AudioSpeakButton";
import { PanelShell } from "../shared/PanelShell";

interface SpeakerTheme {
    border: string;
    borderL: string;
    borderR: string;
    bg: string;
    badgeBg: string;
    badgeText: string;
    avatarBg: string;
    avatarText: string;
    tagBg: string;
    tagText: string;
}

const SPEAKER_THEMES: SpeakerTheme[] = [
    // Speaker 0 (Blue / Primary)
    {
        border: "border-blue-200 dark:border-blue-900/60",
        borderL: "border-l-blue-600 dark:border-l-blue-500",
        borderR: "border-r-blue-600 dark:border-r-blue-500",
        bg: "bg-blue-50/40 dark:bg-blue-950/20",
        badgeBg: "bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300",
        badgeText: "text-blue-800 dark:text-blue-300",
        avatarBg: "bg-blue-600 text-white",
        avatarText: "text-white",
        tagBg: "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/50 dark:border-blue-900/60 dark:text-blue-300",
        tagText: "text-blue-700 dark:text-blue-300",
    },
    // Speaker 1 (Indigo / Purple)
    {
        border: "border-indigo-200 dark:border-indigo-900/60",
        borderL: "border-l-indigo-600 dark:border-l-indigo-500",
        borderR: "border-r-indigo-600 dark:border-r-indigo-500",
        bg: "bg-indigo-50/40 dark:bg-indigo-950/20",
        badgeBg: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300",
        badgeText: "text-indigo-800 dark:text-indigo-300",
        avatarBg: "bg-indigo-600 text-white",
        avatarText: "text-white",
        tagBg: "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/50 dark:border-indigo-900/60 dark:text-indigo-300",
        tagText: "text-indigo-700 dark:text-indigo-300",
    },
    // Speaker 2 (Emerald / Green)
    {
        border: "border-emerald-200 dark:border-emerald-900/60",
        borderL: "border-l-emerald-600 dark:border-l-emerald-500",
        borderR: "border-r-emerald-600 dark:border-r-emerald-500",
        bg: "bg-emerald-50/40 dark:bg-emerald-950/20",
        badgeBg: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300",
        badgeText: "text-emerald-800 dark:text-emerald-300",
        avatarBg: "bg-emerald-600 text-white",
        avatarText: "text-white",
        tagBg: "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/50 dark:border-emerald-900/60 dark:text-emerald-300",
        tagText: "text-emerald-700 dark:text-emerald-300",
    },
    // Speaker 3 (Amber / Orange)
    {
        border: "border-amber-200 dark:border-amber-900/60",
        borderL: "border-l-amber-500 dark:border-l-amber-500",
        borderR: "border-r-amber-500 dark:border-r-amber-500",
        bg: "bg-amber-50/40 dark:bg-amber-950/20",
        badgeBg: "bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-300",
        badgeText: "text-amber-900 dark:text-amber-300",
        avatarBg: "bg-amber-500 text-white",
        avatarText: "text-white",
        tagBg: "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/50 dark:border-amber-900/60 dark:text-amber-300",
        tagText: "text-amber-800 dark:text-amber-300",
    },
    // Speaker 4 (Rose / Red)
    {
        border: "border-rose-200 dark:border-rose-900/60",
        borderL: "border-l-rose-500 dark:border-l-rose-500",
        borderR: "border-r-rose-500 dark:border-r-rose-500",
        bg: "bg-rose-50/40 dark:bg-rose-950/20",
        badgeBg: "bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300",
        badgeText: "text-rose-800 dark:text-rose-300",
        avatarBg: "bg-rose-500 text-white",
        avatarText: "text-white",
        tagBg: "bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/50 dark:border-rose-900/60 dark:text-rose-300",
        tagText: "text-rose-700 dark:text-rose-300",
    },
];

function parseSpeaker(rawSpeaker: string) {
    const s = (rawSpeaker || "").trim();
    // Pattern 1: "Name (Role)" e.g. "Alex (QA Lead)"
    const parenMatch = s.match(/^(.+?)\s*\((.+?)\)$/);
    if (parenMatch) {
        return { name: parenMatch[1].trim(), role: parenMatch[2].trim() };
    }
    // Pattern 2: "Name - Role" e.g. "Sarah - Tech Lead"
    const dashMatch = s.match(/^(.+?)\s*[-–—]\s*(.+?)$/);
    if (dashMatch) {
        return { name: dashMatch[1].trim(), role: dashMatch[2].trim() };
    }
    // Pattern 3: "Name: Role" e.g. "David: DevOps Engineer"
    const colonMatch = s.match(/^(.+?)\s*:\s*(.+?)$/);
    if (colonMatch) {
        return { name: colonMatch[1].trim(), role: colonMatch[2].trim() };
    }
    // Single title/name
    return { name: s, role: null };
}

function getSpeakerInitials(speaker: string): string {
    const clean = speaker.replace(/[\(\)\[\]\-\:\,\.]/g, " ").trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "SP";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function DialogueSection({ section }: { section: ParsedTheorySection }) {
    const { language, showFurigana } = useLessonLanguage();
    const contextTextEn = localizeField(section.raw?.context, "en") || "";
    const contextTextLocalized = language !== "en" ? (localizeField(section.raw?.context, language) || "") : null;

    const cleanDialogueLine = (raw: string) => {
        return raw
            .replace(/\s*\.\.\.\s*\?/g, "?")
            .replace(/\s*…\s*\?/g, "?")
            .replace(/\s*\.\.\.\s*$/g, ".")
            .replace(/\s*…\s*$/g, ".")
            .replace(/\s*\.\.\.\s*/g, " ")
            .replace(/\s*…\s*/g, " ");
    };

    const lines: Array<{ id: string; speaker: string; text: string; textEn: string }> = Array.isArray(section.raw?.turns)
        ? section.raw.turns.map((t: any, idx: number) => {
            const rawLine = t[`line_${language}`] || localizeField(t.line, language);
            const rawLineEn = t.line_en || (typeof t.line === "object" ? t.line.en : t.line) || "";
            return {
                id: `${idx}-${t.speaker || "Speaker"}`,
                speaker: t.speaker || "",
                text: cleanDialogueLine(rawLine || rawLineEn || ""),
                textEn: cleanDialogueLine(rawLineEn || ""),
            };
        })
        : [];

    const uniqueSpeakers = useMemo(() => {
        const seen = new Set<string>();
        const list: string[] = [];
        lines.forEach((l) => {
            const s = (l.speaker || "Speaker").trim();
            if (!seen.has(s)) {
                seen.add(s);
                list.push(s);
            }
        });
        return list;
    }, [lines]);

    const speakerIndexMap = useMemo(() => {
        const map = new Map<string, number>();
        uniqueSpeakers.forEach((s, i) => map.set(s, i));
        return map;
    }, [uniqueSpeakers]);

    const highlights: Array<{ id: string; left: string; rightEn: string; rightLocalized: string | null }> = Array.isArray(section.raw?.key_phrases)
        ? section.raw.key_phrases.map((kp: any, idx: number) => ({
            id: `${idx}-${kp.phrase || ""}`,
            left: kp.phrase || "",
            rightEn: localizeField(kp.why_it_works, "en") || "",
            rightLocalized: language !== "en" ? (localizeField(kp.why_it_works, language) || "") : null,
        }))
        : [];

    const cleanSuggestedAnswer = (rawAnswer: string | null | undefined): string | null => {
        if (!rawAnswer) return null;
        let ans = rawAnswer.trim();
        const words = ans.split(/\s+/);
        for (let len = Math.min(12, Math.floor(words.length / 2)); len >= 3; len--) {
            const firstPhrase = words.slice(0, len).join(" ").toLowerCase();
            const secondPhrase = words.slice(len, len * 2).join(" ").toLowerCase();
            if (firstPhrase === secondPhrase) {
                ans = words.slice(len).join(" ");
                break;
            }
        }
        ans = ans.replace(/\?{2,}$/, "?").replace(/\.{2,}$/, ".");
        return ans;
    };

    const practiceTasks: Array<{ promptTextEn: string; promptTextLoc: string | null; suggestedAnswerEn: string | null; suggestedAnswerLoc: string | null }> = Array.isArray(section.raw?.practice_tasks)
        ? section.raw.practice_tasks.map((t: any) => {
            const rawPromptEn = localizeField(t.prompt, "en") || "";
            const promptTextEn = rawPromptEn
                .replace(/\s*,?\s*using\s+(?:key_phrases?|phrases?)\s*(?:\[\s*\d+\s*\])?\.?/gi, "")
                .trim();
            const rawPromptLoc = language !== "en" ? (localizeField(t.prompt, language) || "") : null;
            const promptTextLoc = rawPromptLoc
                ? rawPromptLoc.replace(/\s*,?\s*using\s+(?:key_phrases?|phrases?)\s*(?:\[\s*\d+\s*\])?\.?/gi, "").trim()
                : null;

            const rawAnsEn = typeof t.suggested_answer === "object"
                ? localizeField(t.suggested_answer, "en")
                : (t.suggested_answer_en || t.suggested_answer || "");
            const rawAnsLoc = language !== "en"
                ? (typeof t.suggested_answer === "object"
                    ? localizeField(t.suggested_answer, language)
                    : (t[`suggested_answer_${language}`] || (typeof t.suggested_completion === "object" ? localizeField(t.suggested_completion, language) : null)))
                : null;

            return {
                promptTextEn,
                promptTextLoc: (promptTextLoc && promptTextLoc !== promptTextEn) ? promptTextLoc : null,
                suggestedAnswerEn: cleanSuggestedAnswer(rawAnsEn),
                suggestedAnswerLoc: cleanSuggestedAnswer(rawAnsLoc),
            };
        })
        : [];

    const [userReplies, setUserReplies] = useState<Record<number, string>>({});
    const [revealedAnswers, setRevealedAnswers] = useState<Record<number, boolean>>({});
    const [listeningQuestionIndex, setListeningQuestionIndex] = useState<number | null>(null);
    const [aiFeedback, setAiFeedback] = useState<Record<number, string>>({});
    const [aiScore, setAiScore] = useState<Record<number, number | null>>({});
    const [isEvaluating, setIsEvaluating] = useState<Record<number, boolean>>({});
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Web SpeechRecognition API has no TS types
    const recognitionRef = useRef<any>(null);

    const handleEvaluate = async (index: number, promptText: string, suggestedAnswer: string) => {
        const userAnswer = userReplies[index]?.trim();
        if (!userAnswer) return;

        setIsEvaluating((prev) => ({ ...prev, [index]: true }));
        try {
            const res = await evaluateAnswer({
                section_type: "dialogue",
                context: contextTextEn,
                question: promptText,
                reference_answer: suggestedAnswer || "No reference answer provided.",
                user_answer: userAnswer,
            });
            setAiFeedback((prev) => ({ ...prev, [index]: res.feedback_summary }));
            let score = typeof res.score === "number" ? res.score : null;
            if (score === null && res.feedback_summary) {
                const match = res.feedback_summary.match(/Score:\s*(\d{1,3})/i);
                if (match) score = parseInt(match[1], 10);
            }
            setAiScore((prev) => ({ ...prev, [index]: score }));
        } catch (error) {
            console.error(error);
            alert("Failed to evaluate answer.");
        } finally {
            setIsEvaluating((prev) => ({ ...prev, [index]: false }));
        }
    };

    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    const toggleDictation = (index: number) => {
        if (listeningQuestionIndex === index) {
            recognitionRef.current?.stop();
            setListeningQuestionIndex(null);
            return;
        }

        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }

        /* eslint-disable @typescript-eslint/no-explicit-any -- Web SpeechRecognition API has no TS types */
        const SpeechRecognition =
            (window as any).SpeechRecognition ||
            (window as any).webkitSpeechRecognition;
        /* eslint-enable @typescript-eslint/no-explicit-any */

        if (!SpeechRecognition) {
            alert("Your browser does not support Speech Recognition.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = "en-US";
        recognition.continuous = true;
        recognition.interimResults = true;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Web SpeechRecognitionEvent has no TS types
        recognition.onresult = (event: any) => {
            let sessionTranscript = "";
            for (let i = 0; i < event.results.length; ++i) {
                sessionTranscript += event.results[i][0].transcript;
            }
            setUserReplies((prev) => ({
                ...prev,
                [index]: sessionTranscript,
            }));
        };

        recognition.onend = () => {
            setListeningQuestionIndex((prev) => (prev === index ? null : prev));
        };

        try {
            recognition.start();
            recognitionRef.current = recognition;
            setListeningQuestionIndex(index);
        } catch (error) {
            console.error("Speech recognition error:", error);
            setListeningQuestionIndex(null);
        }
    };
    return (
        <PanelShell
            eyebrow={getSectionEyebrowNumber(5, language)}
            title={getSectionTitle("dialogue", language)}
            note={renderBilingualNote(section.raw?.teacher_note, section.note, language, showFurigana)}
        >
            {/* Scenario Setting / Context Banner */}
            {contextTextEn && (
                <div className="rounded-2xl border border-blue-200 bg-blue-50/80 px-5 py-4 text-sm text-slate-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-slate-200 space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">
                        {language === "ja" ? "会話の設定と目標" : language === "vi" ? "Bối cảnh & Mục tiêu cuộc hội thoại" : "Conversation Setting & Objective"}
                    </p>
                    <div className="text-base font-semibold leading-relaxed text-slate-900 dark:text-white">
                        {contextTextEn}
                    </div>
                    {contextTextLocalized && contextTextLocalized !== contextTextEn && (
                        <div className="text-sm font-medium text-slate-700 dark:text-slate-300 border-t border-blue-200/60 dark:border-blue-900/40 pt-1.5">
                            {language === "ja" ? (
                                <RubyText text={contextTextLocalized} showFurigana={showFurigana} />
                            ) : (
                                contextTextLocalized
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Participants Bar (when 2 or more unique speakers) */}
            {uniqueSpeakers.length > 1 && (
                <div className="flex flex-wrap items-center gap-2.5 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mr-1">
                        <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span>
                            {language === "ja"
                                ? `参加者 (${uniqueSpeakers.length}名):`
                                : language === "vi"
                                    ? `Người tham gia (${uniqueSpeakers.length} người):`
                                    : `Participants (${uniqueSpeakers.length}):`}
                        </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {uniqueSpeakers.map((speaker) => {
                            const sIdx = speakerIndexMap.get(speaker) ?? 0;
                            const theme = SPEAKER_THEMES[sIdx % SPEAKER_THEMES.length];
                            const initials = getSpeakerInitials(speaker);
                            const { name, role } = parseSpeaker(speaker);
                            return (
                                <div
                                    key={speaker}
                                    className={`flex items-center gap-2 rounded-full border ${theme.tagBg} px-3 py-1 text-xs font-semibold`}
                                >
                                    <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${theme.avatarBg}`}>
                                        {initials}
                                    </span>
                                    <span>{name}</span>
                                    {role && (
                                        <span className="opacity-75 font-normal">({role})</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Dialogue Turns */}
            <div className="space-y-4">
                {lines.map((line, index) => {
                    const isRight = index % 2 !== 0;
                    const speakerName = (line.speaker || "Speaker").trim();
                    const speakerIndex = speakerIndexMap.get(speakerName) ?? (index % SPEAKER_THEMES.length);
                    const theme = SPEAKER_THEMES[speakerIndex % SPEAKER_THEMES.length];
                    const { name, role } = parseSpeaker(speakerName);
                    const initials = getSpeakerInitials(speakerName);
                    const speakerVoice = getDialogueVoiceForSpeaker(
                        speakerName,
                        speakerIndex
                    );

                    return (
                        <div
                            key={line.id}
                            className={[
                                "w-full sm:max-w-2xl overflow-hidden rounded-3xl border shadow-sm transition-all duration-200 hover:-translate-y-0.5",
                                isRight
                                    ? "ml-auto border-r-[6px]"
                                    : "mr-auto border-l-[6px]",
                                theme.border,
                                theme.bg,
                                isRight ? theme.borderR : theme.borderL,
                                "hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)]",
                            ].join(" ")}
                        >
                            {/* Header bar: Speaker identity & Role, separated with a bold crisp boundary line */}
                            <div className="flex items-center justify-between gap-3 border-b-2 border-slate-200/90 bg-white/85 px-5 py-3.5 backdrop-blur-xs dark:border-slate-700/80 dark:bg-slate-900/85">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-xs font-bold shadow-xs ${theme.avatarBg}`}>
                                        {initials}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-base font-bold text-slate-950 dark:text-white truncate">
                                                {name}
                                            </span>
                                            {role ? (
                                                <span className={`rounded-lg px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider border shadow-2xs ${theme.badgeBg}`}>
                                                    {role}
                                                </span>
                                            ) : (
                                                <span className={`rounded-lg px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider border shadow-2xs ${theme.badgeBg}`}>
                                                    {language === "ja"
                                                        ? `話者 ${speakerIndex + 1}`
                                                        : language === "vi"
                                                            ? `Người nói ${speakerIndex + 1}`
                                                            : `Speaker ${speakerIndex + 1}`}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <AudioSpeakButton
                                        text={line.textEn || line.text}
                                        voice={speakerVoice}
                                        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-750 shadow-2xs"
                                    />
                                </div>
                            </div>

                            {/* Content: Spoken dialogue clearly separated under the boundary */}
                            <div className="p-5 space-y-3">
                                <div className="text-base font-medium leading-relaxed text-slate-900 dark:text-slate-100 text-left">
                                    {renderInlineTokens(line.textEn || line.text)}
                                </div>

                                {language !== "en" && line.text && line.text !== line.textEn && (
                                    <div className="rounded-2xl border border-slate-200/80 bg-white/80 dark:border-slate-800 dark:bg-slate-900/80 p-3.5 text-sm font-medium text-slate-700 dark:text-slate-300 text-left">
                                        <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            {language === "ja" ? "日本語参考訳" : "Bản dịch tham khảo"}
                                        </div>
                                        {language === "ja" ? (
                                            <RubyText text={line.text} showFurigana={showFurigana} />
                                        ) : (
                                            renderInlineTokens(line.text)
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Key Strategic Phrases */}
            {highlights.length > 0 && (
                <div className="space-y-3 pt-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Key Strategic Phrases Used:
                    </p>
                    <div className="grid gap-4 md:grid-cols-2">
                        {highlights.map((highlight) => (
                            <article
                                key={highlight.id}
                                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:border-blue-300 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(37,99,235,0.10)] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-700 dark:hover:shadow-[0_12px_28px_rgba(37,99,235,0.15)]"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-base font-bold text-slate-950 dark:text-white">
                                        {highlight.left}
                                    </p>
                                    <AudioSpeakButton text={highlight.left} />
                                </div>
                                <div className="mt-2.5 text-sm leading-6 text-slate-800 dark:text-slate-200 space-y-1.5">
                                    <p className="font-medium">{highlight.rightEn}</p>
                                    {highlight.rightLocalized && highlight.rightLocalized !== highlight.rightEn && (
                                        <div className="text-sm font-medium text-slate-700 dark:text-slate-300 border-t border-slate-200/80 dark:border-slate-800 pt-1.5">
                                            {language === "ja" ? (
                                                <RubyText text={highlight.rightLocalized} showFurigana={showFurigana} />
                                            ) : (
                                                highlight.rightLocalized
                                            )}
                                        </div>
                                    )}
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            )}

            {/* Interactive Roleplay Practice Tasks */}
            {practiceTasks.length > 0 && (
                <div className="rounded-3xl border border-indigo-200 bg-indigo-50/40 p-6 dark:border-indigo-950 dark:bg-slate-900/60">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
                            <MessageSquareText className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">
                                {language === "ja" ? "ロールプレイ演習" : language === "vi" ? "Thực hành nhập vai tương tác" : "Interactive Roleplay Practice"}
                            </p>
                            <h4 className="text-base font-bold text-slate-950 dark:text-white">
                                {language === "ja" ? "会議シナリオでの返答練習" : language === "vi" ? "Luyện tập phản hồi tình huống cuộc họp" : "Practice Replying to Meeting Scenarios"}
                            </h4>
                        </div>
                    </div>

                    <div className="mt-5 space-y-4">
                        {practiceTasks.map((task, idx) => {
                            const isRevealed = Boolean(revealedAnswers[idx]);

                            return (
                                <div
                                    key={idx}
                                    className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950 shadow-sm"
                                >
                                    <div className="space-y-1.5">
                                        <div className="text-base font-bold text-slate-950 dark:text-white">{task.promptTextEn}</div>
                                        {task.promptTextLoc && (
                                            <div className="text-sm font-medium text-slate-700 dark:text-slate-300 border-t border-slate-200/80 dark:border-slate-800 pt-1.5">
                                                {language === "ja" ? (
                                                    <RubyText text={task.promptTextLoc} showFurigana={showFurigana} />
                                                ) : (
                                                    task.promptTextLoc
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <textarea
                                        value={userReplies[idx] ?? ""}
                                        onChange={(e) =>
                                            setUserReplies((prev) => ({
                                                ...prev,
                                                [idx]: e.target.value,
                                            }))
                                        }
                                        placeholder={
                                            language === "ja"
                                                ? "ここに返答を入力し、声に出して練習してください..."
                                                : language === "vi"
                                                    ? "Nhập câu trả lời của bạn vào đây và luyện nói to..."
                                                    : "Type your response here and practice speaking it out loud..."
                                        }
                                        className="mt-3 min-h-20 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                    />
                                    <div className="mt-2.5 flex justify-between items-center flex-wrap gap-2">
                                        <div>
                                            {(task.suggestedAnswerEn || task.suggestedAnswerLoc) && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        setRevealedAnswers((prev) => ({
                                                            ...prev,
                                                            [idx]: !prev[idx],
                                                        }))
                                                    }
                                                >
                                                    {isRevealed
                                                        ? language === "ja" ? "解答を非表示" : language === "vi" ? "Ẩn đáp án" : "Hide answer"
                                                        : language === "ja" ? "解答を表示" : language === "vi" ? "Xem đáp án" : "Show answer"}
                                                </Button>
                                            )}
                                        </div>
                                        <div className="flex gap-2 justify-end">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => toggleDictation(idx)}
                                                className={listeningQuestionIndex === idx ? "text-rose-500 hover:text-rose-600 hover:bg-rose-50" : ""}
                                            >
                                                {listeningQuestionIndex === idx ? (
                                                    <>
                                                        <MicOff className="mr-2 h-4 w-4 animate-pulse" />{" "}
                                                        {language === "ja" ? "音声入力を停止" : language === "vi" ? "Dừng đọc thoại" : "Stop Dictating"}
                                                    </>
                                                ) : (
                                                    <>
                                                        <Mic className="mr-2 h-4 w-4" />{" "}
                                                        {language === "ja" ? "音声入力" : language === "vi" ? "Đọc thoại" : "Dictate"}
                                                    </>
                                                )}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEvaluate(idx, task.promptTextEn, task.suggestedAnswerEn || "")}
                                                disabled={!userReplies[idx]?.trim() || isEvaluating[idx]}
                                            >
                                                {isEvaluating[idx] ? (
                                                    language === "ja" ? "採点中..." : language === "vi" ? "Đang đánh giá..." : "Evaluating..."
                                                ) : (
                                                    <>
                                                        <Sparkles className="mr-2 h-4 w-4 text-indigo-500" />{" "}
                                                        {language === "ja" ? "AI採点" : language === "vi" ? "Đánh giá" : "Evaluate"}
                                                    </>
                                                )}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setUserReplies((prev) => ({
                                                        ...prev,
                                                        [idx]: "",
                                                    }));
                                                    setAiFeedback((prev) => ({
                                                        ...prev,
                                                        [idx]: "",
                                                    }));
                                                    setAiScore((prev) => ({
                                                        ...prev,
                                                        [idx]: null,
                                                    }));
                                                }}
                                            >
                                                {language === "ja" ? "クリア" : language === "vi" ? "Xóa" : "Clear"}
                                            </Button>
                                            {userReplies[idx] && (
                                                <AudioSpeakButton
                                                    text={userReplies[idx]}
                                                    label={language === "ja" ? "自分の回答を聞く" : language === "vi" ? "Nghe lại câu trả lời" : "Listen to my response"}
                                                />
                                            )}
                                        </div>
                                    </div>

                                    {aiFeedback[idx] ? (
                                        <div className="mt-4 rounded-2xl bg-indigo-50/50 p-4 text-sm leading-6 text-indigo-900 border border-indigo-100 dark:bg-indigo-950/30 dark:border-indigo-900/50 dark:text-indigo-100 animate-in fade-in slide-in-from-top-2">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">
                                                    <Sparkles className="h-3.5 w-3.5" />{" "}
                                                    {language === "ja" ? "AIフィードバック" : language === "vi" ? "Nhận xét AI" : "AI Feedback"}
                                                </p>
                                                {aiScore[idx] !== null && aiScore[idx] !== undefined && (
                                                    <span
                                                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${aiScore[idx]! >= 80
                                                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                                                            : aiScore[idx]! >= 60
                                                                ? "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                                                                : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                                                            }`}
                                                    >
                                                        <Target className="h-3 w-3" />
                                                        {language === "ja" ? "スコア:" : language === "vi" ? "Điểm:" : "Score:"} {aiScore[idx]}/100
                                                    </span>
                                                )}
                                            </div>

                                            {aiScore[idx] !== null && aiScore[idx] !== undefined && (
                                                <div className="mt-3 flex items-center justify-between rounded-xl border border-indigo-100 bg-white/80 px-3.5 py-2 text-xs dark:border-indigo-900/40 dark:bg-slate-900/60">
                                                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                                                        {language === "ja" ? "模範解答との一致度" : language === "vi" ? "Độ khớp với đáp án mẫu" : "Match Score with Reference Answer"}
                                                    </span>
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="h-1.5 w-20 sm:w-28 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full transition-all duration-500 ${aiScore[idx]! >= 80
                                                                    ? "bg-emerald-500"
                                                                    : aiScore[idx]! >= 60
                                                                        ? "bg-blue-500"
                                                                        : "bg-amber-500"
                                                                    }`}
                                                                style={{ width: `${Math.min(100, Math.max(0, aiScore[idx]!))}%` }}
                                                            />
                                                        </div>
                                                        <span
                                                            className={`font-bold text-sm ${aiScore[idx]! >= 80
                                                                ? "text-emerald-600 dark:text-emerald-400"
                                                                : aiScore[idx]! >= 60
                                                                    ? "text-blue-600 dark:text-blue-400"
                                                                    : "text-amber-600 dark:text-amber-400"
                                                                }`}
                                                        >
                                                            {aiScore[idx]} / 100
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                            <p className="mt-2.5">{aiFeedback[idx]}</p>
                                        </div>
                                    ) : null}

                                    {isRevealed && (task.suggestedAnswerEn || task.suggestedAnswerLoc) && (
                                        <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm leading-6 text-slate-700 dark:bg-emerald-950/30 dark:text-slate-200 animate-in fade-in space-y-1">
                                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
                                                {language === "ja" ? "模範解答" : language === "vi" ? "Đáp án gợi ý" : "Suggested answer"}
                                            </p>
                                            {task.suggestedAnswerEn && (
                                                <div className="text-base font-bold text-slate-950 dark:text-white">
                                                    {task.suggestedAnswerEn}
                                                </div>
                                            )}
                                            {task.suggestedAnswerLoc && task.suggestedAnswerLoc !== task.suggestedAnswerEn && (
                                                <div className="text-sm font-medium text-emerald-900 dark:text-emerald-200 border-t border-emerald-200/60 dark:border-emerald-900/40 pt-1.5">
                                                    {language === "ja" ? (
                                                        <RubyText text={task.suggestedAnswerLoc} showFurigana={showFurigana} />
                                                    ) : (
                                                        task.suggestedAnswerLoc
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </PanelShell>
    );
}

