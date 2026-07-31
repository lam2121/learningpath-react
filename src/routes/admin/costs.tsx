import { createFileRoute } from '@tanstack/react-router';
import { CostDashboard } from '@/feature/admin/component/CostDashboard';

function CostsPage() {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold text-gray-900">AI Cost Dashboard</h1>
				<p className="text-gray-500">Track AI costs by generator and time</p>
			</div>
			<CostDashboard />
		</div>
	)
}

export const Route = createFileRoute('/admin/costs')({
	component: CostsPage,
});