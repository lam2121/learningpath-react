import { useEffect, useMemo, useRef, useState } from "react";
import {
    CheckCircle2,
    Copy,
    ListChecks,
    Mic,
    MicOff,
    Pause,
    Play,
    RotateCcw,
    Sparkles,
    Target,
    Timer,
} from "lucide-react";
import { Button } from "@/shadcn/component/ui/button";
import { RubyText } from "@/common/component/RubyText";
import { evaluateAnswer } from "@/feature/learning-path/api/roadmapApi";
import { useLessonLanguage } from "../../context/LessonLanguageContext";
import type { ParsedTheorySection } from "../../type/lessonWorkspace";
import {
    getSectionEyebrowNumber,
    getSectionTitle,
    localizeField,
    localizeTeacherNote,
    renderBilingualNote,
} from "../../util/lessonFormatters";
import { AudioSpeakButton } from "../shared/AudioSpeakButton";
import { PanelShell } from "../shared/PanelShell";

export function WrapupSection({ section }: { section: ParsedTheorySection }) {
    const { language, showFurigana } = useLessonLanguage();
    const rawTakeaways = Array.isArray(section.raw?.takeaways)
        ? section.raw.takeaways
        : [];
    const takeaways: Array<{ en: string; loc: string | null }> = useMemo(() => {
        return rawTakeaways.map((t: any) => {
            const en = localizeField(t, "en");
            const loc = language !== "en" ? localizeField(t, language) : null;
            return {
                en,
                loc: loc && loc !== en ? loc : null,
            };
        });
    }, [rawTakeaways, language]);

    const actionTaskEn = localizeField(section.raw?.action_task, "en") || "";
    const actionTaskLoc = language !== "en" ? (localizeField(section.raw?.action_task, language) || "") : null;

    const [actionDraft, setActionDraft] = useState("");
    const [isCopied, setIsCopied] = useState(false);
    const [aiFeedback, setAiFeedback] = useState("");
    const [aiScore, setAiScore] = useState<number | null>(null);
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [isListening, setIsListening] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Web SpeechRecognition API has no TS types
    const recognitionRef = useRef<any>(null);

    // 10-Minute Countdown Timer (600s)
    const [timeLeft, setTimeLeft] = useState(600);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | null = null;
        if (isTimerRunning && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        setIsTimerRunning(false);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isTimerRunning, timeLeft]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const handleStartTimer = () => {
        setHasStarted(true);
        setIsTimerRunning(true);
    };

    const handleToggleTimer = () => {
        if (!hasStarted) {
            setHasStarted(true);
            setIsTimerRunning(true);
        } else {
            setIsTimerRunning((prev) => !prev);
        }
    };

    const handleResetTimer = () => {
        setIsTimerRunning(false);
        setHasStarted(false);
        setTimeLeft(600);
    };

    const handleCopy = () => {
        if (actionDraft) {
            navigator.clipboard.writeText(actionDraft);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    const toggleDictation = () => {
        if (!hasStarted) return;
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
            return;
        }

        const SpeechRecognition =
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            alert("Speech recognition is not supported in this browser.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onresult = (event: any) => {
            const transcript = Array.from(event.results)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .map((result: any) => result[0].transcript)
                .join("");
            setActionDraft((prev) => (prev ? `${prev} ${transcript}` : transcript));
        };

        recognition.onerror = () => {
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        try {
            recognition.start();
            recognitionRef.current = recognition;
            setIsListening(true);
        } catch (error) {
            console.error("Speech recognition error:", error);
            setIsListening(false);
        }
    };

    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    const handleEvaluate = async () => {
        const userAnswer = actionDraft.trim();
        if (!userAnswer) return;

        setIsEvaluating(true);
        try {
            const res = await evaluateAnswer({
                section_type: "wrapup",
                context: takeaways.map((t) => t.en).join("\n"),
                question: actionTaskEn || actionTaskLoc || "",
                user_answer: userAnswer,
            });
            setAiFeedback(res.feedback_summary);
            let score = typeof res.score === "number" ? res.score : null;
            if (score === null && res.feedback_summary) {
                const match = res.feedback_summary.match(/Score:\s*(\d{1,3})/i);
                if (match) score = parseInt(match[1], 10);
            }
            setAiScore(score);
        } catch (error) {
            console.error(error);
            alert("Failed to evaluate draft.");
        } finally {
            setIsEvaluating(false);
        }
    };

    const wordCount = actionDraft.trim()
        ? (actionDraft.match(/\S+/g) || []).length
        : 0;

    const checklistRaw = section.raw?.teacher_note || section.note || "";
    const { en: checklistNoteEn, loc: checklistNoteLoc } = localizeTeacherNote(checklistRaw, language);

    const [checkedChecklist, setCheckedChecklist] = useState<Record<string, boolean>>({});

    interface ChecklistItem {
        id: string;
        en: string;
        vi: string;
        ja: string;
    }

    const defaultChecklistItems: ChecklistItem[] = [
        {
            id: "chk-vocab",
            en: "Reviewed all 8 specialized technical vocabulary terms & readings",
            vi: "Đã ôn tập toàn bộ 8 thuật ngữ kỹ thuật chuyên ngành và cách đọc",
            ja: "8つの専門技術用語と読み方の復習を完了した",
        },
        {
            id: "chk-phrases",
            en: "Mastered strategic phrase templates & workplace examples",
            vi: "Đã nắm vững các mẫu câu giao tiếp chiến lược và ví dụ nơi làm việc",
            ja: "戦略的フレーズテンプレートと職場での使用例を習得した",
        },
        {
            id: "chk-reading-dialogue",
            en: "Understood technical document trade-offs & negotiation dialogue",
            vi: "Đã hiểu rõ sự đánh đổi trong tài liệu kỹ thuật và hội thoại đàm phán",
            ja: "技術文書のトレードオフと交渉ダイアログの内容を理解した",
        },
        {
            id: "chk-action-task",
            en: "Completed 10-minute action challenge email & received AI feedback",
            vi: "Đã hoàn thành email bài tập tình huống 10 phút và nhận đánh giá AI",
            ja: "10分間アクションチャレンジメールを作成しAIフィードバックを確認した",
        },
    ];

    const checklistItems: ChecklistItem[] = useMemo(() => {
        if (Array.isArray(section.raw?.checklist) && section.raw.checklist.length > 0) {
            return section.raw.checklist.map((it: any, i: number): ChecklistItem => ({
                id: it.id || `chk-${i}`,
                en: localizeField(it, "en") || String(it || ""),
                vi: localizeField(it, "vi") || String(it || ""),
                ja: localizeField(it, "ja") || String(it || ""),
            }));
        }
        return defaultChecklistItems;
    }, [section.raw?.checklist]);

    return (
        <PanelShell
            eyebrow={getSectionEyebrowNumber(7, language)}
            title={getSectionTitle("wrapup", language)}
            note={renderBilingualNote(section.raw?.teacher_note, section.note, language, showFurigana)}
        >
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
                <div className="space-y-5">
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:border-blue-300 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(37,99,235,0.10)] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-700 dark:hover:shadow-[0_12px_28px_rgba(37,99,235,0.15)]">
                        <div className="flex items-center gap-2.5">
                            <ListChecks className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                            <h3 className="text-lg font-bold text-slate-950 dark:text-white">
                                {language === "ja" ? "言語習得の重要ポイント" : language === "vi" ? "Điểm cốt lõi về ngôn ngữ" : "Core Linguistic Takeaways"}
                            </h3>
                        </div>
                        <div className="mt-4 space-y-3">
                            {takeaways.length > 0 ? (
                                takeaways.map((takeaway, index) => (
                                    <div
                                        key={`${index}-${takeaway.en}`}
                                        className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700 dark:bg-slate-800/70 dark:text-slate-200"
                                    >
                                        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                                            {index + 1}
                                        </div>
                                        <div className="leading-relaxed flex-1 space-y-1">
                                            <div className="text-base font-bold text-slate-950 dark:text-white">
                                                {takeaway.en}
                                            </div>
                                            {takeaway.loc && (
                                                <div className="text-sm font-medium text-slate-700 dark:text-slate-300 border-t border-slate-200/80 dark:border-slate-700/80 pt-1.5">
                                                    {language === "ja" ? (
                                                        <RubyText text={takeaway.loc} showFurigana={showFurigana} />
                                                    ) : (
                                                        takeaway.loc
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-slate-500 italic">No takeaways listed.</p>
                            )}
                        </div>
                    </div>

                    {/* Interactive Action Challenge Task */}
                    <div className="rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50/60 to-indigo-50/60 p-6 dark:border-blue-900 dark:bg-slate-900 dark:from-slate-900 dark:to-slate-900">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                                <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                                <h3 className="text-lg font-bold text-slate-950 dark:text-white">
                                    10-Minute Output Challenge
                                </h3>
                            </div>

                            {/* Right side: Countdown and Start/Control Buttons */}
                            <div className="flex items-center gap-2">
                                <div
                                    className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm font-semibold shadow-xs transition-colors ${timeLeft === 0
                                        ? "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
                                        : timeLeft <= 60 && hasStarted
                                            ? "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300 animate-pulse"
                                            : "border-blue-200 bg-white/90 text-blue-700 dark:border-blue-900/60 dark:bg-slate-800 dark:text-blue-300"
                                        }`}
                                >
                                    <Timer className="h-4 w-4" />
                                    <span className="font-mono font-bold">
                                        {timeLeft === 0 ? "00:00 (Time's up!)" : formatTime(timeLeft)}
                                    </span>
                                </div>

                                {!hasStarted ? (
                                    <Button
                                        size="sm"
                                        onClick={handleStartTimer}
                                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-xs font-semibold"
                                    >
                                        <Play className="mr-1.5 h-3.5 w-3.5 fill-current" />
                                        Start Timer
                                    </Button>
                                ) : (
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleToggleTimer}
                                            disabled={timeLeft === 0}
                                            className="h-8 text-xs font-medium"
                                        >
                                            {isTimerRunning ? (
                                                <>
                                                    <Pause className="mr-1 h-3 w-3" /> Pause
                                                </>
                                            ) : (
                                                <>
                                                    <Play className="mr-1 h-3 w-3 fill-current" /> Resume
                                                </>
                                            )}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleResetTimer}
                                            title="Reset timer"
                                            className="h-8 px-2 text-xs text-slate-500 hover:text-slate-700"
                                        >
                                            <RotateCcw className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {(actionTaskEn || actionTaskLoc) ? (
                            <div className="mt-3 space-y-1.5 text-sm leading-6 text-slate-700 dark:text-slate-300">
                                {actionTaskEn && (
                                    <div className="text-base font-bold text-slate-950 dark:text-white">
                                        {actionTaskEn}
                                    </div>
                                )}
                                {actionTaskLoc && actionTaskLoc !== actionTaskEn && (
                                    <div className="text-sm font-medium text-slate-700 dark:text-slate-300 border-t border-blue-200/80 dark:border-blue-800/80 pt-1.5">
                                        {language === "ja" ? (
                                            <RubyText text={actionTaskLoc} showFurigana={showFurigana} />
                                        ) : (
                                            actionTaskLoc
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : null}

                        <div className="mt-4">
                            <textarea
                                value={actionDraft}
                                disabled={!hasStarted}
                                onChange={(e) => setActionDraft(e.target.value)}
                                placeholder={
                                    hasStarted
                                        ? "Draft your email, message, or speech notes applying lesson concepts here..."
                                        : "Click 'Start Timer' above to begin the 10-minute challenge..."
                                }
                                className="min-h-32 w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-800 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100/70 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:disabled:bg-slate-900/60 dark:disabled:text-slate-500"
                            />

                            <div className="mt-4 flex flex-wrap items-center gap-3">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={toggleDictation}
                                    disabled={!hasStarted}
                                    className={isListening ? "text-rose-500 hover:text-rose-600 hover:bg-rose-50" : ""}
                                >
                                    {isListening ? (
                                        <>
                                            <MicOff className="mr-2 h-4 w-4 animate-pulse" /> Stop Dictating
                                        </>
                                    ) : (
                                        <>
                                            <Mic className="mr-2 h-4 w-4" /> Dictate
                                        </>
                                    )}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleEvaluate}
                                    disabled={!hasStarted || !actionDraft.trim() || isEvaluating}
                                >
                                    {isEvaluating ? (
                                        "Evaluating..."
                                    ) : (
                                        <>
                                            <Sparkles className="mr-2 h-4 w-4 text-indigo-500" /> Evaluate
                                        </>
                                    )}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setActionDraft("");
                                        setAiFeedback("");
                                        setAiScore(null);
                                    }}
                                    disabled={!hasStarted && !actionDraft}
                                >
                                    Clear
                                </Button>
                            </div>

                            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                                <span>{wordCount} words</span>
                                <div className="flex items-center gap-2">
                                    {actionDraft && (
                                        <AudioSpeakButton
                                            text={actionDraft}
                                            label="Listen to my draft"
                                        />
                                    )}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleCopy}
                                        disabled={!actionDraft}
                                        className="h-7 text-xs"
                                    >
                                        <Copy className="mr-1.5 h-3.5 w-3.5" />
                                        {isCopied ? "Copied!" : "Copy text"}
                                    </Button>
                                </div>
                            </div>

                            {aiFeedback ? (
                                <div className="mt-4 rounded-2xl bg-indigo-50/50 p-4 text-sm leading-6 text-indigo-900 border border-indigo-100 dark:bg-indigo-950/30 dark:border-indigo-900/50 dark:text-indigo-100 animate-in fade-in slide-in-from-top-2">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">
                                            <Sparkles className="h-3.5 w-3.5" /> AI Feedback
                                        </p>
                                        {aiScore !== null && (
                                            <span
                                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${aiScore >= 80
                                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                                                    : aiScore >= 60
                                                        ? "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                                                        : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                                                    }`}
                                            >
                                                <Target className="h-3 w-3" />
                                                Score: {aiScore}/100
                                            </span>
                                        )}
                                    </div>

                                    {aiScore !== null && (
                                        <div className="mt-3 flex items-center justify-between rounded-xl border border-indigo-100 bg-white/80 px-3.5 py-2 text-xs dark:border-indigo-900/40 dark:bg-slate-900/60">
                                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                                                Challenge Performance Score
                                            </span>
                                            <div className="flex items-center gap-2.5">
                                                <div className="h-1.5 w-20 sm:w-28 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-500 ${aiScore >= 80
                                                            ? "bg-emerald-500"
                                                            : aiScore >= 60
                                                                ? "bg-blue-500"
                                                                : "bg-amber-500"
                                                            }`}
                                                        style={{ width: `${Math.min(100, Math.max(0, aiScore))}%` }}
                                                    />
                                                </div>
                                                <span
                                                    className={`font-bold text-sm ${aiScore >= 80
                                                        ? "text-emerald-600 dark:text-emerald-400"
                                                        : aiScore >= 60
                                                            ? "text-blue-600 dark:text-blue-400"
                                                            : "text-amber-600 dark:text-amber-400"
                                                        }`}
                                                >
                                                    {aiScore} / 100
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    <p className="mt-2.5">{aiFeedback}</p>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:border-blue-300 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(37,99,235,0.10)] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-700 dark:hover:shadow-[0_12px_28px_rgba(37,99,235,0.15)]">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
                                    Ready for Quiz
                                </p>
                                {language !== "en" && (
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                        {language === "ja" ? "クイズの準備" : "Sẵn sàng làm bài Quiz"}
                                    </p>
                                )}
                            </div>
                            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                                <CheckCircle2 className="h-4 w-4" />
                            </span>
                        </div>

                        <div className="mt-3">
                            <h4 className="text-base font-bold text-slate-950 dark:text-white">
                                Self-Check Checklist
                            </h4>
                            {language !== "en" && (
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {language === "ja" ? "セルフチェック項目" : "Danh sách tự kiểm tra"}
                                </p>
                            )}
                        </div>

                        {/* Interactive Checklist Items */}
                        <div className="mt-4 space-y-2.5">
                            {checklistItems.map((item, idx) => {
                                const isChecked = Boolean(checkedChecklist[item.id]);
                                const itemLoc = language !== "en" ? (item[language as keyof typeof item] || item.vi || item.ja) : null;
                                return (
                                    <label
                                        key={item.id || idx}
                                        className={`flex items-start gap-3 rounded-2xl border p-3 text-sm transition-all cursor-pointer ${isChecked
                                            ? "border-emerald-300 bg-emerald-50/60 dark:border-emerald-900/60 dark:bg-emerald-950/20"
                                            : "border-slate-200 bg-slate-50/70 hover:border-blue-200 dark:border-slate-800 dark:bg-slate-800/40"
                                            }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() =>
                                                setCheckedChecklist((prev) => ({
                                                    ...prev,
                                                    [item.id]: !prev[item.id],
                                                }))
                                            }
                                            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800"
                                        />
                                        <div className="space-y-0.5 min-w-0 flex-1">
                                            <div className={`text-sm font-semibold leading-6 ${isChecked ? "text-slate-600 line-through dark:text-slate-400" : "text-slate-950 dark:text-white"
                                                }`}>
                                                {item.en}
                                            </div>
                                            {itemLoc && itemLoc !== item.en && (
                                                <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                                    {language === "ja" ? (
                                                        <RubyText text={itemLoc} showFurigana={showFurigana} />
                                                    ) : (
                                                        itemLoc
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </label>
                                );
                            })}
                        </div>

                        {/* Teacher Guidance / Note if present */}
                        {(checklistNoteEn || checklistNoteLoc) && (
                            <div className="mt-4 rounded-2xl bg-blue-50/60 border border-blue-100 p-4 text-sm leading-6 text-slate-800 dark:border-blue-950/60 dark:bg-blue-950/20 dark:text-slate-200 space-y-1.5">
                                <div className="flex items-center gap-1.5 font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider text-xs">
                                    <span>Teacher Guidance</span>
                                    {language !== "en" && (
                                        <span className="font-medium lowercase text-slate-600 dark:text-slate-400">
                                            ({language === "ja" ? "指導のポイント" : "hướng dẫn giảng viên"})
                                        </span>
                                    )}
                                </div>
                                <div className="font-semibold text-slate-950 dark:text-white">
                                    {checklistNoteEn || checklistNoteLoc}
                                </div>
                                {checklistNoteLoc && checklistNoteLoc !== checklistNoteEn && (
                                    <div className="border-t border-blue-200/80 pt-1.5 text-sm font-medium text-slate-700 dark:border-blue-900/40 dark:text-slate-300">
                                        {language === "ja" ? (
                                            <RubyText text={checklistNoteLoc} showFurigana={showFurigana} />
                                        ) : (
                                            checklistNoteLoc
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </article>
                </div>
            </div>
        </PanelShell>
    );
}
