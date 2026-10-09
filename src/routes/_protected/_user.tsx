import { createFileRoute, Outlet } from '@tanstack/react-router'

// No role guard here on purpose: an admin is a user who also has admin rights,
// so they get the full learner experience. The guards below decide access —
// `_enrolled` requires learning_status === 'enrolled', `onboarding` requires it
// not to be. Admins still land on /admin by default after login.
export const Route = createFileRoute('/_protected/_user')({
	component: () => <Outlet />,
})
