import { Loader2, AlertTriangle, RefreshCw, FileText } from 'lucide-react';
import { Button } from '@/shadcn/component/ui/button';
import { Alert, AlertDescription } from '@/shadcn/component/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shadcn/component/ui/dialog';
import type { CareerTrack } from '../api/adminApi';

interface GenerateCourseModalProps {
	track: CareerTrack | null;
	loading: boolean;
	onConfirm: () => void;
	onClose: () => void;
}

export function GenerateCourseModal({ track, loading, onConfirm, onClose }: GenerateCourseModalProps) {
	if (!track) return null;
	const hasOutline = (track.topicsCount ?? 0) > 0;
	return (
		<Dialog open onOpenChange={open => !open && !loading && onClose()}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-blue-600">
						<FileText className="h-5 w-5" />
						Generate Course Outline
					</DialogTitle>
					<DialogDescription>
						Generate the course outline for <strong>{track.name}</strong>: 20 topics
						(B1) and 6 lesson shells per topic (B2), a total of 120 lessons.
					</DialogDescription>
				</DialogHeader>
				<div className="py-2">
					<Alert variant="default" className="border-amber-200 bg-amber-50">
						<AlertTriangle className="h-4 w-4" />
						<AlertDescription className="text-sm">
							{hasOutline ? (
								<>
									This track already has <strong>{track.topicsCount} topics</strong> and{' '}
									<strong>{track.lessonsCount} lessons</strong>. Regenerating will replace the
									existing course outline with a fresh one.
								</>
							) : (
								<>
									Lesson shells are metadata only — theory and quiz content are generated
									lazily when a learner first studies a lesson (Generators C1/C2, later phase).
								</>
							)}
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
						className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700"
					>
						{loading ? (
							<>
								<Loader2 className="h-4 w-4 animate-spin mr-2" />
								Generating...
							</>
						) : (
							hasOutline ? 'Regenerate Course' : 'Generate Course'
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

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
						Regenerate placement questions for <strong>{track.name}</strong>: 4 skills
						× 12 questions per skill (3 difficulty bands), each tagged with an{' '}
						<strong>expanded_skill</strong> layer (Context_layer or Language_layer).
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
						You must reset them before regenerating the placement questions or the course outline.
					</DialogDescription>
				</DialogHeader>
				<div className="py-2">
					<Alert variant="default" className="border-red-200 bg-red-50">
						<AlertTriangle className="h-4 w-4" />
						<AlertDescription className="text-sm">
							Resetting will clear their saved placement answers and learning roadmap, and set
							their enrollment status back to incomplete. They will need to retake the placement test.
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
