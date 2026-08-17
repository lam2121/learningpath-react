/**
 * Radar Context — React state management for the radar score system.
 *
 * Wraps the pure scoring functions from `radarScore.ts` with:
 * - Persistent localStorage cache (keyed by user ID)
 * - Backend API hydration from placement test results
 * - Immutable state updates via React Context
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'

import { useAuth } from '@/common/context/AuthContext'
import { fetchPlacementTestResult } from '@/feature/onboarding/api/onboardingApi'

import {
  createEmptyRadarState,
  getOverallRadar,
  getTotalPassedLessons,
  promoteToMastered,
  recordLessonPass,
  computeRadarForSkill,
  ALL_SKILL_AXES,
  type RadarState,
  type SkillAxis,
} from '../utils/radarScore'

// ─── Storage ────────────────────────────────────────────────────────────────────

const STORAGE_KEY_PREFIX = 'radar-state'

function getStorageKey(userId: number): string {
  return `${STORAGE_KEY_PREFIX}:${userId}`
}

function loadFromStorage(userId: number): RadarState | null {
  try {
    const raw = localStorage.getItem(getStorageKey(userId))
    if (!raw) return null
    return JSON.parse(raw) as RadarState
  } catch {
    return null
  }
}

function saveToStorage(userId: number, state: RadarState): void {
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(state))
  } catch {
    // Storage full or unavailable — silently ignore
  }
}

// ─── Context ────────────────────────────────────────────────────────────────────

export interface RadarContextValue {
  /** Current radar state across all 4 skills. */
  radarState: RadarState
  /** True while the initial placement data is being loaded. */
  isLoading: boolean
  /** Average radar across all skills (0–100). */
  overallRadar: number
  /** Total number of passed lesson quizzes across all skills. */
  totalPassedLessons: number
  /** Record a passed lesson quiz for a specific skill. */
  handleLessonPass: (skill: SkillAxis, lessonPerformance: number) => void
  /** Promote qualifying skills to 100% after final test graduation. */
  handleGraduation: (finalTestSkillScores: Record<SkillAxis, number>) => void
  /** Force re-initialize radar from backend (e.g., after placement test completion). */
  reinitialize: (force?: boolean) => Promise<void>
}

const RadarContext = createContext<RadarContextValue | null>(null)

// ─── Provider ───────────────────────────────────────────────────────────────────

export function RadarProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const userId = user?.id ?? null

  const [radarState, setRadarState] = useState<RadarState>(createEmptyRadarState)
  const [isLoading, setIsLoading] = useState(true)

  /**
   * Initialize radar state from the backend placement result.
   * Falls back to localStorage cache if the API call fails.
   */
  const initialize = useCallback(async (force = false) => {
    if (userId === null) {
      setRadarState(createEmptyRadarState())
      setIsLoading(false)
      return
    }

    // Try localStorage cache first for instant paint if not forced
    const cached = loadFromStorage(userId)
    if (cached && !force) {
      setRadarState(cached)
    }

    try {
      const result = await fetchPlacementTestResult()

      if (result.learning_status === 'enrolled') {
        const cachedHasNoEvidence =
          !cached ||
          ALL_SKILL_AXES.every(
            (axis) => (cached.prev_stack?.[axis]?.length ?? 0) === 0,
          )

        // Update state if forced or if no lesson evidence has been recorded yet
        if (force || cachedHasNoEvidence) {
          let freshState: RadarState;
          
          if (result.radar_score) {
            // Use the exact database values as single source of truth
            freshState = result.radar_score as RadarState;
          } else {
            // Failsafe if backend radar_score is somehow missing
            freshState = createEmptyRadarState()
          }
          // Preserve any existing lesson evidence if this is a forced re-sync
          if (cached && !cachedHasNoEvidence) {
            for (const axis of ALL_SKILL_AXES) {
              const performances = cached.prev_stack?.[axis] || []
              if (performances.length > 0) {
                freshState.prev_stack[axis] = performances
                freshState.current_vector[axis] = computeRadarForSkill(
                  freshState.start_vector[axis],
                  performances,
                )
              }
            }
          }
          setRadarState(freshState)
          saveToStorage(userId, freshState)
        }
      }
    } catch {
      // API unavailable — use cache or empty state
      if (!cached) {
        setRadarState(createEmptyRadarState())
      }
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    initialize()
  }, [initialize])

  // Persist to localStorage on every state change
  useEffect(() => {
    if (userId !== null) {
      saveToStorage(userId, radarState)
    }
  }, [userId, radarState])

  const handleLessonPass = useCallback(
    (skill: SkillAxis, lessonPerformance: number) => {
      setRadarState((prev) => recordLessonPass(prev, skill, lessonPerformance))
    },
    [],
  )

  const handleGraduation = useCallback(
    (finalTestSkillScores: Record<SkillAxis, number>) => {
      setRadarState((prev) => promoteToMastered(prev, finalTestSkillScores))
    },
    [],
  )

  const reinitialize = useCallback(async (force = true) => {
    setIsLoading(true)
    await initialize(force)
  }, [initialize])

  const overallRadar = useMemo(
    () => getOverallRadar(radarState),
    [radarState],
  )

  const totalPassedLessons = useMemo(
    () => getTotalPassedLessons(radarState),
    [radarState],
  )

  const value: RadarContextValue = useMemo(
    () => ({
      radarState,
      isLoading,
      overallRadar,
      totalPassedLessons,
      handleLessonPass,
      handleGraduation,
      reinitialize,
    }),
    [
      radarState,
      isLoading,
      overallRadar,
      totalPassedLessons,
      handleLessonPass,
      handleGraduation,
      reinitialize,
    ],
  )

  return (
    <RadarContext.Provider value={value}>
      {children}
    </RadarContext.Provider>
  )
}

// ─── Hook ───────────────────────────────────────────────────────────────────────

export function useRadar(): RadarContextValue {
  const ctx = useContext(RadarContext)
  if (!ctx) {
    throw new Error('useRadar must be used inside <RadarProvider>')
  }
  return ctx
}
