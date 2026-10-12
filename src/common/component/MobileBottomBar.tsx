import { Link, useLocation } from '@tanstack/react-router';
import { Compass, Layers, History, User, Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/common/context/AuthContext';
import { cn } from '@/shadcn/lib/util';
import { useEffect, useRef } from 'react';

export function MobileBottomBar() {
  const { t } = useTranslation(['nav', 'profile']);
  const location = useLocation();
  const auth = useAuth();
  const prevActiveRef = useRef<string>('');

  // Only show the app bottom bar for authenticated learners in phone mode
  if (!auth.isAuthenticated) {
    return null;
  }

  const currentPath = location.pathname;

  const navItems = [
    {
      to: '/',
      label: t('home', { ns: 'nav', defaultValue: 'Home' }),
      icon: Home,
      isActive: currentPath === '/' || currentPath === '',
    },
    {
      to: '/lessons/learning-path',
      label: t('path', { ns: 'nav', defaultValue: 'Roadmap' }),
      icon: Compass,
      isActive: currentPath.includes('/lessons') || currentPath.includes('/roadmap'),
    },
    {
      to: '/flashcards',
      label: t('trainingTool', { ns: 'nav', defaultValue: 'Vocab' }),
      icon: Layers,
      isActive: currentPath.includes('/flashcards'),
    },
    {
      to: '/history',
      label: t('history', { ns: 'nav', defaultValue: 'History' }),
      icon: History,
      isActive: currentPath.includes('/history'),
    },
    {
      to: '/profile',
      label: t('profile', { ns: 'nav', defaultValue: 'Profile' }),
      icon: User,
      isActive: currentPath.includes('/profile'),
    },
  ];

  const activeKey = navItems.find((item) => item.isActive)?.to ?? '';
  const justChanged = prevActiveRef.current !== activeKey;

  // Track previous active tab for animation trigger
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    prevActiveRef.current = activeKey;
  }, [activeKey]);

  return (
    <>
      {/* Spacer to prevent page bottom content from being obscured by the bottom bar on mobile */}
      <div className="h-[4.5rem] md:hidden" aria-hidden="true" />

      {/* Premium native-app style bottom navigation bar */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className={cn(
          'fixed bottom-0 left-0 right-0 z-40 md:hidden',
          // Glassmorphism with gradient top border
          'bg-white/90 backdrop-blur-xl backdrop-saturate-150',
          'shadow-[0_-2px_24px_rgba(0,0,0,0.08)]',
          'dark:bg-slate-900/90 dark:shadow-[0_-2px_24px_rgba(0,0,0,0.3)]',
          // Safe area inset for modern phones with gesture bars
          'pb-[max(0.5rem,env(safe-area-inset-bottom))]',
        )}
      >
        {/* Gradient top border line */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-400/40 to-transparent dark:via-blue-500/30" />

        <div className="flex h-[3.5rem] items-center justify-around px-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'relative flex flex-1 flex-col items-center justify-center gap-0.5 py-1',
                  'transition-colors duration-200',
                  item.isActive
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300',
                )}
              >
                {/* Icon wrapper with bounce animation on selection */}
                <div className="relative">
                  <Icon
                    className={cn(
                      'h-[22px] w-[22px] transition-transform duration-200',
                      item.isActive && 'stroke-[2.4]',
                      item.isActive && justChanged && 'mobile-tab-icon-bounce',
                    )}
                  />

                  {/* Dark mode glow under active icon */}
                  {item.isActive && (
                    <div className="mobile-tab-glow bg-blue-500/50 dark:bg-blue-400/50 hidden dark:block" />
                  )}
                </div>

                {/* Label */}
                <span
                  className={cn(
                    'text-[10px] leading-none tracking-tight',
                    item.isActive ? 'font-bold' : 'font-medium',
                  )}
                >
                  {item.label}
                </span>

                {/* Active indicator pill */}
                {item.isActive && (
                  <div
                    className={cn(
                      'mobile-tab-active-pill',
                      'bg-blue-600 dark:bg-blue-400',
                    )}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
