import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createRouter } from '@tanstack/react-router'
import { routeTree } from '@/routeTree.gen'
import './i18n/i18n' // Initialize i18next before app renders
import './index.css'

import { AuthProvider, type AuthContextValue } from './common/context/AuthContext'
import { USER_KEY, ADMIN_ROLE_ID } from './feature/auth/helper/authHelper'
import { BASE_PATH } from './const/appConst'
import { RadarProvider } from '@/feature/radar'
import { GeminiGradientDefs } from './common/component/GeminiIcon'
import { MainApp } from './common/component/MainApp'
import { ThemeProvider } from 'next-themes'

// Dev-only bypass: set VITE_BYPASS_AUTH=false (or remove from .env) to disable
const BYPASS_AUTH = import.meta.env.VITE_BYPASS_AUTH === 'true'

if (import.meta.env.DEV && BYPASS_AUTH) {
  const existing = localStorage.getItem(USER_KEY)
  if (!existing) {
    localStorage.setItem(USER_KEY, JSON.stringify({
      username: 'dev_admin',
      email: 'admin@tma.com.vn',
      role: 'admin',
      role_id: ADMIN_ROLE_ID,
    }))
  } else {
    try {
      const parsed = JSON.parse(existing)
      if (parsed.role_id === undefined) {
        parsed.role_id = ADMIN_ROLE_ID
        localStorage.setItem(USER_KEY, JSON.stringify(parsed))
      }
    } catch { /* ignore corrupt data */ }
  }
}

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: Number(import.meta.env.VITE_QUERY_STALE_TIME_MS) || 1000 * 60 * 5, // 5 minutes
			retry: Number(import.meta.env.VITE_QUERY_RETRY) || 3,
			refetchOnWindowFocus: false,
		},
	},
})

// Create router from route tree with proper context type
const router = createRouter({
  routeTree,
  basepath: BASE_PATH,
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
					<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
						<RadarProvider>
							<GeminiGradientDefs />
							<MainApp router={router} queryClient={queryClient} />
						</RadarProvider>
					</ThemeProvider>
				</AuthProvider>
			</QueryClientProvider>
		</StrictMode>,
	)
}
