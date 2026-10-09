import type { QuestionResult, SkillAxis } from '../../api/placementTestTypes'
import { onboardingTexts } from '../../onboardingTexts'
import i18n from '@/i18n/i18n'

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface AxisScore {
  actual: number  // 0–100 from test
  target: number  // milestone target
}

export type AxisMap = Record<SkillAxis, AxisScore>

// ─── Score computation ────────────────────────────────────────────────────────

// Difficulty-weighted scoring (spec §3)
// Each skill: 4×Easy (weight 1) + 4×Medium (weight 2) + 4×Hard (weight 3) = 4 + 8 + 12 = 24
export const DIFFICULTY_WEIGHT: Record<string, number> = {
  Easy: 1,
  Medium: 2,
  Hard: 3,
  Expert: 4,
}
export const MAX_SKILL_WEIGHT = 24 // 4×1 + 4×2 + 4×3

// Weighted accuracy per axis: Earned Weight / 24 × 100
export function computeAxisScores(results: QuestionResult[]): Record<SkillAxis, number> {
  const axes: SkillAxis[] = ['D_doc', 'C_comm', 'T_trouble', 'G_custom']
  const scores: Record<SkillAxis, number> = { D_doc: 0, C_comm: 0, T_trouble: 0, G_custom: 0 }

  axes.forEach((axis) => {
    const relevant = results.filter((r) => r.axis === axis)
    const earnedWeight = relevant
      .filter((r) => r.isCorrect)
      .reduce((sum, r) => sum + (DIFFICULTY_WEIGHT[r.difficulty] ?? 1), 0)
    scores[axis] = Number(((earnedWeight / MAX_SKILL_WEIGHT) * 100).toFixed(2))
  })

  return scores
}

export const DEMO_TARGETS: Record<SkillAxis, number> = {
  D_doc: (20 / 100) * 78,
  C_comm: (50 / 100) * 78,
  T_trouble: (10 / 100) * 78,
  G_custom: (20 / 100) * 78,
}

export function normalizeTarget(t: number): number {
  return Math.round(Math.min(Math.max(t, 0), 100))
}

export function generateAISummary(scores: Record<SkillAxis, number>): string {
  const axisNames: Record<SkillAxis, string> = {
    D_doc: 'technical documentation',
    C_comm: 'communication & presentation',
    T_trouble: 'troubleshooting',
    G_custom: 'business negotiation',
  }

  const entries = Object.entries(scores) as [SkillAxis, number][]
  const sorted = [...entries].sort((a, b) => b[1] - a[1])
  const best = sorted.map(([k]) => k)
  const worst = [...best].reverse()

  const totalAvg = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / 4)

  if (totalAvg >= 75) {
    return `Excellent! Your IT communication skills are at a high level — particularly in ${axisNames[best[0]]}. The system will focus on ${axisNames[worst[0]]} to help you reach expert-level proficiency.`
  } else if (totalAvg >= 50) {
    return `Good! You have a solid foundation in ${axisNames[best[0]]}. Your learning path will be personalized to strengthen ${axisNames[worst[0]]} — the most important skill to improve in your career track.`
  } else {
    return `Welcome to the journey! Every expert starts here. The system will build a step-by-step learning path, prioritizing ${axisNames[worst[0]]} and reinforcing ${axisNames[best[0]]} — perfectly suited to your learning pace.`
  }
}

// ─── Track Level Configuration ────────────────────────────────────────────────

export type StartingLevel = 'basic' | 'intermediate' | 'advanced'

export const LEVEL_CONFIG: Record<StartingLevel, {
  get label(): string
  hours: number
  color: string
}> = {
  basic: {
    get label() { return onboardingTexts.placementResult.trackLabels.basic ?? 'Basic Track' },
    hours: 48,
    color: 'text-slate-700',
  },
  intermediate: {
    get label() { return onboardingTexts.placementResult.trackLabels.intermediate ?? 'Intermediate Track' },
    hours: 96,
    color: 'text-blue-700',
  },
  advanced: {
    get label() { return onboardingTexts.placementResult.trackLabels.advanced ?? 'Advanced Track' },
    hours: 144,
    color: 'text-emerald-700',
  },
}

export function determineStartingLevel(scores: Record<SkillAxis, number>): StartingLevel {
  const fractions = Object.values(scores).map(s => s / 100)
  const overall = fractions.reduce((a, b) => a + b, 0) / fractions.length
  const minSkill = Math.min(...fractions)

  if (overall < 0.45 || minSkill < 0.30) {
    return 'basic'
  } else if (overall >= 0.75 && minSkill >= 0.50) {
    return 'advanced'
  } else {
    return 'intermediate'
  }
}

// ─── Difficulty Label ─────────────────────────────────────────────────────────

export function getDifficultyLabel(level: string): { label: string; color: string; bg: string; border: string } {
  switch (level) {
    case 'Easy':   return { label: 'Easy',   color: 'text-emerald-700', bg: 'bg-emerald-50',  border: 'border-emerald-200' }
    case 'Medium': return { label: 'Medium', color: 'text-blue-700',    bg: 'bg-blue-50',     border: 'border-blue-200'    }
    case 'Hard':   return { label: 'Hard',   color: 'text-orange-600',  bg: 'bg-orange-50',   border: 'border-orange-200'  }
    case 'Expert': return { label: 'Expert', color: 'text-rose-700',    bg: 'bg-rose-50',     border: 'border-rose-200'    }
    default:       return { label: level,    color: 'text-gray-600',    bg: 'bg-gray-50',     border: 'border-gray-200'    }
  }
}

// ─── Result Breakdown ─────────────────────────────────────────────────────────

export const AXIS_META_DISPLAY = [
  {
    key: 'D_doc' as SkillAxis,
    get label() { return i18n.t('skillDoc', { ns: 'profile', defaultValue: 'Documentation (D)' }) },
    color: 'text-blue-500',
    bar: 'bg-blue-400',
    track: 'bg-blue-50',
  },
  {
    key: 'C_comm' as SkillAxis,
    get label() { return i18n.t('skillComm', { ns: 'profile', defaultValue: 'Communication (C)' }) },
    color: 'text-emerald-500',
    bar: 'bg-emerald-400',
    track: 'bg-emerald-50',
  },
  {
    key: 'T_trouble' as SkillAxis,
    get label() { return i18n.t('skillTrouble', { ns: 'profile', defaultValue: 'Problem Solving (T)' }) },
    color: 'text-rose-500',
    bar: 'bg-rose-400',
    track: 'bg-rose-50',
  },
  {
    key: 'G_custom' as SkillAxis,
    get label() { return i18n.t('skillCustom', { ns: 'profile', defaultValue: 'Specialization (G)' }) },
    color: 'text-amber-500',
    bar: 'bg-amber-400',
    track: 'bg-amber-50',
  },
]

export function gradeLabel(pct: number): { label: string; color: string } {
  if (pct >= 80) return { label: onboardingTexts.placementResult.gradeLabels.excellent, color: 'text-emerald-600' }
  if (pct >= 60) return { label: onboardingTexts.placementResult.gradeLabels.good, color: 'text-blue-600' }
  if (pct >= 40) return { label: onboardingTexts.placementResult.gradeLabels.needsWork, color: 'text-amber-600' }
  return { label: onboardingTexts.placementResult.gradeLabels.keepPracticing, color: 'text-rose-600' }
}
