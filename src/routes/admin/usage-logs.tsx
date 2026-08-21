import { createFileRoute } from '@tanstack/react-router';
import { UsageLogTable } from '@/feature/admin/component/UsageLogTable';

function UsageLogsPage() {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold text-gray-900">AI Usage Logs</h1>
				<p className="text-gray-500">Inspect AI call history (tokens, cost, status) and free up database space by deleting old records</p>
			</div>
			<UsageLogTable />
		</div>
	)
}

export const Route = createFileRoute('/admin/usage-logs')({
	component: UsageLogsPage,
});
