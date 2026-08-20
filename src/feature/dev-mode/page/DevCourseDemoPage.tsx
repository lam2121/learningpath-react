import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { AlertCircle, Loader2, RefreshCw, Sparkles } from 'lucide-react'
import { Badge } from '@/shadcn/component/ui/badge'
import { Button } from '@/shadcn/component/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/shadcn/component/ui/dialog'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/shadcn/component/ui/select'
import {
	fetchDevRoadmap,
	generateDevLesson,
	type DevRoadmap,
	type DevTopic,
} from '../api/devModeApi'

const TIER_ORDER = ['basic', 'intermediate', 'advanced']

function prettyJson(value: unknown): string {
	try {
		return JSON.stringify(value, null, 2)
	} catch {
		return String(value)
	}
}

export function DevCourseDemoPage() {
	const navigate = useNavigate()
	const [roadmap, setRoadmap] = useState<DevRoadmap | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [topicId, setTopicId] = useState<number | null>(null)
	const [generatingId, setGeneratingId] = useState<number | null>(null)
	const [generateAll, setGenerateAll] = useState(false)
	const [confirmGenerateAll, setConfirmGenerateAll] = useState(false)

	const load = async () => {
		setIsLoading(true)
		setError(null)
		try {
			const data = await fetchDevRoadmap()
			setRoadmap(data)
			setTopicId((prev) => prev ?? data.topics[0]?.id ?? null)
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Failed to load roadmap')
		} finally {
			setIsLoading(false)
		}
	}

	useEffect(() => {
		void load()
	}, [])

	const topic = useMemo<DevTopic | null>(
		() => roadmap?.topics.find((t) => t.id === topicId) ?? null,
		[roadmap, topicId],
	)

	const lessonsByTier = useMemo(() => {
		if (!topic) return []
		return TIER_ORDER.map((tier) => ({
			tier,
			lessons: topic.lessons.filter((l) => l.difficulty_tier === tier),
		})).filter((g) => g.lessons.length > 0)
	}, [topic])

	const remainingCount = useMemo(
		() => roadmap?.topics.flatMap((t) => t.lessons).filter((l) => !l.is_generated).length ?? 0,
		[roadmap],
	)

	const refreshLesson = (lessonId: number) => {
		setRoadmap((prev) => {
			if (!prev) return prev
			return {
				...prev,
				topics: prev.topics.map((t) => ({
					...t,
					lessons: t.lessons.map((l) =>
						l.id === lessonId ? { ...l, is_generated: true } : l,
					),
				})),
			}
		})
	}

	const handleGenerate = async (lessonId: number) => {
		setGeneratingId(lessonId)
		try {
			const result = await generateDevLesson(lessonId)
			if (result.status === 'completed' || result.status === 'skipped') {
				refreshLesson(lessonId)
			} else {
				alert(`C-1/C-2 generation failed:\n${result.message}`)
			}
		} catch (e) {
			alert(e instanceof Error ? e.message : 'Generation failed')
		} finally {
			setGeneratingId(null)
		}
	}

	const handleGenerateAll = async () => {
		const lessons = roadmap?.topics.flatMap((t) => t.lessons).filter((l) => !l.is_generated) ?? []
		if (lessons.length === 0) return
		setGenerateAll(true)
		try {
			for (const lesson of lessons) {
				await handleGenerate(lesson.id)
			}
			await load()
		} finally {
			setGenerateAll(false)
		}
	}

	if (isLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<Loader2 className="size-8 animate-spin text-indigo-500" />
			</div>
		)
	}

	if (error) {
		return (
			<div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
				<p className="text-red-500">{error}</p>
				<Button variant="outline" onClick={load}>
					Retry
				</Button>
				<Button variant="ghost" onClick={() => navigate({ to: '/onboarding/role-selection' })}>
					Back to role selection
				</Button>
			</div>
		)
	}

	if (!roadmap || roadmap.topics.length === 0) {
		return (
			<div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
				<p className="text-lg font-medium">No roadmap yet.</p>
				<p className="text-sm text-gray-500">
					Select a role in Developer mode (skill-score sliders) or finish the placement test
					first.
				</p>
				<Button onClick={() => navigate({ to: '/onboarding/role-selection' })}>
					Go to role selection
				</Button>
			</div>
		)
	}

	return (
		<div className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h1 className="text-2xl font-bold">Dev Course Demo</h1>
					<p className="text-sm text-gray-500">
						Roadmap + Generators C-1/C-2 test harness (dev-mode, §12.9)
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Badge className="capitalize">{roadmap.track} track</Badge>
					<Button
						variant="outline"
						size="sm"
						className="border-indigo-500/40 text-indigo-400 hover:bg-indigo-950/40"
						onClick={() => navigate({ to: '/dev-audio-test' })}
					>
						🎙️ Audio TTS/STT
					</Button>
					<Button variant="outline" size="sm" onClick={load}>
						<RefreshCw /> Refresh
					</Button>
					<Button variant="ghost" size="sm" onClick={() => navigate({ to: '/onboarding/role-selection' })}>
						Role selection
					</Button>
				</div>

			</div>

			<div className="grid gap-4 sm:grid-cols-3">
				{Object.entries(roadmap.assigned_lessons).map(([skill, count]) => (
					<div key={skill} className="rounded-lg border p-3 text-sm">
						<span className="font-medium">{skill}</span>
						<span className="ml-2 text-gray-500">{count} lessons</span>
					</div>
				))}
			</div>

			<div className="flex flex-wrap items-center gap-3">
				<Select
					value={String(topicId ?? '')}
					onValueChange={(v) => setTopicId(Number(v))}
				>
					<SelectTrigger className="w-[280px]">
						<SelectValue placeholder="Select a topic" />
					</SelectTrigger>
					<SelectContent>
						{roadmap.topics.map((t) => (
							<SelectItem key={t.id} value={String(t.id)}>
								{t.sort_order}. {t.name} ({t.primary_skill})
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Button
					variant="secondary"
					onClick={() => setConfirmGenerateAll(true)}
					disabled={generateAll || remainingCount === 0}
				>
					{generateAll ? <Loader2 className="animate-spin" /> : <Sparkles />}
					Generate all remaining ({remainingCount})
				</Button>
			</div>

			{topic && (
				<div className="flex flex-col gap-4">
					<div className="rounded-lg border p-4">
						<div className="mb-3 flex flex-wrap items-center gap-2">
							<h2 className="text-lg font-semibold">{topic.name}</h2>
							<Badge variant="secondary">{topic.primary_skill}</Badge>
							<Badge variant="outline">{topic.seed_tier}</Badge>
						</div>

						{lessonsByTier.map((group) => (
							<div key={group.tier} className="mb-4">
								<h3 className="mb-2 text-sm font-medium capitalize text-gray-500">
									{group.tier}
								</h3>
								<div className="flex flex-col gap-3">
									{group.lessons.map((lesson) => (
										<div
											key={lesson.id}
											className="rounded-lg border bg-gray-50/50 p-3 dark:bg-gray-800/30"
										>
											<div className="flex flex-wrap items-center justify-between gap-2">
												<div className="flex flex-wrap items-center gap-2">
													<span className="text-sm font-medium">{lesson.title}</span>
													<Badge variant="outline">{lesson.primary_skill}</Badge>
													{lesson.is_generated ? (
														<Badge variant="default" className="bg-emerald-600">
															Generated (shared — reused by all learners of this role)
														</Badge>
													) : (
														<Badge variant="secondary">Not generated</Badge>
													)}
												</div>
												<Button
													size="sm"
													onClick={() => handleGenerate(lesson.id)}
													disabled={generatingId !== null}
												>
													{generatingId === lesson.id ? (
														<Loader2 className="animate-spin" />
													) : (
														<Sparkles />
													)}
													Generate C1+C2
												</Button>
											</div>
											{lesson.is_generated && (
												<div className="mt-3 grid gap-3 lg:grid-cols-2">
													<div>
														<p className="mb-1 text-xs font-medium text-gray-500">
															Theory (C-1)
														</p>
														<pre className="max-h-64 overflow-auto rounded bg-gray-900 p-3 text-xs text-gray-100">
															{prettyJson(lesson.theory_content)}
														</pre>
													</div>
													<div>
														<p className="mb-1 text-xs font-medium text-gray-500">
															Quiz (C-2)
														</p>
														<pre className="max-h-64 overflow-auto rounded bg-gray-900 p-3 text-xs text-gray-100">
															{prettyJson(lesson.quiz_content)}
														</pre>
													</div>
												</div>
											)}
										</div>
									))}
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			<Dialog open={confirmGenerateAll} onOpenChange={setConfirmGenerateAll}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<AlertCircle className="h-5 w-5" />
							Generate All Remaining Lessons
						</DialogTitle>
						<DialogDescription>
							This will generate C-1 (Theory) and C-2 (Quiz) content for{' '}
							<strong>{remainingCount}</strong> ungenerated lesson(s). Each lesson costs
							~$0.05 in AI tokens. This action cannot be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className="flex-col-reverse gap-3 sm:flex-row">
						<Button variant="outline" onClick={() => setConfirmGenerateAll(false)} disabled={generateAll}>
							Cancel
						</Button>
						<Button
							onClick={() => { setConfirmGenerateAll(false); handleGenerateAll() }}
							disabled={generateAll || remainingCount === 0}
						>
							{generateAll ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
							Generate {remainingCount} lesson(s)
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}
