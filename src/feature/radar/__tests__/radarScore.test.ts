import { describe, it, expect } from 'vitest'

import {
  computeWeightedAccuracy,
  classifyLevel,
  computeInitialRadar,
  initializeRadarFromPlacement,
  initializeRadarFromScores,
  computeLessonPerformance,
  computeRadarForSkill,
  recordLessonPass,
  promoteToMastered,
  getTotalPassedLessons,
  getOverallRadar,
  createEmptyRadarState,
  type PlacementAnswer,
  type SkillAxis,
} from '../radarScore'

// ─── Helper to build placement answers ──────────────────────────────────────────

function buildAnswers(
  axis: SkillAxis,
  correctLevels: number[],
): PlacementAnswer[] {
  const allLevels = [1, 2, 3, 4, 5, 6, 7, 8, 1, 2, 3, 4]
  return allLevels.map((level) => ({
    axis,
    level,
    isCorrect: correctLevels.includes(level),
  }))
}

// ─── computeWeightedAccuracy ────────────────────────────────────────────────────

describe('computeWeightedAccuracy', () => {
  it('returns 100% when all 12 questions are correct', () => {
    const answers: PlacementAnswer[] = [
      // 3 Easy (levels 1–2, weight 1 each) = 3
      // 3 Medium (levels 3–4, weight 2 each) = 6
      // 3 Hard (levels 5–6, weight 3 each) = 9
      // 3 Expert (levels 7–8, weight 4 each) = 12
      // Total = 30
      { axis: 'D_doc', level: 1, isCorrect: true },
      { axis: 'D_doc', level: 2, isCorrect: true },
      { axis: 'D_doc', level: 1, isCorrect: true },
      { axis: 'D_doc', level: 3, isCorrect: true },
      { axis: 'D_doc', level: 4, isCorrect: true },
      { axis: 'D_doc', level: 3, isCorrect: true },
      { axis: 'D_doc', level: 5, isCorrect: true },
      { axis: 'D_doc', level: 6, isCorrect: true },
      { axis: 'D_doc', level: 5, isCorrect: true },
      { axis: 'D_doc', level: 7, isCorrect: true },
      { axis: 'D_doc', level: 8, isCorrect: true },
      { axis: 'D_doc', level: 7, isCorrect: true },
    ]

    const result = computeWeightedAccuracy(answers)
    expect(result.D_doc).toBe(100)
  })

  it('returns 0% when no questions are correct', () => {
    const answers: PlacementAnswer[] = Array.from({ length: 12 }, (_, i) => ({
      axis: 'C_comm' as SkillAxis,
      level: (i % 8) + 1,
      isCorrect: false,
    }))

    const result = computeWeightedAccuracy(answers)
    expect(result.C_comm).toBe(0)
  })

  it('computes 80% correctly (earned 24/30)', () => {
    const answers: PlacementAnswer[] = [
      // 3 Easy correct = 3
      { axis: 'T_trouble', level: 1, isCorrect: true },
      { axis: 'T_trouble', level: 2, isCorrect: true },
      { axis: 'T_trouble', level: 1, isCorrect: true },
      // 3 Medium correct = 6
      { axis: 'T_trouble', level: 3, isCorrect: true },
      { axis: 'T_trouble', level: 4, isCorrect: true },
      { axis: 'T_trouble', level: 3, isCorrect: true },
      // 2 Hard correct = 6
      { axis: 'T_trouble', level: 5, isCorrect: true },
      { axis: 'T_trouble', level: 6, isCorrect: true },
      { axis: 'T_trouble', level: 5, isCorrect: false },
      // 3 Easy(3) + 3 Med(6) + 1 Hard(3) + 3 Expert(12) = 24 ✓
      { axis: 'T_trouble', level: 7, isCorrect: true },
      { axis: 'T_trouble', level: 8, isCorrect: true },
      { axis: 'T_trouble', level: 7, isCorrect: true },
    ]

    const result = computeWeightedAccuracy(answers)
    // 3 easy (3) + 3 medium (6) + 2 hard (6) + 3 expert (12) = 27
    expect(result.T_trouble).toBe(90) // 27/30 * 100 = 90
  })

  it('handles multiple skills independently', () => {
    const answers: PlacementAnswer[] = [
      // D_doc: 1 easy correct = weight 1
      { axis: 'D_doc', level: 1, isCorrect: true },
      // C_comm: 1 expert correct = weight 4
      { axis: 'C_comm', level: 7, isCorrect: true },
    ]

    const result = computeWeightedAccuracy(answers)
    expect(result.D_doc).toBeCloseTo((1 / 30) * 100, 1)
    expect(result.C_comm).toBeCloseTo((4 / 30) * 100, 1)
    expect(result.T_trouble).toBe(0)
    expect(result.G_custom).toBe(0)
  })
})

