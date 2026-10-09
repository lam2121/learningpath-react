import { useLayoutEffect } from 'react'
import { useLocation } from '@tanstack/react-router'
import { useTheme } from 'next-themes'
import { BASE_PATH } from '@/const/appConst'

/**
 * Determines whether the current route supports dark theme.
 * Dark theme is ONLY active on pages with the darkmode toggle header (MainNavigationMenu).
 * Any page without the header (e.g. /admin, /onboarding, /auth, etc.) is strictly light mode.
 */
export function isDarkThemeSupportedRoute(pathname: string): boolean {
	const prefix = BASE_PATH === '/' ? '' : BASE_PATH
	const trimmed = prefix && pathname.startsWith(prefix) ? pathname.slice(prefix.length) : pathname
	const normalized = trimmed.replace(/\/$/, '') || '/'
	return (
		normalized === '/' ||
		normalized === '/guide' ||
		normalized.startsWith('/admin') ||
		normalized.startsWith('/lessons') ||
		normalized.startsWith('/profile') ||
		normalized.startsWith('/history')
	)
}

/**
 * Synchronizes the HTML root class and color scheme with the current route.
 * If the current route does not feature the dark mode header (e.g. admin, onboarding),
 * it removes the 'dark' class and enforces light theme, blocking any dark styling leaks.
 */
export function useRouteThemeSync() {
	const location = useLocation()
	const { resolvedTheme } = useTheme()

	useLayoutEffect(() => {
		const isDarkAllowed = isDarkThemeSupportedRoute(location.pathname)
		const root = document.documentElement

		if (!isDarkAllowed) {
			root.classList.remove('dark')
			root.classList.add('light')
			root.style.colorScheme = 'light'
			root.setAttribute('data-theme', 'light')

			// Observe and guard against any external provider/script re-adding 'dark' on excluded pages
			const observer = new MutationObserver(() => {
				if (root.classList.contains('dark')) {
					root.classList.remove('dark')
					root.classList.add('light')
					root.style.colorScheme = 'light'
					root.setAttribute('data-theme', 'light')
				}
			})
			observer.observe(root, { attributes: true, attributeFilter: ['class', 'data-theme'] })
			return () => observer.disconnect()
		} else {
			root.classList.remove('light')
			if (resolvedTheme === 'dark') {
				root.classList.add('dark')
				root.style.colorScheme = 'dark'
				root.setAttribute('data-theme', 'dark')
			} else {
				root.classList.remove('dark')
				root.style.colorScheme = 'light'
				root.setAttribute('data-theme', 'light')
			}
		}
	}, [location.pathname, resolvedTheme])
}
