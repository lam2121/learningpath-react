import type { JobRole, JobRoleSkillDefinitions } from '../../api/onboardingApi'
import type { SkillScores, SkillDifficultyBreakdown } from '@/feature/dev-mode/api/devModeApi'

export const SKILL_KEYS = ['D_doc', 'C_comm', 'T_trouble', 'G_custom'] as const
export type SkillKey = (typeof SKILL_KEYS)[number]
export type AxisKey = 'D' | 'C' | 'T' | 'G'

export const SKILL_LABELS: Record<(typeof SKILL_KEYS)[number], string> = {
  D_doc: 'Documentation (D)',
  C_comm: 'Communication (C)',
  T_trouble: 'Problem Solving (T)',
  G_custom: 'Specialization (G)',
}

export const AXIS_TO_SKILL: Record<AxisKey, SkillKey> = {
  D: 'D_doc',
  C: 'C_comm',
  T: 'T_trouble',
  G: 'G_custom',
}

export const SKILL_TO_AXIS: Record<SkillKey, AxisKey> = {
  D_doc: 'D',
  C_comm: 'C',
  T_trouble: 'T',
  G_custom: 'G',
}

export const DEFAULT_SKILL_DEFINITIONS = {
  D_doc: {
    description: {
      en: 'Ability to read and write clear, concise, and structured technical documentation.',
      vi: 'Khả năng đọc và viết tài liệu kỹ thuật rõ ràng, súc tích và có cấu trúc.',
      jp: '明確で簡潔、かつ構造化された技術ドキュメントの作成・読解能力。',
    },
    example_questions: [],
  },
  C_comm: {
    description: {
      en: 'Effective verbal and written communication in professional IT contexts.',
      vi: 'Kỹ năng giao tiếp bằng văn bản và lời nói hiệu quả trong môi trường IT chuyên nghiệp.',
      jp: 'ITの専門的な現場における、効果的な口頭および書面でのコミュニケーション能力。',
    },
    example_questions: [],
  },
  T_trouble: {
    description: {
      en: 'Skills in identifying, analyzing, and resolving technical issues.',
      vi: 'Kỹ năng xác định, phân tích và giải quyết các vấn đề kỹ thuật.',
      jp: '技術的な課題を特定、分析、解決するスキル。',
    },
    example_questions: [],
  },
  G_custom: {
    description: {
      en: 'Specific domain knowledge and expertise required for this role.',
      vi: 'Kiến thức và chuyên môn sâu theo lĩnh vực yêu cầu cho vai trò này.',
      jp: 'この役職に求められる専門知識および特定分野のスキル。',
    },
    example_questions: [],
  },
} as const

export const MAX_SKILL_WEIGHT = 24

/** Compute earned weight from a difficulty breakdown: Easy×1 + Medium×2 + Hard×3. */
export function earnedWeight(bd: SkillDifficultyBreakdown): number {
  return bd.easy * 1 + bd.medium * 2 + bd.hard * 3
}

/** Replicate backend `classify_user` (placement_evaluator.py) for the live track preview. */
export function classifyTrackPreview(skills: SkillScores): 'basic' | 'intermediate' | 'advanced' {
  const fractions = SKILL_KEYS.map((k) => Math.min(earnedWeight(skills[k]) / MAX_SKILL_WEIGHT, 1))
  const overall = fractions.reduce((a, b) => a + b, 0) / fractions.length
  const min = Math.min(...fractions)
  if (overall >= 0.75 && min >= 0.5) return 'advanced'
  if (overall >= 0.75 && min < 0.5) return 'intermediate'
  if (overall >= 0.45 && overall < 0.75 && min >= 0.3) return 'intermediate'
  return 'basic'
}

// ─── Visual palette — assigned per card index ─────────────────────────────────

