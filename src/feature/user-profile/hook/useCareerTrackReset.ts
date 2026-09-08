import { useState } from "react";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { useAuth } from "@/common/context/AuthContext";
import { deleteCareerTrack } from "@/feature/auth/api/authAPI";
import { clearStudyGoalDecisions } from "@/feature/user-profile/utils/dailyStudyGoal";
import {
    clearLoginDays,
    clearTrackedStudyActivity,
} from "@/feature/user-profile/utils/StudyActivity";
import { clearCachedOnboardingStatus } from "@/feature/onboarding/api/onboardingApi";

const DEFAULT_RESET_ERROR = "Could not reset your career track. Please try again.";

export function useCareerTrackReset() {
    const auth = useAuth();
    const navigate = useNavigate();
    const router = useRouter();
    const [isResetting, setIsResetting] = useState(false);
    const [resetError, setResetError] = useState<string | null>(null);

    const clearResetError = () => {
        setResetError(null);
    };

    const resetCareerTrack = async () => {
        if (isResetting) {
            return false;
        }

        setIsResetting(true);
        setResetError(null);

        try {
            await deleteCareerTrack();

            localStorage.removeItem("pending_role_id");
            localStorage.removeItem("pending_survey_answers");

            const userId = Number(auth.user?.id);
            if (Number.isFinite(userId)) {
                clearLoginDays(userId);
                clearTrackedStudyActivity(userId);
                clearStudyGoalDecisions(userId);
                clearCachedOnboardingStatus(userId);
            }

            await navigate({ to: "/onboarding/role-selection" });
            await router.invalidate();
            return true;
        } catch (error) {
            setResetError(
                error instanceof Error && error.message
                    ? error.message
                    : DEFAULT_RESET_ERROR,
            );
            return false;
        } finally {
            setIsResetting(false);
        }
    };

    return {
        clearResetError,
        isResetting,
        resetCareerTrack,
        resetError,
    };
}
