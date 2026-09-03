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
import { userProfileTexts } from "../userProfileTexts";

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
        <AlertDialogContent className="w-[calc(100%-2rem)] max-w-[540px] rounded-2xl border-slate-200 p-0 shadow-2xl">
            <div className="p-5 sm:p-6">
                <AlertDialogHeader className="text-left">
                    <AlertDialogTitle className="flex items-center gap-3 text-xl font-bold text-slate-900">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100">
                            <AlertTriangle className="h-5 w-5 text-amber-700" />
                        </span>

                        {userProfileTexts.changeCareerTitle()}
                    </AlertDialogTitle>

                    <AlertDialogDescription className="pt-2 text-sm font-medium leading-6 text-slate-600">
                        {userProfileTexts.resetJourneyDesc()}
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="mt-5 rounded-xl border border-amber-200/80 bg-amber-50/70 p-4">
                    <p className="mb-3 font-semibold text-slate-900">
                        {userProfileTexts.beforeYouContinue()}
                    </p>

                    <ul className="space-y-3 text-sm font-medium leading-5 text-slate-700">
                        <li className="flex items-start gap-2.5">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                            <span>{userProfileTexts.retakePlacement()}</span>
                        </li>

                        <li className="flex items-start gap-2.5">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                            <span>{userProfileTexts.progressDeleted()}</span>
                        </li>

                        <li className="flex items-start gap-2.5">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                            <span>{userProfileTexts.newRoadmapCreated()}</span>
                        </li>
                    </ul>

                    <p className="mt-4 border-t border-amber-200 pt-3 text-sm font-bold text-rose-700">
                        {userProfileTexts.actionCannotUndone()}
                    </p>
                </div>

                <AlertDialogFooter className="mt-5 flex-col items-stretch gap-4 sm:flex-col">
                    <label
                        htmlFor="confirm-career-change"
                        className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3"
                    >
                        <Checkbox
                            id="confirm-career-change"
                            checked={confirmed}
                            disabled={isSubmitting}
                            onCheckedChange={(value) => {
                                setConfirmed(value === true);
                            }}
                            className="shrink-0"
                        />

                        <span className="text-sm font-semibold leading-5 text-slate-700">
                            {userProfileTexts.understandDeleted()}
                        </span>
                    </label>

                    {errorMessage ? (
                        <p className="text-sm font-medium text-rose-700">
                            {errorMessage}
                        </p>
                    ) : null}

                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <AlertDialogCancel
                            onClick={onCancel}
                            disabled={isSubmitting}
                            className="mt-0 border-slate-200 text-slate-700"
                        >
                            {userProfileTexts.keepCurrentTrack()}
                        </AlertDialogCancel>

                        <Button
                            type="button"
                            variant="destructive"
                            disabled={!confirmed || isSubmitting}
                            onClick={handleChangeCareerTrack}
                            className="bg-rose-600 font-semibold hover:bg-rose-700 disabled:bg-slate-300"
                        >
                            {isSubmitting ? userProfileTexts.deleting() : userProfileTexts.changeTrack()}
                        </Button>
                    </div>
                </AlertDialogFooter>
            </div>
        </AlertDialogContent>
    );
}
