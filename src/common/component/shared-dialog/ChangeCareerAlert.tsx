import {
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/shadcn/component/ui/alert-dialog";
import { Button } from "@/shadcn/component/ui/button";
import { Checkbox } from "@/shadcn/component/ui/checkbox";
import {
    AlertTriangle,
    Check,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { userProfileTexts } from "@/feature/user-profile/userProfileTexts";

type ChangeCareerAlertProps = {
    onConfirm: () => void | Promise<void>;
    onCancel: () => void;
    isSubmitting?: boolean;
    errorMessage?: string | null;
};

export function ChangeCareerAlert({
    onConfirm,
    onCancel,
    isSubmitting = false,
    errorMessage = null,
}: ChangeCareerAlertProps) {
    useTranslation("profile");
    const [confirmed, setConfirmed] = useState(false);

    const handleChangeCareerTrack = () => {
        if (!confirmed || isSubmitting) return;

        void onConfirm();
    };

    return (
        <AlertDialogContent className="w-[calc(100%-2rem)] max-w-[500px] overflow-hidden rounded-3xl border border-rose-200/70 bg-white p-0 shadow-2xl dark:border-slate-800 dark:bg-slate-900 gap-0">
            {/* Header banner with warm alert gradient */}
            <div className="relative border-b border-amber-100/80 bg-gradient-to-br from-amber-50/90 via-rose-50/40 to-orange-50/20 px-6 py-5 dark:border-slate-800/80 dark:from-slate-800/80 dark:via-slate-800/40 dark:to-slate-900">
                <AlertDialogHeader className="text-left space-y-0">
                    <div className="flex items-center gap-3.5">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 text-white shadow-md shadow-orange-500/25">
                            <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div>
                            <AlertDialogTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                                {userProfileTexts.changeCareerTitle()}
                            </AlertDialogTitle>
                            <AlertDialogDescription className="mt-0.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                                {userProfileTexts.resetJourneyDesc()}
                            </AlertDialogDescription>
                        </div>
                    </div>
                </AlertDialogHeader>
            </div>

            <div className="space-y-4 p-5 sm:p-6">
                {/* Warning details callout */}
                <div className="rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50/70 to-orange-50/30 p-4 sm:p-5 dark:border-amber-900/40 dark:bg-amber-950/20">
                    <p className="mb-3 text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300">
                        {userProfileTexts.beforeYouContinue()}
                    </p>

                    <ul className="space-y-2.5 text-sm font-medium leading-5 text-slate-700 dark:text-slate-300">
                        <li className="flex items-start gap-2.5">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-200/80 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                                <Check className="h-3 w-3 stroke-[3]" />
                            </span>
                            <span>{userProfileTexts.retakePlacement()}</span>
                        </li>

                        <li className="flex items-start gap-2.5">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-200/80 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                                <Check className="h-3 w-3 stroke-[3]" />
                            </span>
                            <span>{userProfileTexts.progressDeleted()}</span>
                        </li>

                        <li className="flex items-start gap-2.5">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-200/80 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                                <Check className="h-3 w-3 stroke-[3]" />
                            </span>
                            <span>{userProfileTexts.newRoadmapCreated()}</span>
                        </li>
                    </ul>

                    <div className="mt-3.5 flex items-center gap-2 rounded-xl border border-rose-200/80 bg-rose-100/70 px-3 py-2 text-xs font-bold text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/60 dark:text-rose-300">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        <span>{userProfileTexts.actionCannotUndone()}</span>
                    </div>
                </div>

                {/* Confirmation Checkbox */}
                <label
                    htmlFor="confirm-career-change"
                    className="group flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200/90 bg-slate-50/70 p-3.5 transition-all hover:border-slate-300 hover:bg-slate-100/70 dark:border-slate-800 dark:bg-slate-800/50 dark:hover:bg-slate-800"
                >
                    <Checkbox
                        id="confirm-career-change"
                        checked={confirmed}
                        disabled={isSubmitting}
                        onCheckedChange={(value) => {
                            setConfirmed(value === true);
                        }}
                        className="mt-0.5 shrink-0"
                    />

                    <span className="text-sm font-semibold leading-5 text-slate-700 transition-colors group-hover:text-slate-900 dark:text-slate-300 dark:group-hover:text-white">
                        {userProfileTexts.understandDeleted()}
                    </span>
                </label>

                {errorMessage ? (
                    <p className="text-xs sm:text-sm font-medium text-rose-600 dark:text-rose-400">
                        {errorMessage}
                    </p>
                ) : null}

                {/* Footer Buttons */}
                <AlertDialogFooter className="mt-2 flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
                    <AlertDialogCancel
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="h-11 rounded-xl border-slate-200 px-5 font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                        {userProfileTexts.keepCurrentTrack()}
                    </AlertDialogCancel>

                    <Button
                        type="button"
                        variant="destructive"
                        disabled={!confirmed || isSubmitting}
                        onClick={handleChangeCareerTrack}
                        className="h-11 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 px-6 font-bold text-white shadow-md shadow-rose-600/20 transition-all hover:from-rose-700 hover:to-red-700 disabled:opacity-50 disabled:shadow-none"
                    >
                        {isSubmitting ? userProfileTexts.deleting() : userProfileTexts.changeTrack()}
                    </Button>
                </AlertDialogFooter>
            </div>
        </AlertDialogContent>
    );
}
