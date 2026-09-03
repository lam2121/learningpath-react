import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { userProfileTexts } from "../userProfileTexts";

import {
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/shadcn/component/ui/dialog";

import { Button } from "@/shadcn/component/ui/button";

import { Slider } from "@/shadcn/component/ui/slider";

import {
    Clock3,
    Info,
} from "lucide-react";

type StudyTimeDialogProps = {
    currentHour: number;
    onCancel: () => void;
    onSave: (newHour: number) => void;
};

export function StudyTimeDialog({
    currentHour,
    onCancel,
    onSave,
}: StudyTimeDialogProps) {
    const { t } = useTranslation("profile");
    const [hour, setHour] = useState([currentHour]);

    useEffect(() => {
        setHour([currentHour]);
    }, [currentHour]);

    return (
        <DialogContent className="sm:max-w-lg">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <Clock3 className="h-5 w-5 text-blue-600" />
                    {userProfileTexts.dailyStudyTime()}
                </DialogTitle>

                <DialogDescription>
                    {userProfileTexts.chooseStudyTime()}
                </DialogDescription>
            </DialogHeader>

            <div className="space-y-8 py-4">
                <div className="text-center">
                    <h2 className="text-4xl font-bold text-blue-600">
                        {hour[0]}
                    </h2>

                    <p className="text-slate-500">
                        {userProfileTexts.hoursPerDay(hour[0])}
                    </p>
                </div>

                <Slider
                    value={hour}
                    min={1}
                    max={6}
                    step={1}
                    onValueChange={setHour}
                />

                <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>1 {t("hours", { defaultValue: "Hour" })}</span>
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                        {userProfileTexts.selectedHours(hour[0])}
                    </span>
                    <span>6 {t("hours", { defaultValue: "Hours" })}</span>
                </div>

                <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
                    <div className="flex gap-3">
                        <Info className="h-5 w-5 text-blue-600 mt-0.5" />

                        <div className="text-sm text-slate-600">
                            <p className="font-semibold">
                                {userProfileTexts.aiRecommendation()}
                            </p>

                            <p>
                                {userProfileTexts.aiRecommendationText()}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <DialogFooter>
                <Button
                    variant="outline"
                    onClick={onCancel}
                >
                    {userProfileTexts.cancel()}
                </Button>

                <Button
                    disabled={hour[0] === currentHour}
                    onClick={() => onSave(hour[0])}
                >
                    {userProfileTexts.saveChanges()}
                </Button>
            </DialogFooter>
        </DialogContent>
    );
}
