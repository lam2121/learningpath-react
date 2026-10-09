import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { QueryClient } from '@tanstack/react-query'
import type { AuthContextValue } from '@/common/context/AuthContext'
import { useRouteThemeSync } from '@/common/hook/useRouteThemeSync'
import { Toaster } from '@/shadcn/component/ui/sonner'

export interface RouterContext {
	queryClient: QueryClient
	auth: AuthContextValue
}

function RootComponent() {
	useRouteThemeSync()
	return (
		<>
			<Outlet />
			<Toaster position="top-right" />
		</>
	)
}

export const Route = createRootRouteWithContext<RouterContext>()({
	component: RootComponent,
})


