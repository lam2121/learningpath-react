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
import { useState, useEffect } from "react";
import {
    fetchJobRoles,
    fetchPlacementTestResult,
} from "@/feature/onboarding/api/onboardingApi";
type StudySettingsDialogProps = {
    studyHours: number;
    onCareerClick: () => void;
    onStudyTimeClick: () => void;
};

export function StudySettingsDialog({
    studyHours,
    onCareerClick,
    onStudyTimeClick,
}: StudySettingsDialogProps) {
    const [careerName, setCareerName] = useState<string>("Career Track");
    useEffect(() => {
        let isMounted = true;

        const loadCareerName = async () => {
            try {
                const result = await fetchPlacementTestResult();
                if (isMounted && result.role_name?.trim()) {
                    setCareerName(result.role_name.trim());
                    return;
                }
            } catch {
            }

            const pendingRoleId = Number(localStorage.getItem("pending_role_id"));
            if (!pendingRoleId || Number.isNaN(pendingRoleId)) {
                if (isMounted) {
                    setCareerName("Career Track");
                }
                return;
            }

            try {
                const roles = await fetchJobRoles();
                const matchedRole = roles.find((role) => role.id === pendingRoleId);
                if (isMounted) {
                    setCareerName(matchedRole?.name?.trim() || "Career Track");
                }
            } catch {
                if (isMounted) {
                    setCareerName("Career Track");
                }
            }
        };

        void loadCareerName();

        return () => {
            isMounted = false;
        };
    }, []);
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
                                    {careerName}
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
                                    {studyHours} {studyHours === 1 ? "Hour" : "Hours"} / Day
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
