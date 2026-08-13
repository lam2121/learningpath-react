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

export type StartingLevel = 'basic' | 'intermediate' | 'advanced'

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

/** Single placement test answer with difficulty metadata. */
export interface PlacementAnswer {
  axis: SkillAxis
  /** Difficulty level 1–8 from the placement test question. */
  level: number
  isCorrect: boolean
}

// ─── Constants ──────────────────────────────────────────────────────────────────

/**
 * Difficulty weight mapping.
 * Levels 1–2 → Easy (1), 3–4 → Medium (2), 5–6 → Hard (3), 7–8 → Expert (4).
 */
export const DIFFICULTY_WEIGHT: Record<number, number> = {
  1: 1, 2: 1,
  3: 2, 4: 2,
  5: 3, 6: 3,
  7: 4, 8: 4,
}

/** Maximum possible weighted score per skill (3 Easy + 3 Medium + 3 Hard + 3 Expert). */
export const MAX_WEIGHT_PER_SKILL = 30

/** Evidence weight assigned to the initial placement result. */
export const PLACEMENT_EVIDENCE_WEIGHT = 3.2

/** Scale factor applied to weighted accuracy to produce the initial radar. */
export const INITIAL_RADAR_SCALE = 0.85

/** Lesson quiz pass threshold (percentage). */
export const LESSON_PASS_THRESHOLD = 70

// ─── Placement Scoring ──────────────────────────────────────────────────────────

/**
 * Compute Difficulty-Weighted Accuracy per skill from placement answers.
 *
 * Each correct answer earns a weight determined by its difficulty level.
 * Result: `earnedWeight / 30 × 100` per skill.
 */
export function computeWeightedAccuracy(
  answers: PlacementAnswer[],
): Record<SkillAxis, number> {
  const earned: Record<SkillAxis, number> = {
    D_doc: 0,
    C_comm: 0,
    T_trouble: 0,
    G_custom: 0,
  }

  for (const answer of answers) {
    if (answer.isCorrect) {
      const weight = DIFFICULTY_WEIGHT[answer.level] ?? 1
      earned[answer.axis] += weight
    }
  }

  const result: Record<SkillAxis, number> = {
    D_doc: 0,
    C_comm: 0,
    T_trouble: 0,
    G_custom: 0,
  }

  for (const axis of ALL_SKILL_AXES) {
    result[axis] = (earned[axis] / MAX_WEIGHT_PER_SKILL) * 100
  }

  return result
}

// ─── Level Classification ───────────────────────────────────────────────────────

/**
 * Classify the learner's starting track from placement weighted accuracy scores.
 *
 * Guard conditions (evaluated in order):
 * 1. Any skill < 30% OR overall < 45% → Basic
 * 2. Overall ≥ 75% AND every skill ≥ 50% → Advanced
 * 3. Overall ≥ 75% but one skill 30–50% → Intermediate (Spiky Profile Cap)
 * 4. Otherwise (overall 45%–75%) → Intermediate
 */
export function classifyLevel(
  scores: Record<SkillAxis, number>,
): StartingLevel {
  const values = ALL_SKILL_AXES.map((axis) => scores[axis])
  const overall = values.reduce((sum, v) => sum + v, 0) / values.length
  const lowest = Math.min(...values)

  // Guard: any skill below 30% or overall below 45% → Basic
  if (lowest < 30 || overall < 45) {
    return 'basic'
  }

  // High overall with all skills above 50% → Advanced
  if (overall >= 75 && lowest >= 50) {
    return 'advanced'
  }

  // Everything else (including spiky profile cap) → Intermediate
  return 'intermediate'
}

// ─── Initial Radar ──────────────────────────────────────────────────────────────

/**
 * Scale a single weighted accuracy value to produce the initial radar score.
 *
 * Formula: `weightedAccuracy × 0.85`
 */
export function computeInitialRadar(weightedAccuracy: number): number {
  return weightedAccuracy * INITIAL_RADAR_SCALE
}

/**
 * Full pipeline: placement answers → weighted accuracy → initial radar → RadarState.
 */
export function initializeRadarFromPlacement(
  answers: PlacementAnswer[],
): RadarState {
  const weightedAccuracy = computeWeightedAccuracy(answers)

  const state = createEmptyRadarState()

  for (const axis of ALL_SKILL_AXES) {
    const initial = computeInitialRadar(weightedAccuracy[axis])
    state.start_vector[axis] = initial
    state.current_vector[axis] = initial
  }

  return state
}

/**
 * Create a RadarState directly from pre-computed weighted accuracy scores
 * (e.g., from a backend API response where scores are already calculated).
 */
export function initializeRadarFromScores(
  scores: Record<SkillAxis, number>,
): RadarState {
  const state = createEmptyRadarState()

  for (const axis of ALL_SKILL_AXES) {
    const initial = computeInitialRadar(scores[axis])
    state.start_vector[axis] = initial
    state.current_vector[axis] = initial
  }

  return state
}

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
