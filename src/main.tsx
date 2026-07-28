import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createRouter } from '@tanstack/react-router'
import { routeTree } from '@/routeTree.gen'
import './index.css'

import { AuthProvider, type AuthContextValue } from './common/context/AuthContext'
import { GeminiGradientDefs } from './common/component/GeminiIcon'
import { MainApp } from './common/component/MainApp'

// Dev-only: auto-login mock user for local development
if (import.meta.env.DEV && !localStorage.getItem('auth_user')) {
  localStorage.setItem('auth_user', JSON.stringify({
    username: 'dev_user',
    email: 'dev@tma.com.vn',
    role: 'admin'
  }));
}

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 5, // 5 minutes
			retry: 3,
			refetchOnWindowFocus: false,
		},
	},
})

// Create router from route tree with proper context type
const router = createRouter({
  routeTree,
  context: {
    auth: undefined as unknown as AuthContextValue,
    queryClient
  }
})

const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
	const root = createRoot(rootElement)
	root.render(
		<StrictMode>
			<QueryClientProvider client={queryClient}>
				<AuthProvider>
					<GeminiGradientDefs />
					<MainApp router={router} queryClient={queryClient} />
				</AuthProvider>
			</QueryClientProvider>
		</StrictMode>,
	)
}