import {
    Card,
    CardContent,
} from "@/shadcn/component/ui/card";

import {
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/shadcn/component/ui/dialog";

import {
    BookOpen,
    Brain,
    ChevronRight,
} from "lucide-react";

type StudySettingsDialogProps = {
    onCareerClick: () => void;
    onStudyTimeClick: () => void;
};

export function StudySettingsDialog({
    onCareerClick,
    onStudyTimeClick,
}: StudySettingsDialogProps) {
    return (
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Study Settings</DialogTitle>

                <DialogDescription>
                    Update your learning preferences.
                </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
                {/* Career Track */}
                <Card
                    className="cursor-pointer transition-all hover:border-blue-400 hover:shadow-md"
                    onClick={onCareerClick}
                >
                    <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                                <BookOpen className="h-5 w-5 text-blue-600" />
                            </div>

                            <div>
                                <p className="font-semibold">
                                    Change Career Track
                                </p>

                                <p className="text-sm text-slate-500">
                                    Full Stack Developer
                                </p>
                            </div>
                        </div>

                        <ChevronRight className="h-5 w-5 text-slate-400" />
                    </CardContent>
                </Card>

                {/* Study Time */}
                <Card
                    className="cursor-pointer transition-all hover:border-blue-400 hover:shadow-md"
                    onClick={onStudyTimeClick}
                >
                    <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                                <Brain className="h-5 w-5 text-green-600" />
                            </div>

                            <div>
                                <p className="font-semibold">
                                    Daily Study Time
                                </p>

                                <p className="text-sm text-slate-500">
                                    2 Hours / Day
                                </p>
                            </div>
                        </div>

                        <ChevronRight className="h-5 w-5 text-slate-400" />
                    </CardContent>
                </Card>
            </div>
        </DialogContent>
    );
}