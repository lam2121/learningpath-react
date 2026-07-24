// ─── Shared Types ─────────────────────────────────────────────────────────────

export type SkillAxis = 'D_doc' | 'C_comm' | 'T_trouble' | 'G_biz'

export interface TestQuestion {
  id: string
  axis: SkillAxis
  difficulty: 1 | 2 | 3  // 1=easy, 2=medium, 3=hard
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
