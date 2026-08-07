import { createFileRoute } from '@tanstack/react-router'
import { UserProfile } from '@/feature/user-profile/page/user-profile'
export const Route = createFileRoute('/_protected/_user/_user-profile/profile')({
  component: UserProfile,
})


