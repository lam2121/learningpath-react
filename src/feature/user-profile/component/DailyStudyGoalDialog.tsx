import { Coffee, Sparkles } from "lucide-react";

import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/shadcn/component/ui/alert-dialog";
import { Button } from "@/shadcn/component/ui/button";

function formatProgressMinutes(minutes: number) {
    if (minutes <= 0) {
        return "0 min";
    }

    if (minutes < 60) {
        return `${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
        return `${hours}h`;
    }

    return `${hours}h ${remainingMinutes}m`;
}

type DailyStudyGoalDialogProps = {
    open: boolean;
    plannedMinutes: number;
    learnedMinutes: number;
    onTakeBreak: () => void;
    onKeepLearning: () => void;
};

export function DailyStudyGoalDialog({
    open,
    plannedMinutes,
    learnedMinutes,
    onTakeBreak,
    onKeepLearning,
}: DailyStudyGoalDialogProps) {
    return (
        <AlertDialog open={open}>
            <AlertDialogContent className="overflow-hidden rounded-[28px] border-0 p-0 shadow-[0_30px_90px_rgba(15,23,42,0.3)] sm:max-w-2xl">
                <div className="bg-[linear-gradient(135deg,#0f4cc9_0%,#0f8ed8_55%,#8ae1ff_100%)] p-6 text-white sm:p-8">
                    <div className="flex items-start gap-4">
                        <div className="rounded-3xl bg-white/18 p-3 ring-1 ring-white/30 backdrop-blur-sm">
                            <Coffee className="h-7 w-7" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="inline-flex rounded-full bg-white/16 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ring-1 ring-white/20">
                                Daily goal reached
                            </div>
                            <AlertDialogHeader className="mt-4 text-left">
                                <AlertDialogTitle className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                                    You have learned enough for today
                                </AlertDialogTitle>
                                <AlertDialogDescription className="pt-2 text-sm leading-7 text-blue-50 sm:text-base">
                                    You reached the study time you planned for today. Do you want to stop here, take a break, and continue tomorrow, or keep learning while you still have momentum?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                        </div>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-3xl bg-white/14 px-4 py-4 ring-1 ring-white/18 backdrop-blur-sm">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-100">
                                Planned today
                            </p>
                            <p className="mt-2 text-2xl font-black">
                                {formatProgressMinutes(plannedMinutes)}
                            </p>
                        </div>
                        <div className="rounded-3xl bg-white px-4 py-4 text-slate-900 shadow-[0_18px_30px_rgba(255,255,255,0.2)]">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                                Learned today
                            </p>
                            <p className="mt-2 text-2xl font-black text-blue-700">
                                {formatProgressMinutes(learnedMinutes)}
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 rounded-3xl border border-white/18 bg-white/12 px-4 py-4 text-sm leading-6 text-blue-50 backdrop-blur-sm">
                        <div className="flex items-start gap-3">
                            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-white" />
                            <p>
                                Taking a break helps you keep tomorrow’s session fresh. Continuing now will still count as extra progress beyond today’s target.
                            </p>
                        </div>
                    </div>
                </div>

                <AlertDialogFooter className="bg-white px-6 py-5 sm:px-8">
                    <Button
                        type="button"
                        variant="outline"
                        className="border-slate-300"
                        onClick={onTakeBreak}
                    >
                        Stop and continue tomorrow
                    </Button>
                    <Button
                        type="button"
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={onKeepLearning}
                    >
                        Keep learning
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
