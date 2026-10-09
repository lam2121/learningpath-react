import { createFileRoute } from '@tanstack/react-router';
import { Toaster } from '@/shadcn/component/ui/sonner';
import { UserManagementTable } from '@/feature/admin/component';

function UsersPage() {
	return (
		<div className="space-y-6">
			<Toaster position="top-right" />
			<div>
				<h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Users</h1>
				<p className="text-gray-500 dark:text-gray-400">View user accounts and manage learning progress — reset curriculum progress and roadmaps</p>
			</div>
			<UserManagementTable />
		</div>
	)
}

export const Route = createFileRoute('/_protected/admin/users')({
	component: UsersPage,
});
