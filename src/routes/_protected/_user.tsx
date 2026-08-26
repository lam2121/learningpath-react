import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/_user')({
	beforeLoad: ({ context }) => {
		if (context.auth.user?.role_id === 2) {
			throw redirect({ to: '/admin' })
		}
	},
	component: () => <Outlet />,
})