import { createFileRoute } from '@tanstack/react-router'
import { PlacementResultPage } from '@/feature/onboarding/page/PlacementResultPage'

export const Route = createFileRoute('/_protected/_user/onboarding/placement-result')({
	component: PlacementResultPage,
})
