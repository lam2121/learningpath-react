import { useState } from "react";

import {
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/shadcn/component/ui/dialog";

import { Button } from "@/shadcn/component/ui/button";
import {
    RadioGroup,
    RadioGroupItem,
} from "@/shadcn/component/ui/radio-group";
import { Label } from "@/shadcn/component/ui/label";

type CareerTrackDialogProps = {
    currentCareer: string;
    onCancel: () => void;
    onContinue: (newCareer: string) => void;
};

const careers = [
    "Frontend Developer",
    "Backend Developer",
    "Full Stack Developer",
    "AI Engineer",
    "Data Engineer",
    "DevOps Engineer",
];

export function CareerTrackDialog({
    currentCareer,
    onCancel,
    onContinue,
}: CareerTrackDialogProps) {
    const [selectedCareer, setSelectedCareer] =
        useState(currentCareer);

    return (
        <DialogContent className="sm:max-w-lg">
            <DialogHeader>
                <DialogTitle>
                    Change Career Track
                </DialogTitle>

                <DialogDescription>
                    Select the career path you want AI to generate.
                </DialogDescription>
            </DialogHeader>

            <RadioGroup
                value={selectedCareer}
                onValueChange={setSelectedCareer}
                className="space-y-3 mt-4"
            >
                {careers.map((career) => (
                    <div
                        key={career}
                        className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-slate-50"
                    >
                        <RadioGroupItem
                            value={career}
                            id={career}
                        />

                        <Label
                            htmlFor={career}
                            className="flex-1 cursor-pointer"
                        >
                            {career}
                        </Label>
                    </div>
                ))}
            </RadioGroup>

            <DialogFooter className="mt-6">
                <Button
                    variant="outline"
                    onClick={onCancel}
                >
                    Cancel
                </Button>

                <Button
                    disabled={selectedCareer === currentCareer}
                    onClick={() =>
                        onContinue(selectedCareer)
                    }
                >
                    Continue
                </Button>
            </DialogFooter>
        </DialogContent>
    );
}