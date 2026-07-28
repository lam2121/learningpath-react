import { createFileRoute } from '@tanstack/react-router'
import { DynamicSurveyPage } from '@/feature/onboarding/page/DynamicSurveyPage'

// Protected route — requires an active session (guarded by _protected.tsx beforeLoad)
export const Route = createFileRoute('/_protected/_user/onboarding/survey')({
	component: DynamicSurveyPage,
})
