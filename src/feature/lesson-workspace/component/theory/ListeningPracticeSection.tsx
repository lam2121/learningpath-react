import { useEffect, useMemo, useRef, useState } from "react";
import { ListChecks, Mic, MicOff, Sparkles, Target } from "lucide-react";
import { Button } from "@/shadcn/component/ui/button";
import { RubyText } from "@/common/component/RubyText";
import { evaluateAnswer } from "@/feature/learning-path/api/roadmapApi";
import { ListeningAudioPlayer } from "../audio";
import { useLessonLanguage } from "../../context/LessonLanguageContext";
import type { ParsedTheorySection } from "../../type/lessonWorkspace";
import {
    getSectionEyebrowNumber,
    getSectionTitle,
    localizeField,
    renderBilingualNote,
} from "../../util/lessonFormatters";
import { PanelShell } from "../shared";

export function ListeningPracticeSection({
    section,
}: {
    section: ParsedTheorySection;
}) {
    const { language, showFurigana } = useLessonLanguage();
    const [draftAnswers, setDraftAnswers] = useState<Record<number, string>>({});
    const [revealedAnswers, setRevealedAnswers] = useState<Record<number, boolean>>({});
    const [listeningQuestionIndex, setListeningQuestionIndex] = useState<number | null>(null);
    const [aiFeedback, setAiFeedback] = useState<Record<number, string>>({});
    const [aiScore, setAiScore] = useState<Record<number, number | null>>({});
    const [isEvaluating, setIsEvaluating] = useState<Record<number, boolean>>({});
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Web SpeechRecognition API has no TS types
    const recognitionRef = useRef<any>(null);

    const scriptEn = typeof section.raw?.script === "object"
        ? section.raw?.script?.en || ""
        : String(section.raw?.script || "");
    const localizedScript = localizeField(section.raw?.script, language);
    const scriptText = scriptEn
        .replace(/^Audio\s*Script\s*:\s*/i, "")
        .replace(/^\[.*?\]\s*:\s*/i, "")
        .replace(/^["']|["']$/g, "")
        .trim();
    const localizedScriptClean = localizedScript
        .replace(/^Audio\s*Script\s*:\s*/i, "")
        .replace(/^\[.*?\]\s*:\s*/i, "")
        .replace(/^["']|["']$/g, "")
        .trim();

    const questions: Array<{
        questionEn: string;
        questionLocalized: string | null;
        answerEn: string;
        answerLocalized: string | null;
    }> = useMemo(() => {
        const rawQas = Array.isArray(section.raw?.qa) ? section.raw.qa : [];
        return rawQas.map((qa: any) => {
            const qEn = localizeField(qa.question, "en");
            const qLoc = language !== "en" ? localizeField(qa.question, language) : null;
            const aEn = localizeField(qa.answer, "en");
            const aLoc = language !== "en" ? localizeField(qa.answer, language) : null;
            return {
                questionEn: qEn,
                questionLocalized: qLoc && qLoc !== qEn ? qLoc : null,
                answerEn: aEn,
                answerLocalized: aLoc && aLoc !== aEn ? aLoc : null,
            };
        });
    }, [section.raw?.qa, language]);

    const handleEvaluate = async (index: number, question: string, referenceAnswer: string) => {
        const userAnswer = draftAnswers[index]?.trim();
        if (!userAnswer) return;

        setIsEvaluating((prev) => ({ ...prev, [index]: true }));
        try {
            const res = await evaluateAnswer({
                section_type: "listening",
                context: scriptText,
                question: question,
                reference_answer: referenceAnswer,
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
            setDraftAnswers((prev) => ({
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
            eyebrow={getSectionEyebrowNumber(6, language)}
            title={getSectionTitle("listening", language)}
            note={renderBilingualNote(section.raw?.teacher_note, section.note, language, showFurigana)}
        >
            {/* Rich Multi-Accent Neural Audio Player with Slower Speed Controls */}
            <ListeningAudioPlayer
                scriptText={scriptText}
                rawTranscript={
                    language !== "en" && localizedScriptClean && localizedScriptClean !== scriptText ? (
                        <div className="space-y-3">
                            <div className="text-slate-900 dark:text-white font-medium">
                                {scriptText}
                            </div>
                            <div className="border-t border-slate-200/80 dark:border-slate-800/80 pt-3 text-sm font-medium leading-relaxed text-slate-700 dark:text-slate-300">
                                <div className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                                    {language === "ja" ? "日本語参考訳" : "Bản dịch tham khảo"}
                                </div>
                                {language === "ja" ? (
                                    <RubyText text={localizedScriptClean} showFurigana={showFurigana} />
                                ) : (
                                    localizedScriptClean
                                )}
                            </div>
                        </div>
                    ) : undefined
                }
                title="Workplace Audio Track"
                subtitle="Authentic Spoken Workplace Monologue"
            />

            {/* Comprehension Questions */}
            <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 px-1">
                    <ListChecks className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                    <h4 className="font-semibold text-slate-950 dark:text-white">
                        {language === "ja" ? "リスニング理解度確認" : language === "vi" ? "Câu hỏi nghe hiểu" : "Listening Comprehension Questions"}
                    </h4>
                </div>

                {questions.map((qa, index: number) => {
                    const isRevealed = Boolean(revealedAnswers[index]);
                    const draft = draftAnswers[index] ?? "";

                    return (
                        <article
                            key={`${index}-${qa.questionEn}`}
                            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:border-blue-300 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(37,99,235,0.10)] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-700 dark:hover:shadow-[0_12px_28px_rgba(37,99,235,0.15)]"
                        >
                            <div className="space-y-1">
                                <div className="text-base font-bold text-slate-950 dark:text-white">
                                    {qa.questionEn}
                                </div>
                                {qa.questionLocalized && (
                                    <div className="text-sm font-medium text-slate-700 dark:text-slate-300 border-t border-slate-200/80 dark:border-slate-800 pt-1.5">
                                        {language === "ja" ? (
                                            <RubyText text={qa.questionLocalized} showFurigana={showFurigana} />
                                        ) : (
                                            qa.questionLocalized
                                        )}
                                    </div>
                                )}
                            </div>

                            <textarea
                                value={draft}
                                onChange={(e) =>
                                    setDraftAnswers((prev) => ({
                                        ...prev,
                                        [index]: e.target.value,
                                    }))
                                }
                                placeholder={
                                    language === "ja"
                                        ? "聞き取った内容または回答を入力してください..."
                                        : language === "vi"
                                            ? "Nhập nội dung bạn nghe được hoặc câu trả lời tại đây..."
                                            : "Write what you heard or answer here..."
                                }
                                className="mt-4 min-h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition-colors focus:border-blue-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-blue-700 dark:focus:bg-slate-900"
                            />

                            <div className="mt-4 flex flex-wrap gap-3">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        setRevealedAnswers((prev) => ({
                                            ...prev,
                                            [index]: !prev[index],
                                        }))
                                    }
                                >
                                    {isRevealed
                                        ? language === "ja" ? "解答を非表示" : language === "vi" ? "Ẩn đáp án" : "Hide answer"
                                        : language === "ja" ? "解答を表示" : language === "vi" ? "Xem đáp án" : "Show answer"}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleDictation(index)}
                                    className={listeningQuestionIndex === index ? "text-rose-500 hover:text-rose-600 hover:bg-rose-50" : ""}
                                >
                                    {listeningQuestionIndex === index ? (
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
                                    onClick={() => handleEvaluate(index, qa.questionEn, qa.answerEn)}
                                    disabled={!draft || isEvaluating[index]}
                                >
                                    {isEvaluating[index] ? (
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
                                        setDraftAnswers((prev) => ({
                                            ...prev,
                                            [index]: "",
                                        }));
                                        setAiFeedback((prev) => ({
                                            ...prev,
                                            [index]: "",
                                        }));
                                        setAiScore((prev) => ({
                                            ...prev,
                                            [index]: null,
                                        }));
                                    }}
                                >
                                    {language === "ja" ? "クリア" : language === "vi" ? "Xóa" : "Clear"}
                                </Button>
                            </div>

                            {aiFeedback[index] ? (
                                <div className="mt-4 rounded-2xl bg-indigo-50/50 p-4 text-sm leading-6 text-indigo-900 border border-indigo-100 dark:bg-indigo-950/30 dark:border-indigo-900/50 dark:text-indigo-100 animate-in fade-in slide-in-from-top-2">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">
                                            <Sparkles className="h-3.5 w-3.5" />{" "}
                                            {language === "ja" ? "AIフィードバック" : language === "vi" ? "Nhận xét AI" : "AI Feedback"}
                                        </p>
                                        {aiScore[index] !== null && aiScore[index] !== undefined && (
                                            <span
                                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${aiScore[index]! >= 80
                                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                                                    : aiScore[index]! >= 60
                                                        ? "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                                                        : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                                                    }`}
                                            >
                                                <Target className="h-3 w-3" />
                                                {language === "ja" ? "スコア:" : language === "vi" ? "Điểm:" : "Score:"} {aiScore[index]}/100
                                            </span>
                                        )}
                                    </div>

                                    {aiScore[index] !== null && aiScore[index] !== undefined && (
                                        <div className="mt-3 flex items-center justify-between rounded-xl border border-indigo-100 bg-white/80 px-3.5 py-2 text-xs dark:border-indigo-900/40 dark:bg-slate-900/60">
                                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                                                {language === "ja" ? "模範解答との一致度" : language === "vi" ? "Độ khớp với đáp án mẫu" : "Match Score with Reference Answer"}
                                            </span>
                                            <div className="flex items-center gap-2.5">
                                                <div className="h-1.5 w-20 sm:w-28 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-500 ${aiScore[index]! >= 80
                                                            ? "bg-emerald-500"
                                                            : aiScore[index]! >= 60
                                                                ? "bg-blue-500"
                                                                : "bg-amber-500"
                                                            }`}
                                                        style={{ width: `${Math.min(100, Math.max(0, aiScore[index]!))}%` }}
                                                    />
                                                </div>
                                                <span
                                                    className={`font-bold text-sm ${aiScore[index]! >= 80
                                                        ? "text-emerald-600 dark:text-emerald-400"
                                                        : aiScore[index]! >= 60
                                                            ? "text-blue-600 dark:text-blue-400"
                                                            : "text-amber-600 dark:text-amber-400"
                                                        }`}
                                                >
                                                    {aiScore[index]} / 100
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    <p className="mt-2.5">{aiFeedback[index]}</p>
                                </div>
                            ) : null}

                            {isRevealed && (
                                <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm leading-6 text-slate-700 dark:bg-emerald-950/30 dark:text-slate-200 animate-in fade-in space-y-1">
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
                                        {language === "ja" ? "模範解答" : language === "vi" ? "Đáp án tham khảo" : "Reference answer"}
                                    </p>
                                    <div className="text-base font-bold text-slate-950 dark:text-white">
                                        {qa.answerEn}
                                    </div>
                                    {qa.answerLocalized && (
                                        <div className="text-sm font-medium text-emerald-900 dark:text-emerald-200 border-t border-emerald-200/60 dark:border-emerald-900/40 pt-1.5">
                                            {language === "ja" ? (
                                                <RubyText text={qa.answerLocalized} showFurigana={showFurigana} />
                                            ) : (
                                                qa.answerLocalized
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </article>
                    );
                })}
            </div>
        </PanelShell>
    );
}
