import { useState, useEffect } from 'react'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { LogOut, Loader2 } from 'lucide-react'
import careerPathLogo from '@/asset/image/careerpath_logo.png'
import { useAuth } from '@/common/context/AuthContext'
import { useRadar } from '@/feature/radar'
import type { QuestionResult, SkillAxis, DifficultyLevel } from '../../api/placementTestTypes'
import { fetchPlacementTestResult, type PlacementResult, type PlacementAnswerDetail } from '../../api/onboardingApi'
import { onboardingTexts } from '../../onboardingTexts'
import i18n from '@/i18n/i18n'
import { fetchCurrentUserProfile, updateDailyStudyMinutes } from '@/feature/auth/api/authAPI'
import { LanguageSwitcher } from '@/common/component/LanguageSwitcher'
import { useTranslation } from 'react-i18next'
import { AdminReturnLink } from '../AdminReturnLink'
import {
  computeAxisScores,
  DEMO_TARGETS,
  normalizeTarget,
  generateAISummary,
  LEVEL_CONFIG,
  determineStartingLevel,
  AXIS_META_DISPLAY,
  gradeLabel,
  type AxisMap,
  type StartingLevel,
  MAX_SKILL_WEIGHT,
  DIFFICULTY_WEIGHT,
} from './placementScoring'
import { PlacementDetailedReviewModal } from './PlacementDetailedReviewModal'
import { PlacementStudyPaceCard } from './PlacementStudyPaceCard'

// ─── Main Result View ─────────────────────────────────────────────────────────

