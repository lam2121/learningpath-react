import { useMemo } from 'react';
import { RouterProvider, type AnyRouter } from '@tanstack/react-router';
import type { QueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';

export function MainApp({ router, queryClient }: { router: AnyRouter; queryClient: QueryClient }) {
	const auth = useAuth();

	const routerContext = useMemo(() => {
		return { queryClient, auth };
	}, [auth, queryClient]);

	if (auth.isLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-[#f5fbff] text-sm font-medium text-slate-600">
				Restoring your session...
			</div>
		);
	}

	return <RouterProvider router={router} context={routerContext} />;
}
