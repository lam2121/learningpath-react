// ─── Shared Types ─────────────────────────────────────────────────────────────

export type SkillAxis = 'D_doc' | 'C_comm' | 'T_trouble' | 'G_custom'

// Skill letter from DB → axis string used in the frontend
export type SkillLetter = 'D' | 'C' | 'T' | 'G'

export const SKILL_TO_AXIS: Record<SkillLetter, SkillAxis> = {
  D: 'D_doc',
  C: 'C_comm',
  T: 'T_trouble',
  G: 'G_custom',
}

/** Difficulty level — DB stores levels 1-10 (5 questions each, 50 per skill) */
export type DifficultyLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

/** Raw shape returned by the backend /placement-test/questions endpoint */
export interface RawPlacementQuestion {
  id: number
  skill: SkillLetter   // 'D' | 'C' | 'T' | 'G'
  level: DifficultyLevel  // 1–10
  statement: string
  options: string[]    // 4 plain-text options
  correct_answer: string
}

/** Normalised shape used by the engine and TestQuestionCard */
export interface TestQuestion {
  id: string
  axis: SkillAxis
  difficulty: DifficultyLevel  // 1–10
  question: string
  options: { id: string; text: string }[]
  correctId: string
  explanation: string
}

export interface QuestionResult {
  questionId: string
  axis: SkillAxis
  difficulty: DifficultyLevel
  selectedId: string | null
  isCorrect: boolean
  questionText?: string
  options?: { id: string; text: string }[]
  correctId?: string
}
