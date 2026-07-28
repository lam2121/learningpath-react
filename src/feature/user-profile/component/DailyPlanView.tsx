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
    ChevronRight
} from "lucide-react";
import { useState } from 'react'
import { StudySettingsDialog } from "./StudySettingsDialog"
import { CareerTrackDialog } from "../../learning-path/component/CareerTrackDialog"
import { ChangeCareerAlert } from "./ChangeCareerAlert"
import { StudyTimeDialog } from "./StudyTimeDialog"
import { StudyTimeAlert } from "./StudyTimeAlert"
export function DailyPlanView() {
    const [openSetting, setOpenSetting] = useState(false);
    const [openCareer, setOpenCareer] = useState(false);
    const [openStudyTime, setOpenStudyTime] = useState(false);
    const [openCareerAlert, setOpenCareerAlert] = useState(false);
    const [openStudyTimeAlert, setOpenStudyTimeAlert] = useState(false);
    const [pendingCareer, setPendingCareer] = useState("");
    const [currentHour, setCurrentHour] = useState(2);
    const [newHour, setNewHour] = useState(2);
    return (
        <>
            <div className="w-[340px] space-y-5 p-6 bg-slate-50">
                {/* Daily Goal */}

                <Card>

                    <CardHeader>

                        <CardTitle>
                            Today's Study Plan
                        </CardTitle>

                    </CardHeader>

                    <CardContent className="space-y-4">

                        <div>

                            <div className="flex justify-between mb-2">

                                <span className="text-sm">
                                    Daily Progress
                                </span>

                                <span className="text-sm font-semibold">
                                    1 / 3
                                </span>

                            </div>

                            <Progress value={33} />

                        </div>

                    </CardContent>

                </Card>

                {/* Lesson */}

                <Card>

                    <CardContent className="pt-6">

                        <div className="flex gap-3">

                            <BookOpen className="text-blue-600" />

                            <div>

                                <h3 className="font-semibold">
                                    New Lesson
                                </h3>

                                <p className="text-sm text-slate-500">
                                    SQL JOIN
                                </p>

                            </div>

                        </div>

                        <Button className="w-full mt-4">
                            Start Learning
                        </Button>

                    </CardContent>

                </Card>

                {/* Review */}

                <Card>

                    <CardContent className="pt-6">

                        <div className="flex gap-3">

                            <RotateCcw className="text-amber-500" />

                            <div>

                                <h3 className="font-semibold">
                                    Review
                                </h3>

                                <p className="text-sm text-slate-500">
                                    Database Relationship
                                </p>

                            </div>

                        </div>

                        <Button
                            variant="outline"
                            className="w-full mt-4"
                        >
                            Review
                        </Button>

                    </CardContent>

                </Card>

                {/* Flashcard */}

                <Card>

                    <CardContent className="pt-6">

                        <div className="flex gap-3">

                            <Brain className="text-violet-600" />

                            <div>

                                <h3 className="font-semibold">
                                    Flashcards
                                </h3>

                                <p className="text-sm text-slate-500">
                                    15 cards remaining
                                </p>

                            </div>

                        </div>

                        <Button
                            variant="outline"
                            className="w-full mt-4"
                        >
                            Practice
                        </Button>

                    </CardContent>

                </Card>

                {/* AI Coach */}

                <Card className="bg-blue-50 border-blue-200">

                    <CardContent className="pt-6">

                        <div className="flex gap-3">

                            <Sparkles className="text-blue-600" />

                            <div>

                                <h3 className="font-semibold">
                                    AI Coach
                                </h3>

                                <p className="text-sm text-slate-600 mt-2">
                                    Focus on SQL JOIN today.
                                    Your last quiz accuracy was 65%.
                                </p>

                            </div>

                        </div>

                    </CardContent>

                </Card>
                <Card onClick={() => setOpenSetting(true)}
                    className="cursor-pointer transition hover:shadow-md"

                >
                    <CardContent className="flex items-center justify-between p-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                                <Settings className="h-5 w-5 text-blue-600" />
                            </div>

                            <div>
                                <p className="font-semibold">Study Settings</p>
                                <p className="text-sm text-slate-500">
                                    Manage your learning preferences
                                </p>
                            </div>
                        </div>

                        <ChevronRight className="h-5 w-5 text-slate-400" />
                    </CardContent>
                </Card>
            </div>
            <Dialog open={openSetting} onOpenChange={setOpenSetting}>
                <StudySettingsDialog
                    onCareerClick={() => {
                        setOpenSetting(false);
                        setOpenCareer(true);
                    }}
                    onStudyTimeClick={() => {
                        setOpenSetting(false);
                        setOpenStudyTime(true);
                    }}
                />
            </Dialog>
            <Dialog open={openCareer} onOpenChange={setOpenCareer}>
                <CareerTrackDialog
                    currentCareer="Full Stack Developer"
                    onCancel={() => setOpenCareer(false)}
                    onContinue={(career) => {
                        setOpenCareer(false);
                        setPendingCareer(career);
                        setOpenCareerAlert(true);
                        // mở AlertDialog xác nhận
                    }}
                />
            </Dialog>
            <AlertDialog open={openCareerAlert} onOpenChange={setOpenCareerAlert}>
                <ChangeCareerAlert
                    currentCareer="Full Stack Developer"
                    newCareer={pendingCareer}
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