import { useState } from "react";

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

    const [hour, setHour] = useState([currentHour]);

    return (
        <DialogContent className="sm:max-w-lg">

            <DialogHeader>

                <DialogTitle className="flex items-center gap-2">
                    <Clock3 className="h-5 w-5 text-blue-600" />
                    Daily Study Time
                </DialogTitle>

                <DialogDescription>
                    Choose how much time you want to study each day.
                </DialogDescription>

            </DialogHeader>

            <div className="space-y-8 py-4">

                <div className="text-center">

                    <h2 className="text-4xl font-bold text-blue-600">
                        {hour[0]}
                    </h2>

                    <p className="text-slate-500">
                        {hour[0] === 1 ? "Hour / Day" : "Hours / Day"}
                    </p>

                </div>

                <Slider
                    value={hour}
                    min={1}
                    max={6}
                    step={1}
                    onValueChange={setHour}
                />

                <div className="flex justify-between text-xs text-slate-400">
                    <span>1 Hour</span>
                    <span>6 Hours</span>
                </div>

                <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">

                    <div className="flex gap-3">

                        <Info className="h-5 w-5 text-blue-600 mt-0.5" />

                        <div className="text-sm text-slate-600">

                            <p className="font-semibold">
                                AI Recommendation
                            </p>

                            <p>
                                2 hours per day provides the best balance
                                between learning speed and long-term retention.
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
                    Cancel
                </Button>

                <Button
                    disabled={hour[0] === currentHour}
                    onClick={() => onSave(hour[0])}
                >
                    Save Changes
                </Button>

            </DialogFooter>

        </DialogContent>
    );
}