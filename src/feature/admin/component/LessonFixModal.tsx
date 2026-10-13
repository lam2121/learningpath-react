import { useState, useEffect } from 'react';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from '@/shadcn/component/ui/dialog';
import { Button } from '@/shadcn/component/ui/button';
import { Badge } from '@/shadcn/component/ui/badge';
import {
	Wrench,
	Zap,
	RotateCcw,
	AlertTriangle,
	CheckCircle2,
	Loader2,
	FileText,
	Sparkles,
} from 'lucide-react';
import { generateLessonContent, type FailedLesson } from '../api/adminApi';

export interface LessonFixTarget {
	id: number;
	title: string;
	topicName?: string;
	roleName?: string;
	primarySkill?: string;
	difficultyTier?: string;
	hasPartialTheory?: boolean;
	failedStep?: string;
	errorMessage?: string | null;
}

interface LessonFixModalProps {
	isOpen: boolean;
	onClose: () => void;
	lesson: FailedLesson | LessonFixTarget | null;
	onSuccess?: () => void;
}

export function LessonFixModal({
	isOpen,
	onClose,
	lesson,
	onSuccess,
}: LessonFixModalProps) {
	const [mode, setMode] = useState<'resume' | 'force'>('resume');
	const [submitting, setSubmitting] = useState(false);
	const [statusMessage, setStatusMessage] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	// Reset form when opened with a new lesson
	useEffect(() => {
		if (isOpen) {
			setMode('resume');
			setStatusMessage(null);
			setError(null);
			setSubmitting(false);
		}
	}, [isOpen, lesson?.id]);

	if (!lesson) return null;

	const hasTheory = Boolean(lesson.hasPartialTheory || lesson.failedStep === 'C2');

	const handleFix = async () => {
		setSubmitting(true);
		setError(null);
		setStatusMessage(null);

		try {
			const res = await generateLessonContent(lesson.id, {
				resume: mode === 'resume',
				force: mode === 'force',
			});

			setStatusMessage(res.message || 'Generation started successfully.');
			if (onSuccess) {
				onSuccess();
			}

			// Allow user to see the success message briefly before closing
			setTimeout(() => {
				onClose();
			}, 1200);
		} catch (err: unknown) {
			const msg =
				err instanceof Error
					? err.message
					: 'Failed to initiate lesson generation. Please try again.';
			setError(msg);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && !submitting && onClose()}>
			<DialogContent className="max-w-xl dark:border-slate-800 dark:bg-slate-900">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
						<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
							<Wrench className="h-5 w-5" />
						</div>
						Fix Failed Lesson Generation
					</DialogTitle>
					<DialogDescription className="text-slate-500 dark:text-slate-400">
						Choose whether to continue from the saved checkpoint to save AI tokens, or
						regenerate completely from scratch.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-2">
					{/* Lesson Summary Card */}
					<div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40">
						<div className="flex flex-wrap items-start justify-between gap-2">
							<div>
								<div className="flex items-center gap-2">
									<span className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">
										#{lesson.id}
									</span>
									<h4 className="text-sm font-semibold text-slate-900 dark:text-white">
										{lesson.title}
									</h4>
								</div>
								{(lesson.roleName || lesson.topicName) && (
									<p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
										{[lesson.roleName, lesson.topicName].filter(Boolean).join(' • ')}
									</p>
								)}
							</div>

							<div className="flex items-center gap-1.5">
								{hasTheory ? (
									<Badge
										variant="outline"
										className="border-emerald-200 bg-emerald-50 text-xs font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
									>
										<FileText className="mr-1 h-3 w-3" />
										Theory checkpointed
									</Badge>
								) : (
									<Badge
										variant="outline"
										className="border-amber-200 bg-amber-50 text-xs font-medium text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
									>
										<AlertTriangle className="mr-1 h-3 w-3" />
										Failed at {lesson.failedStep || 'C1'}
									</Badge>
								)}
							</div>
						</div>

						{lesson.errorMessage && (
							<div className="mt-3 rounded-lg border border-rose-200 bg-rose-50/70 p-2.5 text-xs text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200">
								<p className="font-semibold">Reason:</p>
								<p className="mt-0.5 line-clamp-2 font-mono text-[11px]">
									{lesson.errorMessage}
								</p>
							</div>
						)}
					</div>

					{/* Strategy Choice */}
					<div className="space-y-3">
						<label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
							Select Fix Strategy
						</label>

						{/* Option 1: Continue from failed attempt (Resume) */}
						<div
							role="button"
							tabIndex={0}
							onClick={() => setMode('resume')}
							onKeyDown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') setMode('resume');
							}}
							className={`relative cursor-pointer rounded-xl border p-4 transition-all ${
								mode === 'resume'
									? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20 dark:border-blue-500 dark:bg-blue-950/30'
									: 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700'
							}`}
						>
							<div className="flex items-start gap-3">
								<div
									className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
										mode === 'resume'
											? 'bg-blue-600 text-white'
											: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
									}`}
								>
									<Zap className="h-4 w-4" />
								</div>
								<div className="flex-1 min-w-0">
									<div className="flex flex-wrap items-center gap-2">
										<p className="text-sm font-semibold text-slate-900 dark:text-white">
											Continue from failed attempt (Resume)
										</p>
										<Badge className="bg-emerald-600 text-[10px] font-semibold text-white hover:bg-emerald-600">
											<Sparkles className="mr-1 h-2.5 w-2.5" />
											Saves ~70% Tokens
										</Badge>
									</div>
									<p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
										{hasTheory
											? 'Keeps already verified Theory content (7 sections). Only regenerates the missing Quiz questions. Skips ~5,000 LLM tokens.'
											: 'Picks up execution from the last valid checkpoint without duplicating successful steps.'}
									</p>
								</div>
							</div>
						</div>

						{/* Option 2: Regenerate from scratch */}
						<div
							role="button"
							tabIndex={0}
							onClick={() => setMode('force')}
							onKeyDown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') setMode('force');
							}}
							className={`relative cursor-pointer rounded-xl border p-4 transition-all ${
								mode === 'force'
									? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-500/20 dark:border-amber-500 dark:bg-amber-950/30'
									: 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700'
							}`}
						>
							<div className="flex items-start gap-3">
								<div
									className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
										mode === 'force'
											? 'bg-amber-600 text-white'
											: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
									}`}
								>
									<RotateCcw className="h-4 w-4" />
								</div>
								<div className="flex-1 min-w-0">
									<div className="flex flex-wrap items-center gap-2">
										<p className="text-sm font-semibold text-slate-900 dark:text-white">
											Generate again from scratch
										</p>
										<Badge
											variant="outline"
											className="border-slate-300 text-[10px] text-slate-600 dark:border-slate-700 dark:text-slate-400"
										>
											Full Re-run
										</Badge>
									</div>
									<p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
										Discards any existing checkpoints and generates both Theory and Quiz from
										the beginning. Uses full token budget.
									</p>
								</div>
							</div>
						</div>
					</div>

					{/* Feedback Alerts */}
					{statusMessage && (
						<div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
							<CheckCircle2 className="h-4 w-4 shrink-0" />
							<span>{statusMessage}</span>
						</div>
					)}

					{error && (
						<div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-200">
							<AlertTriangle className="h-4 w-4 shrink-0" />
							<span>{error}</span>
						</div>
					)}
				</div>

				<DialogFooter className="flex-row justify-end gap-2 pt-2">
					<Button
						variant="outline"
						size="sm"
						onClick={onClose}
						disabled={submitting}
						className="text-xs"
					>
						Cancel
					</Button>

					<Button
						size="sm"
						onClick={handleFix}
						disabled={submitting || Boolean(statusMessage)}
						className={`text-xs text-white ${
							mode === 'resume'
								? 'bg-blue-600 hover:bg-blue-700'
								: 'bg-amber-600 hover:bg-amber-700'
						}`}
					>
						{submitting ? (
							<>
								<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
								Submitting...
							</>
						) : mode === 'resume' ? (
							<>
								<Zap className="mr-1.5 h-3.5 w-3.5" />
								Resume Generation (Save Tokens)
							</>
						) : (
							<>
								<RotateCcw className="mr-1.5 h-3.5 w-3.5" />
								Generate from Scratch
							</>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
