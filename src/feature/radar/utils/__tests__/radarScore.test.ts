import { describe, it, expect } from 'vitest'

import {
  computeLessonPerformance,
  computeRadarForSkill,
  recordLessonPass,
  promoteToMastered,
  getTotalPassedLessons,
  getOverallRadar,
  createEmptyRadarState,
  type SkillAxis,
  type RadarState,
} from '../radarScore'

// ─── Helpers ────────────────────────────────────────────────────────────────────

function mockRadarState(scores: Record<SkillAxis, number>): RadarState {
  const state = createEmptyRadarState()
  for (const axis of ['D_doc', 'C_comm', 'T_trouble', 'G_custom'] as SkillAxis[]) {
    state.start_vector[axis] = scores[axis]
    state.current_vector[axis] = scores[axis]
  }
  return state
}

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
    const state = mockRadarState({
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
    const state = mockRadarState({
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

// ─── State Helpers ──────────────────────────────────────────────────────────────

describe('getTotalPassedLessons', () => {
  it('counts lessons across all skills', () => {
    let state = mockRadarState({
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
    const state = mockRadarState({
      D_doc: 85, C_comm: 68, T_trouble: 51, G_custom: 34,
    })
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
