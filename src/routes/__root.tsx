import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { QueryClient } from '@tanstack/react-query'
import type { AuthContextValue } from '@/common/context/AuthContext'
import { useRouteThemeSync } from '@/common/hook/useRouteThemeSync'
import { Toaster } from '@/shadcn/component/ui/sonner'

import { GlobalErrorBoundary } from '@/common/component/GlobalErrorBoundary'

export interface RouterContext {
	queryClient: QueryClient
	auth: AuthContextValue
}

function RootComponent() {
	useRouteThemeSync()
	return (
		<GlobalErrorBoundary>
			<Outlet />
			<Toaster position="top-right" />
		</GlobalErrorBoundary>
	)
}

export const Route = createRootRouteWithContext<RouterContext>()({
	component: RootComponent,
	errorComponent: ({ error }) => (
		<GlobalErrorBoundary>
			<div className="p-8 text-center text-destructive">
				Failed to load route: {error instanceof Error ? error.message : String(error)}
			</div>
		</GlobalErrorBoundary>
	),
})


