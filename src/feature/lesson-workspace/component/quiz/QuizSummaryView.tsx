import { CheckCircle2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/shadcn/component/ui/button";
import type { LessonQuizStateResponse } from "@/feature/learning-path/api/roadmapApi";
import type {
    EmbeddedQuizQuestion,
    LessonLookup,
} from "../../type/lessonWorkspace";
import {
    HINT_CREDIT,
    HINT_UNLOCK_AFTER_FAILURES,
} from "../../util/embeddedQuizPersistence";
import { formatLabel, formatPercent } from "../../util/lessonFormatters";

export interface QuizSummaryViewProps {
    language: string;
    questions: EmbeddedQuizQuestion[];
    totalQuestions: number;
    displayedCorrectCount: number;
    displayedWeightedScorePercent: number;
    currentAttemptPassed: boolean;
    lessonPassed: boolean;
    savedQuizState: LessonQuizStateResponse | null;
    displayedCorrectNoHintCount: number;
    displayedCorrectWithHintCount: number;
    failedAttempts: number;
    nextLesson: LessonLookup | null;
    nextLessonIsReady: boolean;
    hintModeUnlocked: boolean;
    isQuestionCorrect: (question: EmbeddedQuizQuestion, index: number) => boolean;
    onRestart: () => void;
    onReviewQuestion: (index: number) => void;
}

export function QuizSummaryView({
    language,
    questions,
    totalQuestions,
    displayedCorrectCount,
    displayedWeightedScorePercent,
    currentAttemptPassed,
    lessonPassed,
    savedQuizState,
    displayedCorrectNoHintCount,
    displayedCorrectWithHintCount,
    failedAttempts,
    nextLesson,
    nextLessonIsReady,
    hintModeUnlocked,
    isQuestionCorrect,
    onRestart,
    onReviewQuestion,
}: QuizSummaryViewProps) {
    return (
        <section className="space-y-5">
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm">
                        <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-800 dark:text-slate-200">
                            Quiz complete{" "}
                            {language !== "en" &&
                                `· ${language === "ja" ? "クイズ完了" : "Hoàn thành kiểm tra"}`}
                        </p>
                        <h3 className="text-2xl font-extrabold text-slate-950 dark:text-white">
                            {displayedCorrectCount} / {totalQuestions} correct
                            {language !== "en" && (
                                <span className="ml-2 text-xl font-extrabold text-emerald-800 dark:text-emerald-200">
                                    ({displayedCorrectCount} / {totalQuestions}{" "}
                                    {language === "ja" ? "問正解" : "câu đúng"})
                                </span>
                            )}
                        </h3>
                        <p className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
                            Weighted score: {formatPercent(displayedWeightedScorePercent)}
                            {currentAttemptPassed
                                ? " · Passed"
                                : lessonPassed
                                ? " · Lesson already passed previously"
                                : " · Pass requires 70%"}
                        </p>
                        {language !== "en" && (
                            <p className="mt-1 text-sm font-extrabold text-slate-950 dark:text-white">
                                {language === "ja"
                                    ? `加重スコア: ${formatPercent(displayedWeightedScorePercent)}${
                                          currentAttemptPassed
                                              ? " · 合格"
                                              : lessonPassed
                                              ? " · 以前に合格済み"
                                              : " · 合格には70%以上必要"
                                      }`
                                    : `Điểm trọng số: ${formatPercent(displayedWeightedScorePercent)}${
                                          currentAttemptPassed
                                              ? " · Đã đạt"
                                              : lessonPassed
                                              ? " · Bài học đã đạt trước đó"
                                              : " · Cần 70% để đạt"
                                      }`}
                            </p>
                        )}
                    </div>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-700 dark:text-slate-200">
                    {currentAttemptPassed
                        ? "You passed this lesson check. Review any question from the navigator above, restart if you want another attempt, or continue once the next lesson is ready."
                        : lessonPassed
                        ? "This retake did not pass, but the lesson is already marked as passed. You can review any question, restart again, or continue once the next lesson is ready."
                        : "Review any question from the navigator above, or restart the quiz to try again."}
                </p>
                {language !== "en" && (
                    <p className="mt-2 border-t border-slate-200/80 pt-2 text-sm font-semibold leading-6 text-slate-950 dark:border-slate-800 dark:text-white">
                        {language === "ja"
                            ? currentAttemptPassed
                                ? "レッスンチェックに合格しました。上部のナビゲーターから問題を確認するか、再挑戦するか、次のレッスンの準備ができたら次に進んでください。"
                                : lessonPassed
                                ? "今回の再挑戦は不合格でしたが、レッスンはすでに合格扱いとなっています。問題を確認するか、再挑戦するか、次のレッスンへ進むことができます。"
                                : "上部のナビゲーターから問題を確認するか、クイズをやり直してください。"
                            : currentAttemptPassed
                            ? "Bạn đã vượt qua bài kiểm tra bài học này. Xem lại các câu hỏi từ thanh điều hướng ở trên, làm lại nếu muốn thử lần nữa, hoặc tiếp tục khi bài học tiếp theo sẵn sàng."
                            : lessonPassed
                            ? "Lần làm lại này chưa đạt, nhưng bài học đã được tính là hoàn thành trước đó. Bạn có thể xem lại câu hỏi, làm lại bài, hoặc tiếp tục khi bài học tiếp theo sẵn sàng."
                            : "Xem lại bất kỳ câu hỏi nào từ thanh điều hướng ở trên, hoặc làm lại bài kiểm tra để thử lại."}
                    </p>
                )}
                {savedQuizState?.current_skill_score !== null &&
                savedQuizState?.current_skill_score !== undefined ? (
                    <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-4 text-sm font-medium text-sky-950 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-100">
                        <div>
                            Current {formatLabel(savedQuizState.skill)} radar score:{" "}
                            <strong className="font-bold">
                                {formatPercent(savedQuizState.current_skill_score)}
                            </strong>
                            {savedQuizState.first_pass_score_percent !== null &&
                            savedQuizState.first_pass_score_percent !== undefined
                                ? ` · First pass recorded at ${formatPercent(
                                      savedQuizState.first_pass_score_percent,
                                  )}.`
                                : ""}
                        </div>
                        {language !== "en" && (
                            <div className="mt-1.5 border-t border-sky-200/80 pt-1.5 font-bold text-sky-950 dark:border-sky-900/60 dark:text-sky-100">
                                {language === "ja"
                                    ? `現在の${formatLabel(savedQuizState.skill)}レーダースコア: `
                                    : `Điểm radar ${formatLabel(savedQuizState.skill)} hiện tại: `}
                                <strong className="font-extrabold">
                                    {formatPercent(savedQuizState.current_skill_score)}
                                </strong>
                                {savedQuizState.first_pass_score_percent !== null &&
                                savedQuizState.first_pass_score_percent !== undefined
                                    ? language === "ja"
                                        ? ` · 初回合格記録: ${formatPercent(
                                              savedQuizState.first_pass_score_percent,
                                          )}`
                                        : ` · Điểm lần đầu đạt: ${formatPercent(
                                              savedQuizState.first_pass_score_percent,
                                          )}`
                                    : ""}
                            </div>
                        )}
                    </div>
                ) : null}
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/60">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-700 dark:text-slate-300">
                            Correct without hint
                        </p>
                        {language !== "en" && (
                            <p className="text-xs font-bold text-slate-950 dark:text-white">
                                {language === "ja" ? "ヒントなし正解" : "Đúng không gợi ý"}
                            </p>
                        )}
                        <p className="mt-1 text-lg font-bold text-slate-950 dark:text-white">
                            {displayedCorrectNoHintCount}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/60">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-700 dark:text-slate-300">
                            Correct with hint
                        </p>
                        {language !== "en" && (
                            <p className="text-xs font-bold text-slate-950 dark:text-white">
                                {language === "ja" ? "ヒントあり正解" : "Đúng có gợi ý"}
                            </p>
                        )}
                        <p className="mt-1 text-lg font-bold text-slate-950 dark:text-white">
                            {displayedCorrectWithHintCount}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/60">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-700 dark:text-slate-300">
                            Failed attempts
                        </p>
                        {language !== "en" && (
                            <p className="text-xs font-bold text-slate-950 dark:text-white">
                                {language === "ja" ? "不合格回数" : "Số lần chưa đạt"}
                            </p>
                        )}
                        <p className="mt-1 text-lg font-bold text-slate-950 dark:text-white">
                            {failedAttempts}
                        </p>
                    </div>
                </div>
                {!lessonPassed && (
                    <div className="mt-4 grid gap-3 lg:grid-cols-2">
                        {nextLesson ? (
                            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 dark:border-amber-900 dark:bg-amber-950/40">
                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-800 dark:text-amber-300">
                                    Next lesson lock
                                </p>
                                <p className="mt-2 text-sm font-medium text-amber-950 dark:text-amber-200">
                                    {nextLessonIsReady
                                        ? "The next lesson is ready, but it stays locked until you pass this quiz with a weighted score of at least 70%."
                                        : "The next lesson stays locked until you pass this quiz with a weighted score of at least 70%."}
                                </p>
                                {language !== "en" && (
                                    <p className="mt-1.5 border-t border-amber-200/80 pt-1.5 text-sm font-bold text-amber-950 dark:border-amber-800/60 dark:text-amber-100">
                                        {language === "ja"
                                            ? nextLessonIsReady
                                                ? "次のレッスンは準備完了していますが、このクイズで70%以上のスコアを獲得して合格するまでロックされます。"
                                                : "このクイズで70%以上のスコアを獲得して合格するまで、次のレッスンはロックされたままになります。"
                                            : nextLessonIsReady
                                            ? "Bài học tiếp theo đã sẵn sàng, nhưng sẽ vẫn bị khóa cho đến khi bạn vượt qua bài kiểm tra này với điểm trọng số từ 70% trở lên."
                                            : "Bài học tiếp theo sẽ vẫn bị khóa cho đến khi bạn vượt qua bài kiểm tra này với điểm trọng số từ 70% trở lên."}
                                    </p>
                                )}
                            </div>
                        ) : !hintModeUnlocked &&
                          failedAttempts + 1 === HINT_UNLOCK_AFTER_FAILURES ? (
                            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 dark:border-amber-900 dark:bg-amber-950/40">
                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-800 dark:text-amber-300">
                                    Hint mode
                                </p>
                                <p className="mt-2 text-sm font-medium text-amber-950 dark:text-amber-200">
                                    One more failed attempt will unlock hint mode for this lesson.
                                </p>
                                {language !== "en" && (
                                    <p className="mt-1.5 border-t border-amber-200/80 pt-1.5 text-sm font-bold text-amber-950 dark:border-amber-800/60 dark:text-amber-100">
                                        {language === "ja"
                                            ? "あと1回不合格になると、このレッスンのヒントモードが解除されます。"
                                            : "Thêm 1 lần làm bài không đạt nữa sẽ mở khóa chế độ gợi ý cho bài học này."}
                                    </p>
                                )}
                            </div>
                        ) : null}
                        {hintModeUnlocked ? (
                            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 dark:border-amber-900 dark:bg-amber-950/40">
                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-800 dark:text-amber-300">
                                    Hint mode
                                </p>
                                <p className="mt-2 text-sm font-medium text-amber-950 dark:text-amber-200">
                                    Hint mode is now available on your next retry. Each hinted
                                    answer auto-fills the correct response and counts as{" "}
                                    {Math.round(HINT_CREDIT * 100)}% credit.
                                </p>
                                {language !== "en" && (
                                    <p className="mt-1.5 border-t border-amber-200/80 pt-1.5 text-sm font-bold text-amber-950 dark:border-amber-800/60 dark:text-amber-100">
                                        {language === "ja"
                                            ? `次回の挑戦でヒントモードが利用可能です。ヒントを使用した回答は自動的に正解が入力され、${Math.round(
                                                  HINT_CREDIT * 100,
                                              )}%のスコアとしてカウントされます。`
                                            : `Chế độ gợi ý đã khả dụng cho lần làm lại tiếp theo. Mỗi câu trả lời dùng gợi ý sẽ tự động điền đáp án đúng và được tính ${Math.round(
                                                  HINT_CREDIT * 100,
                                              )}% số điểm.`}
                                    </p>
                                )}
                            </div>
                        ) : null}
                    </div>
                )}
                <div className="mt-5 flex flex-wrap gap-3">
                    <Button className="w-full sm:w-auto font-semibold" onClick={onRestart}>
                        {language === "ja"
                            ? "クイズをやり直す"
                            : language === "vi"
                            ? "Làm lại bài kiểm tra"
                            : "Restart quiz"}
                    </Button>
                    <Button
                        className="w-full sm:w-auto font-semibold"
                        variant="outline"
                        onClick={() => onReviewQuestion(0)}
                    >
                        {language === "ja"
                            ? "第1問から復習"
                            : language === "vi"
                            ? "Xem lại từ câu 1"
                            : "Review from question 1"}
                    </Button>
                    {nextLesson && nextLessonIsReady && lessonPassed ? (
                        <Button asChild className="w-full sm:w-auto font-semibold">
                            <Link
                                to="/lessons/$lessonId"
                                params={{ lessonId: String(nextLesson.lesson.id) }}
                            >
                                {language === "ja"
                                    ? "次のレッスンへ進む"
                                    : language === "vi"
                                    ? "Tiếp tục bài học tiếp theo"
                                    : "Continue to next lesson"}
                            </Link>
                        </Button>
                    ) : null}
                </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {questions.map((question, index) => {
                    const isCorrect = isQuestionCorrect(question, index);
                    return (
                        <button
                            key={`summary-${question.id}`}
                            type="button"
                            onClick={() => onReviewQuestion(index)}
                            className={[
                                "rounded-2xl border px-4 py-4 text-left transition-all shadow-sm hover:shadow",
                                isCorrect
                                    ? "border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100"
                                    : "border-rose-300 bg-rose-50 text-rose-950 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-100",
                            ].join(" ")}
                        >
                            <p className="text-xs font-extrabold uppercase tracking-[0.16em]">
                                Question {index + 1}{" "}
                                {language !== "en" &&
                                    `(${
                                        language === "ja"
                                            ? `第${index + 1}問`
                                            : `Câu ${index + 1}`
                                    })`}
                            </p>
                            <p className="mt-2 text-base font-bold">
                                {question.type
                                    ? question.type.replace("_", " ")
                                    : "Question"}
                            </p>
                            <p className="mt-2 text-sm font-bold">
                                {isCorrect
                                    ? language === "ja"
                                        ? "Correct · 正解"
                                        : language === "vi"
                                        ? "Correct · Đúng"
                                        : "Correct"
                                    : language === "ja"
                                    ? "Needs review · 要復習"
                                    : language === "vi"
                                    ? "Needs review · Cần ôn lại"
                                    : "Needs review"}
                            </p>
                        </button>
                    );
                })}
            </div>
        </section>
    );
}
