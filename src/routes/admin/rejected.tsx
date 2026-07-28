import { createFileRoute } from '@tanstack/react-router';
import { RejectedContentTable } from '@/feature/admin/component/RejectedContentTable';

function RejectedPage() {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold text-gray-900">Rejected Content</h1>
				<p className="text-gray-500">Xem và xử lý nội dung bị AI Validator từ chối</p>
			</div>
			<RejectedContentTable />
		</div>
	)
}

export const Route = createFileRoute('/admin/rejected')({
	component: RejectedPage,
});