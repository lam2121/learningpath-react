import { Card, CardContent } from "@/shadcn/component/ui/card";
import { Skeleton } from "@/shadcn/component/ui/skeleton";

export function TheorySkeleton() {
    return (
        <div className="space-y-6">

            {/* Hero Banner */}

            <Card className="overflow-hidden rounded-3xl">

                <CardContent className="p-8">

                    <div className="flex items-center gap-5">

                        <Skeleton className="h-16 w-16 rounded-full" />

                        <div className="flex-1 space-y-3">

                            <Skeleton className="h-8 w-56" />

                            <Skeleton className="h-4 w-80" />

                        </div>

                    </div>

                </CardContent>

            </Card>

            {/* Introduction */}

            <Card className="rounded-2xl">

                <CardContent className="p-8">

                    <Skeleton className="h-6 w-48" />

                    <div className="mt-6 space-y-4">

                        <Skeleton className="h-4 w-full" />

                        <Skeleton className="h-4 w-full" />

                        <Skeleton className="h-4 w-5/6" />

                        <Skeleton className="h-4 w-3/4" />

                    </div>

                </CardContent>

            </Card>

            {/* AI Explanation */}

            <Card className="rounded-2xl">

                <CardContent className="p-6">

                    <div className="flex gap-4">

                        <Skeleton className="h-10 w-10 rounded-full" />

                        <div className="flex-1 space-y-3">

                            <Skeleton className="h-5 w-40" />

                            <Skeleton className="h-4 w-full" />

                            <Skeleton className="h-4 w-4/5" />

                        </div>

                    </div>

                </CardContent>

            </Card>

            {/* Code Block */}

            <Card className="rounded-2xl overflow-hidden">

                <div className="border-b p-5 flex justify-between">

                    <Skeleton className="h-5 w-36" />

                    <Skeleton className="h-8 w-20 rounded-md" />

                </div>

                <div className="bg-slate-900 p-6 space-y-3">

                    <Skeleton className="h-4 w-2/3 bg-slate-700" />

                    <Skeleton className="h-4 w-1/2 bg-slate-700" />

                    <Skeleton className="h-4 w-3/4 bg-slate-700" />

                    <Skeleton className="h-4 w-2/5 bg-slate-700" />

                    <Skeleton className="h-4 w-3/5 bg-slate-700" />

                </div>

            </Card>

            {/* Best Practice */}

            <Card className="rounded-2xl">

                <CardContent className="p-6">

                    <div className="flex gap-4">

                        <Skeleton className="h-10 w-10 rounded-full" />

                        <div className="flex-1 space-y-3">

                            <Skeleton className="h-5 w-44" />

                            <Skeleton className="h-4 w-full" />

                            <Skeleton className="h-4 w-3/4" />

                        </div>

                    </div>

                </CardContent>

            </Card>

            {/* Common Mistake */}

            <Card className="rounded-2xl">

                <CardContent className="p-6">

                    <div className="flex gap-4">

                        <Skeleton className="h-10 w-10 rounded-full" />

                        <div className="flex-1 space-y-3">

                            <Skeleton className="h-5 w-44" />

                            <Skeleton className="h-4 w-full" />

                            <Skeleton className="h-4 w-2/3" />

                        </div>

                    </div>

                </CardContent>

            </Card>

            {/* Interview Tip */}

            <Card className="rounded-2xl">

                <CardContent className="p-6">

                    <div className="flex gap-4">

                        <Skeleton className="h-10 w-10 rounded-full" />

                        <div className="flex-1 space-y-3">

                            <Skeleton className="h-5 w-36" />

                            <Skeleton className="h-4 w-full" />

                            <Skeleton className="h-4 w-4/5" />

                        </div>

                    </div>

                </CardContent>

            </Card>

            {/* Key Takeaways */}

            <Card className="rounded-2xl">

                <CardContent className="p-8">

                    <Skeleton className="h-6 w-52" />

                    <div className="mt-6 space-y-4">

                        {Array.from({ length: 5 }).map((_, index) => (

                            <div
                                key={index}
                                className="flex items-center gap-3"
                            >

                                <Skeleton className="h-5 w-5 rounded-full" />

                                <Skeleton className="h-4 flex-1" />

                            </div>

                        ))}

                    </div>

                </CardContent>

            </Card>

        </div>
    );
}