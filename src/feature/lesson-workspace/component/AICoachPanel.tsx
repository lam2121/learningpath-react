import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/shadcn/component/ui/card";

import { Button } from "@/shadcn/component/ui/button";

import { Progress } from "@/shadcn/component/ui/progress";

import {
    Bot,
    Sparkles,
    Lightbulb,
    Languages,
    NotebookPen,
    BookOpen,
    ChevronRight,
    BrainCircuit,
} from "lucide-react";

export function AICoachPanel() {
    return (
        <div className="xl:sticky xl:top-24 space-y-5">

            {/* AI Coach */}

            <Card className="rounded-3xl border-blue-200 bg-gradient-to-b from-blue-50 to-white">

                <CardHeader>

                    <CardTitle className="flex items-center gap-3">

                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100">

                            <Bot className="size-6 text-blue-600" />

                        </div>

                        <div>

                            <p>AI Coach</p>

                            <span className="text-sm font-normal text-slate-500">

                                Always here to help

                            </span>

                        </div>

                    </CardTitle>

                </CardHeader>

                <CardContent>

                    <Button className="w-full justify-between">

                        Ask AI

                        <ChevronRight className="size-4" />

                    </Button>

                </CardContent>

            </Card>

            {/* Quick Actions */}

            <Card className="rounded-2xl">

                <CardHeader>

                    <CardTitle>

                        Quick Actions

                    </CardTitle>

                </CardHeader>

                <CardContent className="space-y-3">

                    <Button
                        variant="outline"
                        className="w-full justify-start"
                    >
                        <Lightbulb className="mr-2 size-5 text-yellow-500" />

                        Explain Simpler

                    </Button>

                    <Button
                        variant="outline"
                        className="w-full justify-start"
                    >
                        <Sparkles className="mr-2 size-5 text-blue-600" />

                        Generate Example

                    </Button>

                    <Button
                        variant="outline"
                        className="w-full justify-start"
                    >
                        <Languages className="mr-2 size-5 text-green-600" />

                        Translate

                    </Button>

                    <Button
                        variant="outline"
                        className="w-full justify-start"
                    >
                        <NotebookPen className="mr-2 size-5 text-purple-600" />

                        Summarize

                    </Button>

                </CardContent>

            </Card>

            {/* Lesson Insight */}

            <Card className="rounded-2xl bg-blue-50 border-blue-200">

                <CardHeader>

                    <CardTitle>

                        Lesson Insight

                    </CardTitle>

                </CardHeader>

                <CardContent>

                    <p className="text-sm leading-7 text-slate-700">

                        Students usually struggle with the difference
                        between INNER JOIN and LEFT JOIN.

                    </p>

                </CardContent>

            </Card>

            {/* Learning Progress */}

            <Card className="rounded-2xl">

                <CardHeader>

                    <CardTitle>

                        Learning Progress

                    </CardTitle>

                </CardHeader>

                <CardContent>

                    <Progress value={58} />

                    <div className="mt-4 space-y-2 text-sm">

                        <div className="flex justify-between">

                            <span>Reading</span>

                            <span>100%</span>

                        </div>

                        <div className="flex justify-between">

                            <span>Examples</span>

                            <span>75%</span>

                        </div>

                        <div className="flex justify-between">

                            <span>Exercises</span>

                            <span>40%</span>

                        </div>

                    </div>

                </CardContent>

            </Card>

            {/* Recommendation */}

            <Card className="rounded-2xl border-green-200 bg-green-50">

                <CardContent className="p-6">

                    <div className="flex gap-3">

                        <BrainCircuit className="size-6 text-green-600" />

                        <div>

                            <h3 className="font-semibold">

                                AI Recommendation

                            </h3>

                            <p className="mt-2 text-sm text-slate-600">

                                Before taking today's quiz,
                                review the LEFT JOIN example once more.

                            </p>

                        </div>

                    </div>

                </CardContent>

            </Card>

            {/* Continue */}

            <Button
                className="w-full h-11"
            >
                <BookOpen className="mr-2 size-5" />

                Continue Learning

            </Button>

        </div>
    );
}