import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Loader2, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/shadcn/component/ui/button';
import { Badge } from '@/shadcn/component/ui/badge';
import { RoleCreationForm } from '@/feature/admin/component/RoleCreationForm';
import { fetchTracks, type CareerTrack } from '@/feature/admin/api/adminApi';

function TracksPage() {
	const [tracks, setTracks] = useState<CareerTrack[]>([]);
	const [loading, setLoading] = useState(true);
	const [showForm, setShowForm] = useState(false);
	const [editingTrack, setEditingTrack] = useState<CareerTrack | undefined>(undefined);

	useEffect(() => {
		loadTracks();
	}, []);

	const loadTracks = async () => {
		setLoading(true);
		try {
			const data = await fetchTracks();
			setTracks(data);
		} catch (error) {
			console.error('Failed to load tracks:', error);
		} finally {
			setLoading(false);
		}
	}

const handleTrackSaved = () => {
		setShowForm(false);
		setEditingTrack(undefined);
		loadTracks();
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<Loader2 className="h-8 w-8 animate-spin text-blue-600" />
			</div>
		)
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold text-gray-900">Career Tracks</h1>
					<p className="text-gray-500">Quản lý các career track và ngân sách D/C/T/G</p>
				</div>
				<Button onClick={() => { setEditingTrack(undefined); setShowForm(true); }}>
					<Plus className="h-4 w-4 mr-2" />
					Thêm Track mới
				</Button>
			</div>

			<div className="overflow-x-auto rounded-lg border bg-white">
				<table className="w-full">
					<thead>
						<tr className="bg-gray-50 text-left text-sm text-gray-500">
							<th className="p-4">Track Name</th>
							<th className="p-4">Role</th>
							<th className="p-4">Active Learners</th>
							<th className="p-4">Status</th>
							<th className="p-4">Budget (Adv)</th>
							<th className="p-4 w-40">Actions</th>
						</tr>
					</thead>
					<tbody>
						{tracks.map(track => (
							<tr key={track.id} className="border-t border-gray-100 hover:bg-gray-50">
								<td className="p-4 font-medium text-gray-900">{track.name}</td>
								<td className="p-4 text-sm text-gray-600 max-w-xs truncate">{track.jobDescription.slice(0, 60)}...</td>
								<td className="p-4 text-sm text-gray-600">{track.activeLearnerCount}</td>
								<td className='p-4'>
									<Badge variant={track.isActive ? 'default' : 'secondary'}>
										{track.isActive ? 'Active' : 'Inactive'}
									</Badge>
								</td>
								<td className="p-4 text-sm font-mono">
									D:{track.budgets.advanced.D} C:{track.budgets.advanced.C} T:{track.budgets.advanced.T} G:{track.budgets.advanced.G}
								</td>
								<td className='p-4'>
									<div className="flex items-center gap-2">
										<Button variant="ghost" size="icon" onClick={() => { setEditingTrack(track); setShowForm(true); }}>
											<Edit className='h-4 w-4' />
										</Button>
										<Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700">
											<Trash2 className='h-4 w-4' />
										</Button>
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{/* Role Creation Form Modal */}
			{showForm && (
				<div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
					<div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
						<RoleCreationForm 
							initialTrack={editingTrack || undefined} 
							onSuccess={handleTrackSaved} 
						/>
					</div>
				</div>
			)}
		</div>
	)
}

export const Route = createFileRoute('/admin/tracks')({
	component: TracksPage,
});