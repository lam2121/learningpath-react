import { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import tmaLogo from '@/asset/image/tma_logo.png'
import { fetchJobRoles, type JobRole, type JobRoleSkillDefinitions } from '../api/onboardingApi'
import { useAuth } from '@/common/context/AuthContext'
import { devGenerateCourse, type SkillScores } from '../../dev-mode/api/devModeApi'

// ─── Dev-mode harness (docs/07 §12.9) ────────────────────────────────────────

const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true'

const SKILL_KEYS = ['D_doc', 'C_comm', 'T_trouble', 'G_custom'] as const
type SkillKey = (typeof SKILL_KEYS)[number]
type AxisKey = 'D' | 'C' | 'T' | 'G'
const SKILL_LABELS: Record<(typeof SKILL_KEYS)[number], string> = {
  D_doc: 'Documentation (D)',
  C_comm: 'Communication (C)',
  T_trouble: 'Troubleshooting (T)',
  G_custom: 'Business (G)',
}
const AXIS_TO_SKILL: Record<AxisKey, SkillKey> = {
  D: 'D_doc',
  C: 'C_comm',
  T: 'T_trouble',
  G: 'G_custom',
}
const SKILL_TO_AXIS: Record<SkillKey, AxisKey> = {
  D_doc: 'D',
  C_comm: 'C',
  T_trouble: 'T',
  G_custom: 'G',
}
const DEFAULT_SKILL_DEFINITIONS = {
  D_doc: {
    description: 'Ability to read and write clear, concise, and structured technical documentation.',
    example_questions: [],
  },
  C_comm: {
    description: 'Effective verbal and written communication in professional IT contexts.',
    example_questions: [],
  },
  T_trouble: {
    description: 'Skills in identifying, analyzing, and resolving technical issues.',
    example_questions: [],
  },
  G_custom: {
    description: 'Specific domain knowledge and expertise required for this role.',
    example_questions: [],
  },
} as const

/** Replicate backend `classify_user` (placement_evaluator.py, spec §3) for the live track preview. */
function classifyTrackPreview(skills: SkillScores): 'basic' | 'intermediate' | 'advanced' {
  const scores = SKILL_KEYS.map((k) => skills[k] / 12)
  const overall = scores.reduce((a, b) => a + b, 0) / scores.length
  const min = Math.min(...scores)
  if (overall >= 0.75 && min >= 0.5) return 'advanced'
  if (overall >= 0.75 && min < 0.5) return 'intermediate'
  if (overall >= 0.45 && overall < 0.75 && min >= 0.3) return 'intermediate'
  return 'basic'
}

// ─── Visual palette — assigned per card index ─────────────────────────────────

const ROLE_PALETTE = [
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractWeights(baseline: JobRole['baseline']): { D: number; C: number; T: number; G: number } {
  const src = baseline ?? {}
  return {
    D: Number(src.D_doc ?? 25),
    C: Number(src.C_comm ?? 25),
    T: Number(src.T_trouble ?? 25),
    G: Number(src.G_custom ?? 25),
  }
}

function getRoleDescription(role: JobRole): string {
  if (role.job_description && role.job_description.trim()) return role.job_description
  const descMap: Record<string, string> = {
    'Project Manager': 'Responsible for planning, executing, and closing IT projects while leading cross-functional teams and communicating with stakeholders.',
    'Business Analyst': 'Bridging the gap between business needs and technical solutions by gathering requirements and documenting specifications.',
    'Tech Lead': 'Providing technical leadership, guiding software architecture decisions, and mentoring team members to deliver high-quality code.',
    'Software Architect': 'Designing high-level system structures, defining technical standards, and making critical architecture decisions.',
    'QA / Tester': 'Ensuring software quality through test strategy execution, bug tracking, automated testing, and release validation.',
    'DevOps / SRE': 'Managing CI/CD pipelines, infrastructure automation, cloud deployment, system reliability, and incident response.',
    'Frontend / UI-UX': 'Creating intuitive, responsive user interfaces and engaging web applications using modern UI technologies.',
    'Data / AI Engineer': 'Building data pipelines, machine learning models, and scalable data infrastructure to enable intelligent business analytics.',
  }
  return descMap[role.name] ?? 'Responsible for technical deliverables, communication, and collaboration in software engineering projects.'
}

export type WeightDescription = {
  name: string
  description: string
}

function getSkillDefinitions(role?: JobRole) {
  const defs: Partial<JobRoleSkillDefinitions> = role?.skill_definitions ?? {}
  return {
    D_doc: {
      description: defs.D_doc?.description || DEFAULT_SKILL_DEFINITIONS.D_doc.description,
      example_questions: defs.D_doc?.example_questions ?? [],
    },
    C_comm: {
      description: defs.C_comm?.description || DEFAULT_SKILL_DEFINITIONS.C_comm.description,
      example_questions: defs.C_comm?.example_questions ?? [],
    },
    T_trouble: {
      description: defs.T_trouble?.description || DEFAULT_SKILL_DEFINITIONS.T_trouble.description,
      example_questions: defs.T_trouble?.example_questions ?? [],
    },
    G_custom: {
      description: defs.G_custom?.description || DEFAULT_SKILL_DEFINITIONS.G_custom.description,
      example_questions: defs.G_custom?.example_questions ?? [],
    },
  }
}

function getWeightDescriptions(role?: JobRole): Record<AxisKey, WeightDescription> {
  const definitions = getSkillDefinitions(role)
  return {
    D: { name: 'Documentation (D_doc)', description: definitions.D_doc.description },
    C: { name: 'Communication (C_comm)', description: definitions.C_comm.description },
    T: { name: 'Troubleshooting (T_trouble)', description: definitions.T_trouble.description },
    G: { name: 'Domain/Custom (G_custom)', description: definitions.G_custom.description },
  }
}

function getDefaultActiveSkill(role: JobRole): SkillKey {
  const baseline = role.baseline ?? {}
  return [...SKILL_KEYS].sort((a, b) => {
    const diff = Number(baseline[b] ?? 0) - Number(baseline[a] ?? 0)
    return diff !== 0 ? diff : SKILL_KEYS.indexOf(a) - SKILL_KEYS.indexOf(b)
  })[0]
}

function getExampleQuestions(role: JobRole, skill: SkillKey): string[] {
  return getSkillDefinitions(role)[skill].example_questions.slice(0, 2)
}

// ─── Skill Weight Bar ─────────────────────────────────────────────────────────

const SKILL_COLOR: Record<string, string> = {
  D: 'bg-blue-500',
  C: 'bg-emerald-500',
  T: 'bg-rose-500',
  G: 'bg-amber-500',
}

const SKILL_BORDER_COLOR: Record<string, string> = {
  D: 'border-blue-200',
  C: 'border-emerald-200',
  T: 'border-rose-200',
  G: 'border-amber-200',
}

const SKILL_TEXT_COLOR: Record<string, string> = {
  D: 'text-blue-600',
  C: 'text-emerald-600',
  T: 'text-rose-600',
  G: 'text-amber-600',
}

// ─── Skill Tooltip ────────────────────────────────────────────────────────────

function SkillTooltip({ axis, desc }: { axis: string; desc: WeightDescription }) {
  return (
    <div
      className={`
        absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2
        w-72 rounded-xl border bg-white shadow-xl p-3
        pointer-events-none
        ${SKILL_BORDER_COLOR[axis] ?? 'border-gray-200'}
      `}
    >
      {/* Arrow */}
      <div
        className={`absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent`}
        style={{ borderTopColor: 'white', filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.08))' }}
      />
      <p className={`text-[11px] font-bold uppercase tracking-wider mb-1 ${SKILL_TEXT_COLOR[axis] ?? 'text-gray-700'}`}>
        {desc.name}
      </p>
      <p className="text-[11px] text-gray-600 leading-relaxed">{desc.description}</p>
    </div>
  )
}

function SkillBar({
  axis, value, weightDescriptions, isActive, onClick
}: {
  axis: 'D' | 'C' | 'T' | 'G'
  value: number
  weightDescriptions?: Record<AxisKey, WeightDescription>
  isActive?: boolean
  onClick?: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const desc = weightDescriptions?.[axis]

  return (
    <div
      className="flex items-center gap-1.5 relative group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ cursor: onClick ? 'pointer' : desc ? 'help' : 'default' }}
      onClick={onClick}
    >
      {hovered && desc && <SkillTooltip axis={axis} desc={desc} />}
      <span
        className={`text-[10px] font-bold w-3 flex-shrink-0 select-none transition-colors duration-150 ${desc ? SKILL_TEXT_COLOR[axis] : 'text-gray-500'
          }`}
      >
        {axis}
      </span>
      <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${isActive ? 'bg-indigo-100 ring-1 ring-indigo-200' : 'bg-gray-100'}`}>
        <div
          className={`h-full rounded-full transition-all duration-700 ${SKILL_COLOR[axis]}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className={`text-[10px] font-semibold w-7 text-right ${isActive ? 'text-indigo-600' : 'text-gray-600'}`}>{value}%</span>
    </div>
  )
}


// ─── Role Card Component ───────────────────────────────────────────────────────

interface RoleCardItemProps {
  role: JobRole
  paletteIdx: number
  isSelected: boolean
  isHovered: boolean
  onSelect: () => void
  onHover: () => void
  onLeave: () => void
}

function RoleCardItem({ role, paletteIdx, isSelected, isHovered, onSelect, onHover, onLeave }: RoleCardItemProps) {
  const palette = ROLE_PALETTE[paletteIdx % ROLE_PALETTE.length]

  return (
    <div
      id={`role-card-${role.id}`}
      onClick={onSelect}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className={`
        relative cursor-pointer rounded-xl border-2 p-3 sm:p-4 2xl:p-5 transition-all duration-200 select-none bg-white
        ${isSelected
          ? 'border-indigo-500 bg-indigo-50/30 shadow-md scale-[1.02]'
          : isHovered
            ? 'border-gray-300 shadow-sm scale-[1.01]'
            : 'border-gray-100 hover:border-gray-300'
        }
      `}
    >
      <div className="flex items-center gap-3 pr-4">
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${palette.color} flex items-center justify-center text-xl shadow-sm flex-shrink-0`}>
          {palette.icon}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className={`font-bold text-sm leading-tight truncate ${isSelected ? 'text-indigo-600' : 'text-gray-900'}`}>{role.name}</h3>
          <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${isSelected ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
            Career Track
          </span>
        </div>
      </div>
      
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-1/2 right-4 -translate-y-1/2">
           <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
           </svg>
        </div>
      )}
    </div>
  )
}

// ─── Legend Component ─────────────────────────────────────────────────────────

function SkillLegend({
  weightDescriptions,
  activeSkill,
  onSkillClick,
}: {
  weightDescriptions?: Record<AxisKey, WeightDescription>
  activeSkill?: SkillKey
  onSkillClick?: (skill: SkillKey) => void
}) {
  const items = [
    { key: 'D', label: 'Documentation (D_doc)', color: 'bg-blue-500' },
    { key: 'C', label: 'Communication (C_comm)', color: 'bg-emerald-500' },
    { key: 'T', label: 'Troubleshooting (T_trouble)', color: 'bg-rose-500' },
    { key: 'G', label: 'Domain/Custom (G_custom)', color: 'bg-amber-500' },
  ] as const
  const [hoveredKey, setHoveredKey] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-3">
      {items.map(({ key, label, color }) => {
        const desc = weightDescriptions?.[key]
        const isHov = hoveredKey === key
        const isActive = activeSkill === AXIS_TO_SKILL[key as AxisKey]
        return (
          <div
            key={key}
            className={`flex items-start gap-2.5 relative rounded-lg px-2 py-1.5 transition-colors ${desc ? 'cursor-pointer' : ''} ${isActive ? 'bg-indigo-50' : ''}`}
            onMouseEnter={() => desc && setHoveredKey(key)}
            onMouseLeave={() => setHoveredKey(null)}
            onClick={() => onSkillClick?.(AXIS_TO_SKILL[key as AxisKey])}
          >
            {isHov && desc && <SkillTooltip axis={key} desc={desc} />}
            <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-0.5 transition-transform duration-150 ${color} ${isHov && desc ? 'scale-125' : ''}`} />
            <span className={`text-sm leading-tight transition-colors duration-150 ${(isHov || isActive) && desc ? SKILL_TEXT_COLOR[key as AxisKey] + ' font-semibold' : 'text-gray-600'}`}>
              {label}
            </span>
          </div>
        )
      })}
    </div>
  )
}