export const ROLE_PALETTE = [
  { icon: '🎯', color: 'from-violet-500 to-purple-600', gradient: 'from-violet-50 to-purple-50' },
  { icon: '📊', color: 'from-blue-500 to-indigo-600', gradient: 'from-blue-50 to-indigo-50' },
  { icon: '⚡', color: 'from-emerald-500 to-teal-600', gradient: 'from-emerald-50 to-teal-50' },
  { icon: '🏗️', color: 'from-amber-500 to-orange-600', gradient: 'from-amber-50 to-orange-50' },
  { icon: '🔍', color: 'from-rose-500 to-pink-600', gradient: 'from-rose-50 to-pink-50' },
  { icon: '🛠️', color: 'from-slate-500 to-gray-600', gradient: 'from-slate-50 to-gray-50' },
  { icon: '🎨', color: 'from-cyan-500 to-sky-600', gradient: 'from-cyan-50 to-sky-50' },
  { icon: '🤖', color: 'from-fuchsia-500 to-violet-600', gradient: 'from-fuchsia-50 to-violet-50' },
  { icon: '🚀', color: 'from-green-500 to-emerald-600', gradient: 'from-green-50 to-emerald-50' },
  { icon: '💡', color: 'from-yellow-500 to-amber-600', gradient: 'from-yellow-50 to-amber-50' },
]

export function extractWeights(baseline: JobRole['baseline']): { D: number; C: number; T: number; G: number } {
  const src = baseline ?? {}
  return {
    D: Number(src.D_doc ?? 25),
    C: Number(src.C_comm ?? 25),
    T: Number(src.T_trouble ?? 25),
    G: Number(src.G_custom ?? 25),
  }
}

export type WeightDescription = {
  name: string
  description: string
}

function extractDescription(
  desc: string | Record<string, string> | undefined,
  fallback: string | Record<string, string>,
  lang?: string,
): string {
  const normalizedLang =
    lang?.toLowerCase().startsWith('jp') || lang?.toLowerCase().startsWith('ja')
      ? 'jp'
      : lang?.toLowerCase().startsWith('vi')
        ? 'vi'
        : 'en'

  const target = desc || fallback
  if (typeof target === 'object' && target !== null) {
    return target[normalizedLang] || target.en || Object.values(target)[0] || ''
  }
  if (typeof target === 'string') {
    const trimmed = target.trim()
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed)
        if (typeof parsed === 'object' && parsed !== null) {
          return parsed[normalizedLang] || parsed.en || Object.values(parsed)[0] || ''
        }
      } catch {
        // Fall back to plain string
      }
    }
    return trimmed
  }
  return String(target ?? '')
}

