import { createFileRoute } from '@tanstack/react-router'
import { RoleSelectionPage } from '@/feature/onboarding/page/RoleSelectionPage'

export const Route = createFileRoute('/_protected/_user/onboarding/role-selection')({
	component: RoleSelectionPage,
})
