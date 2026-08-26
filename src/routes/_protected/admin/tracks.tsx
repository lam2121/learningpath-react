import { createFileRoute } from '@tanstack/react-router';
import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Edit, Loader2, Plus, RotateCcw, Sparkles, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shadcn/component/ui/button';
import { Badge } from '@/shadcn/component/ui/badge';
import { Alert, AlertDescription } from '@/shadcn/component/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shadcn/component/ui/dialog';
import { Toaster } from '@/shadcn/component/ui/sonner';
import { RoleCreationForm } from '@/feature/admin/component/RoleCreationForm';
import { GenerationCenterDialog } from '@/feature/admin/component/GenerationCenterDialog';
import {
	activateTrack,
	deleteTrack,
	fetchGenerationSummary,
	fetchTracks,
	generateCourse,
	generatePlacement,
	resetTrackLearners,
	type CareerTrack,
	type GenerationSummary,
} from '@/feature/admin/api/adminApi';

type Workflow = 'placement' | 'course';
type ActionState = Workflow | 'reset' | null;

function getRowStatus(track: CareerTrack): { label: string; className: string } {
	const placementStatus = track.placementGenerationStatus;
	const courseStatus = track.courseGenerationStatus;
	const isGenerating = placementStatus === 'in_progress' || placementStatus === 'pending' || courseStatus === 'in_progress' || courseStatus === 'pending';

	if (isGenerating) {
		return {
			label: courseStatus === 'in_progress' || courseStatus === 'pending' ? 'Generating course' : 'Generating placement',
			className: 'border-blue-200 bg-blue-50 text-blue-700',
		}
	}
	if (placementStatus === 'failed' || courseStatus === 'failed') {
		return {
			label: 'Attention',
			className: 'border-red-200 bg-red-50 text-red-700',
		}
	}
	const placementReady = track.placementQuestionsCount >= 48;
	const courseReady = track.topicsCount >= 20 && track.lessonsCount >= 120;
	if (placementReady && courseReady) {
		return {
			label: 'Ready',
			className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
		}
	}
	if (track.placementQuestionsCount > 0 || track.topicsCount > 0 || track.lessonsCount > 0) {
		return {
			label: 'Partial',
			className: 'border-amber-200 bg-amber-50 text-amber-800',
		}
	}
	return {
		label: 'Not started',
		className: 'border-slate-200 bg-slate-50 text-slate-700',
	}
}

function summarizePlacement(track: CareerTrack): string {
	if (track.placementQuestionsCount > 0) {
		return `Placement: ${track.placementQuestionsCount} questions`;
	}
	if (track.placementGenerationStatus === 'failed') {
		return 'Placement: last run failed';
	}
	return 'Placement: not generated';
}

function summarizeCourse(track: CareerTrack): string {
	if (track.topicsCount > 0 || track.lessonsCount > 0) {
		return `Course: ${track.topicsCount} topics · ${track.lessonsCount} lessons`;
	}
	if (track.courseGenerationStatus === 'failed') {
		return 'Course: last run failed';
	}
	return 'Course: not generated';
}