export function getRoleDescription(role?: JobRole | null, lang?: string): string {
  if (!role) return ''

  if (role.job_description) {
    const extracted = extractDescription(role.job_description, '', lang)
    if (extracted && extracted.trim()) {
      return extracted
    }
  }

  const descMap: Record<string, Record<'en' | 'vi' | 'jp', string>> = {
    'Project Manager': {
      en: 'Plans and coordinates software projects, aligns teams on scope, tracks delivery risks, and communicates progress with stakeholders.',
      vi: 'Lập kế hoạch và điều phối các dự án phần mềm, thống nhất phạm vi công việc với đội ngũ, theo dõi các rủi ro trong quá trình triển khai và báo cáo tiến độ cho các bên liên quan.',
      jp: 'ソフトウェアプロジェクトの計画と調整、チーム間のスコープ調整、デリバリーリスクの管理、およびステークホルダーへの進捗報告を担当します。',
    },
    'Business Analyst': {
      en: 'Elicits requirements, clarifies scope, documents business flows, and bridges communication between stakeholders and engineering teams.',
      vi: 'Thu thập yêu cầu, làm rõ phạm vi, tài liệu hóa quy trình nghiệp vụ và làm cầu nối giao tiếp giữa các bên liên quan và đội ngũ kỹ thuật.',
      jp: '要件定義、スコープの明確化、業務フローのドキュメント化を行い、ステークホルダーとエンジニアチーム間の橋渡しを担う。',
    },
    'Tech Lead': {
      en: 'Leads implementation decisions, mentors engineers, drives code quality, and communicates technical tradeoffs across the team.',
      vi: 'Chịu trách nhiệm đưa ra các quyết định triển khai, hướng dẫn kỹ sư, đảm bảo chất lượng mã nguồn và truyền đạt các đánh đổi kỹ thuật trong nhóm.',
      jp: '実装方針の決定、エンジニアのメンタリング、コード品質の向上を主導し、チーム全体で技術的なトレードオフについて調整を行う。',
    },
    'Software Architect': {
      en: 'Designs system architecture, evaluates tradeoffs, defines standards, and communicates technical direction to engineering and business audiences.',
      vi: 'Thiết kế kiến trúc hệ thống, đánh giá các phương án thay thế, xác định tiêu chuẩn kỹ thuật và truyền đạt định hướng công nghệ tới đội ngũ kỹ thuật và các bên liên quan trong kinh doanh.',
      jp: 'システムアーキテクチャの設計、トレードオフの評価、技術標準の策定、およびエンジニアリングチームやビジネス関係者への技術的な方向性の提示。',
    },
    'QA / Tester': {
      en: 'Validates software quality through test design, bug reporting, defect triage, and close collaboration with product and engineering teams.',
      vi: 'Đảm bảo chất lượng phần mềm thông qua thiết kế kiểm thử, báo cáo lỗi, phân loại khiếm khuyết và phối hợp chặt chẽ với các đội ngũ sản phẩm và kỹ thuật.',
      jp: 'テスト設計、バグ報告、不具合のトリアージ、およびプロダクト・エンジニアリングチームとの緊密な連携を通じて、ソフトウェアの品質を保証する。',
    },
    'DevOps / SRE': {
      en: 'Operates CI/CD pipelines, infrastructure, reliability tooling, and incident response processes for production systems.',
      vi: 'Vận hành các quy trình CI/CD, cơ sở hạ tầng, công cụ đảm bảo độ tin cậy và quy trình xử lý sự cố cho các hệ thống sản xuất.',
      jp: '本番環境におけるCI/CDパイプライン、インフラストラクチャ、信頼性向上ツール、およびインシデント対応プロセスの運用。',
    },
    'Frontend / UI-UX': {
      en: 'Builds user interfaces, collaborates with design and product, and communicates interaction, accessibility, and performance tradeoffs.',
      vi: 'Xây dựng giao diện người dùng, phối hợp chặt chẽ với đội ngũ thiết kế và sản phẩm, đồng thời đánh giá các yếu tố về tương tác, khả năng truy cập và hiệu năng.',
      jp: 'ユーザーインターフェースの構築、デザイン・プロダクトチームとの連携、およびインタラクション、アクセシビリティ、パフォーマンスに関するトレードオフの検討・調整。',
    },
    'Data / AI Engineer': {
      en: 'Builds data pipelines and ML workflows, reports model outcomes, and explains data quality or model tradeoffs to technical and business stakeholders.',
      vi: 'Xây dựng các đường ống dữ liệu và quy trình làm việc ML, báo cáo kết quả mô hình, đồng thời giải thích về chất lượng dữ liệu hoặc các đánh đổi của mô hình cho các bên liên quan.',
      jp: 'データパイプラインおよび機械学習ワークフローの構築、モデル成果のレポーティング、ならびに技術およびビジネスのステークホルダーに対するデータ品質やモデルのトレードオフに関する説明を行う。',
    },
  }

  const normalizedLang =
    lang?.toLowerCase().startsWith('jp') || lang?.toLowerCase().startsWith('ja')
      ? 'jp'
      : lang?.toLowerCase().startsWith('vi')
        ? 'vi'
        : 'en'

  const matched = descMap[role.name]
  if (matched) {
    return matched[normalizedLang] || matched.en
  }

  return 'Responsible for technical deliverables, communication, and collaboration in software engineering projects.'
}

