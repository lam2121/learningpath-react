import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/shadcn/component/ui/button';
import { Alert, AlertDescription } from '@/shadcn/component/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shadcn/component/ui/dialog';
import type { CareerTrack } from '../api/adminApi';

interface RegenerateTrackModalProps {
	track: CareerTrack | null;
	loading: boolean;
	onConfirm: () => void;
	onClose: () => void;
}

export function RegenerateTrackModal({ track, loading, onConfirm, onClose }: RegenerateTrackModalProps) {
	if (!track) return null;
	return (
		<Dialog open onOpenChange={open => !open && !loading && onClose()}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-amber-600">
						<RefreshCw className="h-5 w-5" />
						Regenerate Placement Questions
					</DialogTitle>
					<DialogDescription>
						This track has already generated content. Regenerating will replace the existing
						question set with a fresh one.
					</DialogDescription>
				</DialogHeader>
				<div className="py-2">
					<Alert variant="default" className="border-amber-200 bg-amber-50">
						<AlertTriangle className="h-4 w-4" />
						<AlertDescription className="text-sm">
							The current placement questions for <strong>{track.name}</strong> will be deleted
							and replaced by newly generated questions.
						</AlertDescription>
					</Alert>
				</div>
				<DialogFooter className="flex-col-reverse sm:flex-row gap-3">
					<Button variant="outline" onClick={onClose} disabled={loading} className="w-full sm:flex-1">
						Cancel
					</Button>
					<Button
						variant="default"
						onClick={onConfirm}
						disabled={loading}
						className="w-full sm:flex-1 bg-amber-600 hover:bg-amber-700"
					>
						{loading ? (
							<>
								<Loader2 className="h-4 w-4 animate-spin mr-2" />
								Generating...
							</>
						) : (
							'Regenerate'
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

interface ResetTrackLearnersModalProps {
	track: CareerTrack | null;
	loading: boolean;
	onConfirm: () => void;
	onClose: () => void;
}

export function ResetTrackLearnersModal({ track, loading, onConfirm, onClose }: ResetTrackLearnersModalProps) {
	if (!track) return null;
	const count = track.activeLearnerCount;
	return (
		<Dialog open onOpenChange={open => !open && !loading && onClose()}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-red-600">
						<AlertTriangle className="h-5 w-5" />
						Reset Learners for {track.name}
					</DialogTitle>
					<DialogDescription>
						This track has {count} active learner{count === 1 ? '' : 's'} with saved placement answers.
						You must reset them before regenerating questions.
					</DialogDescription>
				</DialogHeader>
				<div className="py-2">
					<Alert variant="default" className="border-red-200 bg-red-50">
						<AlertTriangle className="h-4 w-4" />
						<AlertDescription className="text-sm">
							Resetting will clear their saved placement answers and set their placement status
							back to incomplete. They will need to retake the placement test.
						</AlertDescription>
					</Alert>
				</div>
				<DialogFooter className="flex-col-reverse sm:flex-row gap-3">
					<Button variant="outline" onClick={onClose} disabled={loading} className="w-full sm:flex-1">
						Cancel
					</Button>
					<Button
						variant="destructive"
						onClick={onConfirm}
						disabled={loading}
						className="w-full sm:flex-1"
					>
						{loading ? (
							<>
								<Loader2 className="h-4 w-4 animate-spin mr-2" />
								Resetting...
							</>
						) : (
							'Reset Learners'
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