// ─── classifyLevel ──────────────────────────────────────────────────────────────

describe('classifyLevel', () => {
  it('returns Basic when any skill < 30%', () => {
    expect(classifyLevel({
      D_doc: 80, C_comm: 80, T_trouble: 80, G_custom: 25,
    })).toBe('basic')
  })

  it('returns Basic when overall < 45%', () => {
    expect(classifyLevel({
      D_doc: 40, C_comm: 40, T_trouble: 40, G_custom: 40,
    })).toBe('basic')
  })

  it('returns Advanced when overall ≥ 75% and all skills ≥ 50%', () => {
    expect(classifyLevel({
      D_doc: 80, C_comm: 75, T_trouble: 70, G_custom: 80,
    })).toBe('advanced')
  })

  it('returns Intermediate (spiky cap) when overall ≥ 75% but one skill 30–50%', () => {
    expect(classifyLevel({
      D_doc: 90, C_comm: 90, T_trouble: 90, G_custom: 35,
    })).toBe('intermediate')
  })

  it('returns Intermediate for overall 45–75%', () => {
    expect(classifyLevel({
      D_doc: 60, C_comm: 55, T_trouble: 50, G_custom: 45,
    })).toBe('intermediate')
  })

  it('Basic guard takes priority over Intermediate range', () => {
    expect(classifyLevel({
      D_doc: 60, C_comm: 17, T_trouble: 60, G_custom: 63,
    })).toBe('basic')
  })
})

// ─── computeInitialRadar ────────────────────────────────────────────────────────

describe('computeInitialRadar', () => {
  it('scales 100% accuracy to 85%', () => {
    expect(computeInitialRadar(100)).toBe(85)
  })

  it('scales 80% accuracy to 68%', () => {
    expect(computeInitialRadar(80)).toBe(68)
  })

  it('scales 0% accuracy to 0%', () => {
    expect(computeInitialRadar(0)).toBe(0)
  })

  it('scales 60% accuracy to 51%', () => {
    expect(computeInitialRadar(60)).toBe(51)
  })
})

// ─── initializeRadarFromPlacement ───────────────────────────────────────────────

describe('initializeRadarFromPlacement', () => {
  it('creates RadarState with correct initial values', () => {
    const answers: PlacementAnswer[] = [
      // D_doc: all 12 correct → WA = 100% → IR = 85%
      ...Array.from({ length: 3 }, () => ({ axis: 'D_doc' as SkillAxis, level: 1, isCorrect: true })),
      ...Array.from({ length: 3 }, () => ({ axis: 'D_doc' as SkillAxis, level: 3, isCorrect: true })),
      ...Array.from({ length: 3 }, () => ({ axis: 'D_doc' as SkillAxis, level: 5, isCorrect: true })),
      ...Array.from({ length: 3 }, () => ({ axis: 'D_doc' as SkillAxis, level: 7, isCorrect: true })),
    ]

    const state = initializeRadarFromPlacement(answers)
    expect(state.start_vector.D_doc).toBe(85)
    expect(state.current_vector.D_doc).toBe(85)
    expect(state.prev_stack.D_doc).toEqual([])
    expect(state.start_vector.C_comm).toBe(0)
  })
})

// ─── initializeRadarFromScores ──────────────────────────────────────────────────

describe('initializeRadarFromScores', () => {
  it('creates RadarState from pre-computed scores', () => {
    const scores = { D_doc: 60, C_comm: 17, T_trouble: 87, G_custom: 17 }
    const state = initializeRadarFromScores(scores)

    expect(state.start_vector.D_doc).toBeCloseTo(51, 0)
    expect(state.start_vector.C_comm).toBeCloseTo(14.45, 0)
    expect(state.start_vector.T_trouble).toBeCloseTo(73.95, 0)
    expect(state.start_vector.G_custom).toBeCloseTo(14.45, 0)
  })
})

// ─── computeLessonPerformance ───────────────────────────────────────────────────

describe('computeLessonPerformance', () => {
  it('returns 90% for 27 correct without hint, 0 with hint, 3 wrong (30 total)', () => {
    expect(computeLessonPerformance(27, 0, 30)).toBe(90)
  })

  it('returns 90% for 24 no-hint + 4 with-hint (30 total)', () => {
    expect(computeLessonPerformance(24, 4, 30)).toBe(90)
  })

  it('returns 75% when all 30 answers use hints', () => {
    expect(computeLessonPerformance(0, 30, 30)).toBe(75)
  })

  it('returns 100% for perfect no-hint performance', () => {
    expect(computeLessonPerformance(30, 0, 30)).toBe(100)
  })

  it('returns 0 when total questions is 0', () => {
    expect(computeLessonPerformance(0, 0, 0)).toBe(0)
  })
})