export function getSkillDefinitions(role?: JobRole, lang?: string) {
  const defs: Partial<JobRoleSkillDefinitions> = role?.skill_definitions ?? {}
  return {
    D_doc: {
      description: extractDescription(defs.D_doc?.description, DEFAULT_SKILL_DEFINITIONS.D_doc.description, lang),
      example_questions: defs.D_doc?.example_questions ?? [],
    },
    C_comm: {
      description: extractDescription(defs.C_comm?.description, DEFAULT_SKILL_DEFINITIONS.C_comm.description, lang),
      example_questions: defs.C_comm?.example_questions ?? [],
    },
    T_trouble: {
      description: extractDescription(defs.T_trouble?.description, DEFAULT_SKILL_DEFINITIONS.T_trouble.description, lang),
      example_questions: defs.T_trouble?.example_questions ?? [],
    },
    G_custom: {
      description: extractDescription(defs.G_custom?.description, DEFAULT_SKILL_DEFINITIONS.G_custom.description, lang),
      example_questions: defs.G_custom?.example_questions ?? [],
    },
  }
}

export function getWeightDescriptions(role?: JobRole, lang?: string): Record<AxisKey, WeightDescription> {
  const definitions = getSkillDefinitions(role, lang)
  const normalizedLang =
    lang?.toLowerCase().startsWith('jp') || lang?.toLowerCase().startsWith('ja')
      ? 'jp'
      : lang?.toLowerCase().startsWith('vi')
        ? 'vi'
        : 'en'

  const names: Record<AxisKey, Record<'en' | 'vi' | 'jp', string>> = {
    D: {
      en: 'Documentation (D)',
      vi: 'Tài liệu (D)',
      jp: 'ドキュメント (D)',
    },
    C: {
      en: 'Communication (C)',
      vi: 'Giao tiếp (C)',
      jp: 'コミュニケーション (C)',
    },
    T: {
      en: 'Problem Solving (T)',
      vi: 'Giải quyết vấn đề (T)',
      jp: '問題解決 (T)',
    },
    G: {
      en: 'Specialization (G)',
      vi: 'Chuyên môn (G)',
      jp: '専門スキル (G)',
    },
  }

  return {
    D: { name: names.D[normalizedLang], description: definitions.D_doc.description },
    C: { name: names.C[normalizedLang], description: definitions.C_comm.description },
    T: { name: names.T[normalizedLang], description: definitions.T_trouble.description },
    G: { name: names.G[normalizedLang], description: definitions.G_custom.description },
  }
}

export function getDefaultActiveSkill(role: JobRole): SkillKey {
  const baseline = role.baseline ?? {}
  return [...SKILL_KEYS].sort((a, b) => {
    const diff = Number(baseline[b] ?? 0) - Number(baseline[a] ?? 0)
    return diff !== 0 ? diff : SKILL_KEYS.indexOf(a) - SKILL_KEYS.indexOf(b)
  })[0]
}

export function getExampleQuestions(role: JobRole, skill: SkillKey): string[] {
  return getSkillDefinitions(role)[skill].example_questions.slice(0, 2)
}

export const SKILL_COLOR: Record<string, string> = {
  D: 'bg-blue-500',
  C: 'bg-emerald-500',
  T: 'bg-rose-500',
  G: 'bg-amber-500',
}

export const SKILL_BORDER_COLOR: Record<string, string> = {
  D: 'border-blue-200',
  C: 'border-emerald-200',
  T: 'border-rose-200',
  G: 'border-amber-200',
}

export const SKILL_TEXT_COLOR: Record<string, string> = {
  D: 'text-blue-600',
  C: 'text-emerald-600',
  T: 'text-rose-600',
  G: 'text-amber-600',
}
