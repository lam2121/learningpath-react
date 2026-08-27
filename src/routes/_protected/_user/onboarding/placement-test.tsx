import { createFileRoute } from '@tanstack/react-router'
import { PlacementTestPage } from '@/feature/onboarding/page/PlacementTestPage'

export const Route = createFileRoute('/_protected/_user/onboarding/placement-test')({
	component: PlacementTestPage,
})
