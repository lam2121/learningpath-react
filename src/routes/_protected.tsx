import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

const BYPASS_AUTH = import.meta.env.VITE_BYPASS_AUTH === 'true'

export const Route = createFileRoute('/_protected')({
	beforeLoad: ({ context }) => {
		if (import.meta.env.DEV && BYPASS_AUTH) return
		if (!context.auth.isAuthenticated) {
			throw redirect({
				to: '/login',
			})
		}
		if (context.auth.user?.role_id === 2) {
			throw redirect({ to: '/admin' })
		}
	},
	component: () => <Outlet />,
})
