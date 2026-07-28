import {
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/shadcn/component/ui/alert-dialog";

import {
    TrendingUp,
    TrendingDown,
    Clock3,
} from "lucide-react";

type StudyTimeAlertProps = {
    currentHour: number;
    newHour: number;
    onCancel: () => void;
    onConfirm: () => void;
};

export function StudyTimeAlert({
    currentHour,
    newHour,
    onCancel,
    onConfirm,
}: StudyTimeAlertProps) {

    const isIncrease = newHour > currentHour;

    // Demo
    const currentDays = 60;
    const newDays = Math.round(currentDays * currentHour / newHour);

    return (
        <AlertDialogContent className="sm:max-w-lg">

            <AlertDialogHeader>

                <AlertDialogTitle className="flex items-center gap-2">

                    {isIncrease ? (
                        <>
                            <TrendingUp className="h-5 w-5 text-green-600" />
                            Increase Daily Study Time
                        </>
                    ) : (
                        <>
                            <TrendingDown className="h-5 w-5 text-orange-600" />
                            Reduce Daily Study Time
                        </>
                    )}

                </AlertDialogTitle>

                <AlertDialogDescription className="space-y-5 pt-3">

                    <div className="rounded-xl border bg-slate-50 p-4">

                        <div className="flex items-center justify-center gap-8">

                            <div className="text-center">

                                <Clock3 className="mx-auto mb-2 h-6 w-6 text-blue-600" />

                                <p className="text-xs text-slate-500">
                                    Current
                                </p>

                                <p className="font-semibold">
                                    {currentHour} Hours / Day
                                </p>

                            </div>

                            <div className="text-center">

                                <Clock3
                                    className={`mx-auto mb-2 h-6 w-6 ${isIncrease
                                        ? "text-green-600"
                                        : "text-orange-600"
                                        }`}
                                />

                                <p className="text-xs text-slate-500">
                                    New
                                </p>

                                <p
                                    className={`font-semibold ${isIncrease
                                        ? "text-green-600"
                                        : "text-orange-600"
                                        }`}
                                >
                                    {newHour} Hours / Day
                                </p>

                            </div>

                        </div>

                    </div>

                    <div
                        className={`rounded-xl border p-4 ${isIncrease
                            ? "border-green-200 bg-green-50"
                            : "border-orange-200 bg-orange-50"
                            }`}
                    >

                        <p className="font-semibold mb-3">

                            Estimated Completion

                        </p>

                        <div className="flex justify-between">

                            <span>Current Plan</span>

                            <span className="font-semibold">
                                {currentDays} Days
                            </span>

                        </div>

                        <div className="flex justify-between mt-2">

                            <span>New Plan</span>

                            <span
                                className={`font-semibold ${isIncrease
                                    ? "text-green-600"
                                    : "text-orange-600"
                                    }`}
                            >
                                {newDays} Days
                            </span>

                        </div>

                    </div>

                    <div className="text-sm text-slate-500">

                        {isIncrease
                            ? "AI will schedule more lessons every day and you'll complete your roadmap sooner."
                            : "AI will reduce your daily workload and extend the estimated completion time."}

                    </div>

                </AlertDialogDescription>

            </AlertDialogHeader>

            <AlertDialogFooter>

                <AlertDialogCancel onClick={onCancel}>
                    Cancel
                </AlertDialogCancel>

                <AlertDialogAction
                    onClick={onConfirm}
                    className={
                        isIncrease
                            ? "bg-green-600 hover:bg-green-700"
                            : "bg-orange-600 hover:bg-orange-700"
                    }
                >
                    Update Plan
                </AlertDialogAction>

            </AlertDialogFooter>

        </AlertDialogContent>
    );
}