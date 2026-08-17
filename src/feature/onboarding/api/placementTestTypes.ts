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

/** Difficulty level — DB stores string levels: Easy | Medium | Hard | Expert */
export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard' | 'Expert'

/** Ordered levels for progression: Easy -> Medium -> Hard */
export const ORDERED_LEVELS: DifficultyLevel[] = ['Easy', 'Medium', 'Hard']

/** Raw shape returned by the backend /placement-test/questions endpoint */
export interface RawPlacementQuestion {
  id: number
  skill: SkillLetter   // 'D' | 'C' | 'T' | 'G'
  level: DifficultyLevel  // Easy | Medium | Hard | Expert
  statement: string
  options: string[]    // 4 plain-text options
  correct_answer: string
  expanded_skill?: 'Context_layer' | 'Language_layer'
}

/** Normalised shape used by the engine and TestQuestionCard */
export interface TestQuestion {
  id: string
  axis: SkillAxis
  difficulty: DifficultyLevel  // Easy | Medium | Hard | Expert
  question: string
  options: { id: string; text: string }[]
  correctId: string
  explanation: string
  expanded_skill?: 'Context_layer' | 'Language_layer'
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
