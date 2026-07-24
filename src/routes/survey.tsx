import { createFileRoute } from '@tanstack/react-router'
import { DynamicSurveyPage } from '@/feature/onboarding/page/DynamicSurveyPage'

// Public route — no session required (for testing purposes)
export const Route = createFileRoute('/survey')({
	component: DynamicSurveyPage,
})
