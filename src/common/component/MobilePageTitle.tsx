import { useLocation } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

/**
 * Renders a dynamic page title for the mobile header bar based on the
 * current route. This replaces the desktop navigation links with a single
 * contextual title, like native mobile apps do.
 */
export function MobilePageTitle() {
    const { t } = useTranslation('nav');
    const location = useLocation();
    const path = location.pathname;

    const title = getPageTitle(path, t);

    return (
        <span className="truncate text-[15px] font-bold text-slate-900 dark:text-white">
            {title}
        </span>
    );
}

function getPageTitle(
    path: string,
    t: (key: string, opts?: Record<string, string>) => string,
): string {
    if (path === '/' || path === '') {
        return t('home', { defaultValue: 'Home' });
    }
    if (path.includes('/lessons') || path.includes('/learning-path')) {
        return t('path', { defaultValue: 'Learning Path' });
    }
    if (path.includes('/flashcards')) {
        return t('trainingTool', { defaultValue: 'Flashcards' });
    }
    if (path.includes('/history')) {
        return t('history', { defaultValue: 'History' });
    }
    if (path.includes('/profile')) {
        return t('profile', { defaultValue: 'Profile' });
    }
    if (path.includes('/guide')) {
        return t('howItWorks', { defaultValue: 'How It Works' });
    }
    if (path.includes('/admin')) {
        return t('adminPage', { defaultValue: 'Admin' });
    }
    if (path.includes('/onboarding')) {
        return t('smartLearning', { defaultValue: 'Getting Started' });
    }
    if (path.includes('/quiz') || path.includes('/review')) {
        return t('smartLearning', { defaultValue: 'Practice' });
    }
    return t('home', { defaultValue: 'Home' });
}
