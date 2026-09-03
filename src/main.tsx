import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createRouter } from '@tanstack/react-router'
import { routeTree } from '@/routeTree.gen'
import './i18n/i18n' // Initialize i18next before app renders
import './index.css'

import { AuthProvider, type AuthContextValue } from './common/context/AuthContext'
import { RadarProvider } from '@/feature/radar'
import { GeminiGradientDefs } from './common/component/GeminiIcon'
import { MainApp } from './common/component/MainApp'

// Dev-only bypass: set VITE_BYPASS_AUTH=false (or remove from .env) to disable
const BYPASS_AUTH = import.meta.env.VITE_BYPASS_AUTH === 'true'

if (import.meta.env.DEV && BYPASS_AUTH) {
  const existing = localStorage.getItem('auth_user')
  if (!existing) {
    localStorage.setItem('auth_user', JSON.stringify({
      username: 'dev_admin',
      email: 'admin@tma.com.vn',
      role: 'admin',
      role_id: 2,
    }))
    localStorage.setItem('auth_access_token', 'dev-bypass-token')
  } else {
    try {
      const parsed = JSON.parse(existing)
      if (parsed.role_id === undefined) {
        parsed.role_id = 2
        localStorage.setItem('auth_user', JSON.stringify(parsed))
      }
    } catch { /* ignore corrupt data */ }
  }
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
  basepath: '/careerpath',
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
					<RadarProvider>
						<GeminiGradientDefs />
						<MainApp router={router} queryClient={queryClient} />
					</RadarProvider>
				</AuthProvider>
			</QueryClientProvider>
		</StrictMode>,
	)
}