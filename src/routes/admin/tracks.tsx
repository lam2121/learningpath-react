import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect, useCallback } from 'react';
import { Loader2, Plus, Edit, Trash2, Play, RotateCcw, AlertCircle, ShieldAlert, AlertTriangle, FileText } from 'lucide-react';
import { Button } from '@/shadcn/component/ui/button';
import { Badge } from '@/shadcn/component/ui/badge';
import { Alert, AlertDescription } from '@/shadcn/component/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shadcn/component/ui/dialog';
import { RoleCreationForm } from '@/feature/admin/component/RoleCreationForm';
import {
	RegenerateTrackModal,
	ResetTrackLearnersModal,
	GenerateCourseModal,
} from '@/feature/admin/component/GenerationConfirmModals';
import {
	fetchTracks,
	generatePlacement,
	generateCourse,
	fetchGenerationStatus,
	resetTrackLearners,
	activateTrack,
	deleteTrack,
	fetchKillSwitchState,
	type CareerTrack,
} from '@/feature/admin/api/adminApi';

const RUNNING_STATUSES = ['in_progress', 'pending'];

function TracksPage() {
	const navigate = useNavigate();
	const [tracks, setTracks] = useState<CareerTrack[]>([]);
	const [loading, setLoading] = useState(true);
	const [showForm, setShowForm] = useState(false);
	const [editingTrack, setEditingTrack] = useState<CareerTrack | undefined>(undefined);
	const [generating, setGenerating] = useState<Record<number, boolean>>({});
	const [confirmRegen, setConfirmRegen] = useState<CareerTrack | null>(null);
	const [confirmReset, setConfirmReset] = useState<CareerTrack | null>(null);
	const [confirmCourse, setConfirmCourse] = useState<CareerTrack | null>(null);
	const [confirmDelete, setConfirmDelete] = useState<CareerTrack | null>(null);
	const [mutating, setMutating] = useState(false);
	const [killSwitchBlocked, setKillSwitchBlocked] = useState(false);
	const [killSwitchReason, setKillSwitchReason] = useState<string | undefined>(undefined);

	const loadTracks = useCallback(async () => {
		setLoading(true);
		try {
			const data = await fetchTracks();
			setTracks(data);
		} catch (error) {
			console.error('Failed to load tracks:', error);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadTracks();
	}, [loadTracks]);

	const pollGeneration = async (trackId: number): Promise<string> => {
		const deadline = Date.now() + 120000;
		while (true) {
			const status = await fetchGenerationStatus(trackId);
			if (status.status === 'completed' || status.status === 'failed') {
				return status.status;
			}
			if (Date.now() > deadline) return 'timedout';
			await new Promise(res => setTimeout(res, 2000));
		}
	};

	const runGenerate = async (track: CareerTrack, force: boolean) => {
		setGenerating(prev => ({ ...prev, [track.id]: true }));
		try {
			await generatePlacement(track.id, force);
			const finalStatus = await pollGeneration(track.id);
			setTracks(prev =>
				prev.map(t => (t.id === track.id ? { ...t, generationStatus: finalStatus } : t))
			);
			if (finalStatus === 'timedout') {
				alert('Generation is still running on the server. Check back in a moment.');
			}
		} catch (error) {
			console.error('Generation failed:', error);
			const detail = (error as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
			alert(typeof detail === 'string' ? detail : 'Failed to start generation.');
		} finally {
			setGenerating(prev => ({ ...prev, [track.id]: false }));
		}
	};

	const handleGenerateClick = async (track: CareerTrack) => {
		try {
			const ks = await fetchKillSwitchState();
			if (ks.enabled) {
				setKillSwitchReason(ks.reason ?? undefined);
				setKillSwitchBlocked(true);
				return;
			}
		} catch (error) {
			console.error('Failed to check kill switch:', error);
		}
		if (track.activeLearnerCount > 0) {
			setConfirmReset(track);
		} else if (track.generationStatus === 'completed' || track.generationStatus === 'failed') {
			setConfirmRegen(track);
		} else {
			runGenerate(track, false);
		}
	};

	const runGenerateCourse = async (track: CareerTrack, force: boolean) => {
		setGenerating(prev => ({ ...prev, [track.id]: true }));
		try {
			await generateCourse(track.id, force);
			const finalStatus = await pollGeneration(track.id);
			await loadTracks();
			if (finalStatus === 'timedout') {
				alert('Course generation is still running on the server. Check back in a moment.');
			} else if (finalStatus === 'failed') {
				alert('Course generation failed. Check the AI Costs / Rejected Content pages for details.');
			}
		} catch (error) {
			console.error('Course generation failed:', error);
			const detail = (error as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
			alert(typeof detail === 'string' ? detail : 'Failed to start course generation.');
		} finally {
			setGenerating(prev => ({ ...prev, [track.id]: false }));
		}
	};

	const handleGenerateCourseClick = async (track: CareerTrack) => {
		try {
			const ks = await fetchKillSwitchState();
			if (ks.enabled) {
				setKillSwitchReason(ks.reason ?? undefined);
				setKillSwitchBlocked(true);
				return;
			}
		} catch (error) {
			console.error('Failed to check kill switch:', error);
		}
		// Regenerating the course outline replaces every topic/lesson, which would
		// wipe each enrolled learner's roadmap (FK cascade). Mirror the placement
		// flow: require a reset-learners step first (docs/07 deviation #23).
		if ((track.activeLearnerCount ?? 0) > 0) {
			setConfirmReset(track);
		} else {
			setConfirmCourse(track);
		}
	};

	const handleCourseConfirm = () => {
		if (!confirmCourse) return;
		const track = confirmCourse;
		setConfirmCourse(null);
		runGenerateCourse(track, (track.topicsCount ?? 0) > 0);
	};

	const handleRegenConfirm = () => {
		if (!confirmRegen) return;
		const track = confirmRegen;
		setConfirmRegen(null);
		runGenerate(track, true);
	};

	const handleResetConfirm = async () => {
		if (!confirmReset) return;
		const track = confirmReset;
		setMutating(true);
		try {
			const result = await resetTrackLearners(track.id);
			alert(
				`Reset ${result.resetLearners} learner(s), cleared ${result.clearedAnswers} answer(s) and ` +
					`${result.clearedRoadmaps} roadmap(s). ` +
					'You can now regenerate the placement questions or the course outline.'
			);
			setConfirmReset(null);
			await loadTracks();
		} catch (error) {
			console.error('Reset learners failed:', error);
			alert('Failed to reset learners.');
		} finally {
			setMutating(false);
		}
	};

	const handleTrackSaved = () => {
		setShowForm(false);
		setEditingTrack(undefined);
		loadTracks();
	};

	const handleActivate = async (track: CareerTrack) => {
		setMutating(true);
		try {
			await activateTrack(track.id);
			await loadTracks();
		} catch (error) {
			console.error('Activate track failed:', error);
			alert('Failed to activate track.');
		} finally {
			setMutating(false);
		}
	};

	const handleDelete = async () => {
		if (!confirmDelete) return;
		const track = confirmDelete;
		setMutating(true);
		try {
			await deleteTrack(track.id);
			setConfirmDelete(null);
			await loadTracks();
		} catch (error) {
			console.error('Delete track failed:', error);
			const detail = (error as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
			alert(typeof detail === 'string' ? detail : 'Failed to delete track.');
		} finally {
			setMutating(false);
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<Loader2 className="h-8 w-8 animate-spin text-blue-600" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold text-gray-900">Career Tracks</h1>
					<p className="text-gray-500">Manage career tracks and D/C/T/G budget</p>
				</div>
				<Button onClick={() => { setEditingTrack(undefined); setShowForm(true); }}>
					<Plus className="h-4 w-4 mr-2" />
					Add New Track
				</Button>
			</div>

			<div className="overflow-x-auto rounded-lg border bg-white">
				<table className="w-full">
					<thead>
						<tr className="bg-gray-50 text-left text-sm text-gray-500">
							<th className="p-4">Track Name</th>
							<th className="p-4">Role Description</th>
							<th className="p-4">Active Learners</th>
							<th className="p-4">Status</th>
							<th className="p-4">Budget (Baseline)</th>
							<th className="p-4">Generation</th>
							<th className="p-4 w-40">Actions</th>
						</tr>
					</thead>
					<tbody>
						{tracks.map(track => {
							const isLocallyGenerating = Boolean(generating[track.id]);
							const isRunning = RUNNING_STATUSES.includes(track.generationStatus ?? '');
							return (
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
										D:{track.baseline.D_doc} C:{track.baseline.C_comm} T:{track.baseline.T_trouble} G:{track.baseline.G_custom}
									</td>
									<td className="p-4">
										<div className="flex items-center gap-2">
											{isLocallyGenerating ? (
												<Loader2 className="h-4 w-4 animate-spin text-blue-600" />
											) : (
												<Button
													variant="outline"
													size="sm"
													className="h-8 text-xs"
													disabled={isRunning}
													title={isRunning ? 'Generation already in progress' : undefined}
													onClick={() => handleGenerateClick(track)}
												>
													<Play className="h-3 w-3 mr-1" />
													Generate
												</Button>
											)}
											<Button
												variant="outline"
												size="sm"
												className="h-8 text-xs"
												disabled={isLocallyGenerating || isRunning}
												title={isRunning ? 'Generation already in progress' : 'Generate course outline (20 topics + 120 lessons)'}
												onClick={() => handleGenerateCourseClick(track)}
											>
												<FileText className="h-3 w-3 mr-1" />
												Generate Course
											</Button>
											{track.generationStatus && track.generationStatus !== 'pending' && (
												<Badge variant="outline" className="text-xs">
													{track.generationStatus}
												</Badge>
											)}
										</div>
										{(track.topicsCount ?? 0) > 0 && (
											<div className="mt-1 text-xs text-gray-500">
												{track.topicsCount} topics · {track.lessonsCount} lessons
											</div>
										)}
									</td>
									<td className='p-4'>
										<div className="flex items-center gap-2">
											<Button variant="ghost" size="icon" title="Edit Track" onClick={() => { setEditingTrack(track); setShowForm(true); }}>
												<Edit className='h-4 w-4' />
											</Button>
											{!track.isActive && (
												<Button
													variant="ghost"
													size="icon"
													className="text-green-600 hover:text-green-700"
													title="Reactivate track"
													disabled={mutating}
													onClick={() => handleActivate(track)}
												>
													<RotateCcw className='h-4 w-4' />
												</Button>
											)}
											<Button
												variant="ghost"
												size="icon"
												className="text-red-500 hover:text-red-700"
												title="Delete track"
												disabled={isRunning || mutating}
												onClick={() => setConfirmDelete(track)}
											>
												<Trash2 className='h-4 w-4' />
											</Button>
										</div>
									</td>
								</tr>
							);
						})}
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

			{/* Regenerate confirmation */}
			<RegenerateTrackModal
				track={confirmRegen}
				loading={Boolean(confirmRegen && generating[confirmRegen.id])}
				onConfirm={handleRegenConfirm}
				onClose={() => setConfirmRegen(null)}
			/>

			{/* Reset learners confirmation */}
			<ResetTrackLearnersModal
				track={confirmReset}
				loading={mutating}
				onConfirm={handleResetConfirm}
				onClose={() => setConfirmReset(null)}
			/>

			{/* Generate Course (B1+B2) confirmation */}
			<GenerateCourseModal
				track={confirmCourse}
				loading={Boolean(confirmCourse && generating[confirmCourse.id])}
				onConfirm={handleCourseConfirm}
				onClose={() => setConfirmCourse(null)}
			/>

			{/* Delete track confirmation */}
			<Dialog open={Boolean(confirmDelete)} onOpenChange={open => { if (!open) setConfirmDelete(null); }}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-red-600">
							<AlertCircle className="h-5 w-5" />
							Delete Career Track
						</DialogTitle>
						<DialogDescription>
							You are about to permanently delete track <strong>{confirmDelete?.name}</strong>. This action cannot be undone.
						</DialogDescription>
					</DialogHeader>

					{confirmDelete && (
						<div className="space-y-4 py-4">
							<Alert variant={confirmDelete.activeLearnerCount > 0 ? 'default' : 'default'} className="border-amber-200 bg-amber-50">
								<AlertCircle className="h-4 w-4" />
								<AlertDescription className="text-sm">
									{confirmDelete.activeLearnerCount > 0
										? `This track has ${confirmDelete.activeLearnerCount} active learner(s). Deletion is blocked until you reset learners for this track.`
										: 'This track has no active learners. All generated placement questions will be deleted.'}
								</AlertDescription>
							</Alert>
						</div>
					)}

					<DialogFooter className="flex-col-reverse sm:flex-row gap-3">
						<Button variant="outline" onClick={() => setConfirmDelete(null)} disabled={mutating}>
							Cancel
						</Button>
						<Button
							variant="destructive"
							disabled={mutating || (confirmDelete?.activeLearnerCount ?? 0) > 0}
							onClick={handleDelete}
						>
							{mutating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
							Delete Track
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Kill switch blocked */}
			<Dialog open={killSwitchBlocked} onOpenChange={open => { if (!open) setKillSwitchBlocked(false); }}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-red-600">
							<ShieldAlert className="h-5 w-5" />
							AI Generation is Disabled
						</DialogTitle>
						<DialogDescription>
							The kill switch is currently ON, so AI generation is blocked. Enable it on the
							Kill Switch page to generate placement questions.
						</DialogDescription>
					</DialogHeader>

					{killSwitchReason && (
						<Alert variant="default" className="border-red-200 bg-red-50">
							<AlertTriangle className="h-4 w-4" />
							<AlertDescription className="text-sm">
								Reason: {killSwitchReason}
							</AlertDescription>
						</Alert>
					)}

					<DialogFooter className="flex-col-reverse sm:flex-row gap-3">
						<Button variant="outline" onClick={() => setKillSwitchBlocked(false)} className="w-full sm:flex-1">
							Got it
						</Button>
						<Button
							onClick={() => { setKillSwitchBlocked(false); navigate({ to: '/admin/killswitch' }); }}
							className="w-full sm:flex-1"
						>
							Go to Kill Switch
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

export const Route = createFileRoute('/admin/tracks')({
	component: TracksPage,
});
