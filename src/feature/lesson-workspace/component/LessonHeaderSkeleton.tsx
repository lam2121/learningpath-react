import {
    Card,
    CardContent,
} from "@/shadcn/component/ui/card";

import { Skeleton } from "@/shadcn/component/ui/skeleton";

export function LessonHeaderSkeleton() {
    return (
        <Card className="rounded-3xl border-0 shadow-sm">

            <CardContent className="p-5 sm:p-6 lg:p-8">

                {/* Breadcrumb */}

                <div className="flex items-center gap-3">

                    <Skeleton className="h-3 w-24" />

                    <Skeleton className="h-3 w-3 rounded-full" />

                    <Skeleton className="h-3 w-20" />

                    <Skeleton className="h-3 w-3 rounded-full" />

                    <Skeleton className="h-3 w-28" />

                </div>

                {/* Title */}

                <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

                    <div className="flex-1 min-w-0">

                        <Skeleton className="h-8 w-full max-w-xs sm:h-10 sm:max-w-sm" />

                        <Skeleton className="mt-5 h-4 w-full max-w-2xl" />

                        <Skeleton className="mt-3 h-4 w-5/6 max-w-xl" />

                    </div>

                    <Skeleton className="h-10 w-28 rounded-lg self-start shrink-0 sm:w-32" />

                </div>

                {/* Badges */}

                <div className="mt-8 flex gap-3">

                    <Skeleton className="h-9 w-24 rounded-full" />

                    <Skeleton className="h-9 w-28 rounded-full" />

                    <Skeleton className="h-9 w-24 rounded-full" />

                </div>

                {/* Progress */}

                <div className="mt-8">

                    <div className="mb-3 flex justify-between">

                        <Skeleton className="h-3 w-32" />

                        <Skeleton className="h-3 w-10" />

                    </div>

                    <Skeleton className="h-3 w-full rounded-full" />

                </div>

                {/* Footer */}

                <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                    <Skeleton className="h-4 w-44" />

                    <Skeleton className="h-10 w-full sm:w-48 rounded-lg" />

                </div>

            </CardContent>

        </Card>
    );
}