// ─── Main Component ───────────────────────────────────────────────────────────

// ─── Warning Confirmation Modal ───────────────────────────────────────────────

function ConfirmRoleModal({
  roleName,
  devMode,
  onDevModeChange,
  onConfirm,
  onSetScores,
  onCancel,
}: {
  roleName: string
  devMode: boolean
  onDevModeChange: (v: boolean) => void
  onConfirm: () => void
  onSetScores: () => void
  onCancel: () => void
}) {
  return (
    <div
      id="modal-confirm-role-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div
        id="modal-confirm-role-dialog"
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in zoom-in-95 fade-in duration-200"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-400 to-orange-500 px-6 pt-6 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center text-2xl flex-shrink-0">
              ⚠️
            </div>
            <div>
              <h2 className="text-white font-bold text-lg leading-tight">Before You Continue</h2>
              <p className="text-white/80 text-xs mt-0.5">Please read this carefully</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-3">
          <p className="text-gray-800 text-sm leading-relaxed">
            You are about to start the <span className="font-bold text-indigo-700">Placement Test</span> for the
            <span className="font-bold text-orange-600"> {roleName}</span> career track.
          </p>
          <ul className="space-y-2">
            {[
              { icon: '🎯', text: 'The test will assess your current IT English proficiency.' },
              { icon: '⏱️', text: 'Once started, you should complete it without interruption.' },
              { icon: '🔒', text: 'Your career track cannot be changed until the test is completed.' },
            ].map(({ icon, text }) => (
              <li key={text} className="flex items-start gap-2.5 text-xs text-gray-600 leading-relaxed">
                <span className="text-base flex-shrink-0 mt-0.5">{icon}</span>
                <span>{text}</span>
              </li>
            ))}
          </ul>
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
            <p className="text-amber-800 text-xs font-medium leading-relaxed">
              Are you ready to proceed with <span className="font-bold">{roleName}</span>?
            </p>
          </div>
          {DEV_MODE && (
            <label className="flex items-start gap-2.5 rounded-xl border border-indigo-200 bg-indigo-50/60 px-4 py-3 cursor-pointer">
              <input
                type="checkbox"
                checked={devMode}
                onChange={(e) => onDevModeChange(e.target.checked)}
                className="mt-0.5 size-4 accent-indigo-600"
              />
              <span className="text-xs text-indigo-800 leading-relaxed">
                <span className="font-bold">Developer mode</span> — skip the placement test and set
                skill scores manually to build the course roadmap.
              </span>
            </label>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            id="modal-btn-cancel"
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 cursor-pointer"
          >
            Go Back
          </button>
          {devMode ? (
            <button
              id="modal-btn-set-scores"
              type="button"
              onClick={onSetScores}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-sm shadow-md shadow-indigo-200 hover:shadow-lg transition-all duration-200 active:scale-[0.98] cursor-pointer"
            >
              Set skill scores →
            </button>
          ) : (
            <button
              id="modal-btn-confirm"
              type="button"
              onClick={onConfirm}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-sm shadow-md shadow-indigo-200 hover:shadow-lg transition-all duration-200 active:scale-[0.98] cursor-pointer"
            >
              Yes, Proceed →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Deactivated Track Warning Modal ───────────────────────────────────────────

function InactiveRoleModal({
  roleName,
  onClose,
}: {
  roleName: string
  onClose: () => void
}) {
  return (
    <div
      id="modal-inactive-role-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        id="modal-inactive-role-dialog"
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in zoom-in-95 fade-in duration-200"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-500 to-slate-700 px-6 pt-6 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center text-2xl flex-shrink-0">
              🚫
            </div>
            <div>
              <h2 className="text-white font-bold text-lg leading-tight">Track Not Available</h2>
              <p className="text-white/80 text-xs mt-0.5">This career track is deactivated</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-3">
          <p className="text-gray-800 text-sm leading-relaxed">
            <span className="font-bold text-gray-900">{roleName}</span> is currently
            <span className="font-bold text-slate-600"> deactivated</span> and is not accepting new learners.
          </p>
          <ul className="space-y-2">
            {[
              { icon: '📚', text: 'Existing learners already on this track can continue their course.' },
              { icon: '👥', text: 'New learners should pick a different active career track.' },
              { icon: '🛠️', text: 'Contact your administrator if you believe this is a mistake.' },
            ].map(({ icon, text }) => (
              <li key={text} className="flex items-start gap-2.5 text-xs text-gray-600 leading-relaxed">
                <span className="text-base flex-shrink-0 mt-0.5">{icon}</span>
                <span>{text}</span>
              </li>
            ))}
          </ul>
          <div className="rounded-xl bg-slate-100 border border-slate-200 px-4 py-3">
            <p className="text-slate-700 text-xs font-medium leading-relaxed">
              Please select an active track to start your placement test.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            id="modal-inactive-btn-close"
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Dev-mode Skill Score Panel (docs/07 §12.9) ─────────────────────────────

function DevSkillPanel({
  skills,
  onSkillsChange,
  onGenerate,
  onCancel,
  isGenerating,
}: {
  skills: SkillScores
  onSkillsChange: (skills: SkillScores) => void
  onGenerate: () => void
  onCancel: () => void
  isGenerating: boolean
}) {
  const track = classifyTrackPreview(skills)
  const trackStyles: Record<string, { label: string; color: string; badge: string }> = {
    basic: { label: 'Basic Track', color: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    intermediate: { label: 'Intermediate Track', color: 'text-indigo-700', badge: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
    advanced: { label: 'Advanced Track', color: 'text-violet-700', badge: 'bg-violet-100 text-violet-700 border-violet-200' },
  }
  const style = trackStyles[track]

  return (
    <div
      id="modal-dev-panel-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget && !isGenerating) onCancel() }}
    >
      <div
        id="modal-dev-panel-dialog"
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in zoom-in-95 fade-in duration-200"
      >
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 pt-6 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center text-2xl flex-shrink-0">
              🧪
            </div>
            <div>
              <h2 className="text-white font-bold text-lg leading-tight">Developer Mode</h2>
              <p className="text-white/80 text-xs mt-0.5">Set skill scores (0–12) to build the roadmap</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          {SKILL_KEYS.map((key) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-gray-700">{SKILL_LABELS[key]}</label>
                <span className="text-sm font-bold text-indigo-700">{skills[key]}/12</span>
              </div>
              <input
                type="range"
                min={0}
                max={12}
                step={1}
                value={skills[key]}
                onChange={(e) => onSkillsChange({ ...skills, [key]: Number(e.target.value) })}
                className="w-full accent-indigo-600 cursor-pointer"
                disabled={isGenerating}
              />
            </div>
          ))}

          <div className={`rounded-xl border px-4 py-3 ${style.badge}`}>
            <p className="text-xs font-bold uppercase tracking-wide">Track preview</p>
            <p className={`text-sm font-bold mt-0.5 ${style.color}`}>{style.label}</p>
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button
            id="modal-dev-btn-cancel"
            type="button"
            onClick={onCancel}
            disabled={isGenerating}
            className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            id="modal-dev-btn-generate"
            type="button"
            onClick={onGenerate}
            disabled={isGenerating}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-sm shadow-md shadow-indigo-200 hover:shadow-lg transition-all duration-200 active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            {isGenerating ? 'Building course…' : 'Generate Course'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function RoleSelectionGrid() {
  const [roles, setRoles] = useState<JobRole[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null)
  const [activeSkill, setActiveSkill] = useState<SkillKey>('D_doc')
  const [hoveredRoleId, setHoveredRoleId] = useState<number | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showInactiveModal, setShowInactiveModal] = useState(false)
  const [devMode, setDevMode] = useState(false)
  const [showDevPanel, setShowDevPanel] = useState(false)
  const [devSkills, setDevSkills] = useState<SkillScores>({
    D_doc: 6,
    C_comm: 6,
    T_trouble: 6,
    G_custom: 6,
  })
  const [isGeneratingCourse, setIsGeneratingCourse] = useState(false)
  const navigate = useNavigate()
  const { logout } = useAuth()

  useEffect(() => {
    fetchJobRoles()
      .then(setRoles)
      .catch(err => setError(err.message ?? 'Unable to load role list.'))
      .finally(() => setIsLoading(false))
  }, [])

  const selectedRole = roles.find(r => r.id === selectedRoleId) ?? null

  useEffect(() => {
    if (selectedRole) {
      setActiveSkill(getDefaultActiveSkill(selectedRole))
    }
  }, [selectedRoleId, selectedRole])

  function handleContinueClick() {
    if (!selectedRoleId) return
    if (selectedRole?.is_active === false) {
      setShowInactiveModal(true)
      return
    }
    setShowConfirmModal(true)
  }

  function handleConfirm() {
    if (!selectedRoleId) return
    setShowConfirmModal(false)
    localStorage.removeItem('pending_survey_answers')
    localStorage.setItem('pending_role_id', selectedRoleId.toString())
    navigate({ to: '/placement-test' })
  }

  async function handleDevGenerate() {
    if (!selectedRoleId) return
    setIsGeneratingCourse(true)
    try {
      await devGenerateCourse(selectedRoleId, devSkills)
      setShowDevPanel(false)
      setShowConfirmModal(false)
      navigate({ to: '/dev-course-demo' })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to build the course.'
      alert(message)
    } finally {
      setIsGeneratingCourse(false)
    }
  }

  function handleLogout() {
    logout()
    navigate({ to: '/login' })
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Warning Confirmation Modal */}
      {showConfirmModal && selectedRole && (
        <ConfirmRoleModal
          roleName={selectedRole.name}
          devMode={devMode}
          onDevModeChange={setDevMode}
          onConfirm={handleConfirm}
          onSetScores={() => { setShowConfirmModal(false); setShowDevPanel(true) }}
          onCancel={() => setShowConfirmModal(false)}
        />
      )}

      {/* Deactivated Track Modal */}
      {showInactiveModal && selectedRole && (
        <InactiveRoleModal
          roleName={selectedRole.name}
          onClose={() => setShowInactiveModal(false)}
        />
      )}

      {/* Developer-mode Skill Score Panel */}
      {showDevPanel && (
        <DevSkillPanel
          skills={devSkills}
          onSkillsChange={setDevSkills}
          onGenerate={handleDevGenerate}
          onCancel={() => { setShowDevPanel(false); setShowConfirmModal(true) }}
          isGenerating={isGeneratingCourse}
        />
      )}
      {/* Top Header Bar */}
      <header className="w-full bg-[#0072FF] px-6 py-3.5 flex items-center justify-between shadow-md sticky top-0 z-30">
        <img src={tmaLogo} alt="TMA Solutions" className="h-9 w-auto" />
        <button
          id="btn-logout-role-selection"
          type="button"
          onClick={handleLogout}
          className="px-4 py-1.5 rounded-full border border-white/40 text-white hover:bg-white/10 transition-colors text-sm font-medium flex items-center gap-2 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Log out</span>
        </button>
      </header>

      {/* Main Content */}
      <div className="flex-1 w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-10">
        {/* Page Header */}
        <div className="text-center mb-10">
          {/* Step indicator */}
          <div className="flex items-center justify-center mb-6">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${step === 1
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                      : 'bg-gray-100 text-gray-400 border border-gray-200'
                    }`}
                >
                  {step}
                </div>
                {step < 3 && <div className="w-10 h-0.5 bg-gray-200 mx-2 rounded-full" />}
              </div>
            ))}
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-sm font-medium mb-4">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            Step 1 / 3 — Choose Your Career Track
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl 2xl:text-6xl font-extrabold text-gray-900 leading-tight mb-3">
            What role are you currently in
            <span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 bg-clip-text text-transparent mt-1">
              at TMA?
            </span>
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            The system will build a personalized IT English learning path based on the
            <span className="font-semibold text-gray-900"> D/C/T/G skill weights</span> specific to each career track.
          </p>


        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 text-sm">Loading career tracks...</p>
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div className="max-w-lg mx-auto text-center py-16">
            <p className="text-rose-600 font-semibold text-lg mb-2">Unable to load data</p>
            <p className="text-gray-600 text-sm">{error}</p>
            <button
              onClick={() => {
                setError(null)
                setIsLoading(true)
                fetchJobRoles()
                  .then(setRoles)
                  .catch(e => setError(e.message))
                  .finally(() => setIsLoading(false))
              }}
              className="mt-4 px-5 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Main Content Split View */}
        {!isLoading && !error && (
          <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
            
            {/* Left Panel: Role List */}
            <div className="w-full lg:w-1/3 2xl:w-2/5 flex flex-col gap-3 lg:max-h-[70vh] lg:overflow-y-auto pr-1">
              {roles.map((role, idx) => (
                <RoleCardItem
                  key={role.id}
                  role={role}
                  paletteIdx={idx}
                  isSelected={selectedRoleId === role.id}
                  isHovered={hoveredRoleId === role.id}
                  onSelect={() => setSelectedRoleId(role.id)}
                  onHover={() => setHoveredRoleId(role.id)}
                  onLeave={() => setHoveredRoleId(null)}
                />
              ))}
            </div>

            {/* Right Panel: Role Details */}
            <div className="w-full lg:w-2/3 2xl:w-3/5">
              {selectedRole ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6 sm:p-8 2xl:p-10 animate-in fade-in zoom-in-95 duration-200">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <h2 className="text-2xl font-bold text-gray-900">{selectedRole.name}</h2>
                    <button
                      id="btn-confirm-role"
                      onClick={handleContinueClick}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold shadow-md transition-all duration-200 active:scale-[0.98] flex items-center gap-2 whitespace-nowrap"
                    >
                      <span>Continue with {selectedRole.name}</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Two column details layout */}
                  <div className="flex flex-col md:flex-row gap-8 2xl:gap-12">
                     {/* Left column in details */}
                     <div className="w-full md:w-1/2 space-y-6">
                        <div>
                           <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 border-b pb-2">Job Description</h3>
                           <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                             {getRoleDescription(selectedRole)}
                           </p>
                        </div>
                        
                        <div className="pt-2">
                           <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 border-b pb-2">Skill Overview</h3>
                           <SkillLegend
                             weightDescriptions={getWeightDescriptions(selectedRole)}
                             activeSkill={activeSkill}
                             onSkillClick={setActiveSkill}
                           />
                           <p className="text-[11px] text-gray-400 mt-3 italic">
                              Click a skill to see its role-specific details and examples.
                           </p>
                         </div>

                      </div>
                      
                      {/* Right column in details */}
                     <div className="w-full md:w-1/2 space-y-6">
                        <div>
                          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 border-b pb-2">Skill Weights</h3>
                          <div className="space-y-3 mt-4">
                            {(() => {
                               const weights = extractWeights(selectedRole.baseline)
                               const weightDescriptions = getWeightDescriptions(selectedRole)
                               return (
                                 <>
                                   <SkillBar axis="D" value={weights.D} weightDescriptions={weightDescriptions} isActive={activeSkill === 'D_doc'} onClick={() => setActiveSkill('D_doc')} />
                                   <SkillBar axis="C" value={weights.C} weightDescriptions={weightDescriptions} isActive={activeSkill === 'C_comm'} onClick={() => setActiveSkill('C_comm')} />
                                   <SkillBar axis="T" value={weights.T} weightDescriptions={weightDescriptions} isActive={activeSkill === 'T_trouble'} onClick={() => setActiveSkill('T_trouble')} />
                                   <SkillBar axis="G" value={weights.G} weightDescriptions={weightDescriptions} isActive={activeSkill === 'G_custom'} onClick={() => setActiveSkill('G_custom')} />
                                 </>
                               )
                            })()}
                          </div>
                        </div>

                        <div>
                           <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 border-b pb-2">
                             Example Questions
                           </h3>
                           {(() => {
                              const exampleQs = getExampleQuestions(selectedRole, activeSkill)
                              const activeDescription = getWeightDescriptions(selectedRole)[SKILL_TO_AXIS[activeSkill]]
                              return (
                                 <ul className="space-y-3 mt-4">
                                   <li className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                                     {activeDescription.name}
                                   </li>
                                   {exampleQs.length > 0
                                     ? exampleQs.map((q, i) => (
                                         <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700 leading-snug bg-gray-50 p-3 rounded-xl border border-gray-100">
                                           <span className="font-bold text-indigo-500 flex-shrink-0 mt-0.5">Q{i + 1}.</span>
                                           <span>{q}</span>
                                         </li>
                                       ))
                                     : (
                                         <li className="text-sm text-gray-500 italic">
                                           No example questions available for this skill yet.
                                         </li>
                                       )
                                   }
                                 </ul>
                              )
                           })()}
                        </div>
                     </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50/80 rounded-2xl border border-dashed border-gray-300 p-12 text-center h-full flex flex-col items-center justify-center min-h-[400px]">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                     <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                     </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Select a Career Track</h3>
                  <p className="text-gray-500 text-sm max-w-sm">
                    Choose a role from the list on the left to view its detailed requirements and skill weights.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Hint when nothing selected */}
        {!isLoading && !error && !selectedRole && (
          <div className="text-center mt-4">
            <p className="text-sm text-gray-400 animate-pulse">
              Select a Career Track to begin your IT English learning journey
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
