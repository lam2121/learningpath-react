import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected')({
	beforeLoad: ({ context }) => {
		if (import.meta.env.DEV) return
		if (!context.auth.isAuthenticated) {
			throw redirect({
				to: '/login',
			})
		}
	},
	component: () => <Outlet />,
})