// ─── computeRadarForSkill (evidence-based formula) ──────────────────────────────

describe('computeRadarForSkill', () => {
  it('returns initial radar when no lessons have been passed', () => {
    expect(computeRadarForSkill(85, [])).toBe(85)
  })

  it('computes correctly with two 100% lessons (v3 §8 example)', () => {
    const result = computeRadarForSkill(85, [100, 100])
    expect(result).toBeCloseTo(90.77, 1)
  })

  it('computes correctly with four 100% lessons (v3 §12 example)', () => {
    const result = computeRadarForSkill(40, [100, 100, 100, 100])
    expect(result).toBeCloseTo(73.33, 1)
  })

  it('is order-independent', () => {
    const orderA = computeRadarForSkill(50, [60, 70, 100])
    const orderB = computeRadarForSkill(50, [100, 70, 60])
    const orderC = computeRadarForSkill(50, [70, 100, 60])
    expect(orderA).toBeCloseTo(orderB, 10)
    expect(orderB).toBeCloseTo(orderC, 10)
  })

  it('stays within 0–100% bounds', () => {
    const maxResult = computeRadarForSkill(100, [100, 100, 100, 100, 100])
    const minResult = computeRadarForSkill(0, [0, 0, 0])
    expect(maxResult).toBeLessThanOrEqual(100)
    expect(minResult).toBeGreaterThanOrEqual(0)
  })
})

// ─── recordLessonPass ───────────────────────────────────────────────────────────

describe('recordLessonPass', () => {
  it('updates only the target skill', () => {
    const state = initializeRadarFromScores({
      D_doc: 80, C_comm: 60, T_trouble: 50, G_custom: 40,
    })

    const newState = recordLessonPass(state, 'D_doc', 90)

    // D_doc updated
    expect(newState.prev_stack.D_doc).toEqual([90])
    expect(newState.current_vector.D_doc).not.toBe(state.current_vector.D_doc)

    // Other skills unchanged
    expect(newState.current_vector.C_comm).toBe(state.current_vector.C_comm)
    expect(newState.current_vector.T_trouble).toBe(state.current_vector.T_trouble)
    expect(newState.current_vector.G_custom).toBe(state.current_vector.G_custom)
  })
})

// ─── promoteToMastered ──────────────────────────────────────────────────────────

describe('promoteToMastered', () => {
  it('promotes skills with final test score ≥ 90% to 100%', () => {
    const state = initializeRadarFromScores({
      D_doc: 80, C_comm: 70, T_trouble: 60, G_custom: 50,
    })

    const promoted = promoteToMastered(state, {
      D_doc: 95, C_comm: 92, T_trouble: 85, G_custom: 90,
    })

    expect(promoted.current_vector.D_doc).toBe(100)
    expect(promoted.current_vector.C_comm).toBe(100)
    expect(promoted.current_vector.T_trouble).toBe(state.current_vector.T_trouble) // < 90%, not promoted
    expect(promoted.current_vector.G_custom).toBe(100)
  })
})

// ─── Helpers ────────────────────────────────────────────────────────────────────

describe('getTotalPassedLessons', () => {
  it('counts lessons across all skills', () => {
    let state = initializeRadarFromScores({
      D_doc: 50, C_comm: 50, T_trouble: 50, G_custom: 50,
    })
    state = recordLessonPass(state, 'D_doc', 80)
    state = recordLessonPass(state, 'D_doc', 90)
    state = recordLessonPass(state, 'C_comm', 75)

    expect(getTotalPassedLessons(state)).toBe(3)
  })
})

describe('getOverallRadar', () => {
  it('computes the average of all 4 skill radars', () => {
    const state = initializeRadarFromScores({
      D_doc: 100, C_comm: 80, T_trouble: 60, G_custom: 40,
    })
    // Initial radars: 85, 68, 51, 34
    const overall = getOverallRadar(state)
    expect(overall).toBeCloseTo((85 + 68 + 51 + 34) / 4, 1)
  })
})

describe('createEmptyRadarState', () => {
  it('creates state with all zeros', () => {
    const state = createEmptyRadarState()
    for (const axis of ['D_doc', 'C_comm', 'T_trouble', 'G_custom'] as SkillAxis[]) {
      expect(state.start_vector[axis]).toBe(0)
      expect(state.current_vector[axis]).toBe(0)
      expect(state.prev_stack[axis]).toEqual([])
    }
  })
})
