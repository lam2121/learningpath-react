import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { userProfileTexts } from "@/feature/user-profile/userProfileTexts";

import {
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "@/shadcn/component/ui/dialog";

import { Button } from "@/shadcn/component/ui/button";
import { Slider } from "@/shadcn/component/ui/slider";

import {
    Brain,
    Clock3,
    Sparkles,
    X,
} from "lucide-react";

type StudyTimeDialogProps = {
    open?: boolean;
    currentMinutes?: number;
    onCancel: () => void;
    onSave: (newMinutes: number) => void;
};

const PRESETS = [30, 60, 90, 120, 180, 240];

export function StudyTimeDialog({
    open,
    currentMinutes,
    onCancel,
    onSave,
}: StudyTimeDialogProps) {
    const { t } = useTranslation("profile");

    const initialMinutes = currentMinutes ?? 120;
    const [minutes, setMinutes] = useState([initialMinutes]);

    useEffect(() => {
        if (open !== false) {
            setMinutes([currentMinutes ?? 120]);
        }
    }, [open, currentMinutes]);

    const currentVal = minutes[0];

    const formatPerDay = (mins: number) => {
        const perDay = t("perDay", { defaultValue: "/ Day" });
        return `${mins} ${t("mins", { defaultValue: "mins" })} ${perDay}`;
    };

    const handleCancel = () => {
        setMinutes([currentMinutes ?? 120]);
        onCancel();
    };

    return (
        <DialogContent
            showCloseButton={false}
            className="w-[calc(100%-2rem)] sm:max-w-[480px] overflow-hidden rounded-3xl border border-emerald-200/70 bg-white p-0 shadow-2xl dark:border-slate-800 dark:bg-slate-900 gap-0"
        >
            {/* Header banner with emerald gradient */}
            <div className="relative border-b border-emerald-100/80 bg-gradient-to-br from-emerald-50/80 via-teal-50/40 to-sky-50/20 px-6 py-5 dark:border-slate-800/80 dark:from-slate-800/80 dark:via-slate-800/40 dark:to-slate-900">
                <DialogClose asChild>
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-200/60 hover:text-slate-700 dark:hover:bg-slate-700/60 dark:hover:text-slate-200 focus:outline-hidden"
                        aria-label="Close"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </DialogClose>

                <div className="flex items-center gap-3.5 pr-8">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25">
                        <Clock3 className="h-5 w-5" />
                    </div>
                    <div>
                        <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                            {userProfileTexts.dailyStudyTime()}
                        </DialogTitle>
                        <DialogDescription className="mt-0.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                            {userProfileTexts.chooseStudyTime()}
                        </DialogDescription>
                    </div>
                </div>
            </div>

            {/* Content area */}
            <div className="space-y-5 p-5 sm:p-6">
                {/* Time Display Card */}
                <div className="rounded-2xl border border-emerald-100/90 bg-gradient-to-b from-emerald-50/60 via-teal-50/20 to-white p-5 text-center shadow-xs dark:border-emerald-900/40 dark:bg-gradient-to-b dark:from-emerald-950/30 dark:to-slate-900">
                    <div className="inline-flex items-baseline justify-center gap-1.5">
                        <span className="text-5xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
                            {currentVal}
                        </span>
                        <span className="text-lg font-bold text-slate-500 dark:text-slate-400">
                            {t("mins", { defaultValue: "mins" })}
                        </span>
                    </div>

                    <div className="mt-2 flex items-center justify-center">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/70 bg-emerald-100/80 px-3 py-1 text-xs font-bold text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/80 dark:text-emerald-300">
                            <Sparkles className="h-3 w-3" />
                            {formatPerDay(currentVal)}
                        </span>
                    </div>
                </div>

                {/* Quick Presets */}
                <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {t("quickSelect", { defaultValue: "Quick Presets" })}
                    </p>
                    <div className="grid grid-cols-6 gap-1.5">
                        {PRESETS.map((preset) => {
                            const isSelected = currentVal === preset;
                            return (
                                <button
                                    key={preset}
                                    type="button"
                                    onClick={() => setMinutes([preset])}
                                    className={`rounded-xl py-2 text-xs font-bold transition-all ${
                                        isSelected
                                            ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/25 scale-[1.03]"
                                            : "border border-slate-200/80 bg-slate-50/80 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/50 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-slate-800"
                                    }`}
                                >
                                    {preset}m
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Slider */}
                <div className="space-y-2 pt-1">
                    <Slider
                        value={minutes}
                        min={5}
                        max={360}
                        step={5}
                        onValueChange={setMinutes}
                        className="py-1"
                    />
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-400 dark:text-slate-500">
                        <span>5 {t("mins", { defaultValue: "mins" })}</span>
                        <span className="text-emerald-600 dark:text-emerald-400">
                            {t("selectedMinutes", { minutes: currentVal, defaultValue: `Selected: ${currentVal} mins` })}
                        </span>
                        <span>360 {t("mins", { defaultValue: "mins" })}</span>
                    </div>
                </div>

                {/* AI Recommendation Box */}
                <div className="rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50/70 to-blue-50/30 p-4 dark:border-sky-900/40 dark:bg-sky-950/20">
                    <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600 dark:bg-sky-900/60 dark:text-sky-400">
                            <Brain className="h-4 w-4" />
                        </div>
                        <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                            <p className="font-bold text-slate-900 dark:text-white">
                                {userProfileTexts.aiRecommendation()}
                            </p>
                            <p className="mt-0.5 leading-relaxed">
                                {userProfileTexts.aiRecommendationText()}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 bg-slate-50/50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/50">
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    className="h-11 rounded-xl border-slate-200 px-5 font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                    {userProfileTexts.cancel()}
                </Button>

                <Button
                    type="button"
                    disabled={currentVal === (currentMinutes ?? 120)}
                    onClick={() => onSave(currentVal)}
                    className="h-11 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 font-bold text-white shadow-md shadow-emerald-500/20 transition-all hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:shadow-none"
                >
                    {userProfileTexts.saveChanges()}
                </Button>
            </div>
        </DialogContent>
    );
}
