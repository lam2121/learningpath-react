import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/shadcn/component/ui/alert-dialog";
import { Button } from "@/shadcn/component/ui/button";

export interface QuizIncompleteWarningDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    language: string;
    unansweredCount: number;
    firstUnansweredQuestionIndex: number;
    savingAttempt: boolean;
    onGoToFirstUnanswered: () => void;
    onConfirmSubmit: () => void;
}

export function QuizIncompleteWarningDialog({
    open,
    onOpenChange,
    language,
    unansweredCount,
    firstUnansweredQuestionIndex,
    savingAttempt,
    onGoToFirstUnanswered,
    onConfirmSubmit,
}: QuizIncompleteWarningDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="rounded-3xl border-slate-200 p-0 shadow-2xl dark:border-slate-800">
                <div className="p-6 sm:p-7">
                    <AlertDialogHeader className="text-left">
                        <AlertDialogTitle className="text-xl font-bold text-slate-950 dark:text-white">
                            Submit quiz with unanswered questions?
                        </AlertDialogTitle>
                        {language !== "en" && (
                            <p className="mt-1 text-sm font-bold text-slate-950 dark:text-white">
                                {language === "ja"
                                    ? "未解答の問題がある状態でクイズを提出しますか？"
                                    : "Nộp bài kiểm tra khi còn câu chưa trả lời?"}
                            </p>
                        )}
                        <AlertDialogDescription className="pt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">
                            <span>
                                You still have {unansweredCount} unanswered question
                                {unansweredCount === 1 ? "" : "s"}. If you submit now, those
                                questions will be graded as unanswered and the answers will
                                stay hidden unless you pass.
                            </span>
                            {language !== "en" && (
                                <span className="mt-2 block border-t border-slate-200/80 pt-2 font-bold text-slate-950 dark:border-slate-800 dark:text-white">
                                    {language === "ja"
                                        ? `まだ${unansweredCount}問の未解答問題があります。今提出すると未解答として採点され、合格しない限り正解は表示されません。`
                                        : `Bạn vẫn còn ${unansweredCount} câu hỏi chưa trả lời. Nếu nộp ngay bây giờ, những câu này sẽ bị tính là chưa làm và đáp án sẽ được ẩn trừ khi bạn đạt.`}
                                </span>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm font-medium text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
                        <p>
                            Jump to the first unanswered question to finish faster, or submit
                            the quiz as-is.
                        </p>
                        {language !== "en" && (
                            <p className="mt-1.5 border-t border-amber-200/80 pt-1.5 font-bold text-amber-950 dark:border-amber-800/60 dark:text-amber-100">
                                {language === "ja"
                                    ? "最初の未解答問題に移動して解答を完了するか、このままクイズを提出してください。"
                                    : "Chuyển đến câu chưa trả lời đầu tiên để hoàn thành nhanh hơn, hoặc nộp bài như hiện tại."}
                            </p>
                        )}
                    </div>

                    <AlertDialogFooter className="mt-6">
                        <AlertDialogCancel>
                            {language === "ja"
                                ? "戻る"
                                : language === "vi"
                                ? "Quay lại"
                                : "Go back"}
                        </AlertDialogCancel>
                        {firstUnansweredQuestionIndex >= 0 ? (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onGoToFirstUnanswered}
                            >
                                {language === "ja"
                                    ? `第${firstUnansweredQuestionIndex + 1}問へ移動`
                                    : language === "vi"
                                    ? `Đến câu ${firstUnansweredQuestionIndex + 1}`
                                    : `Go to question ${firstUnansweredQuestionIndex + 1}`}
                            </Button>
                        ) : null}
                        <AlertDialogAction
                            onClick={onConfirmSubmit}
                            disabled={savingAttempt}
                        >
                            {language === "ja"
                                ? "そのまま提出"
                                : language === "vi"
                                ? "Vẫn nộp bài"
                                : "Submit anyway"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </div>
            </AlertDialogContent>
        </AlertDialog>
    );
}
