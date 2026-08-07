import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/shadcn/component/ui/card";
import {
    Dialog
} from "@/shadcn/component/ui/dialog"
import { AlertDialog } from "@/shadcn/component/ui/alert-dialog";
import { Button } from "@/shadcn/component/ui/button";
import { Progress } from "@/shadcn/component/ui/progress";
import {
    BookOpen,
    Brain,
    RotateCcw,
    Sparkles,
    Settings,
    ChevronRight,
    Clock3,
    Flame,
    Target,
} from "lucide-react";
import { useState } from 'react'
import { StudySettingsDialog } from "./StudySettingsDialog"
import { ChangeCareerAlert } from "./ChangeCareerAlert"
import { StudyTimeDialog } from "./StudyTimeDialog"
import { StudyTimeAlert } from "./StudyTimeAlert"
import { Link } from "@tanstack/react-router";

export function DailyPlanView() {
    const [openSetting, setOpenSetting] = useState(false);
    const [openStudyTime, setOpenStudyTime] = useState(false);
    const [openCareerAlert, setOpenCareerAlert] = useState(false);
    const [openStudyTimeAlert, setOpenStudyTimeAlert] = useState(false);
    const [currentHour, setCurrentHour] = useState(2);
    const [newHour, setNewHour] = useState(2);

    const planCards = [
        {
            title: "New Lesson",
            description: "SQL JOIN",
            buttonLabel: "Start Learning",
            icon: BookOpen,
            iconClassName: "text-blue-600",
            accentClassName: "border-blue-100 bg-blue-50/70",
            buttonVariant: "default" as const,
        },
        {
            title: "Review",
            description: "Database Relationship",
            buttonLabel: "Review",
            icon: RotateCcw,
            iconClassName: "text-amber-500",
            accentClassName: "border-amber-100 bg-amber-50/70",
            buttonVariant: "outline" as const,
        },
        {
            title: "Flashcards",
            description: "15 cards remaining",
            buttonLabel: "Practice",
            icon: Brain,
            iconClassName: "text-violet-600",
            accentClassName: "border-violet-100 bg-violet-50/70",
            buttonVariant: "outline" as const,
        },
    ];

    return (
        <>
            <div className="flex h-full w-full flex-col rounded-[30px] border border-white/70 bg-white/80 p-4 shadow-[0_22px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-5">
                <div className="flex h-full flex-col space-y-5">
                    <Card className="overflow-hidden border-0 bg-[linear-gradient(145deg,_rgba(15,23,42,1)_0%,_rgba(30,41,59,0.95)_100%)] text-white shadow-none">
                        <CardHeader className="space-y-5 pb-4">
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-blue-200">
                                        Today's Study Plan
                                    </p>
                                    <CardTitle className="text-2xl font-bold tracking-tight">
                                        1 of 3 tasks completed
                                    </CardTitle>
                                </div>
                                <div className="rounded-full bg-white/10 p-2">
                                    <Target className="h-5 w-5 text-blue-200" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm text-slate-200">
                                    <span>Daily Progress</span>
                                    <span className="font-semibold text-white">33%</span>
                                </div>
                                <Progress value={33} className="bg-white/15" />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
                                    <div className="flex items-center gap-2 text-blue-100">
                                        <Clock3 className="h-4 w-4" />
                                        <span className="text-xs font-semibold uppercase tracking-[0.18em]">
                                            Study Time
                                        </span>
                                    </div>
                                    <p className="mt-2 text-xl font-bold">{currentHour}h</p>
                                </div>
                                <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
                                    <div className="flex items-center gap-2 text-orange-100">
                                        <Flame className="h-4 w-4" />
                                        <span className="text-xs font-semibold uppercase tracking-[0.18em]">
                                            Streak
                                        </span>
                                    </div>
                                    <p className="mt-2 text-xl font-bold">8 days</p>
                                </div>
                            </div>
                        </CardHeader>
                    </Card>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                        {planCards.map((card) => {
                            const Icon = card.icon;

                            return (
                                <Card
                                    key={card.title}
                                    className={`border shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md ${card.accentClassName}`}
                                >
                                    <CardContent className="p-5">
                                        <div className="flex items-start gap-4">
                                            <div className="rounded-2xl bg-white/80 p-3 shadow-sm">
                                                <Icon className={`h-5 w-5 ${card.iconClassName}`} />
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <h3 className="font-semibold text-slate-900">
                                                    {card.title}
                                                </h3>
                                                <p className="mt-1 text-sm text-slate-600">
                                                    {card.description}
                                                </p>
                                            </div>
                                        </div>
                                        {card.buttonLabel === "Start Learning" ? (
                                            <Link to="/dashboard">
                                                <Button
                                                    variant={card.buttonVariant}
                                                    className="mt-5 w-full"
                                                >
                                                    {card.buttonLabel}
                                                </Button>
                                            </Link>
                                        ) : (
                                            <Button variant={card.buttonVariant}
                                                className="mt-5 w-full">
                                                {card.buttonLabel}
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    <Card className="border-blue-100 bg-[linear-gradient(135deg,_rgba(239,246,255,1)_0%,_rgba(224,242,254,0.9)_100%)] shadow-sm">
                        <CardContent className="p-5">
                            <div className="flex items-start gap-4">
                                <div className="rounded-2xl bg-white/80 p-3 shadow-sm">
                                    <Sparkles className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-900">
                                        AI Coach
                                    </h3>
                                    <p className="mt-2 text-sm leading-6 text-slate-600">
                                        Focus on SQL JOIN today. Your last quiz accuracy was 65%, so one review round before the next lesson should help.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card
                        onClick={() => setOpenSetting(true)}
                        className="mt-auto cursor-pointer border-slate-200 bg-white transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
                    >
                        <CardContent className="flex items-center justify-between gap-3 p-5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100">
                                    <Settings className="h-5 w-5 text-blue-600" />
                                </div>

                                <div>
                                    <p className="font-semibold text-slate-900">Study Settings</p>
                                    <p className="text-sm text-slate-500">
                                        Manage your learning preferences
                                    </p>
                                </div>
                            </div>

                            <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
                        </CardContent>
                    </Card>
                </div>
            </div>
            <Dialog open={openSetting} onOpenChange={setOpenSetting}>
                <StudySettingsDialog
                    onCareerClick={() => {
                        setOpenSetting(false);
                        setOpenCareerAlert(true);
                    }}
                    onStudyTimeClick={() => {
                        setOpenSetting(false);
                        setOpenStudyTime(true);
                    }}
                />
            </Dialog>
            <AlertDialog open={openCareerAlert} onOpenChange={setOpenCareerAlert}>
                <ChangeCareerAlert
                    onCancel={() => setOpenCareerAlert(false)}
                    onConfirm={() => {
                        setOpenCareerAlert(false);

                        // gọi API regenerate course

                        // navigate("/course-loading")
                    }}
                />
            </AlertDialog>
            <Dialog
                open={openStudyTime}
                onOpenChange={setOpenStudyTime}
            >
                <StudyTimeDialog
                    currentHour={currentHour}
                    onCancel={() => setOpenStudyTime(false)}
                    onSave={(hour) => {

                        setOpenStudyTime(false);

                        setNewHour(hour);

                        setOpenStudyTimeAlert(true);

                    }}
                />
            </Dialog>
            <AlertDialog
                open={openStudyTimeAlert}
                onOpenChange={setOpenStudyTimeAlert}
            >
                <StudyTimeAlert
                    currentHour={currentHour}
                    newHour={newHour}
                    onCancel={() => setOpenStudyTimeAlert(false)}
                    onConfirm={() => {

                        setCurrentHour(newHour);

                        setOpenStudyTimeAlert(false);

                        // gọi API update study time

                    }}
                />
            </AlertDialog>
        </>
    );
}
