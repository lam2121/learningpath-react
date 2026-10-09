import { createFileRoute } from '@tanstack/react-router';
import { RejectedContentTable } from '@/feature/admin/component';

function RejectedPage() {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Rejected Content</h1>
				<p className="text-gray-500 dark:text-gray-400">View and process content rejected by AI Validator</p>
			</div>
			<RejectedContentTable />
		</div>
	)
}

export const Route = createFileRoute('/_protected/admin/rejected')({
	component: RejectedPage,
});
