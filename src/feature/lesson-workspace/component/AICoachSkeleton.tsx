import {
    Card,
    CardContent,
    CardHeader,
} from "@/shadcn/component/ui/card";

import { Skeleton } from "@/shadcn/component/ui/skeleton";

export function AICoachSkeleton() {
    return (
        <div className="sticky top-24 space-y-5">

            {/* AI Coach */}

            <Card className="rounded-3xl border-slate-200">

                <CardHeader>

                    <div className="flex items-center gap-3">

                        <Skeleton className="h-11 w-11 rounded-full" />

                        <div className="flex-1 space-y-2">

                            <Skeleton className="h-5 w-32" />

                            <Skeleton className="h-3 w-24" />

                        </div>

                    </div>

                </CardHeader>

                <CardContent>

                    <Skeleton className="h-10 w-full rounded-lg" />

                </CardContent>

            </Card>

            {/* Quick Actions */}

            <Card className="rounded-2xl">

                <CardHeader>

                    <Skeleton className="h-5 w-36" />

                </CardHeader>

                <CardContent className="space-y-3">

                    {Array.from({ length: 4 }).map((_, i) => (

                        <Skeleton
                            key={i}
                            className="h-10 w-full rounded-lg"
                        />

                    ))}

                </CardContent>

            </Card>

            {/* Lesson Insight */}

            <Card className="rounded-2xl">

                <CardHeader>

                    <Skeleton className="h-5 w-32" />

                </CardHeader>

                <CardContent className="space-y-3">

                    <Skeleton className="h-4 w-full" />

                    <Skeleton className="h-4 w-4/5" />

                    <Skeleton className="h-4 w-3/5" />

                </CardContent>

            </Card>

            {/* Progress */}

            <Card className="rounded-2xl">

                <CardHeader>

                    <Skeleton className="h-5 w-40" />

                </CardHeader>

                <CardContent>

                    <Skeleton className="h-3 w-full rounded-full" />

                    <div className="mt-5 space-y-3">

                        {Array.from({ length: 3 }).map((_, i) => (

                            <div
                                key={i}
                                className="flex justify-between"
                            >

                                <Skeleton className="h-4 w-24" />

                                <Skeleton className="h-4 w-10" />

                            </div>

                        ))}

                    </div>

                </CardContent>

            </Card>

            {/* Recommendation */}

            <Card className="rounded-2xl">

                <CardContent className="space-y-3 p-6">

                    <Skeleton className="h-5 w-44" />

                    <Skeleton className="h-4 w-full" />

                    <Skeleton className="h-4 w-4/5" />

                </CardContent>

            </Card>

            {/* Continue */}

            <Skeleton className="h-11 w-full rounded-lg" />

        </div>
    );
}