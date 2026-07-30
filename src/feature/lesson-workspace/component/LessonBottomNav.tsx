import { Button } from "@/shadcn/component/ui/button";

import {
    Card,
    CardContent,
} from "@/shadcn/component/ui/card";

import {
    ArrowLeft,
    ArrowRight,
    CircleCheckBig,
} from "lucide-react";

export function LessonBottomNav() {
    return (
        <Card className="rounded-3xl">

            <CardContent className="flex flex-col gap-5 p-4 sm:p-6 md:flex-row md:items-center md:justify-between">

                {/* Previous */}

                <Button
                    variant="outline"
                    className="h-11 w-full px-5 text-sm sm:w-auto md:h-12 md:px-6"
                >
                    <ArrowLeft className="mr-2 size-4 sm:size-5" />

                    Previous Lesson

                </Button>

                {/* Current */}

                <div className="text-center order-first md:order-none">

                    <CircleCheckBig className="mx-auto mb-1.5 size-7 text-green-500 sm:size-9" />

                    <h3 className="font-semibold text-sm sm:text-base">

                        Great Job!

                    </h3>

                    <p className="text-xs text-slate-500 sm:text-sm">

                        You're almost ready for the quiz.

                    </p>

                </div>

                {/* Next */}

                <Button
                    className="h-11 w-full px-5 text-sm sm:w-auto md:h-12 md:px-6"
                >

                    Next Lesson

                    <ArrowRight className="ml-2 size-4 sm:size-5" />

                </Button>

            </CardContent>

        </Card>
    );
}