export function PlacementResultView() {
  useTranslation('onboarding')
  const navigate = useNavigate()
  const { logout } = useAuth()
  const routerState = useRouterState({ select: (s) => s.location.state })
  const handleSignOut = async () => {
    await logout()
    navigate({ to: '/login' })
  }

  // State for backend result
  const [result, setResult] = useState<PlacementResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showContent, setShowContent] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [activeTab, setActiveTab] = useState<SkillAxis>('D_doc')
  const [dailyMinutes, setDailyMinutes] = useState(120)
  const [isSavingCourse, setIsSavingCourse] = useState(false)

  // Use router state as instant paint fallback, but fetch from backend as source of truth
  const routerResults: QuestionResult[] = (routerState as { results?: QuestionResult[] })?.results ?? []

  const { reinitialize: reinitializeRadar } = useRadar()

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const [data, profile] = await Promise.all([
          fetchPlacementTestResult(),
          fetchCurrentUserProfile({ redirectOnAuthFailure: false }).catch(() => null),
        ])
        setResult(data)
        if (profile?.daily_study_minutes) {
          setDailyMinutes(profile.daily_study_minutes)
        }
        if (data.learning_status === 'enrolled') {
          reinitializeRadar(true)
        }
      } catch (err) {
        console.error('Failed to fetch placement test result:', err)
        setError(i18n.t('placementResult.failedToLoad', { ns: 'onboarding' }))
      } finally {
        setLoading(false)
      }
    }
    fetchResult()
  }, [reinitializeRadar])

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (e.state?.popup === 'details') {
        setShowDetails(true)
      } else {
        setShowDetails(false)
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setShowContent(true), 200)
    return () => clearTimeout(t)
  }, [])

  // While loading, show spinner
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="mt-4 text-lg font-medium text-slate-600">{onboardingTexts.placementResult.loadingText}</p>
      </div>
    )
  }

  // If no result from backend and no router fallback, show empty state
  if (!result && routerResults.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-4xl text-center">
          <div className="text-6xl mb-4 animate-in zoom-in-50 duration-500">{onboardingTexts.placementResult.noResultsEmoji}</div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-3">
            {onboardingTexts.placementResult.noResultsTitle}
          </h1>
          <p className="text-slate-600 text-base font-medium mb-8">
            {onboardingTexts.placementResult.noResultsDescription}
          </p>
          <button
            onClick={() => navigate({ to: '/onboarding/role-selection' })}
            className="py-4 px-8 rounded-2xl bg-[#007aff] hover:bg-blue-600 text-white font-extrabold text-lg shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
          >
            {onboardingTexts.placementResult.startPlacementTest}
          </button>
        </div>
      </div>
    )
  }

  // Use backend result if available, otherwise fall back to router state
  const useBackend = result && result.learning_status === 'enrolled'
  const resultsToUse = useBackend ? result.answers.map((a: PlacementAnswerDetail) => {
    // Options come back in DB order; the user's pick is matched by TEXT so the
    // letter the frontend shuffled at test time never needs to line up again.
    const opts = a.options.map((text: string, i: number) => ({ id: ['a', 'b', 'c', 'd'][i] ?? String(i), text }))
    const correctId = opts.find((o) => o.text === a.correct_answer)?.id ?? 'a'
    const selectedId = a.selected_text
      ? (opts.find((o) => o.text === a.selected_text)?.id ?? null)
      : null
    return {
      questionId: String(a.question_id),
      axis: a.axis as SkillAxis,
      difficulty: a.level as DifficultyLevel,
      selectedId,
      isCorrect: a.is_correct,
      questionText: a.statement,
      options: opts,
      correctId,
    }
  }) : routerResults

  const totalQuestions = useBackend ? result.total_questions : 48
  const totalCorrect = useBackend ? result.total_correct : resultsToUse.filter((r: QuestionResult) => r.isCorrect).length
  const overallPct = useBackend ? result.overall_percent : Math.round((totalCorrect / totalQuestions) * 100)
  const scoreOutOf10 = ((totalCorrect / totalQuestions) * 10).toFixed(1)

  // Compute axis scores from resultsToUse (difficulty-weighted accuracy) or backend fallback
  const computedScores = computeAxisScores(resultsToUse)
  const actualScores = {
    D_doc: resultsToUse.some((r) => r.axis === 'D_doc') ? computedScores.D_doc : (result?.skill_scores?.D_doc || 0),
    C_comm: resultsToUse.some((r) => r.axis === 'C_comm') ? computedScores.C_comm : (result?.skill_scores?.C_comm || 0),
    T_trouble: resultsToUse.some((r) => r.axis === 'T_trouble') ? computedScores.T_trouble : (result?.skill_scores?.T_trouble || 0),
    G_custom: resultsToUse.some((r) => r.axis === 'G_custom') ? computedScores.G_custom : (result?.skill_scores?.G_custom || 0),
  }

  // Target bars: use role baseline if available, otherwise fallback to demo targets
  const roleBaseline = useBackend && result.baseline ? {
    D_doc: result.baseline.D_doc || 0,
    C_comm: result.baseline.C_comm || 0,
    T_trouble: result.baseline.T_trouble || 0,
    G_custom: result.baseline.G_custom || 0,
  } : DEMO_TARGETS

  const axisMap: AxisMap = {
    D_doc: { actual: actualScores.D_doc, target: normalizeTarget(roleBaseline.D_doc) },
    C_comm: { actual: actualScores.C_comm, target: normalizeTarget(roleBaseline.C_comm) },
    T_trouble: { actual: actualScores.T_trouble, target: normalizeTarget(roleBaseline.T_trouble) },
    G_custom: { actual: actualScores.G_custom, target: normalizeTarget(roleBaseline.G_custom) },
  }

  // Hàm tính toán số câu đúng / tổng số câu, earned weight và điểm scale [0-100]
  const getAxisStats = (axis: SkillAxis) => {
    const relevant = resultsToUse.filter((r: QuestionResult) => r.axis === axis)
    const correct = relevant.filter((r: QuestionResult) => r.isCorrect).length
    const total = useBackend ? relevant.length : (totalQuestions / 4)
    const earnedWeight = relevant
      .filter((r: QuestionResult) => r.isCorrect)
      .reduce((sum, r) => sum + (DIFFICULTY_WEIGHT[r.difficulty] ?? 1), 0)

    // Formula: Earned Weight / 24 * 100
    const rawScore = relevant.length > 0
      ? (earnedWeight / MAX_SKILL_WEIGHT) * 100
      : axisMap[axis].actual
    const score = Number(rawScore.toFixed(0))
    const formattedScore = score % 1 === 0 ? score.toString() : score.toFixed(2)

    return { correct, total, earnedWeight, score, formattedScore, percentage: score }
  }

  const aiSummary = generateAISummary(actualScores)
  const startingLevel = useBackend ? result.starting_level as StartingLevel : determineStartingLevel(actualScores)

  const totalHours = LEVEL_CONFIG[startingLevel].hours
  const totalMinutes = totalHours * 60
  const estimatedDays = Math.max(1, Math.ceil(totalMinutes / dailyMinutes))
  const estimatedMonths = (estimatedDays / 30.5).toFixed(1)

  const openDetails = () => {
    window.history.pushState({ popup: 'details' }, '')
    setShowDetails(true)
  }

  const closeDetails = () => {
    if (window.history.state?.popup === 'details') {
      window.history.back()
    } else {
      setShowDetails(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <header className="w-full bg-[#007aff] px-6 py-4 flex items-center justify-between shadow-sm z-20">
        <div className="flex items-center gap-3">
          <img src={careerPathLogo} alt="AI Learning Path" className="h-8 w-auto brightness-0 invert" />
          <LanguageSwitcher
            variant="ghost"
            showLabel
            className="text-white shadow-md border border-white/30 hover:bg-white/10 [&_svg]:text-white [&_span]:text-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <AdminReturnLink />
          <button
            onClick={handleSignOut}
            className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-colors text-sm font-medium flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>{onboardingTexts.placementResult.logoutButton}</span>
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-start px-4 pt-10 pb-16">
        <div className={`w-full max-w-4xl transition-all duration-700 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>

          {/* Celebration header */}
          <div className="text-center mb-10">
            <div className="text-6xl mb-4 animate-in zoom-in-50 duration-500">{onboardingTexts.placementResult.celebrationEmoji}</div>
            <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white mb-3">
              {onboardingTexts.placementResult.testCompleteTitle}
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-base font-medium">
              {onboardingTexts.placementResult.testCompleteSubtitle(totalQuestions)}
            </p>
          </div>

          {/* ── Overall score & Starting Track ─────────────── */}
          <div className="bg-card border border-border/80 shadow-md rounded-3xl p-8 mb-6 flex flex-col md:flex-row items-stretch card-interactive-subtle">
            {/* LEFT SIDE: Score */}
            <div className="flex-1 flex items-center justify-center gap-6 pr-0 md:pr-8">
              {/* Score circle */}
              <div className="relative w-40 h-40 shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                  <circle
                    cx="50" cy="50" r="42"
                    fill="none"
                    stroke="url(#scoreGrad)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${(overallPct / 100) * 263.9} 263.9`}
                    className="transition-all duration-1000"
                  />
                  <defs>
                    <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#60a5fa" />
                      <stop offset="100%" stopColor="#34d399" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-black text-slate-800">{scoreOutOf10}</span>
                  <span className="text-base font-bold text-slate-400 mt-1">{onboardingTexts.placementResult.outOf10}</span>
                </div>
              </div>

              {/* Score details */}
              <div className="text-left flex flex-col justify-center">
                <div className={`text-4xl font-extrabold mb-3 ${gradeLabel(overallPct).color}`}>
                  {gradeLabel(overallPct).label}
                </div>
                <div className="text-slate-600 text-lg font-bold bg-slate-50 inline-flex px-4 py-2 rounded-xl border border-slate-100 whitespace-nowrap">
                  {onboardingTexts.placementResult.correctOverall(totalCorrect, totalQuestions)}
                </div>
              </div>
            </div>

            {/* DIVIDER */}
            <div className="hidden md:block w-px bg-slate-200 mx-6 my-4" />
            <div className="md:hidden h-px bg-slate-200 my-8 w-full" />

            {/* RIGHT SIDE: Starting Track */}
            <div className="flex-1 flex items-center justify-center pl-0 md:pl-8">
              <div className="w-full text-center flex flex-col items-center justify-center">
                <p className={`text-sm ${LEVEL_CONFIG[startingLevel].color} font-bold uppercase tracking-widest mb-3 opacity-90`}>
                  {onboardingTexts.placementResult.recommendedTrack}
                </p>
                <h2 className={`text-4xl font-black ${LEVEL_CONFIG[startingLevel].color}`}>
                  {LEVEL_CONFIG[startingLevel].label}
                </h2>
              </div>
            </div>
          </div>

          {/* ── Vertical Bar Chart ─────────────────────────────────────── */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-8 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
              <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">
                {onboardingTexts.placementResult.skillBreakdownHeader}
              </p>
              {/* Legend */}
              <div className="flex gap-5 mt-4 sm:mt-0">
                <div className="flex items-center gap-2 text-sm text-slate-600 font-semibold">
                  <div className="w-5 h-4 bg-blue-400 rounded-sm" />
                  {onboardingTexts.placementResult.actualScoreLegend}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 font-semibold">
                  <div className="w-5 h-0.5 bg-slate-400 border-0" style={{ borderTop: '2px dashed #94a3b8' }} />
                  {onboardingTexts.placementResult.targetLevelLegend}
                </div>
              </div>
            </div>

            {/* Các cột dọc thể hiện điểm số */}
            <div className="flex justify-around items-end h-72 w-full pt-4">
              {AXIS_META_DISPLAY.map((ax) => {
                const stats = getAxisStats(ax.key)
                const target = axisMap[ax.key].target

                return (
                  <div key={ax.key} className="flex flex-col items-center flex-1">
                    {/* Phần hiển thị điểm số ở trên đầu cột: scale 0-100 */}
                    <div
                      className="mb-3 text-center whitespace-nowrap"
                      title={`Earned weight: ${stats.earnedWeight}/${MAX_SKILL_WEIGHT} (${stats.correct}/${stats.total} questions correct)`}
                    >
                      <span className={`text-2xl sm:text-3xl font-black ${ax.color}`}>
                        {stats.formattedScore}
                      </span>
                      <span className="text-base sm:text-xl font-bold text-slate-400">
                        {onboardingTexts.placementResult.outOf100}
                      </span>
                    </div>

                    {/* Cột biểu đồ dọc */}
                    <div className={`relative w-28 h-48 rounded-t-xl ${ax.track} overflow-hidden border border-slate-100 flex items-end justify-center group`}>
                      {/* Đường chỉ tiêu (Target) */}
                      <div
                        className="absolute left-0 right-0 h-[2px] bg-slate-400/90 z-10 border-t-2 border-dashed border-slate-400"
                        style={{ bottom: `${target}%` }}
                      >
                        <span className="absolute -top-5 left-1 text-[10px] font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                          {onboardingTexts.placementResult.targetLabel}
                        </span>
                      </div>

                      {/* Cột màu thể hiện tiến độ */}
                      <div
                        className={`w-full ${ax.bar} rounded-t-xl transition-all duration-1000 ease-out`}
                        style={{ height: `${showContent ? stats.percentage : 0}%` }}
                      />
                    </div>

                    {/* Nhãn (Label) ở dưới đáy cột */}
                    <div className="mt-5 text-center">
                      <span className={`block text-lg font-bold ${ax.color}`}>
                        {ax.label}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Nút View Lại Kết Quả */}
            <div className="mt-8 flex justify-end">
              <button
                onClick={openDetails}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-sm rounded-xl border border-slate-200 transition-colors"
              >
                {onboardingTexts.placementResult.viewDetailedResults}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* ── AI Summary ─────────────────────────────────────────────── */}
          <div className="bg-blue-50/60 border border-blue-100 shadow-sm rounded-3xl p-8 mb-8">
            <p className="text-sm text-blue-600 font-bold uppercase tracking-wider mb-3">
              {onboardingTexts.placementResult.advisorHeader}
            </p>
            <p className="text-base text-slate-700 font-medium leading-relaxed italic">
              "{aiSummary}"
            </p>
          </div>

          {/* ── Daily Study Time & ETA ───────────────────────────────── */}
          <PlacementStudyPaceCard
            dailyMinutes={dailyMinutes}
            setDailyMinutes={setDailyMinutes}
            estimatedDays={estimatedDays}
            estimatedMonths={estimatedMonths}
          />

          {/* ── CTA Button ─────────────────────────────────────────────── */}
          <button
            id="btn-create-course"
            type="button"
            disabled={isSavingCourse}
            onClick={async () => {
              setIsSavingCourse(true)
              try {
                await updateDailyStudyMinutes(dailyMinutes)
              } catch (err) {
                console.error('Failed to sync study time from placement result:', err)
              }
              await reinitializeRadar(true)
              navigate({ to: '/profile' })
            }}
            className="w-full py-5 px-6 rounded-2xl bg-[#007aff] hover:bg-blue-600 disabled:opacity-60 text-white font-extrabold text-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-3"
          >
            {isSavingCourse ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>{onboardingTexts.placementResult.createMyCourse}</span>
              </span>
            ) : (
              <>
                <span>{onboardingTexts.placementResult.createMyCourse}</span>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>

          <p className="text-center text-sm font-semibold text-slate-400 mt-5">
            {onboardingTexts.placementResult.aiFooter}
          </p>
          {error && (
            <p className="mt-4 text-center text-sm text-red-500">{error}</p>
          )}
        </div>
      </div>

      {/* ── Details Popup ─────────────────────────────────────────────── */}
      <PlacementDetailedReviewModal
        showDetails={showDetails}
        onClose={closeDetails}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalCorrect={totalCorrect}
        totalQuestions={totalQuestions}
        resultsToUse={resultsToUse}
        useBackend={Boolean(useBackend)}
      />
    </div>
  )
}
