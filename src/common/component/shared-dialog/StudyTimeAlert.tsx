import {
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/shadcn/component/ui/alert-dialog";
import { Button } from "@/shadcn/component/ui/button";

import {
    CalendarDays,
    Sparkles,
    TrendingDown,
    TrendingUp,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { userProfileTexts } from "@/feature/user-profile/userProfileTexts";

type StudyTimeAlertProps = {
    currentMinutes: number;
    newMinutes: number;
    currentDays: number | null;
    newDays: number | null;
    isSaving: boolean;
    errorMessage: string | null;
    onCancel: () => void;
    onConfirm: () => void;
};

export function StudyTimeAlert({
    currentMinutes,
    newMinutes,
    currentDays,
    newDays,
    isSaving,
    errorMessage,
    onCancel,
    onConfirm,
}: StudyTimeAlertProps) {
    const { t } = useTranslation("profile");

    const isIncrease = newMinutes > currentMinutes;

    const formatTimeLabel = (mins: number) => {
        const perDay = t("perDay", { defaultValue: "/ Day" });
        return `${mins} ${t("mins", { defaultValue: "mins" })} ${perDay}`;
    };

    return (
        <AlertDialogContent
            className={`w-[calc(100%-2rem)] max-w-[490px] overflow-hidden rounded-3xl border bg-white p-0 shadow-2xl dark:border-slate-800 dark:bg-slate-900 gap-0 ${
                isIncrease ? "border-emerald-200/70" : "border-orange-200/70"
            }`}
        >
            {/* Header banner */}
            <div
                className={`relative border-b px-6 py-5 dark:border-slate-800/80 dark:from-slate-800/80 dark:via-slate-800/40 dark:to-slate-900 ${
                    isIncrease
                        ? "border-emerald-100/80 bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-sky-50/20"
                        : "border-orange-100/80 bg-gradient-to-br from-amber-50/90 via-orange-50/40 to-rose-50/20"
                }`}
            >
                <AlertDialogHeader className="text-left space-y-0">
                    <div className="flex items-center gap-3.5">
                        <div
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-md ${
                                isIncrease
                                    ? "bg-gradient-to-tr from-emerald-500 to-teal-600 shadow-emerald-500/25"
                                    : "bg-gradient-to-tr from-amber-500 to-orange-600 shadow-orange-500/25"
                            }`}
                        >
                            {isIncrease ? (
                                <TrendingUp className="h-5 w-5" />
                            ) : (
                                <TrendingDown className="h-5 w-5" />
                            )}
                        </div>
                        <div>
                            <AlertDialogTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                                {isIncrease
                                    ? userProfileTexts.increaseDailyStudyTime()
                                    : userProfileTexts.reduceDailyStudyTime()}
                            </AlertDialogTitle>
                            <AlertDialogDescription className="mt-0.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                                {t("confirmNewSchedule", { defaultValue: "Review the impact of this study pace adjustment." })}
                            </AlertDialogDescription>
                        </div>
                    </div>
                </AlertDialogHeader>
            </div>

            {/* Content area */}
            <div className="space-y-4 p-5 sm:p-6">
                {/* Comparison Grid */}
                <div className="grid grid-cols-2 gap-3">
                    {/* Current Pace */}
                    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3.5 text-center dark:border-slate-800 dark:bg-slate-800/60">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            {userProfileTexts.current()}
                        </span>
                        <p className="mt-1 text-base font-bold text-slate-700 dark:text-slate-200">
                            {formatTimeLabel(currentMinutes)}
                        </p>
                    </div>

                    {/* New Pace */}
                    <div
                        className={`rounded-2xl border p-3.5 text-center ${
                            isIncrease
                                ? "border-emerald-200/90 bg-emerald-50/80 dark:border-emerald-900/60 dark:bg-emerald-950/40"
                                : "border-orange-200/90 bg-orange-50/80 dark:border-orange-900/60 dark:bg-orange-950/40"
                        }`}
                    >
                        <span
                            className={`text-[11px] font-bold uppercase tracking-wider ${
                                isIncrease ? "text-emerald-700 dark:text-emerald-400" : "text-orange-700 dark:text-orange-400"
                            }`}
                        >
                            {userProfileTexts.new()}
                        </span>
                        <p
                            className={`mt-1 text-base font-bold ${
                                isIncrease ? "text-emerald-700 dark:text-emerald-300" : "text-orange-700 dark:text-orange-300"
                            }`}
                        >
                            {formatTimeLabel(newMinutes)}
                        </p>
                    </div>
                </div>

                {/* Target Finish Timeline Box */}
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/50">
                    <div className="mb-3 flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                            {userProfileTexts.targetFinish()}
                        </p>
                    </div>

                    <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                            <span>{t("currentPlan", { defaultValue: "Current Plan" })}</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-100">
                                {currentDays == null ? userProfileTexts.estimatePending() : `${currentDays} ${t("days", { defaultValue: "Days" })}`}
                            </span>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-200/60 pt-2 font-bold dark:border-slate-800">
                            <span>{t("newPlan", { defaultValue: "New Plan" })}</span>
                            <span className={isIncrease ? "text-emerald-600 dark:text-emerald-400" : "text-orange-600 dark:text-orange-400"}>
                                {newDays == null ? userProfileTexts.estimatePending() : `${newDays} ${t("days", { defaultValue: "Days" })}`}
                            </span>
                        </div>
                    </div>
                </div>

                {/* AI Advice Callout */}
                <div className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-500 dark:text-amber-400" />
                    <span className="leading-relaxed">
                        {isIncrease
                            ? "AI will schedule more lessons every day and you'll complete your roadmap sooner."
                            : "AI will reduce your daily workload and extend the estimated completion time."}
                    </span>
                </div>

                {errorMessage ? (
                    <div className="text-xs sm:text-sm font-medium text-rose-600 dark:text-rose-400">
                        {errorMessage}
                    </div>
                ) : null}

                {/* Footer Buttons */}
                <AlertDialogFooter className="mt-2 flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
                    <AlertDialogCancel
                        onClick={onCancel}
                        disabled={isSaving}
                        className="h-11 rounded-xl border-slate-200 px-5 font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                        {userProfileTexts.cancel()}
                    </AlertDialogCancel>

                    <Button
                        type="button"
                        disabled={isSaving}
                        onClick={onConfirm}
                        className={`h-11 rounded-xl px-6 font-bold text-white shadow-md transition-all disabled:opacity-50 disabled:shadow-none ${
                            isIncrease
                                ? "bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-500/20 hover:from-emerald-700 hover:to-teal-700"
                                : "bg-gradient-to-r from-orange-600 to-amber-600 shadow-orange-500/20 hover:from-orange-700 hover:to-amber-700"
                        }`}
                    >
                        {isSaving ? userProfileTexts.saving() : t("updatePlan", { defaultValue: "Update Plan" })}
                    </Button>
                </AlertDialogFooter>
            </div>
        </AlertDialogContent>
    );
}
