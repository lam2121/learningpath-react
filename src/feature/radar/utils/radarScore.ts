/**
 * Radar Score — Pure Scoring Engine
 *
 * Implements the evidence-based radar score calculation from
 * learning-path-scoring-design-v3.md (Consolidated Spec Aligned).
 *
 * All functions are pure (no side effects) and fully testable.
 */

// ─── Types ──────────────────────────────────────────────────────────────────────

export type SkillAxis = 'D_doc' | 'C_comm' | 'T_trouble' | 'G_custom'

export const ALL_SKILL_AXES: readonly SkillAxis[] = [
  'D_doc',
  'C_comm',
  'T_trouble',
  'G_custom',
] as const

/** A vector representing scores across all skills. */
export type RadarVector = Record<SkillAxis, number>

/** Complete radar state matching the backend database schema. */
export interface RadarState {
  /** Initial Radar Score derived from placement (Weighted Accuracy × 0.85). */
  start_vector: RadarVector
  /** Current radar score after applying all evidence. */
  current_vector: RadarVector
  /** Ordered list of passed lesson quiz performances (0–100) per skill. */
  prev_stack: Record<SkillAxis, number[]>
}

// ─── Constants ──────────────────────────────────────────────────────────────────

/** Evidence weight assigned to the initial placement result. */
export const PLACEMENT_EVIDENCE_WEIGHT = 3.2

/** Lesson quiz pass threshold (percentage). */
export const LESSON_PASS_THRESHOLD = 70

// ─── Lesson Quiz Scoring ────────────────────────────────────────────────────────

/**
 * Calculate Lesson Performance with hint scoring.
 *
 * Formula: `(correctNoHint + 0.75 × correctWithHint) / totalQuestions × 100`
 */
export function computeLessonPerformance(
  correctNoHint: number,
  correctWithHint: number,
  totalQuestions: number,
): number {
  if (totalQuestions <= 0) return 0
  return ((correctNoHint + 0.75 * correctWithHint) / totalQuestions) * 100
}

// ─── Evidence-Based Radar Update ────────────────────────────────────────────────

/**
 * Compute the current radar score for a single skill using the evidence-based
 * weighted average formula.
 *
 * Formula: `(I × 3.2 + Σ Pi) / (3.2 + n)`
 *
 * Where:
 * - I = Initial Radar Score from Placement
 * - Pi = Performance of each passed lesson quiz
 * - n = Number of passed lesson quizzes
 */
export function computeRadarForSkill(
  initialRadar: number,
  passedPerformances: number[],
): number {
  const n = passedPerformances.length

  if (n === 0) {
    return initialRadar
  }

  const sumPi = passedPerformances.reduce((sum, p) => sum + p, 0)
  const raw =
    (initialRadar * PLACEMENT_EVIDENCE_WEIGHT + sumPi) /
    (PLACEMENT_EVIDENCE_WEIGHT + n)

  return Math.min(100, Math.max(0, raw))
}

/**
 * Record a passed lesson quiz for a specific skill in the full radar state.
 *
 * Returns a new RadarState (immutable update).
 */
export function recordLessonPass(
  state: RadarState,
  skill: SkillAxis,
  lessonPerformance: number,
): RadarState {
  const newPerformances = [...state.prev_stack[skill], lessonPerformance]
  
  return {
    ...state,
    current_vector: {
      ...state.current_vector,
      [skill]: computeRadarForSkill(state.start_vector[skill], newPerformances),
    },
    prev_stack: {
      ...state.prev_stack,
      [skill]: newPerformances,
    },
  }
}

// ─── Mastery Promotion ──────────────────────────────────────────────────────────

/**
 * Promote skills to 100% (MASTERED) after passing the Final Test.
 *
 * For each skill where the Final Test section score ≥ 90%,
 * the radar is set to 100%.
 */
export function promoteToMastered(
  state: RadarState,
  finalTestSkillScores: Record<SkillAxis, number>,
): RadarState {
  const newState = { 
    ...state,
    current_vector: { ...state.current_vector }
  }

  for (const axis of ALL_SKILL_AXES) {
    if (finalTestSkillScores[axis] >= 90) {
      newState.current_vector[axis] = 100
    }
  }

  return newState
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

/** Get the total number of passed lessons across all skills. */
export function getTotalPassedLessons(state: RadarState): number {
  return ALL_SKILL_AXES.reduce(
    (sum, axis) => sum + state.prev_stack[axis].length,
    0,
  )
}

/** Get the average current radar across all skills (0–100). */
export function getOverallRadar(state: RadarState): number {
  const total = ALL_SKILL_AXES.reduce(
    (sum, axis) => sum + state.current_vector[axis],
    0,
  )
  return total / ALL_SKILL_AXES.length
}

/** Create an empty radar state (all zeros). */
export function createEmptyRadarState(): RadarState {
  const state: RadarState = {
    start_vector: {} as RadarVector,
    current_vector: {} as RadarVector,
    prev_stack: {} as Record<SkillAxis, number[]>,
  }

  for (const axis of ALL_SKILL_AXES) {
    state.start_vector[axis] = 0
    state.current_vector[axis] = 0
    state.prev_stack[axis] = []
  }

  return state
}
