import { AlertCircle } from 'lucide-react';
import { Button } from '@/shadcn/component/ui/button';

interface TopicQuizQuitDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirmExit: () => void;
}

export function TopicQuizQuitDialog({
    isOpen,
    onClose,
    onConfirmExit,
}: TopicQuizQuitDialogProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
                    <AlertCircle className="h-6 w-6" />
                </div>
                <h3 className="text-center text-lg font-bold text-slate-900 dark:text-white">Exit Topic Quiz?</h3>

                <div className="mt-3 rounded-xl border border-rose-200/80 bg-rose-50/80 p-3.5 text-center text-xs leading-relaxed text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
                    <p className="font-bold">⚠️ No Drafts or Mid-Quiz Resumption</p>
                    <p className="mt-1">
                        Your answers cannot be saved as a draft or resumed midway. If you exit now, all current progress will be lost and you must restart the quiz from the very beginning (Question 1).
                    </p>
                </div>

                <div className="mt-6 flex gap-3">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="h-10 flex-1 rounded-xl text-sm font-semibold"
                    >
                        Stay & Finish
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onConfirmExit}
                        className="h-10 flex-1 rounded-xl text-sm font-bold shadow-sm"
                    >
                        Exit & Discard
                    </Button>
                </div>
            </div>
        </div>
    );
}
