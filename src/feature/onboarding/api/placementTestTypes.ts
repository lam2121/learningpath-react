// ─── Shared Types ─────────────────────────────────────────────────────────────

export type SkillAxis = 'D_doc' | 'C_comm' | 'T_trouble' | 'G_biz'

// Skill letter from DB → axis string used in the frontend
export type SkillLetter = 'D' | 'C' | 'T' | 'G'

export const SKILL_TO_AXIS: Record<SkillLetter, SkillAxis> = {
  D: 'D_doc',
  C: 'C_comm',
  T: 'T_trouble',
  G: 'G_biz',
}

/** Raw shape returned by the backend /placement-test/questions endpoint */
export interface RawPlacementQuestion {
  id: number
  skill: SkillLetter   // 'D' | 'C' | 'T' | 'G'
  level: 1 | 2 | 3
  statement: string
  options: string[]    // 4 plain-text options
  correct_answer: string
}

/** Normalised shape used by the engine and TestQuestionCard */
export interface TestQuestion {
  id: string
  axis: SkillAxis
  difficulty: 1 | 2 | 3
  question: string
  options: { id: string; text: string }[]
  correctId: string
  explanation: string
}

export interface QuestionResult {
  questionId: string
  axis: SkillAxis
  difficulty: number
  selectedId: string | null
  isCorrect: boolean
}
