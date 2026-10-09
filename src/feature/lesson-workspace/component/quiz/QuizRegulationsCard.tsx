import { ClipboardList, ChevronRight } from "lucide-react";
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
    return (
        <div className="space-y-5">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        <ClipboardList className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-700 dark:text-slate-200">
                            {language === "ja"
                                ? "開始前の確認"
                                : language === "vi"
                                ? "Trước khi bắt đầu"
                                : "Before you start"}
                        </p>
                        <h3 className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">
                            {language === "ja"
                                ? "クイズ規定"
                                : language === "vi"
                                ? "Quy định bài kiểm tra"
                                : "Quiz regulations"}
                        </h3>
                        <p className="mt-3 text-sm font-medium leading-6 text-slate-800 dark:text-slate-100">
                            {language === "ja"
                                ? "レッスンチェックに入る前にこれらのルールをお読みください。開始すると、ロードマップの次のレッスンもバックグラウンドで準備されます。"
                                : language === "vi"
                                ? "Đọc các quy định này trước khi bắt đầu bài kiểm tra. Khi bắt đầu, bài học tiếp theo trong lộ trình cũng sẽ bắt đầu được chuẩn bị ở chế độ nền."
                                : "Read these rules before entering the lesson check. Once you start, the next lesson in your roadmap will also begin preparing in the background."}
                        </p>
                    </div>
                </div>

                {savedAttemptCount > 0 ? (
                    <div className="mt-5 rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100">
                        <div>
                            Saved best score: <strong>{formatPercent(savedBestScore)}</strong>
                            {savedQuizState?.lesson_passed
                                ? " · This lesson has already been passed once, so future retakes can improve your stored best score but will not update radar again."
                                : ` · Failed attempts saved: ${failedAttempts}.`}
                        </div>
                        {language !== "en" && (
                            <div className="mt-2 border-t border-emerald-300/80 pt-2 text-sm font-bold text-emerald-950 dark:border-emerald-800/80 dark:text-emerald-100">
                                {language === "ja" ? (
                                    <>
                                        最高スコア記録:{" "}
                                        <strong className="font-extrabold text-emerald-950 dark:text-white">
                                            {formatPercent(savedBestScore)}
                                        </strong>
                                        {savedQuizState?.lesson_passed
                                            ? " · このレッスンはすでに合格しているため、再挑戦で記録は更新できますがレーダーは再度更新されません。"
                                            : ` · 保存された不合格回数: ${failedAttempts}回`}
                                    </>
                                ) : (
                                    <>
                                        Điểm cao nhất đã lưu:{" "}
                                        <strong className="font-extrabold text-emerald-950 dark:text-white">
                                            {formatPercent(savedBestScore)}
                                        </strong>
                                        {savedQuizState?.lesson_passed
                                            ? " · Bài học này đã hoàn thành trước đó; việc làm lại có thể cải thiện điểm lưu trữ nhưng không cập nhật lại radar."
                                            : ` · Số lần làm bài chưa đạt: ${failedAttempts}`}
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                ) : null}

                {savedQuizState?.current_skill_score !== null &&
                savedQuizState?.current_skill_score !== undefined ? (
                    <div className="mt-4 rounded-3xl border border-sky-200 bg-sky-50 px-4 py-4 text-sm text-sky-950 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-100">
                        <div>
                            Current {formatLabel(savedQuizState.skill)} radar score:{" "}
                            <strong>{formatPercent(savedQuizState.current_skill_score)}</strong>
                        </div>
                        {language !== "en" && (
                            <div className="mt-2 border-t border-sky-300/80 pt-2 text-sm font-bold text-sky-950 dark:border-sky-800/80 dark:text-sky-100">
                                {language === "ja"
                                    ? `現在の${formatLabel(savedQuizState.skill)}レーダースコア: `
                                    : `Điểm radar ${formatLabel(savedQuizState.skill)} hiện tại: `}
                                <strong className="font-extrabold text-sky-950 dark:text-white">
                                    {formatPercent(savedQuizState.current_skill_score)}
                                </strong>
                            </div>
                        )}
                    </div>
                ) : null}

                {quizStateError ? (
                    <div className="mt-4 rounded-3xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
                        {quizStateError}
                    </div>
                ) : null}

                {pendingDraft ? (
                    <div className="mt-4 rounded-3xl border border-blue-200 bg-blue-50 px-4 py-4 dark:border-blue-900 dark:bg-blue-950/30">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-300">
                                Quiz draft found
                            </p>
                            <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">
                                Resume from question{" "}
                                <strong>
                                    {Math.min(
                                        pendingDraft.currentQuestionIndex + 1,
                                        Math.max(1, pendingDraft.questions.length),
                                    )}
                                </strong>{" "}
                                of <strong>{pendingDraft.questions.length}</strong>. You
                                already answered{" "}
                                <strong>
                                    {
                                        Object.values(pendingDraft.answers).filter(
                                            (value) => hasAnswer(value),
                                        ).length
                                    }
                                </strong>{" "}
                                question
                                {Object.values(pendingDraft.answers).filter((value) =>
                                    hasAnswer(value),
                                ).length === 1
                                    ? ""
                                    : "s"}
                                .
                            </p>
                        </div>
                        {language !== "en" && (
                            <div className="mt-2.5 border-t border-blue-300/80 pt-2.5 text-sm font-semibold text-slate-950 dark:border-blue-800/80 dark:text-white">
                                <p className="font-extrabold text-blue-950 dark:text-blue-200">
                                    {language === "ja"
                                        ? "保存された下書きがあります"
                                        : "Tìm thấy bản nháp"}
                                </p>
                                <p className="mt-1 leading-6">
                                    {language === "ja" ? (
                                        <>
                                            問題{" "}
                                            <strong className="font-extrabold text-slate-950 dark:text-white">
                                                {Math.min(
                                                    pendingDraft.currentQuestionIndex + 1,
                                                    Math.max(
                                                        1,
                                                        pendingDraft.questions.length,
                                                    ),
                                                )}
                                            </strong>{" "}
                                            /{" "}
                                            <strong className="font-extrabold text-slate-950 dark:text-white">
                                                {pendingDraft.questions.length}
                                            </strong>{" "}
                                            から再開します。すでに{" "}
                                            <strong className="font-extrabold text-slate-950 dark:text-white">
                                                {
                                                    Object.values(
                                                        pendingDraft.answers,
                                                    ).filter((value) => hasAnswer(value))
                                                        .length
                                                }
                                            </strong>{" "}
                                            問に回答済みです。
                                        </>
                                    ) : (
                                        <>
                                            Tiếp tục từ câu{" "}
                                            <strong className="font-extrabold text-slate-950 dark:text-white">
                                                {Math.min(
                                                    pendingDraft.currentQuestionIndex + 1,
                                                    Math.max(
                                                        1,
                                                        pendingDraft.questions.length,
                                                    ),
                                                )}
                                            </strong>{" "}
                                            trên tổng số{" "}
                                            <strong className="font-extrabold text-slate-950 dark:text-white">
                                                {pendingDraft.questions.length}
                                            </strong>{" "}
                                            câu. Bạn đã trả lời{" "}
                                            <strong className="font-extrabold text-slate-950 dark:text-white">
                                                {
                                                    Object.values(
                                                        pendingDraft.answers,
                                                    ).filter((value) => hasAnswer(value))
                                                        .length
                                                }
                                            </strong>{" "}
                                            câu.
                                        </>
                                    )}
                                </p>
                            </div>
                        )}
                    </div>
                ) : null}

                <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50/70 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/40 sm:px-5">
                    <ol className="divide-y divide-slate-200 dark:divide-slate-800">
                        <li className="flex gap-4 py-3 first:pt-1 last:pb-1">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-lg font-bold text-slate-500 shadow-sm dark:bg-slate-900 dark:text-slate-300">
                                1
                            </div>
                            <div className="min-w-0 flex-1 pt-1">
                                <p className="text-sm leading-6 text-slate-700 dark:text-slate-200">
                                    <strong className="font-semibold text-slate-950 dark:text-white">
                                        Move one question at a time.
                                    </strong>{" "}
                                    You can move between questions before submission, but
                                    <strong className="font-semibold text-slate-950 dark:text-white">
                                        {" "}scoring is finalized only when you submit.
                                    </strong>
                                </p>
                                {language !== "en" && (
                                    <p className="mt-1.5 border-t border-slate-200/80 pt-1.5 text-sm font-semibold leading-6 text-slate-950 dark:border-slate-700/80 dark:text-white">
                                        {language === "ja" ? (
                                            <>
                                                <strong className="font-bold text-slate-950 dark:text-white">
                                                    一度に1問ずつ進めます。
                                                </strong>{" "}
                                                提出前であれば問題間を自由に移動できますが、
                                                <strong className="font-bold text-slate-950 dark:text-white">
                                                    採点は提出時にのみ確定します。
                                                </strong>
                                            </>
                                        ) : (
                                            <>
                                                <strong className="font-bold text-slate-950 dark:text-white">
                                                    Làm từng câu hỏi một.
                                                </strong>{" "}
                                                Bạn có thể di chuyển giữa các câu hỏi trước khi nộp bài, nhưng
                                                <strong className="font-bold text-slate-950 dark:text-white">
                                                    {" "}điểm số chỉ được chốt khi bạn bấm nộp bài.
                                                </strong>
                                            </>
                                        )}
                                    </p>
                                )}
                            </div>
                        </li>
                        <li className="flex gap-4 py-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-lg font-bold text-slate-500 shadow-sm dark:bg-slate-900 dark:text-slate-300">
                                2
                            </div>
                            <div className="min-w-0 flex-1 pt-1">
                                <p className="text-sm leading-6 text-slate-700 dark:text-slate-200">
                                    <strong className="font-semibold text-slate-950 dark:text-white">
                                        Pass requires a 70% lesson score.
                                    </strong>{" "}
                                    The next lesson can warm up in the background, but it
                                    stays locked until this quiz is passed.
                                </p>
                                {language !== "en" && (
                                    <p className="mt-1.5 border-t border-slate-200/80 pt-1.5 text-sm font-semibold leading-6 text-slate-950 dark:border-slate-700/80 dark:text-white">
                                        {language === "ja" ? (
                                            <>
                                                <strong className="font-extrabold text-slate-950 dark:text-white">
                                                    合格にはレッスンスコア70%以上が必要です。
                                                </strong>{" "}
                                                次のレッスンはバックグラウンドで準備されますが、このクイズに合格するまでロックされたままになります。
                                            </>
                                        ) : (
                                            <>
                                                <strong className="font-extrabold text-slate-950 dark:text-white">
                                                    Cần đạt từ 70% điểm bài học để vượt qua.
                                                </strong>{" "}
                                                Bài học tiếp theo có thể được chuẩn bị trước ở chế độ nền, nhưng vẫn sẽ bị khóa cho đến khi bạn vượt qua bài kiểm tra này.
                                            </>
                                        )}
                                    </p>
                                )}
                            </div>
                        </li>
                        <li className="flex gap-4 py-3 first:pt-1 last:pb-1">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-lg font-bold text-slate-500 shadow-sm dark:bg-slate-900 dark:text-slate-300">
                                3
                            </div>
                            <div className="min-w-0 flex-1 pt-1">
                                <p className="text-sm leading-6 text-slate-700 dark:text-slate-200">
                                    <strong className="font-semibold text-slate-950 dark:text-white">
                                        Hint mode unlocks after 2 failed attempts.
                                    </strong>{" "}
                                    When hint mode is active, "Show hint" fills in the
                                    correct answer and that question is worth{" "}
                                    <strong className="font-semibold text-slate-950 dark:text-white">
                                        0.75 credit
                                    </strong>
                                    .
                                </p>
                                {language !== "en" && (
                                    <p className="mt-1.5 border-t border-slate-200/80 pt-1.5 text-sm font-semibold leading-6 text-slate-950 dark:border-slate-700/80 dark:text-white">
                                        {language === "ja" ? (
                                            <>
                                                <strong className="font-extrabold text-slate-950 dark:text-white">
                                                    2回不合格になるとヒントモードが解除されます。
                                                </strong>{" "}
                                                ヒントモードが有効な場合、「ヒントを表示」で正解が入力され、その問題は
                                                <strong className="font-extrabold text-slate-950 dark:text-white">
                                                    0.75点分のスコア
                                                </strong>
                                                となります。
                                            </>
                                        ) : (
                                            <>
                                                <strong className="font-extrabold text-slate-950 dark:text-white">
                                                    Chế độ gợi ý mở khóa sau 2 lần làm bài không đạt.
                                                </strong>{" "}
                                                Khi chế độ gợi ý được bật, "Xem gợi ý" sẽ điền đáp án đúng và câu hỏi đó sẽ được tính{" "}
                                                <strong className="font-extrabold text-slate-950 dark:text-white">
                                                    0.75 số điểm
                                                </strong>
                                                .
                                            </>
                                        )}
                                    </p>
                                )}
                            </div>
                        </li>
                        <li className="flex gap-4 py-3 first:pt-1 last:pb-1">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-lg font-bold text-slate-500 shadow-sm dark:bg-slate-900 dark:text-slate-300">
                                4
                            </div>
                            <div className="min-w-0 flex-1 pt-1">
                                <p className="text-sm leading-6 text-slate-700 dark:text-slate-200">
                                    <strong className="font-semibold text-slate-950 dark:text-white">
                                        Wrong and hinted answers should be reviewed.
                                    </strong>{" "}
                                    If the attempt is failed, the correct answers and explanations for those questions will remain hidden until you pass the quiz.
                                </p>
                                {language !== "en" && (
                                    <p className="mt-1.5 border-t border-slate-200/80 pt-1.5 text-sm font-semibold leading-6 text-slate-950 dark:border-slate-700/80 dark:text-white">
                                        {language === "ja" ? (
                                            <>
                                                <strong className="font-extrabold text-slate-950 dark:text-white">
                                                    不正解やヒントを使用した回答は復習することをお勧めします。
                                                </strong>{" "}
                                                不合格の場合、クイズに合格するまでそれらの問題の正解と解説は非表示のままになります。
                                            </>
                                        ) : (
                                            <>
                                                <strong className="font-extrabold text-slate-950 dark:text-white">
                                                    Nên xem lại các câu trả lời sai và câu đã dùng gợi ý.
                                                </strong>{" "}
                                                Nếu bài kiểm tra chưa đạt, đáp án đúng và giải thích chi tiết cho các câu hỏi đó sẽ được ẩn cho đến khi bạn vượt qua bài kiểm tra.
                                            </>
                                        )}
                                    </p>
                                )}
                            </div>
                        </li>
                    </ol>
                </div>

                <div className="mt-4 rounded-2xl border-l-4 border-l-sky-500 bg-sky-50 px-4 py-4 dark:bg-sky-950/20">
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sky-600 shadow-sm dark:bg-slate-900 dark:text-sky-300">
                            <ChevronRight className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700 dark:text-sky-300">
                                    Next lesson warmup
                                </p>
                                <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">
                                    {nextLesson
                                        ? `When you click Start quiz, ${nextLesson.lesson.title} from Topic ${nextLesson.topic.sort_order} will be prepared in parallel.`
                                        : "This is the last assigned lesson right now, so no additional lesson needs to be prepared."}
                                </p>
                            </div>
                            {language !== "en" && (
                                <div className="mt-2.5 border-t border-sky-300/80 pt-2.5 dark:border-sky-800/80">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-950 dark:text-sky-200">
                                        {language === "ja"
                                            ? "次のレッスンの事前準備"
                                            : "Chuẩn bị bài học tiếp theo"}
                                    </p>
                                    <p className="mt-1 text-sm font-semibold leading-6 text-slate-950 dark:text-white">
                                        {language === "ja"
                                            ? nextLesson
                                                ? `クイズを開始をクリックすると、トピック ${nextLesson.topic.sort_order} の「${nextLesson.lesson.title}」がバックグラウンドで並行して準備されます。`
                                                : "これは現在割り当てられている最後のレッスンであるため、追加のレッスンを準備する必要はありません。"
                                            : nextLesson
                                            ? `Khi bạn bấm Bắt đầu làm bài, bài học ${nextLesson.lesson.title} thuộc Chủ đề ${nextLesson.topic.sort_order} sẽ được chuẩn bị song song ở chế độ nền.`
                                            : "Hiện tại đây là bài học cuối cùng được giao, nên không cần chuẩn bị thêm bài học nào."}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                    {pendingDraft ? (
                        <>
                            <Button className="w-full sm:w-auto" onClick={onResumeQuiz}>
                                {language === "ja"
                                    ? "クイズを再開"
                                    : language === "vi"
                                    ? "Tiếp tục làm bài"
                                    : "Resume quiz"}
                            </Button>
                            <Button
                                className="w-full sm:w-auto"
                                variant="outline"
                                onClick={onStartOver}
                            >
                                {language === "ja"
                                    ? "最初からやり直す"
                                    : language === "vi"
                                    ? "Làm lại từ đầu"
                                    : "Start over"}
                            </Button>
                        </>
                    ) : (
                        <Button className="w-full sm:w-auto" onClick={onStartQuiz}>
                            {language === "ja"
                                ? "クイズを開始"
                                : language === "vi"
                                ? "Bắt đầu làm bài"
                                : "Start quiz"}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
