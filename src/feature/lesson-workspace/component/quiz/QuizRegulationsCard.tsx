import { ClipboardList, ChevronRight, Play, RotateCcw } from "lucide-react";
import { Button } from "@/shadcn/component/ui/button";
import type { LessonQuizStateResponse } from "@/feature/learning-path/api/roadmapApi";
import type {
    EmbeddedLessonQuizDraft,
    LessonLookup,
} from "../../type/lessonWorkspace";
import { hasAnswer } from "../../util/embeddedQuizPersistence";
import { formatLabel, formatPercent } from "../../util/lessonFormatters";

export interface QuizRegulationsCardProps {
    language: string;
    savedAttemptCount: number;
    savedBestScore: number;
    savedQuizState: LessonQuizStateResponse | null;
    failedAttempts: number;
    quizStateError: string | null;
    pendingDraft: EmbeddedLessonQuizDraft | null;
    nextLesson: LessonLookup | null;
    onStartQuiz: () => void;
    onResumeQuiz: () => void;
    onStartOver: () => void;
}

export function QuizRegulationsCard({
    language,
    savedAttemptCount,
    savedBestScore,
    savedQuizState,
    failedAttempts,
    quizStateError,
    pendingDraft,
    nextLesson,
    onStartQuiz,
    onResumeQuiz,
    onStartOver,
}: QuizRegulationsCardProps) {
    const isVI = language === "vi";
    const isJA = language === "ja";

    const answeredCount = pendingDraft
        ? Object.values(pendingDraft.answers).filter((val) => hasAnswer(val)).length
        : 0;

    const renderActionButtons = (isTop = false) => {
        if (pendingDraft) {
            return (
                <div className={`flex flex-col gap-2.5 sm:flex-row sm:items-center ${isTop ? "mt-4" : "mt-5"}`}>
                    <Button
                        className="w-full sm:w-auto h-11 px-5 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
                        onClick={onResumeQuiz}
                    >
                        <Play className="h-4 w-4 mr-1.5 fill-current" />
                        {isJA ? "クイズを再開" : isVI ? "Tiếp tục làm bài" : "Resume quiz"}
                    </Button>
                    <Button
                        className="w-full sm:w-auto h-11 px-4 rounded-xl font-semibold border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                        variant="outline"
                        onClick={onStartOver}
                    >
                        <RotateCcw className="h-4 w-4 mr-1.5" />
                        {isJA ? "最初からやり直す" : isVI ? "Làm lại từ đầu" : "Start over"}
                    </Button>
                </div>
            );
        }

        return (
            <div className={isTop ? "mt-4" : "mt-5"}>
                <Button
                    className="w-full sm:w-auto h-11 px-6 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
                    onClick={onStartQuiz}
                >
                    <Play className="h-4 w-4 mr-1.5 fill-current" />
                    {isJA ? "クイズを開始" : isVI ? "Bắt đầu làm bài" : "Start quiz"}
                </Button>
            </div>
        );
    };

    return (
        <div className="space-y-4 sm:space-y-5">
            <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-start gap-3.5 sm:gap-4">
                    <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-slate-300">
                        <ClipboardList className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
                            {isJA ? "開始前の確認" : isVI ? "Trước khi bắt đầu" : "Before you start"}
                        </p>
                        <h3 className="mt-1 text-xl sm:text-2xl font-bold text-slate-950 dark:text-white">
                            {isJA ? "クイズ規定" : isVI ? "Quy định bài kiểm tra" : "Quiz regulations"}
                        </h3>
                        <p className="mt-2 text-xs sm:text-sm font-medium leading-relaxed text-slate-700 dark:text-slate-200">
                            {isJA
                                ? "レッスンチェックに入る前にこれらのルールをお読みください。開始すると、ロードマップの次のレッスンもバックグラウンドで準備されます。"
                                : isVI
                                ? "Đọc các quy định này trước khi bắt đầu bài kiểm tra. Khi bắt đầu, bài học tiếp theo trong lộ trình cũng sẽ bắt đầu được chuẩn bị ở chế độ nền."
                                : "Read these rules before entering the lesson check. Once you start, the next lesson in your roadmap will also begin preparing in the background."}
                        </p>
                    </div>
                </div>

                {/* Instant Action CTA on Mobile/Desktop */}
                {renderActionButtons(true)}

                {/* Saved best score badge */}
                {savedAttemptCount > 0 ? (
                    <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-xs sm:text-sm text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100">
                        {isJA ? (
                            <>
                                最高スコア記録: <strong className="font-extrabold">{formatPercent(savedBestScore)}</strong>
                                {savedQuizState?.lesson_passed
                                    ? " · このレッスンはすでに合格しているため、再挑戦で記録は更新できますがレーダーは再度更新されません。"
                                    : ` · 保存された不合格回数: ${failedAttempts}回`}
                            </>
                        ) : isVI ? (
                            <>
                                Điểm cao nhất đã lưu: <strong className="font-extrabold">{formatPercent(savedBestScore)}</strong>
                                {savedQuizState?.lesson_passed
                                    ? " · Bài học này đã hoàn thành trước đó; việc làm lại có thể cải thiện điểm lưu trữ nhưng không cập nhật lại radar."
                                    : ` · Số lần làm bài chưa đạt: ${failedAttempts}`}
                            </>
                        ) : (
                            <>
                                Saved best score: <strong className="font-extrabold">{formatPercent(savedBestScore)}</strong>
                                {savedQuizState?.lesson_passed
                                    ? " · This lesson has already been passed once, so future retakes can improve your stored best score but will not update radar again."
                                    : ` · Failed attempts saved: ${failedAttempts}.`}
                            </>
                        )}
                    </div>
                ) : null}

                {/* Radar Skill Score badge */}
                {savedQuizState?.current_skill_score !== null &&
                savedQuizState?.current_skill_score !== undefined ? (
                    <div className="mt-3 rounded-2xl border border-sky-200 bg-sky-50 px-3.5 py-3 text-xs sm:text-sm text-sky-950 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-100">
                        {isJA ? (
                            <>
                                現在の{formatLabel(savedQuizState.skill)}レーダースコア:{" "}
                                <strong className="font-extrabold">{formatPercent(savedQuizState.current_skill_score)}</strong>
                            </>
                        ) : isVI ? (
                            <>
                                Điểm radar {formatLabel(savedQuizState.skill)} hiện tại:{" "}
                                <strong className="font-extrabold">{formatPercent(savedQuizState.current_skill_score)}</strong>
                            </>
                        ) : (
                            <>
                                Current {formatLabel(savedQuizState.skill)} radar score:{" "}
                                <strong className="font-extrabold">{formatPercent(savedQuizState.current_skill_score)}</strong>
                            </>
                        )}
                    </div>
                ) : null}

                {quizStateError ? (
                    <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs sm:text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
                        {quizStateError}
                    </div>
                ) : null}

                {/* Pending Draft Notice */}
                {pendingDraft ? (
                    <div className="mt-3.5 rounded-2xl border border-blue-200 bg-blue-50 px-3.5 py-3 text-xs sm:text-sm dark:border-blue-900 dark:bg-blue-950/30">
                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-300">
                            {isJA ? "保存された下書きがあります" : isVI ? "Tìm thấy bản nháp dở dang" : "Quiz draft found"}
                        </p>
                        <p className="mt-1 leading-relaxed text-slate-800 dark:text-slate-200">
                            {isJA ? (
                                <>
                                    問題 <strong>{Math.min(pendingDraft.currentQuestionIndex + 1, pendingDraft.questions.length)}</strong> / <strong>{pendingDraft.questions.length}</strong> から再開します。すでに <strong>{answeredCount}</strong> 問に回答済みです。
                                </>
                            ) : isVI ? (
                                <>
                                    Tiếp tục từ câu <strong>{Math.min(pendingDraft.currentQuestionIndex + 1, pendingDraft.questions.length)}</strong> trên tổng số <strong>{pendingDraft.questions.length}</strong> câu. Bạn đã trả lời <strong>{answeredCount}</strong> câu.
                                </>
                            ) : (
                                <>
                                    Resume from question <strong>{Math.min(pendingDraft.currentQuestionIndex + 1, pendingDraft.questions.length)}</strong> of <strong>{pendingDraft.questions.length}</strong>. You already answered <strong>{answeredCount}</strong> question{answeredCount === 1 ? "" : "s"}.
                                </>
                            )}
                        </p>
                    </div>
                ) : null}

                {/* Regulations List (Clean, single language to avoid endless scrolling) */}
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 dark:border-slate-800 dark:bg-slate-800/40 sm:px-4">
                    <ol className="divide-y divide-slate-200/80 dark:divide-slate-800 text-xs sm:text-sm">
                        <li className="flex gap-3 py-2.5 first:pt-1 last:pb-1">
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 shadow-2xs dark:bg-slate-900 dark:text-slate-300">
                                1
                            </div>
                            <div className="min-w-0 flex-1 pt-0.5 leading-relaxed text-slate-800 dark:text-slate-200">
                                {isJA ? (
                                    <>
                                        <strong className="font-bold">一度に1問ずつ進めます。</strong> 提出前であれば問題間を自由に移動できますが、<strong className="font-bold">採点は提出時にのみ確定します。</strong>
                                    </>
                                ) : isVI ? (
                                    <>
                                        <strong className="font-bold">Làm từng câu hỏi một.</strong> Bạn có thể di chuyển giữa các câu trước khi nộp bài, nhưng <strong className="font-bold">điểm số chỉ được chốt khi bạn bấm nộp bài.</strong>
                                    </>
                                ) : (
                                    <>
                                        <strong className="font-semibold">Move one question at a time.</strong> You can move between questions before submission, but <strong className="font-semibold">scoring is finalized only when you submit.</strong>
                                    </>
                                )}
                            </div>
                        </li>

                        <li className="flex gap-3 py-2.5">
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 shadow-2xs dark:bg-slate-900 dark:text-slate-300">
                                2
                            </div>
                            <div className="min-w-0 flex-1 pt-0.5 leading-relaxed text-slate-800 dark:text-slate-200">
                                {isJA ? (
                                    <>
                                        <strong className="font-bold">合格には70%以上のスコアが必要です。</strong> 次のレッスンはバックグラウンドで準備されますが、合格するまでロックされます。
                                    </>
                                ) : isVI ? (
                                    <>
                                        <strong className="font-bold">Cần đạt từ 70% điểm để vượt qua.</strong> Bài tiếp theo được chuẩn bị song song ở nền, nhưng vẫn bị khóa cho đến khi bạn đạt bài kiểm tra này.
                                    </>
                                ) : (
                                    <>
                                        <strong className="font-semibold">Pass requires a 70% lesson score.</strong> The next lesson warms up in the background, but stays locked until this quiz is passed.
                                    </>
                                )}
                            </div>
                        </li>

                        <li className="flex gap-3 py-2.5">
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 shadow-2xs dark:bg-slate-900 dark:text-slate-300">
                                3
                            </div>
                            <div className="min-w-0 flex-1 pt-0.5 leading-relaxed text-slate-800 dark:text-slate-200">
                                {isJA ? (
                                    <>
                                        <strong className="font-bold">2回不合格になるとヒントが解放されます。</strong> ヒント使用時は正解が入力され、その問題は <strong className="font-bold">0.75点</strong> となります。
                                    </>
                                ) : isVI ? (
                                    <>
                                        <strong className="font-bold">Mở khóa gợi ý sau 2 lần không đạt.</strong> "Xem gợi ý" sẽ điền đáp án đúng và câu đó được tính <strong className="font-bold">0.75 số điểm</strong>.
                                    </>
                                ) : (
                                    <>
                                        <strong className="font-semibold">Hint mode unlocks after 2 failed attempts.</strong> When active, "Show hint" fills the answer and awards <strong className="font-semibold">0.75 credit</strong>.
                                    </>
                                )}
                            </div>
                        </li>

                        <li className="flex gap-3 py-2.5 first:pt-1 last:pb-1">
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 shadow-2xs dark:bg-slate-900 dark:text-slate-300">
                                4
                            </div>
                            <div className="min-w-0 flex-1 pt-0.5 leading-relaxed text-slate-800 dark:text-slate-200">
                                {isJA ? (
                                    <>
                                        <strong className="font-bold">不正解やヒントを使った問題は要復習。</strong> 合格するまで正解と解説の詳細は非表示のままになります。
                                    </>
                                ) : isVI ? (
                                    <>
                                        <strong className="font-bold">Ôn tập lại các câu sai hoặc dùng gợi ý.</strong> Giải thích chi tiết sẽ được hiển thị đầy đủ sau khi bạn vượt qua bài kiểm tra.
                                    </>
                                ) : (
                                    <>
                                        <strong className="font-semibold">Wrong and hinted answers should be reviewed.</strong> Explanations remain hidden until you pass the quiz.
                                    </>
                                )}
                            </div>
                        </li>
                    </ol>
                </div>

                {/* Warmup Note */}
                <div className="mt-3.5 rounded-2xl border-l-4 border-l-sky-500 bg-sky-50 px-3.5 py-3 text-xs sm:text-sm dark:bg-sky-950/20">
                    <div className="flex items-start gap-2.5">
                        <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" />
                        <div className="min-w-0 text-slate-800 dark:text-slate-200">
                            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-sky-700 dark:text-sky-300">
                                {isJA ? "次のレッスンの事前準備" : isVI ? "Chuẩn bị bài học tiếp theo" : "Next lesson warmup"}
                            </p>
                            <p className="mt-0.5 leading-relaxed">
                                {isJA
                                    ? nextLesson
                                        ? `クイズを開始すると、トピック ${nextLesson.topic.sort_order} の「${nextLesson.lesson.title}」がバックグラウンドで並行して準備されます。`
                                        : "これは現在割り当てられている最後のレッスンです。"
                                    : isVI
                                    ? nextLesson
                                        ? `Khi bạn bấm Bắt đầu làm bài, bài học "${nextLesson.lesson.title}" thuộc Chủ đề ${nextLesson.topic.sort_order} sẽ được chuẩn bị song song ở chế độ nền.`
                                        : "Hiện tại đây là bài học cuối cùng trong lộ trình."
                                    : nextLesson
                                    ? `When you start, ${nextLesson.lesson.title} from Topic ${nextLesson.topic.sort_order} will be prepared in parallel.`
                                    : "This is the last assigned lesson right now."}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Bottom Action CTA */}
                {renderActionButtons(false)}
            </div>
        </div>
    );
}
