import { Link } from '@tanstack/react-router';
import { LayoutDashboard } from 'lucide-react';

import { useAuth } from '@/common/context/AuthContext';

const ADMIN_ROLE_ID = 2;

/**
 * Escape hatch back to the admin portal, for admins going through onboarding.
 *
 * The onboarding pages each render their own blue TMA header and deliberately
 * expose no site navigation, so without this an admin who starts the learner
 * flow has no way back short of editing the URL. Renders nothing for learners.
 */
export function AdminReturnLink() {
	const { user } = useAuth();
	if (user?.role_id !== ADMIN_ROLE_ID) return null;

	return (
		<Link
			to="/admin"
			className="px-4 py-1.5 rounded-full border border-white/40 text-white hover:bg-white/10 transition-colors text-sm font-medium flex items-center gap-2 cursor-pointer"
		>
			<LayoutDashboard className="w-4 h-4" />
			<span>Admin Portal</span>
		</Link>
	);
}
