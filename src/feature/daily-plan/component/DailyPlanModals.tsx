import { AlertDialog } from "@/shadcn/component/ui/alert-dialog";
import { Dialog } from "@/shadcn/component/ui/dialog";
import type { UserProfileResponse } from "@/feature/auth/type/Auth";
import { updateStudySettings } from "@/feature/auth/api/authAPI";
import {
    ChangeCareerAlert,
    StudySettingsDialog,
    StudyTimeAlert,
    StudyTimeDialog,
} from "@/common/component/shared-dialog";

interface DailyPlanModalsProps {
    openSetting: boolean;
    setOpenSetting: (open: boolean) => void;
    openCareerAlert: boolean;
    setOpenCareerAlert: (open: boolean) => void;
    openStudyTime: boolean;
    setOpenStudyTime: (open: boolean) => void;
    openStudyTimeAlert: boolean;
    setOpenStudyTimeAlert: (open: boolean) => void;
    currentMinutes: number;
    newMinutes: number;
    setNewMinutes: (minutes: number) => void;
    currentDays: number;
    projectedDays: number;
    isResetting: boolean;
    resetError: string | null;
    clearResetError: () => void;
    resetCareerTrack: () => Promise<boolean>;
    isSavingStudyTime: boolean;
    setIsSavingStudyTime: (saving: boolean) => void;
    studyTimeError: string | null;
    setStudyTimeError: (error: string | null) => void;
    onStudySettingsUpdated: (profile: UserProfileResponse) => void;
}

export function DailyPlanModals({
    openSetting,
    setOpenSetting,
    openCareerAlert,
    setOpenCareerAlert,
    openStudyTime,
    setOpenStudyTime,
    openStudyTimeAlert,
    setOpenStudyTimeAlert,
    currentMinutes,
    newMinutes,
    setNewMinutes,
    currentDays,
    projectedDays,
    isResetting,
    resetError,
    clearResetError,
    resetCareerTrack,
    isSavingStudyTime,
    setIsSavingStudyTime,
    studyTimeError,
    setStudyTimeError,
    onStudySettingsUpdated,
}: DailyPlanModalsProps) {
    return (
        <>
            <Dialog open={openSetting} onOpenChange={setOpenSetting}>
                <StudySettingsDialog
                    studyMinutes={currentMinutes}
                    onCareerClick={() => {
                        setOpenSetting(false);
                        clearResetError();
                        setOpenCareerAlert(true);
                    }}
                    onStudyTimeClick={() => {
                        setOpenSetting(false);
                        setNewMinutes(currentMinutes);
                        setOpenStudyTime(true);
                    }}
                />
            </Dialog>

            <AlertDialog open={openCareerAlert} onOpenChange={setOpenCareerAlert}>
                <ChangeCareerAlert
                    onCancel={() => setOpenCareerAlert(false)}
                    onConfirm={async () => {
                        const didReset = await resetCareerTrack();
                        if (didReset) {
                            setOpenCareerAlert(false);
                        }
                    }}
                    isSubmitting={isResetting}
                    errorMessage={resetError}
                />
            </AlertDialog>

            <Dialog
                open={openStudyTime}
                onOpenChange={(isOpen) => {
                    setOpenStudyTime(isOpen);
                    if (!isOpen) {
                        setNewMinutes(currentMinutes);
                        setStudyTimeError(null);
                    }
                }}
            >
                <StudyTimeDialog
                    open={openStudyTime}
                    currentMinutes={currentMinutes}
                    onCancel={() => {
                        setOpenStudyTime(false);
                        setNewMinutes(currentMinutes);
                    }}
                    onSave={(mins) => {
                        setOpenStudyTime(false);
                        setNewMinutes(mins);
                        setStudyTimeError(null);
                        setOpenStudyTimeAlert(true);
                    }}
                />
            </Dialog>

            <AlertDialog
                open={openStudyTimeAlert}
                onOpenChange={(isOpen) => {
                    setOpenStudyTimeAlert(isOpen);
                    if (!isOpen) {
                        setNewMinutes(currentMinutes);
                    }
                }}
            >
                <StudyTimeAlert
                    currentMinutes={currentMinutes}
                    newMinutes={newMinutes}
                    currentDays={currentDays}
                    newDays={projectedDays}
                    isSaving={isSavingStudyTime}
                    errorMessage={studyTimeError}
                    onCancel={() => {
                        setOpenStudyTimeAlert(false);
                        setNewMinutes(currentMinutes);
                    }}
                    onConfirm={async () => {
                        setIsSavingStudyTime(true);
                        setStudyTimeError(null);
                        try {
                            const updatedProfile = await updateStudySettings({
                                daily_study_minutes: newMinutes,
                            });
                            onStudySettingsUpdated(updatedProfile);
                            setOpenStudyTimeAlert(false);
                        } catch {
                            setStudyTimeError("Could not update daily study time. Please try again.");
                        } finally {
                            setIsSavingStudyTime(false);
                        }
                    }}
                />
            </AlertDialog>
        </>
    );
}