function TracksPage() {
	const [tracks, setTracks] = useState<CareerTrack[]>([]);
	const [loading, setLoading] = useState(true);
	const [showForm, setShowForm] = useState(false);
	const [editingTrack, setEditingTrack] = useState<CareerTrack | undefined>(undefined);
	const [selectedTrack, setSelectedTrack] = useState<CareerTrack | null>(null);
	const [generationSummary, setGenerationSummary] = useState<GenerationSummary | null>(null);
	const [summaryLoading, setSummaryLoading] = useState(false);
	const [actionLoading, setActionLoading] = useState<ActionState>(null);
	const [confirmWorkflow, setConfirmWorkflow] = useState<Workflow | null>(null);
	const [confirmDelete, setConfirmDelete] = useState<CareerTrack | null>(null);
	const [mutating, setMutating] = useState(false);

	const loadTracks = useCallback(async () => {
		setLoading(true);
		try {
			const data = await fetchTracks();
			setTracks(data);
			setSelectedTrack(prev => (prev ? data.find(track => track.id === prev.id) ?? prev : prev));
		} catch (error) {
			console.error('Failed to load tracks:', error);
			toast.error('Failed to load career tracks.');
		} finally {
			setLoading(false);
		}
	}, []);

	const loadGenerationSummary = useCallback(async (roleId: number, silent = false) => {
		if (!silent) setSummaryLoading(true);
		try {
			const data = await fetchGenerationSummary(roleId);
			setGenerationSummary(data);
			return data;
		} catch (error) {
			console.error('Failed to load generation summary:', error);
			if (!silent) toast.error('Failed to load generation details.');
			return null;
		} finally {
			if (!silent) setSummaryLoading(false);
		}
	}, []);

	useEffect(() => {
		loadTracks();
	}, [loadTracks]);

	useEffect(() => {
		if (!selectedTrack || !generationSummary) return;
		const isRunning = generationSummary.activeJob.status === 'in_progress' || generationSummary.activeJob.status === 'pending';
		if (!isRunning) return;

		const intervalId = window.setInterval(async () => {
			const next = await loadGenerationSummary(selectedTrack.id, true);
			if (!next) return;
			const stillRunning = next.activeJob.status === 'in_progress' || next.activeJob.status === 'pending';
			if (!stillRunning) {
				await loadTracks();
			}
		}, 2000);

		return () => window.clearInterval(intervalId);
	}, [selectedTrack, generationSummary, loadGenerationSummary, loadTracks]);

	const openGenerationCenter = async (track: CareerTrack) => {
		setSelectedTrack(track);
		setConfirmWorkflow(null);
		setGenerationSummary(null);
		await loadGenerationSummary(track.id);
	}

	const closeGenerationCenter = () => {
		if (actionLoading !== null) return;
		setSelectedTrack(null);
		setGenerationSummary(null);
		setConfirmWorkflow(null);
	}

	const handleGenerateRequest = async (workflow: Workflow) => {
		if (!selectedTrack || !generationSummary) return;
		const hasAssets = workflow === 'placement'
			? generationSummary.placement.questionCount > 0
			: generationSummary.course.topicsCount > 0 || generationSummary.course.lessonsCount > 0;

		if (hasAssets && confirmWorkflow !== workflow) {
			setConfirmWorkflow(workflow);
			return
		}

		setActionLoading(workflow);
		try {
			if (workflow === 'placement') {
				await generatePlacement(selectedTrack.id, hasAssets);
				toast.success(hasAssets ? 'Placement regeneration started.' : 'Placement generation started.');
			} else {
				await generateCourse(selectedTrack.id, hasAssets);
				toast.success(hasAssets ? 'Course regeneration started.' : 'Course generation started.');
			}
			setConfirmWorkflow(null);
			await Promise.all([
				loadTracks(),
				loadGenerationSummary(selectedTrack.id, true),
			])
		} catch (error) {
			console.error(`${workflow} generation failed:`, error);
			const detail = (error as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
			toast.error(typeof detail === 'string' ? detail : 'Failed to start generation.');
			await loadGenerationSummary(selectedTrack.id, true);
		} finally {
			setActionLoading(null);
		}
	}

	const handleResetLearners = async () => {
		if (!selectedTrack) return;
		setActionLoading('reset');
		try {
			const result = await resetTrackLearners(selectedTrack.id);
			toast.success(
				`Reset ${result.resetLearners} learner(s), cleared ${result.clearedAnswers} answer(s), ${result.clearedRoadmaps} roadmap(s), ${result.clearedLessons} lesson(s), ${result.clearedRadarScores} radar score(s), and ${result.clearedQueueEntries} review queue entry(ies).`
			);
			setConfirmWorkflow(null);
			await Promise.all([
				loadTracks(),
				loadGenerationSummary(selectedTrack.id, true),
			])
		} catch (error) {
			console.error('Reset learners failed:', error);
			const detail = (error as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
			toast.error(typeof detail === 'string' ? detail : 'Failed to reset learners.');
		} finally {
			setActionLoading(null);
		}
	}

	const handleTrackSaved = () => {
		setShowForm(false);
		setEditingTrack(undefined);
		loadTracks();
	}

	const handleActivate = async (track: CareerTrack) => {
		setMutating(true);
		try {
			await activateTrack(track.id);
			toast.success('Track reactivated.');
			await loadTracks();
		} catch (error) {
			console.error('Activate track failed:', error);
			toast.error('Failed to activate track.');
		} finally {
			setMutating(false);
		}
	}

	const handleDelete = async () => {
		if (!confirmDelete) return;
		const track = confirmDelete;
		setMutating(true);
		try {
			await deleteTrack(track.id);
			setConfirmDelete(null);
			toast.success('Track deleted.');
			await loadTracks();
		} catch (error) {
			console.error('Delete track failed:', error);
			const detail = (error as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
			toast.error(typeof detail === 'string' ? detail : 'Failed to delete track.');
		} finally {
			setMutating(false);
		}
	}

	if (loading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-blue-600" />
			</div>
		)
	}

	return (
		<div className="space-y-6">
			<Toaster position="top-right" />
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold text-gray-900">Career Tracks</h1>
					<p className="text-gray-500">Manage career tracks and D/C/T/G budget</p>
				</div>
				<Button onClick={() => { setEditingTrack(undefined); setShowForm(true); }}>
					<Plus className="mr-2 h-4 w-4" />
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
							const rowStatus = getRowStatus(track);
							const isRunning = track.placementGenerationStatus === 'in_progress'
								|| track.placementGenerationStatus === 'pending'
								|| track.courseGenerationStatus === 'in_progress'
								|| track.courseGenerationStatus === 'pending';
							return (
								<tr key={track.id} className="border-t border-gray-100 hover:bg-gray-50">
									<td className="p-4 font-medium text-gray-900">{track.name}</td>
									<td className="max-w-xs p-4 text-sm text-gray-600">{track.jobDescription.slice(0, 80)}...</td>
									<td className="p-4 text-sm text-gray-600">{track.activeLearnerCount}</td>
									<td className='p-4'>
										<Badge variant={track.isActive ? 'default' : 'secondary'}>
											{track.isActive ? 'Active' : 'Inactive'}
										</Badge>
									</td>
									<td className="p-4 font-mono text-sm">
										D:{track.baseline.D_doc} C:{track.baseline.C_comm} T:{track.baseline.T_trouble} G:{track.baseline.G_custom}
									</td>
									<td className='p-4'>
										<div className="flex flex-col gap-3">
											<div className="flex flex-wrap items-center gap-2">
												<Button
													variant='outline'
													size='sm'
													className='h-8 text-xs'
													onClick={() => openGenerationCenter(track)}
												>
													{isRunning ? <Loader2 className="mr-1 h-3 w-3 animate-spin text-blue-600" /> : <Sparkles className="mr-1 h-3 w-3" />}
													Manage
												</Button>
												<Badge variant="outline" className={rowStatus.className}>
													{rowStatus.label}
												</Badge>
											</div>
											<div className="space-y-1 text-xs text-gray-500">
												<div>{summarizePlacement(track)}</div>
												<div>{summarizeCourse(track)}</div>
											</div>
										</div>
									</td>
									<td className='p-4'>
										<div className="flex items-center gap-2">
											<Button variant="ghost" size="icon" title="Edit Track" onClick={() => { setEditingTrack(track); setShowForm(true); }}>
												<Edit className='h-4 w-4' />
											</Button>
											{!track.isActive && (
												<Button
													variant='ghost'
													size='icon'
													className="text-green-600 hover:text-green-700"
													title='Reactivate track'
													disabled={mutating}
													onClick={() => handleActivate(track)}
												>
													<RotateCcw className='h-4 w-4' />
												</Button>
											)}
											<Button
												variant='ghost'
												size='icon'
												className="text-red-500 hover:text-red-700"
												title='Delete track'
												disabled={isRunning || mutating}
												onClick={() => setConfirmDelete(track)}
											>
												<Trash2 className='h-4 w-4' />
											</Button>
										</div>
									</td>
								</tr>
							)
						})}
					</tbody>
				</table>
			</div>

			{showForm && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
					<div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-6">
						<RoleCreationForm
							initialTrack={editingTrack || undefined}
							onSuccess={handleTrackSaved}
						/>
					</div>
				</div>
			)}

			<GenerationCenterDialog
				track={selectedTrack}
				summary={generationSummary}
				loading={summaryLoading}
				actionLoading={actionLoading}
				confirmWorkflow={confirmWorkflow}
				onClose={closeGenerationCenter}
				onRequestGenerate={handleGenerateRequest}
				onCancelConfirm={() => setConfirmWorkflow(null)}
				onResetLearners={handleResetLearners}
			/>

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
							<Alert className="border-amber-200 bg-amber-50">
								<AlertCircle className="h-4 w-4" />
								<AlertDescription className="text-sm">
									{confirmDelete.activeLearnerCount > 0
										? `This track has ${confirmDelete.activeLearnerCount} active learner(s). Deletion is blocked until you reset learners for this track.`
										: 'This track has no active learners. All generated placement questions and course metadata will be deleted.'}
								</AlertDescription>
							</Alert>
						</div>
					)}

					<DialogFooter className="flex-col-reverse gap-3 sm:flex-row">
						<Button variant="outline" onClick={() => setConfirmDelete(null)} disabled={mutating}>
							Cancel
						</Button>
						<Button
							variant='destructive'
							disabled={mutating || (confirmDelete?.activeLearnerCount ?? 0) > 0}
							onClick={handleDelete}
						>
							{mutating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
							Delete Track
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}

export const Route = createFileRoute('/_protected/admin/tracks')({
	component: TracksPage,
});
