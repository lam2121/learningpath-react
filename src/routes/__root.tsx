import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { QueryClient } from '@tanstack/react-query'
import type { AuthContextValue } from '@/common/context/AuthContext'

export interface RouterContext {
	queryClient: QueryClient
	auth: AuthContextValue
}

export const Route = createRootRouteWithContext<RouterContext>()({
	component: () => <Outlet />,
})
