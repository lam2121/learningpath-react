import React from 'react'
import { Link } from '@tanstack/react-router'
import { Sparkles, ArrowLeft, Target, Bot, Zap, ShieldCheck } from 'lucide-react'
import logo from '@/asset/image/careerpath_logo.png'
import robotImage from '@/asset/image/careerpath-robot.png'
import { ThemeToggle } from '@/common/component/ThemeToggle'
import { LanguageSwitcher } from '@/common/component/LanguageSwitcher'

interface AuthLayoutProps {
	children: React.ReactNode
	badgeText?: string
	heroHeadline?: string
	heroDescription?: string
}

export function AuthLayout({
	children,
	badgeText = 'AI-Powered English Platform',
	heroHeadline = 'Master Workplace English with Intelligent AI Paths',
	heroDescription = 'Personalized CEFR curriculum, real-time AI speech coaching, and realistic career roleplay scenarios tailored to your level.',
}: AuthLayoutProps) {
	return (
		<div className="relative min-h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-blue-500 selection:text-white transition-colors duration-300">
			{/* Ambient Glowing Background Lights - strictly contained in overflow-hidden to prevent ghost scrolling */}
			<div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
				<div className="absolute -top-32 -left-32 h-[350px] w-[350px] sm:h-[500px] sm:w-[500px] rounded-full bg-blue-500/15 dark:bg-blue-600/20 blur-[90px] sm:blur-[130px] animate-pulse" />
				<div className="absolute top-1/2 -right-32 h-[350px] w-[350px] sm:h-[550px] sm:w-[550px] rounded-full bg-indigo-500/15 dark:bg-indigo-600/15 blur-[90px] sm:blur-[140px]" />
				<div className="absolute -bottom-24 left-1/4 h-[280px] w-[280px] sm:h-[450px] sm:w-[450px] rounded-full bg-sky-400/10 dark:bg-sky-500/10 blur-[80px] sm:blur-[120px]" />
				{/* Subtle Dot Grid Mesh */}
				<div
					className="absolute inset-0 opacity-[0.035] dark:opacity-[0.06]"
					style={{
						backgroundImage: `radial-gradient(currentColor 1px, transparent 1px)`,
						backgroundSize: '24px 24px',
					}}
				/>
			</div>

			{/* Top Navigation Header (App Bar) */}
			<header className="relative z-20 w-full px-3.5 sm:px-8 py-2.5 sm:py-5 flex items-center justify-between pt-[max(0.6rem,env(safe-area-inset-top))]">
				{/* Brand Logo & Pill */}
				<Link
					to="/"
					className="group flex items-center gap-2 sm:gap-3 transition-transform hover:scale-[1.02] active:scale-[0.98]"
				>
					<div className="relative flex items-center justify-center p-1 sm:p-1.5 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-md">
						<img src={logo} alt="CareerPath Logo" className="h-6 sm:h-9 w-auto object-contain" />
					</div>
					<div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-900/60 text-blue-700 dark:text-blue-300 shadow-2xs">
						<Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-blue-500 animate-spin-slow" />
						<span>AI Learning</span>
					</div>
				</Link>

				{/* Right Navigation Controls */}
				<div className="flex items-center gap-1.5 sm:gap-3">
					<div className="flex items-center gap-1 p-0.5 sm:p-1 rounded-full bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 backdrop-blur-md shadow-xs">
						<LanguageSwitcher variant="ghost" className="h-7 sm:h-8 rounded-full px-1.5 sm:px-2 text-xs" />
						<div className="h-3.5 w-px bg-slate-200 dark:bg-slate-800" />
						<ThemeToggle variant="ghost" className="h-7 w-7 sm:h-8 sm:w-8 rounded-full p-0" />
					</div>

					<Link
						to="/"
						className="hidden md:inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900/60"
					>
						<ArrowLeft className="h-3.5 w-3.5" />
						<span>Home</span>
					</Link>
				</div>
			</header>

			{/* Main Content Area */}
			<main className="relative z-10 flex-1 flex items-center justify-center px-3 sm:px-6 lg:px-8 py-2 sm:py-8 w-full max-w-full">
				<div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-center">
					{/* Left Column: Visual AI Showcase (Desktop Only) */}
					<div className="hidden lg:flex lg:col-span-6 flex-col justify-center space-y-8 pr-4">
						{/* Floating Feature Badge */}
						<div className="inline-flex items-center gap-2 self-start px-3.5 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-sky-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 backdrop-blur-md shadow-2xs">
							<Sparkles className="h-3.5 w-3.5 text-blue-500" />
							<span>{badgeText}</span>
						</div>

						{/* Headline & Description */}
						<div className="space-y-4">
							<h1 className="font-display text-3xl sm:text-4xl xl:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
								{heroHeadline.split(' ').slice(0, -2).join(' ')}{' '}
								<span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 bg-clip-text text-transparent">
									{heroHeadline.split(' ').slice(-2).join(' ')}
								</span>
							</h1>
							<p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
								{heroDescription}
							</p>
						</div>

						{/* Feature Pills */}
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
							<div className="p-3.5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md shadow-xs flex items-center gap-3 card-interactive-subtle">
								<div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400">
									<Target className="h-4 w-4" />
								</div>
								<div>
									<h2 className="text-xs font-bold text-slate-900 dark:text-white">CEFR Adaptive</h2>
									<p className="text-[11px] text-slate-500 dark:text-slate-400">Targeted Level</p>
								</div>
							</div>

							<div className="p-3.5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md shadow-xs flex items-center gap-3 card-interactive-subtle">
								<div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400">
									<Bot className="h-4 w-4" />
								</div>
								<div>
									<h2 className="text-xs font-bold text-slate-900 dark:text-white">AI Coach 24/7</h2>
									<p className="text-[11px] text-slate-500 dark:text-slate-400">Speech feedback</p>
								</div>
							</div>

							<div className="p-3.5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md shadow-xs flex items-center gap-3 card-interactive-subtle">
								<div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400">
									<Zap className="h-4 w-4" />
								</div>
								<div>
									<h2 className="text-xs font-bold text-slate-900 dark:text-white">Career Tracks</h2>
									<p className="text-[11px] text-slate-500 dark:text-slate-400">Role-tailored</p>
								</div>
							</div>
						</div>

						{/* AI Mascot Preview Card */}
						<div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600/10 via-indigo-600/10 to-transparent p-5 border border-blue-500/20 backdrop-blur-md flex items-center justify-between">
							<div className="space-y-1.5 max-w-xs">
								<div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
									<ShieldCheck className="h-3.5 w-3.5" />
									<span>Smart Study Ecosystem</span>
								</div>
								<p className="text-xs text-slate-600 dark:text-slate-300">
									Study flashcards, take topic quizzes, and advance your workplace proficiency step by step.
								</p>
							</div>
							<div className="relative h-20 w-20 flex-shrink-0 flex items-center justify-center">
								<div className="absolute inset-0 bg-blue-500/25 rounded-full blur-xl animate-pulse" />
								<img
									src={robotImage}
									alt="AI Learning Robot"
									className="relative h-20 w-auto object-contain drop-shadow-md animate-bounce-gentle"
								/>
							</div>
						</div>
					</div>

					{/* Right Column: Form Container (App View on Mobile) */}
					<div className="lg:col-span-6 w-full flex justify-center lg:justify-end">
						<div className="w-full max-w-md sm:max-w-lg">
							{children}
						</div>
					</div>
				</div>
			</main>

			{/* Bottom Footer (App Bar Safe Bottom) */}
			<footer className="relative z-10 w-full px-3 sm:px-8 py-2 sm:py-3.5 text-center text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 pb-[max(0.6rem,env(safe-area-inset-bottom))]">
				<p>
					© {new Date().getFullYear()} CareerPath • AI Learning Path
				</p>
			</footer>
		</div>
	)
}
