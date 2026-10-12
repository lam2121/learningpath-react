import { Link, useLocation } from '@tanstack/react-router';
import { Compass, Layers, History, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/common/context/AuthContext';
import { cn } from '@/shadcn/lib/util';

export function MobileBottomBar() {
  const { t } = useTranslation(['nav', 'profile']);
  const location = useLocation();
  const auth = useAuth();

  // Only show the app bottom bar for authenticated learners in phone mode
  if (!auth.isAuthenticated) {
    return null;
  }

  const currentPath = location.pathname;

  const navItems = [
    {
      to: '/lessons/learning-path',
      label: t('roadmap', { ns: 'nav', defaultValue: 'Lộ trình' }),
      icon: Compass,
      isActive: currentPath.includes('/lessons') || currentPath === '/' || currentPath.includes('/roadmap'),
    },
    {
      to: '/flashcards',
      label: t('flashcards', { ns: 'nav', defaultValue: 'Từ vựng' }),
      icon: Layers,
      isActive: currentPath.includes('/flashcards'),
    },
    {
      to: '/history',
      label: t('history', { ns: 'nav', defaultValue: 'Lịch sử' }),
      icon: History,
      isActive: currentPath.includes('/history'),
    },
    {
      to: '/profile',
      label: t('profile', { ns: 'nav', defaultValue: 'Hồ sơ' }),
      icon: User,
      isActive: currentPath.includes('/profile'),
    },
  ];

  return (
    <>
      {/* Spacer to prevent page bottom content from being obscured by the bottom bar on mobile */}
      <div className="h-16 md:hidden" aria-hidden="true" />

      {/* Floating native-app style bottom navigation bar */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-slate-200/90 bg-white/95 backdrop-blur-lg shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:border-slate-800 dark:bg-slate-900/95 pb-[max(0.4rem,env(safe-area-inset-bottom))]"
      >
        <div className="flex h-14 items-center justify-around px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'flex flex-1 flex-col items-center justify-center py-1 transition-all duration-200 active:scale-90',
                  item.isActive
                    ? 'text-blue-600 dark:text-blue-400 font-bold'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 font-medium'
                )}
              >
                <div className="relative">
                  <Icon
                    className={cn(
                      'h-5 w-5 transition-transform duration-200',
                      item.isActive && 'scale-110 stroke-[2.4]'
                    )}
                  />
                  {item.isActive && (
                    <span className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-blue-600 dark:bg-blue-400" />
                  )}
                </div>
                <span className="mt-1 text-[11px] tracking-tight leading-none">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
