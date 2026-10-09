import { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

import { Alert, AlertDescription } from '@/shadcn/component/ui/alert';
import { Button } from '@/shadcn/component/ui/button';
import { Checkbox } from '@/shadcn/component/ui/checkbox';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/shadcn/component/ui/dialog';

import { type AdminUser } from '../type/Admin';

function displayName(user: AdminUser): string {
	return user.name || user.email;
}

// ── Reset learner ────────────────────────────────────────────────────────────

interface ResetLearnerModalProps {
	user: AdminUser | null;
	loading: boolean;
	onConfirm: (clearFlashcards: boolean) => void;
	onClose: () => void;
}

export function ResetLearnerModal({ user, loading, onConfirm, onClose }: ResetLearnerModalProps) {
	const [clearFlashcards, setClearFlashcards] = useState(true);
	if (!user) return null;

	const flashcardCount = user.flashcardCount;

	return (
		<Dialog open onOpenChange={open => !open && !loading && onClose()}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-red-600">
						<AlertTriangle className="h-5 w-5" />
						Reset {displayName(user)}
					</DialogTitle>
					<DialogDescription>
						This unenrols them from {user.jobRoleName ?? 'their career track'} and
						sends them back to role selection.
					</DialogDescription>
				</DialogHeader>

				<div className="py-2 space-y-3">
					<Alert variant="default" className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950">
						<AlertTriangle className="h-4 w-4" />
						<AlertDescription className="text-sm">
							Permanently clears their placement answers, learning roadmap, lesson progress,
							topic quizzes, final quiz, skill (radar) scores and spaced-repetition review
							queue. Their account, email and role are untouched. This cannot be undone.
						</AlertDescription>
					</Alert>

					<label className="flex items-start gap-2 text-sm cursor-pointer">
						<Checkbox
							checked={clearFlashcards}
							onCheckedChange={value => setClearFlashcards(value === true)}
							disabled={loading}
							className="mt-0.5"
						/>
						<span>
							Also clear saved flashcards
							{flashcardCount > 0 ? ` (${flashcardCount} word${flashcardCount === 1 ? '' : 's'})` : ''}
							<span className="block text-xs text-gray-500 dark:text-gray-400">
								Their personal vocabulary list, not course progress. Untick to keep it.
							</span>
						</span>
					</label>
				</div>

				<DialogFooter className="flex-col-reverse sm:flex-row gap-3">
					<Button variant="outline" onClick={onClose} disabled={loading} className="w-full sm:flex-1">
						Cancel
					</Button>
					<Button
						variant="destructive"
						onClick={() => onConfirm(clearFlashcards)}
						disabled={loading}
						className="w-full sm:flex-1"
					>
						{loading ? (
							<>
								<Loader2 className="h-4 w-4 animate-spin mr-2" />
								Resetting...
							</>
						) : (
							'Reset learner'
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
