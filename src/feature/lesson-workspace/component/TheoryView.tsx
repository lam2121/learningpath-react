import { Card, CardContent } from "@/shadcn/component/ui/card";
import { Button } from "@/shadcn/component/ui/button";
import {
    BookOpen,
    TriangleAlert,
    Briefcase,
    Code2,
    Sparkles,
    CheckCircle2,
} from "lucide-react";

export function TheoryView() {
    return (
        <div className="space-y-6">

            {/* Hero Banner */}

            <Card className="overflow-hidden rounded-3xl border-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm">

                <CardContent className="p-5 sm:p-8">

                    <div className="flex items-center gap-4">

                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20">

                            <BookOpen className="size-8" />

                        </div>

                        <div>

                            <h2 className="text-3xl font-bold">

                                SQL JOIN

                            </h2>

                            <p className="mt-2 text-blue-100">

                                Learn how to combine multiple tables efficiently.

                            </p>

                        </div>

                    </div>

                </CardContent>

            </Card>

            {/* Introduction */}

            <Card className="rounded-2xl">

                <CardContent className="p-5 sm:p-8">

                    <h2 className="text-xl font-bold mb-4">

                        Introduction

                    </h2>

                    <p className="leading-8 text-slate-700">

                        SQL JOIN is one of the most important concepts in
                        relational databases. It allows you to retrieve data
                        from multiple tables based on matching values.

                    </p>

                </CardContent>

            </Card>

            {/* AI Explanation */}

            <Card className="rounded-2xl border-blue-200 bg-blue-50">

                <CardContent className="p-4 sm:p-6">

                    <div className="flex gap-4">

                        <Sparkles className="size-6 text-blue-600 mt-1" />

                        <div>

                            <h3 className="font-semibold">

                                AI Explanation

                            </h3>

                            <p className="mt-2 text-slate-700">

                                Think of SQL JOIN like connecting two Excel
                                sheets using a common column such as Student ID.

                            </p>

                        </div>

                    </div>

                </CardContent>

            </Card>

            {/* Code */}

            <Card className="rounded-2xl">

                <CardContent className="p-0">

                    <div className="flex items-center justify-between border-b px-4 py-3 sm:px-6 sm:py-4">

                        <div className="flex items-center gap-2">

                            <Code2 className="size-5 text-blue-600" />

                            <span className="font-semibold">

                                Example

                            </span>

                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                        >
                            Copy
                        </Button>

                    </div>

                    <pre className="overflow-x-auto bg-slate-900 p-4 sm:p-6 text-xs sm:text-sm text-green-300">

                        {`SELECT *
FROM Student
INNER JOIN Score
ON Student.id = Score.student_id;`}

                    </pre>

                </CardContent>

            </Card>

            {/* Best Practice */}

            <Card className="rounded-2xl border-green-200 bg-green-50">

                <CardContent className="p-6">

                    <div className="flex gap-4">

                        <CheckCircle2 className="size-6 text-green-600 mt-1" />

                        <div>

                            <h3 className="font-semibold">

                                Best Practice

                            </h3>

                            <p className="mt-2 text-slate-700">

                                Always specify the JOIN condition using ON to
                                avoid Cartesian Products.

                            </p>

                        </div>

                    </div>

                </CardContent>

            </Card>

            {/* Common Mistakes */}

            <Card className="rounded-2xl border-orange-200 bg-orange-50">

                <CardContent className="p-6">

                    <div className="flex gap-4">

                        <TriangleAlert className="size-6 text-orange-500 mt-1" />

                        <div>

                            <h3 className="font-semibold">

                                Common Mistake

                            </h3>

                            <p className="mt-2 text-slate-700">

                                Forgetting the ON condition causes every row
                                from one table to match every row in another.

                            </p>

                        </div>

                    </div>

                </CardContent>

            </Card>

            {/* Interview */}

            <Card className="rounded-2xl border-purple-200 bg-purple-50">

                <CardContent className="p-6">

                    <div className="flex gap-4">

                        <Briefcase className="size-6 text-purple-600 mt-1" />

                        <div>

                            <h3 className="font-semibold">

                                Interview Tip

                            </h3>

                            <p className="mt-2 text-slate-700">

                                Interviewers frequently ask the difference
                                between INNER JOIN and LEFT JOIN.

                            </p>

                        </div>

                    </div>

                </CardContent>

            </Card>

            {/* Key Takeaways */}

            <Card className="rounded-2xl">

                <CardContent className="p-5 sm:p-8">

                    <h2 className="text-xl font-bold mb-5">

                        Key Takeaways

                    </h2>

                    <ul className="space-y-3">

                        <li>✅ JOIN combines multiple tables.</li>

                        <li>✅ INNER JOIN returns matched rows.</li>

                        <li>✅ LEFT JOIN keeps all left table rows.</li>

                        <li>✅ Always use ON.</li>

                    </ul>

                </CardContent>

            </Card>

        </div>
    );
}