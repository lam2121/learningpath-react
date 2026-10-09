import { useState } from 'react';
import {
	Loader2,
	AlertTriangle,
	RefreshCw,
	FileText,
	Plus,
	Minus,
	Check,
	Sparkles,
	BookOpen,
	MessageSquare,
	Wrench,
	Info,
	Layers,
} from 'lucide-react';
import { Button } from '@/shadcn/component/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/shadcn/component/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shadcn/component/ui/dialog';
import { Label } from '@/shadcn/component/ui/label';
import { cn } from '@/shadcn/lib/util';
import type { CareerTrack, SkillKey } from '../api/adminApi';

interface MoreTopicSkillConfig {
	key: SkillKey;
	code: string;
	title: string;
	description: string;
	icon: React.ComponentType<{ className?: string }>;
	badgeBg: string;
	badgeText: string;
	activeBorder: string;
	activeBg: string;
}

const MORE_TOPICS_SKILL_CONFIGS: MoreTopicSkillConfig[] = [
	{
		key: 'D_doc',
		code: 'D',
		title: 'Documentation',
		description: 'Tech specs, API docs & guides',
		icon: BookOpen,
		badgeBg: 'bg-blue-100 dark:bg-blue-900/60',
		badgeText: 'text-blue-700 dark:text-blue-300',
		activeBorder: 'border-blue-500 ring-2 ring-blue-500/20',
		activeBg: 'bg-blue-50/70 dark:bg-blue-950/40',
	},
	{
		key: 'C_comm',
		code: 'C',
		title: 'Communication',
		description: 'Team & cross-functional comms',
		icon: MessageSquare,
		badgeBg: 'bg-emerald-100 dark:bg-emerald-900/60',
		badgeText: 'text-emerald-700 dark:text-emerald-300',
		activeBorder: 'border-emerald-500 ring-2 ring-emerald-500/20',
		activeBg: 'bg-emerald-50/70 dark:bg-emerald-950/40',
	},
	{
		key: 'T_trouble',
		code: 'T',
		title: 'Troubleshooting',
		description: 'Incidents, bug analysis & fixes',
		icon: Wrench,
		badgeBg: 'bg-amber-100 dark:bg-amber-900/60',
		badgeText: 'text-amber-700 dark:text-amber-300',
		activeBorder: 'border-amber-500 ring-2 ring-amber-500/20',
		activeBg: 'bg-amber-50/70 dark:bg-amber-950/40',
	},
	{
		key: 'G_custom',
		code: 'G',
		title: 'Growth',
		description: 'Domain mastery & advanced practices',
		icon: Sparkles,
		badgeBg: 'bg-purple-100 dark:bg-purple-900/60',
		badgeText: 'text-purple-700 dark:text-purple-300',
		activeBorder: 'border-purple-500 ring-2 ring-purple-500/20',
		activeBg: 'bg-purple-50/70 dark:bg-purple-950/40',
	},
];

const MORE_TOPICS_MAX = 5;
const LESSONS_PER_TOPIC = 6;
const COUNT_PRESETS = [1, 2, 3, 5];

interface GenerateMoreTopicsModalProps {
	track: CareerTrack | null;
	loading: boolean;
	onConfirm: (skill: SkillKey, count: number) => void;
	onClose: () => void;
}

