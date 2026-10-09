import { createFileRoute } from '@tanstack/react-router';
import { Link } from '@tanstack/react-router';
import { ScrollText } from 'lucide-react';
import { CostDashboard } from '@/feature/admin/component';
import { Button } from '@/shadcn/component/ui/button';

function CostsPage() {
	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">AI Cost Dashboard</h1>
					<p className="text-gray-500 dark:text-gray-400">Track AI costs by generator and time</p>
				</div>
				<Button asChild variant="outline">
					<Link to="/admin/usage-logs">
						<ScrollText className="mr-2 h-4 w-4" />
						View Usage Logs
					</Link>
				</Button>
			</div>
			<CostDashboard />
		</div>
	)
}

export const Route = createFileRoute('/_protected/admin/costs')({
	component: CostsPage,
});
