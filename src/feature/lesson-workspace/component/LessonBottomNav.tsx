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

            <CardContent className="flex items-center justify-between p-6">

                {/* Previous */}

                <Button
                    variant="outline"
                    className="h-12 px-6"
                >
                    <ArrowLeft className="mr-2 size-5" />

                    Previous Lesson

                </Button>

                {/* Current */}

                <div className="text-center">

                    <CircleCheckBig className="mx-auto mb-2 size-9 text-green-500" />

                    <h3 className="font-semibold">

                        Great Job!

                    </h3>

                    <p className="text-sm text-slate-500">

                        You're almost ready for the quiz.

                    </p>

                </div>

                {/* Next */}

                <Button
                    className="h-12 px-6"
                >

                    Next Lesson

                    <ArrowRight className="ml-2 size-5" />

                </Button>

            </CardContent>

        </Card>
    );
}