export function GenerateMoreTopicsModal({ track, loading, onConfirm, onClose }: GenerateMoreTopicsModalProps) {
	const [skill, setSkill] = useState<SkillKey | null>(null);
	const [count, setCount] = useState(1);

	if (!track) return null;

	const selectedConfig = MORE_TOPICS_SKILL_CONFIGS.find(s => s.key === skill);
	const projectedTopics = (track.topicsCount ?? 0) + count;
	const addedLessons = count * LESSONS_PER_TOPIC;

	return (
		<Dialog open onOpenChange={open => !open && !loading && onClose()}>
			<DialogContent className="max-w-lg p-0 overflow-hidden border dark:border-slate-800">
				{/* Header */}
				<div className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 px-6 py-5">
					<DialogHeader>
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
								<Plus className="h-5 w-5" />
							</div>
							<div>
								<DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
									Generate More Topics
								</DialogTitle>
								<DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
									Add focused topics and lesson shells to{' '}
									<span className="font-semibold text-slate-800 dark:text-slate-200">
										{track.name}
									</span>
								</DialogDescription>
							</div>
						</div>
					</DialogHeader>
				</div>

				{/* Body Content */}
				<div className="space-y-5 px-6 py-5">
					{/* 1. Skill Selection */}
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
								Target Skill Area
							</Label>
							{selectedConfig ? (
								<span className="text-xs font-medium text-blue-600 dark:text-blue-400">
									Selected: {selectedConfig.title} ({selectedConfig.code})
								</span>
							) : (
								<span className="text-xs text-amber-600 dark:text-amber-400">
									Please choose one
								</span>
							)}
						</div>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
							{MORE_TOPICS_SKILL_CONFIGS.map(item => {
								const isSelected = skill === item.key;
								const Icon = item.icon;
								return (
									<button
										key={item.key}
										type="button"
										disabled={loading}
										onClick={() => setSkill(item.key)}
										className={cn(
											'relative flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all',
											isSelected
												? `${item.activeBorder} ${item.activeBg} shadow-sm`
												: 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
										)}
									>
										<div className="flex items-center justify-between w-full">
											<div className="flex items-center gap-2">
												<span
													className={cn(
														'flex items-center justify-center h-6 w-6 rounded-md font-bold text-xs',
														item.badgeBg,
														item.badgeText
													)}
												>
													{item.code}
												</span>
												<span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
													{item.title}
												</span>
											</div>
											<div className="flex items-center gap-1">
												<Icon className="h-3.5 w-3.5 text-slate-400" />
												{isSelected && (
													<span className="h-4 w-4 rounded-full bg-blue-600 text-white flex items-center justify-center">
														<Check className="h-2.5 w-2.5 stroke-[3]" />
													</span>
												)}
											</div>
										</div>
										<p className="text-xs text-slate-500 dark:text-slate-400 leading-snug line-clamp-1 mt-0.5">
											{item.description}
										</p>
									</button>
								);
							})}
						</div>
					</div>

					{/* 2. Number of Topics Stepper & Presets */}
					<div className="space-y-2">
						<Label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
							Quantity of Topics to Add
						</Label>
						<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 p-3">
							<div className="flex items-center gap-2">
								<span className="text-xs text-slate-500 dark:text-slate-400">
									Quick select:
								</span>
								<div className="flex items-center gap-1">
									{COUNT_PRESETS.map(preset => (
										<button
											key={preset}
											type="button"
											disabled={loading}
											onClick={() => setCount(preset)}
											className={cn(
												'px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors',
												count === preset
													? 'bg-blue-600 text-white shadow-sm'
													: 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
											)}
										>
											+{preset}
										</button>
									))}
								</div>
							</div>

							<div className="flex items-center justify-end gap-2">
								<Button
									type="button"
									variant="outline"
									size="icon"
									className="h-8 w-8 rounded-lg"
									disabled={loading || count <= 1}
									onClick={() => setCount(prev => Math.max(1, prev - 1))}
								>
									<Minus className="h-4 w-4" />
								</Button>
								<div className="min-w-16 text-center">
									<span className="text-base font-bold text-slate-900 dark:text-slate-100">
										{count}
									</span>
									<span className="text-xs text-slate-500 dark:text-slate-400 ml-1">
										{count === 1 ? 'topic' : 'topics'}
									</span>
								</div>
								<Button
									type="button"
									variant="outline"
									size="icon"
									className="h-8 w-8 rounded-lg"
									disabled={loading || count >= MORE_TOPICS_MAX}
									onClick={() => setCount(prev => Math.min(MORE_TOPICS_MAX, prev + 1))}
								>
									<Plus className="h-4 w-4" />
								</Button>
							</div>
						</div>
					</div>

					{/* 3. Output Projection Summary */}
					<div className="rounded-xl border border-blue-100 dark:border-blue-900/50 bg-blue-50/60 dark:bg-blue-950/30 p-3.5 space-y-2">
						<div className="flex items-center justify-between text-xs">
							<span className="flex items-center gap-1.5 font-semibold text-blue-950 dark:text-blue-200">
								<Layers className="h-4 w-4 text-blue-600 dark:text-blue-400" />
								Output Projection
							</span>
							<span className="font-bold text-blue-700 dark:text-blue-300">
								+{count} {count === 1 ? 'Topic' : 'Topics'} · +{addedLessons} Lesson Shells
							</span>
						</div>
						<div className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1.5">
							<Info className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
							<span>
								Course outline will grow from <strong>{track.topicsCount ?? 0}</strong> to{' '}
								<strong>{projectedTopics}</strong> topics. Existing topics, lessons, and
								learner roadmaps remain unchanged.
							</span>
						</div>
					</div>
				</div>

				{/* Footer */}
				<DialogFooter className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 px-6 py-4 flex-col-reverse sm:flex-row gap-2.5">
					<Button
						variant="outline"
						onClick={onClose}
						disabled={loading}
						className="w-full sm:w-auto"
					>
						Cancel
					</Button>
					<Button
						variant="default"
						onClick={() => skill && onConfirm(skill, count)}
						disabled={loading || !skill}
						className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white min-w-36"
					>
						{loading ? (
							<>
								<Loader2 className="h-4 w-4 animate-spin mr-2" />
								Generating...
							</>
						) : (
							<>
								<Plus className="h-4 w-4 mr-1.5" />
								Generate {count} {count === 1 ? 'Topic' : 'Topics'}
							</>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

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
					<DialogTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
						<FileText className="h-5 w-5" />
						Generate Course Outline
					</DialogTitle>
					<DialogDescription>
						Generate the course outline for <strong>{track.name}</strong>: 20 topics
						(B1) and 6 lesson shells per topic (B2), a total of 120 lessons.
					</DialogDescription>
				</DialogHeader>
				<div className="py-2">
					<Alert variant="default" className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200">
						<AlertTriangle className="h-4 w-4" />
						{hasOutline && <AlertTitle>Existing outline will be replaced</AlertTitle>}
						<AlertDescription>
							<p>
								{hasOutline
									? `This track already has ${track.topicsCount} topics and ${track.lessonsCount} lessons, and regenerating will replace the existing course outline with a fresh one.`
									: 'Lesson shells are metadata only — theory and quiz content are generated lazily when a learner first studies a lesson (Generators C1/C2, later phase).'}
							</p>
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
					<DialogTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
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
					<Alert variant="default" className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200">
						<AlertTriangle className="h-4 w-4" />
						<AlertTitle>Existing questions will be replaced</AlertTitle>
						<AlertDescription>
							<p>
								{`The current placement questions for ${track.name} will be deleted and replaced by newly generated questions.`}
							</p>
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
					<DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
						<AlertTriangle className="h-5 w-5" />
						Reset Learners for {track.name}
					</DialogTitle>
					<DialogDescription>
						This track has {count} active learner{count === 1 ? '' : 's'}. You must reset them
						before regenerating the placement questions or the course outline.
					</DialogDescription>
				</DialogHeader>
				<div className="py-2">
					<Alert variant="default" className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/50 text-red-900 dark:text-red-200">
						<AlertTriangle className="h-4 w-4" />
						<AlertDescription>
							<p>
							Resetting will permanently clear their enrollment data: saved placement answers,
							learning roadmap, lesson progress, topic quizzes, the final quiz, skill (radar)
							scores, and spaced-repetition review queue. Their enrollment status will be reset
							to incomplete and their track removed, so they will need to retake the placement
							test from scratch. Saved flashcards are kept. This cannot be undone.
							</p>
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
