import { Card, CardContent } from "@/shadcn/component/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/shadcn/component/ui/avatar";
import { Badge } from "@/shadcn/component/ui/badge";
import { Clock3 } from "lucide-react";

import {
    Flame,
    GraduationCap,
    BookOpen,
} from "lucide-react";

export function UserProfileCard() {
    return (
        <Card className="shadow-sm">

            <CardContent className="p-6">

                <div className="flex items-center gap-6">

                    <Avatar className="h-24 w-24">
                        <AvatarImage src="/avatar.png" />
                        <AvatarFallback>LN</AvatarFallback>
                    </Avatar>

                    <div className="flex-1">

                        <h2 className="text-2xl font-bold">
                            Nguyen Van Lam
                        </h2>

                        <Badge className="mt-2">
                            Full Stack Developer
                        </Badge>


                    </div>

                </div>
                <div className="grid grid-cols-2 gap-4 mt-6">

                    <div className="rounded-xl border bg-slate-50 p-4">

                        <p className="text-xs uppercase text-slate-500">
                            Started
                        </p>

                        <p className="mt-2 font-semibold">
                            Jul 15, 2026
                        </p>

                    </div>

                    <div className="rounded-xl border bg-slate-50 p-4">

                        <p className="text-xs uppercase text-slate-500">
                            Estimated Finish
                        </p>

                        <p className="mt-2 font-semibold text-blue-600">
                            Oct 18, 2026
                        </p>

                    </div>

                </div>

                <div className="grid grid-cols-4 gap-4 mt-8">

                    <div className="rounded-xl bg-orange-50 p-4 text-center">

                        <Flame className="mx-auto text-orange-500" />

                        <p className="mt-2 text-2xl font-bold">
                            8
                        </p>

                        <p className="text-sm text-slate-500">
                            Day Streak
                        </p>

                    </div>

                    <div className="rounded-xl bg-blue-50 p-4 text-center">

                        <BookOpen className="mx-auto text-blue-600" />

                        <p className="mt-2 text-2xl font-bold">
                            35
                        </p>

                        <p className="text-sm text-slate-500">
                            Lessons
                        </p>

                    </div>

                    <div className="rounded-xl bg-green-50 p-4 text-center">

                        <GraduationCap className="mx-auto text-green-600" />

                        <p className="mt-2 text-2xl font-bold">
                            84%
                        </p>

                        <p className="text-sm text-slate-500">
                            Accuracy
                        </p>

                    </div>
                    <div className="rounded-xl bg-cyan-50 p-4 text-center">

                        <Clock3 className="mx-auto text-cyan-600" />

                        <p className="mt-2 text-2xl font-bold">
                            82h
                        </p>

                        <p className="text-sm text-slate-500">
                            Study Time
                        </p>

                    </div>

                </div>

            </CardContent>

        </Card>
    );
}