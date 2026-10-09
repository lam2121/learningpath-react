import { AlertTriangle, FileText, Layers3, Loader2, Play, Plus, RefreshCw, Sparkles } from 'lucide-react';
import { Alert, AlertDescription } from '@/shadcn/component/ui/alert';
import { Badge } from '@/shadcn/component/ui/badge';
import { Button } from '@/shadcn/component/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shadcn/component/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shadcn/component/ui/dialog';
import { Progress } from '@/shadcn/component/ui/progress';
import type { CareerTrack } from '../api/adminApi';
import type { GenerationSummary } from '../type/Admin';

type Workflow = 'placement' | 'course' | 'course-resume';

interface GenerationCenterDialogProps {
	track: CareerTrack | null;
	summary: GenerationSummary | null;
	loading: boolean;
	actionLoading: Workflow | 'reset' | 'more-topics' | null;
	confirmWorkflow: Workflow | null;
	onClose: () => void;
	onRequestGenerate: (workflow: Workflow) => void;
	onCancelConfirm: () => void;
	onRequestResetLearners: () => void;
	onRequestMoreTopics: () => void;
}

function formatDateTime(value: string | null): string {
	if (!value) return 'Never';
	return new Intl.DateTimeFormat('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
	}).format(new Date(value));
}

function statusMeta(status: string, blocked: boolean) {
	if (blocked) {
		return {
			label: 'Blocked',
			className: 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-200',
		};
	}
	switch (status) {
		case 'in_progress':
		case 'pending':
			return {
				label: 'Generating',
				className: 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300',
			};
		case 'completed':
			return {
				label: 'Ready',
				className: 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300',
			};
		case 'failed':
			return {
				label: 'Failed',
				className: 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300',
			};
		default:
			return {
				label: 'Not generated',
				className: 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300',
			};
	}
}

function courseProgress(summary: GenerationSummary | null): number {
	if (!summary) return 0;
	const topicsProgress = (summary.course.stepB1Count / Math.max(summary.course.targetTopics, 1)) * 35;
	const lessonsProgress = (summary.course.stepB2Count / Math.max(summary.course.targetLessons, 1)) * 65;
	return Math.max(0, Math.min(100, topicsProgress + lessonsProgress));
}

function CardSkeleton() {
	return (
		<Card className="border-slate-200 dark:border-slate-700">
			<CardHeader>
				<div className="h-5 w-32 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
				<div className="h-4 w-48 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
			</CardHeader>
			<CardContent className="space-y-3">
				<div className="h-10 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
				<div className="h-10 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
				<div className="h-16 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
			</CardContent>
		</Card>
	);
}

