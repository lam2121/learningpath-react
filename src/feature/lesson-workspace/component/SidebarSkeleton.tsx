import { Card, CardContent } from "@/shadcn/component/ui/card";
import { Skeleton } from "@/shadcn/component/ui/skeleton";

export function SidebarSkeleton() {
    return (
        <div className="xl:sticky xl:top-24 space-y-5">

            {/* Progress Card */}

            <Card className="rounded-2xl">

                <CardContent className="p-5">

                    <div className="flex items-center gap-3">

                        <Skeleton className="h-11 w-11 rounded-full" />

                        <div className="flex-1 space-y-2">

                            <Skeleton className="h-4 w-32" />

                            <Skeleton className="h-3 w-20" />

                        </div>

                    </div>

                    <Skeleton className="mt-5 h-3 w-full rounded-full" />

                    <div className="mt-4 flex justify-between">

                        <Skeleton className="h-3 w-20" />

                        <Skeleton className="h-3 w-10" />

                    </div>

                </CardContent>

            </Card>

            {/* Lesson Outline */}

            <Card className="rounded-2xl">

                <CardContent className="p-5">

                    <Skeleton className="mb-5 h-5 w-36" />

                    <div className="space-y-4">

                        {Array.from({ length: 8 }).map((_, index) => (

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

            {/* Daily Goal */}

            <Card className="rounded-2xl">

                <CardContent className="p-5">

                    <div className="flex items-center gap-3">

                        <Skeleton className="h-10 w-10 rounded-full" />

                        <div className="flex-1 space-y-2">

                            <Skeleton className="h-4 w-28" />

                            <Skeleton className="h-3 w-24" />

                        </div>

                    </div>

                    <Skeleton className="mt-5 h-3 w-full rounded-full" />

                    <Skeleton className="mt-4 h-3 w-40" />

                </CardContent>

            </Card>

        </div>
    );
}