import {
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from "@/shadcn/component/ui/alert-dialog";

import {
    AlertTriangle,
    BookOpen,
    ArrowRight,
} from "lucide-react";

type ChangeCareerAlertProps = {
    currentCareer: string;
    newCareer: string;
    onConfirm: () => void;
    onCancel: () => void;
};

export function ChangeCareerAlert({
    currentCareer,
    newCareer,
    onConfirm,
    onCancel,
}: ChangeCareerAlertProps) {
    return (
        <AlertDialogContent className="sm:max-w-lg">

            <AlertDialogHeader>

                <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-5 w-5" />
                    Change Career Track
                </AlertDialogTitle>

                <AlertDialogDescription className="space-y-5 pt-3">

                    <p>
                        You are about to change your AI learning roadmap.
                    </p>

                    {/* Current → New */}

                    <div className="rounded-xl border bg-slate-50 p-4">

                        <div className="flex items-center justify-center gap-4">

                            <div className="text-center">
                                <BookOpen className="mx-auto mb-2 h-6 w-6 text-blue-600" />

                                <p className="text-xs text-slate-500">
                                    Current
                                </p>

                                <p className="font-semibold">
                                    {currentCareer}
                                </p>
                            </div>

                            <ArrowRight className="text-slate-400" />

                            <div className="text-center">
                                <BookOpen className="mx-auto mb-2 h-6 w-6 text-green-600" />

                                <p className="text-xs text-slate-500">
                                    New
                                </p>

                                <p className="font-semibold text-green-600">
                                    {newCareer}
                                </p>
                            </div>

                        </div>

                    </div>

                    {/* Warning */}

                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">

                        <p className="font-semibold mb-2">
                            What will happen?
                        </p>

                        <ul className="space-y-2 text-sm">

                            <li>
                                ✅ Your completed lessons will be kept.
                            </li>

                            <li>
                                ✅ Your learning history will remain.
                            </li>

                            <li>
                                ⚠ Today's study plan will be regenerated.
                            </li>

                            <li>
                                ⚠ AI will create a completely new roadmap.
                            </li>

                        </ul>

                    </div>

                </AlertDialogDescription>

            </AlertDialogHeader>

            <AlertDialogFooter>

                <AlertDialogCancel onClick={onCancel}>
                    Cancel
                </AlertDialogCancel>

                <AlertDialogAction
                    onClick={onConfirm}
                    className="bg-blue-600 hover:bg-blue-700"
                >
                    Regenerate Course
                </AlertDialogAction>

            </AlertDialogFooter>

        </AlertDialogContent>
    );
}