export function GenerationCenterDialog({
	track,
	summary,
	loading,
	actionLoading,
	confirmWorkflow,
	onClose,
	onRequestGenerate,
	onCancelConfirm,
	onRequestResetLearners,
	onRequestMoreTopics,
}: GenerationCenterDialogProps) {
	if (!track) return null;

	const activeWorkflow = summary?.activeJob.workflow ?? null;
	const activeStatus = summary?.activeJob.status ?? null;
	const isAnythingRunning = activeStatus === 'in_progress' || activeStatus === 'pending';
	const placementBlocked = Boolean(summary?.blockers.requiresLearnerResetForPlacement);
	const courseBlocked = Boolean(summary?.blockers.requiresLearnerResetForCourse);
	const placementMeta = statusMeta(summary?.placement.lastStatus ?? 'empty', placementBlocked);
	const courseMeta = statusMeta(summary?.course.lastStatus ?? 'empty', courseBlocked);
	const placementReady = (summary?.placement.questionCount ?? 0) > 0;
	const courseReady = (summary?.course.topicsCount ?? 0) > 0 || (summary?.course.lessonsCount ?? 0) > 0;
	const canResumeCourse =
		summary?.course.lastStatus === 'failed' &&
		(summary?.course.topicsCount ?? 0) > 0 &&
		(summary?.course.lessonsCount ?? 0) < (summary?.course.targetLessons ?? 0);
	const killSwitchOn = Boolean(summary?.blockers.killSwitchOn);

	// More topics can only extend a complete outline (every topic has its lesson shells).
	const lessonsPerTopic = (summary?.course.targetLessons ?? 0) / Math.max(summary?.course.targetTopics ?? 0, 1);
	const canAddTopics =
		(summary?.course.topicsCount ?? 0) > 0 &&
		(summary?.course.lessonsCount ?? 0) >= (summary?.course.topicsCount ?? 0) * lessonsPerTopic;

	return (
		<Dialog open onOpenChange={open => !open && actionLoading === null && onClose()}>
			<DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto p-0">
				<div className="sticky top-0 z-10 border-b dark:border-gray-700 bg-slate-50/80 dark:bg-slate-900/80 px-6 py-5">
					<DialogHeader>
						<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
							<div>
								<DialogTitle className="flex items-center gap-2 text-xl text-slate-900 dark:text-slate-100">
									<Sparkles className="h-5 w-5 text-blue-600" />
									Generation Center
								</DialogTitle>
								<DialogDescription className="mt-1 text-sm text-slate-600 dark:text-slate-400">
									Manage placement-question and course-outline generation for <strong>{track.name}</strong>.
								</DialogDescription>
							</div>
							<div className="flex flex-wrap gap-2">
								<Badge variant="outline" className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300">
									{track.placementQuestionsCount} questions
								</Badge>
								<Badge variant="outline" className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300">
									{track.topicsCount} topics · {track.lessonsCount} lessons
								</Badge>
								{isAnythingRunning && activeWorkflow && (
									<Badge className="bg-blue-600 text-white hover:bg-blue-600">
										<Loader2 className="mr-1 h-3 w-3 animate-spin" />
										Generating {activeWorkflow}
									</Badge>
								)}
							</div>
						</div>
					</DialogHeader>
				</div>

				<div className="space-y-4 px-6 py-5">
					{killSwitchOn && (
						<Alert className="border-red-200 bg-red-50">
							<AlertTriangle className="h-4 w-4" />
							<AlertDescription className="text-sm text-red-800">
								AI generation is disabled by the kill switch.
								{summary?.blockers.killSwitchReason ? ` Reason: ${summary.blockers.killSwitchReason}` : ''}
							</AlertDescription>
						</Alert>
					)}

					{isAnythingRunning && (
						<Alert className="border-blue-200 bg-blue-50">
							<Loader2 className="h-4 w-4 animate-spin text-blue-600" />
							<AlertDescription className="text-sm text-blue-900">
								A generation job is already running for this track. Actions stay disabled until it finishes.
							</AlertDescription>
						</Alert>
					)}

					<div className="space-y-4">
						{loading || !summary ? (
							<>
								<CardSkeleton />
								<CardSkeleton />
							</>
						) : (
							<>
								<Card className="border-slate-200 dark:border-slate-700 shadow-sm">
									<CardHeader className="space-y-3">
										<div className="flex items-start justify-between gap-3">
											<div>
												<CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
													<FileText className="h-5 w-5 text-blue-600" />
													Placement Tests
												</CardTitle>
												<CardDescription>
													Generator A. Cached placement-question pool for onboarding.
												</CardDescription>
											</div>
											<Badge variant="outline" className={placementMeta.className}>
												{placementMeta.label}
											</Badge>
										</div>
									</CardHeader>
									<CardContent className="space-y-4">
										<div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4">
											<div className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Question pool</div>
											<div className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
												{summary.placement.questionCount} / {summary.placement.targetCount}
											</div>
											<div className="mt-1 text-sm text-slate-600 dark:text-slate-400">
												{summary.placement.questionCount > 0
													? 'Cached and ready for learner placement tests.'
													: 'No placement pool generated yet.'}
											</div>
										</div>

										<div className="grid gap-3 sm:grid-cols-2">
											<div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
												<div className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Last started</div>
												<div className="mt-1 text-sm text-slate-800 dark:text-slate-200">{formatDateTime(summary.placement.lastStartedAt)}</div>
											</div>
											<div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
												<div className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Last finished</div>
												<div className="mt-1 text-sm text-slate-800 dark:text-slate-200">{formatDateTime(summary.placement.lastFinishedAt)}</div>
											</div>
										</div>

										{summary.placement.lastStatus === 'failed' && summary.placement.lastErrorMessage && (
											<Alert className="border-red-200 bg-red-50">
												<AlertTriangle className="h-4 w-4" />
												<AlertDescription className="text-sm text-red-800">
													{summary.placement.lastErrorMessage}
												</AlertDescription>
											</Alert>
										)}

										{placementBlocked && (
											<Alert className="border-amber-200 bg-amber-50">
												<AlertTriangle className="h-4 w-4" />
												<AlertDescription className="text-sm text-amber-900">
													{summary.blockers.activeLearnerCount} learner(s) still have saved placement answers for this role. Reset them before regenerating placement questions.
												</AlertDescription>
											</Alert>
										)}
									</CardContent>
									<CardFooter className="border-t dark:border-gray-700 bg-slate-50/60 dark:bg-slate-900/60">
										<div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
											<p className="text-xs text-slate-500 dark:text-slate-400">
												Regeneration replaces the existing placement pool with a new set of 48 questions.
											</p>
											<div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
												{placementBlocked ? (
													<Button
														variant="outline"
														onClick={onRequestResetLearners}
														disabled={actionLoading !== null || isAnythingRunning}
														className="w-full sm:w-auto"
													>
														{actionLoading === 'reset' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
														Reset learners
													</Button>
												) : confirmWorkflow === 'placement' && placementReady ? (
													<>
														<Button variant="outline" onClick={onCancelConfirm} disabled={actionLoading !== null}>
															Cancel
														</Button>
														<Button
															onClick={() => onRequestGenerate('placement')}
															disabled={actionLoading !== null || killSwitchOn || isAnythingRunning}
															className="bg-amber-600 hover:bg-amber-700"
														>
															{actionLoading === 'placement' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
															Confirm regenerate
														</Button>
													</>
												) : (
													<Button
														onClick={() => onRequestGenerate('placement')}
														disabled={actionLoading !== null || killSwitchOn || isAnythingRunning}
														className="w-full sm:w-auto"
													>
														{actionLoading === 'placement' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
														{placementReady ? 'Regenerate' : 'Generate'}
													</Button>
												)}
											</div>
										</div>
									</CardFooter>
								</Card>

								<Card className="border-slate-200 dark:border-slate-700 shadow-sm">
									<CardHeader className="space-y-3">
										<div className="flex items-start justify-between gap-3">
											<div>
												<CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
													<Layers3 className="h-5 w-5 text-blue-600" />
													Course Outline
												</CardTitle>
												<CardDescription>
													Generators B1 and B2. Creates 20 topics and 120 lesson shells.
												</CardDescription>
											</div>
											<Badge variant="outline" className={courseMeta.className}>
												{courseMeta.label}
											</Badge>
										</div>
									</CardHeader>
									<CardContent className="space-y-4">
										<div className="grid gap-3 sm:grid-cols-2">
											<div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4">
												<div className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Topics</div>
												<div className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
													{summary.course.topicsCount} / {summary.course.targetTopics}
												</div>
											</div>
											<div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4">
												<div className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Lessons</div>
												<div className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
													{summary.course.lessonsCount} / {summary.course.targetLessons}
												</div>
											</div>
										</div>

										<div className="space-y-2 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
											<div className="flex items-center justify-between text-sm text-slate-700 dark:text-slate-300">
												<span>Pipeline progress</span>
												<span>
													{summary.course.currentStep === 'b1' ? 'Generating topics' : summary.course.currentStep === 'b2' ? 'Generating lesson shells' : 'Idle'}
												</span>
											</div>
											<Progress value={courseProgress(summary)} className="h-2" />
											<div className="flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
												<span>B1: {summary.course.stepB1Count} topics</span>
												<span>B2: {summary.course.stepB2Count} lessons</span>
												<span>Errors: {summary.course.stepB1Errors + summary.course.stepB2Errors}</span>
											</div>
										</div>

										<div className="grid gap-3 sm:grid-cols-2">
											<div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
												<div className="text-xs font-medium uppercase tracking-wide text-slate-500">Last started</div>
												<div className="mt-1 text-sm text-slate-800 dark:text-slate-200">{formatDateTime(summary.course.lastStartedAt)}</div>
											</div>
											<div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
												<div className="text-xs font-medium uppercase tracking-wide text-slate-500">Last finished</div>
												<div className="mt-1 text-sm text-slate-800 dark:text-slate-200">{formatDateTime(summary.course.lastFinishedAt)}</div>
											</div>
										</div>

										{summary.course.lastStatus === 'failed' && summary.course.lastErrorMessage && (
											<Alert className="border-red-200 bg-red-50">
												<AlertTriangle className="h-4 w-4" />
												<AlertDescription className="text-sm text-red-800">
													{summary.course.lastErrorMessage}
												</AlertDescription>
											</Alert>
										)}

										{courseBlocked && (
											<Alert className="border-amber-200 bg-amber-50">
												<AlertTriangle className="h-4 w-4" />
												<AlertDescription className="text-sm text-amber-900">
													{summary.blockers.activeLearnerCount} learner(s) are enrolled on this role. Reset them before replacing the course outline.
												</AlertDescription>
											</Alert>
										)}
									</CardContent>
									{/* Redesigned footer specifically for Generate More Topics and Course Outline actions */}
									<CardFooter className="border-t dark:border-gray-700 bg-slate-50/60 dark:bg-slate-900/60 flex flex-col gap-3 p-4">
										<p className="text-xs text-slate-500 dark:text-slate-400 w-full leading-relaxed">
											{canResumeCourse
												? 'Resume only regenerates the lesson shells that are still missing. Existing topics and completed shells are kept.'
												: 'Lesson shells are metadata only. Theory and quiz content are still generated lazily per lesson.'}
										</p>
										<div className="flex flex-wrap items-center justify-end gap-2.5 w-full">
											{canAddTopics && confirmWorkflow === null && (
												<Button
													variant="outline"
													onClick={onRequestMoreTopics}
													disabled={actionLoading !== null || killSwitchOn || isAnythingRunning}
													className="w-full sm:w-auto"
												>
													{actionLoading === 'more-topics' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
													Generate More Topics
												</Button>
											)}
											{courseBlocked ? (
												<Button
													variant="outline"
													onClick={onRequestResetLearners}
													disabled={actionLoading !== null || isAnythingRunning}
													className="w-full sm:w-auto"
												>
													{actionLoading === 'reset' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
													Reset learners
												</Button>
											) : confirmWorkflow === 'course' && courseReady ? (
												<>
													<Button variant="outline" onClick={onCancelConfirm} disabled={actionLoading !== null}>
														Cancel
													</Button>
													<Button
														onClick={() => onRequestGenerate('course')}
														disabled={actionLoading !== null || killSwitchOn || isAnythingRunning}
														className="bg-amber-600 hover:bg-amber-700 text-white"
													>
														{actionLoading === 'course' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
														Confirm regenerate
													</Button>
												</>
											) : confirmWorkflow === 'course-resume' ? (
												<>
													<Button variant="outline" onClick={onCancelConfirm} disabled={actionLoading !== null}>
														Cancel
													</Button>
													<Button
														onClick={() => onRequestGenerate('course-resume')}
														disabled={actionLoading !== null || killSwitchOn || isAnythingRunning}
														className="bg-emerald-600 hover:bg-emerald-700 text-white"
													>
														{actionLoading === 'course-resume' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
														Confirm resume
													</Button>
												</>
											) : canResumeCourse ? (
												<>
													<Button
														onClick={() => onRequestGenerate('course-resume')}
														disabled={actionLoading !== null || killSwitchOn || isAnythingRunning}
														className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white"
													>
														{actionLoading === 'course-resume' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
														Resume
													</Button>
													<Button
														variant="outline"
														onClick={() => onRequestGenerate('course')}
														disabled={actionLoading !== null || killSwitchOn || isAnythingRunning}
														className="w-full sm:w-auto"
													>
														<RefreshCw className="mr-2 h-4 w-4" />
														Regenerate
													</Button>
												</>
											) : (
												<Button
													onClick={() => onRequestGenerate('course')}
													disabled={actionLoading !== null || killSwitchOn || isAnythingRunning}
													className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
												>
													{actionLoading === 'course' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Layers3 className="mr-2 h-4 w-4" />}
													{courseReady ? 'Regenerate' : 'Generate'}
												</Button>
											)}
										</div>
									</CardFooter>
								</Card>
							</>
						)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
