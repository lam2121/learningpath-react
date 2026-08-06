import { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import tmaLogo from '@/asset/image/tma_logo.png'
import { fetchJobRoles, type JobRole, type SeedTierItem, type WeightDescription } from '../api/onboardingApi'
import { useAuth } from '@/common/context/AuthContext'

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

function extractWeights(init_weights: JobRole['init_weights']): { D: number; C: number; T: number; G: number } {
  const src = (init_weights as any)?.Basic ?? init_weights ?? {}
  return {
    D: Number(src.D ?? src.D_doc ?? 25),
    C: Number(src.C ?? src.C_comm ?? 25),
    T: Number(src.T ?? src.T_trouble ?? 25),
    G: Number(src.G ?? src.G_biz ?? 25),
  }
}

function getExampleQuestions(example_question: string[]): string[] {
  return Array.isArray(example_question) ? example_question.slice(0, 2) : []
}

function getSeedTiers(seed_tier: SeedTierItem[]): Map<number, string[]> {
  const map = new Map<number, string[]>()
  if (!Array.isArray(seed_tier)) return map
  for (const item of seed_tier) {
    const list = map.get(item.tier) ?? []
    list.push(item.name)
    map.set(item.tier, list)
  }
  return map
}

function getRoleDescription(role: JobRole): string {
  if (role.JD && role.JD.trim()) return role.JD
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
  axis, value, weightDescriptions
}: {
  axis: 'D' | 'C' | 'T' | 'G'
  value: number
  weightDescriptions?: Record<string, WeightDescription>
}) {
  const [hovered, setHovered] = useState(false)
  const desc = weightDescriptions?.[axis]

  return (
    <div
      className="flex items-center gap-1.5 relative group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ cursor: desc ? 'help' : 'default' }}
    >
      {hovered && desc && <SkillTooltip axis={axis} desc={desc} />}
      <span
        className={`text-[10px] font-bold w-3 flex-shrink-0 select-none transition-colors duration-150 ${
          desc ? SKILL_TEXT_COLOR[axis] : 'text-gray-500'
        }`}
      >
        {axis}
      </span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${SKILL_COLOR[axis]}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-[10px] font-semibold text-gray-600 w-7 text-right">{value}%</span>
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
  const description = getRoleDescription(role)

  return (
    <div
      id={`role-card-${role.id}`}
      onClick={onSelect}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className={`
        relative cursor-pointer rounded-2xl border-2 p-5 transition-all duration-300 select-none bg-white
        ${isSelected
          ? 'border-indigo-500 shadow-lg shadow-indigo-100 scale-[1.02]'
          : isHovered
            ? 'border-gray-300 shadow-md scale-[1.01]'
            : 'border-gray-200 shadow-sm hover:border-gray-300'
        }
      `}
    >
      {/* Selection checkmark */}
      {isSelected && (
        <div className="absolute top-4 right-4 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center shadow-md animate-in zoom-in-50 duration-200">
          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      {/* Card Header */}
      <div className="flex items-start gap-3 mb-3 pr-6">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${palette.color} flex items-center justify-center text-2xl shadow-sm flex-shrink-0`}>
          {palette.icon}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-gray-900 text-sm leading-tight">{role.name}</h3>
          <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-semibold">
            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            Career Track
          </span>
        </div>
      </div>

      {/* Job Description */}
      <p className="text-xs text-gray-600 leading-relaxed mb-3">
        {description}
      </p>

      {/* Seed Tiers */}
      {Array.isArray(role.seed_tier) && role.seed_tier.length > 0 && (() => {
        const tierMap = getSeedTiers(role.seed_tier)
        const tierEntries = Array.from(tierMap.entries()).sort(([a], [b]) => a - b)
        const tierColors: Record<number, { badge: string; dot: string }> = {
          1: { badge: 'bg-indigo-50 text-indigo-700 border border-indigo-100', dot: 'bg-indigo-400' },
          2: { badge: 'bg-amber-50 text-amber-700 border border-amber-100', dot: 'bg-amber-400' },
          3: { badge: 'bg-rose-50 text-rose-700 border border-rose-100', dot: 'bg-rose-400' },
        }
        return (
          <div className="space-y-1.5">
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Practice Scenarios</p>
            {tierEntries.map(([tier, names]) => {
              const colors = tierColors[tier] ?? { badge: 'bg-gray-50 text-gray-600 border border-gray-100', dot: 'bg-gray-400' }
              return (
                <div key={tier} className="flex items-start gap-1.5">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide w-8 flex-shrink-0 pt-0.5">T{tier}</span>
                  <div className="flex flex-wrap gap-1">
                    {names.map(name => (
                      <span
                        key={name}
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${colors.badge}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${colors.dot}`} />
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )
      })()}
    </div>
  )
}

// ─── Legend Component ─────────────────────────────────────────────────────────

function SkillLegend({ weightDescriptions }: { weightDescriptions?: Record<string, WeightDescription> }) {
  const items = [
    { key: 'D', label: 'Documentation (D_doc)', color: 'bg-blue-500' },
    { key: 'C', label: 'Communication (C_comm)', color: 'bg-emerald-500' },
    { key: 'T', label: 'Troubleshooting (T_trouble)', color: 'bg-rose-500' },
    { key: 'G', label: 'Business (G_biz)', color: 'bg-amber-500' },
  ]
  const [hoveredKey, setHoveredKey] = useState<string | null>(null)

  return (
    <div className="flex flex-wrap justify-center gap-4">
      {items.map(({ key, label, color }) => {
        const desc = weightDescriptions?.[key]
        const isHov = hoveredKey === key
        return (
          <div
            key={key}
            className={`flex items-center gap-1.5 relative ${desc ? 'cursor-help' : ''}`}
            onMouseEnter={() => desc && setHoveredKey(key)}
            onMouseLeave={() => setHoveredKey(null)}
          >
            {isHov && desc && <SkillTooltip axis={key} desc={desc} />}
            <div className={`w-2.5 h-2.5 rounded-full transition-transform duration-150 ${color} ${isHov && desc ? 'scale-125' : ''}`} />
            <span className={`text-xs transition-colors duration-150 ${isHov && desc ? SKILL_TEXT_COLOR[key] + ' font-semibold' : 'text-gray-600'}`}>
              {label}
            </span>
          </div>
        )
      })}
    </div>
  )
}


// ─── Main Component ───────────────────────────────────────────────────────────

export function RoleSelectionGrid() {
  const [roles, setRoles] = useState<JobRole[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null)
  const [hoveredRoleId, setHoveredRoleId] = useState<number | null>(null)
  const navigate = useNavigate()
  const { logout } = useAuth()

  useEffect(() => {
    fetchJobRoles()
      .then(setRoles)
      .catch(err => setError(err.message ?? 'Unable to load role list.'))
      .finally(() => setIsLoading(false))
  }, [])

  const selectedRole = roles.find(r => r.id === selectedRoleId) ?? null

  function handleConfirm() {
    if (!selectedRoleId) return
    localStorage.removeItem('pending_survey_answers')
    localStorage.setItem('pending_role_id', selectedRoleId.toString())
    navigate({ to: '/placement-test' })
  }

  function handleLogout() {
    logout()
    navigate({ to: '/login' })
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
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
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Page Header */}
        <div className="text-center mb-10">
          {/* Step indicator */}
          <div className="flex items-center justify-center mb-6">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    step === 1
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                      : 'bg-gray-100 text-gray-400 border border-gray-200'
                  }`}
                >
                  {step}
                </div>
                {step < 4 && <div className="w-10 h-0.5 bg-gray-200 mx-2 rounded-full" />}
              </div>
            ))}
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-sm font-medium mb-4">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            Step 1 / 4 — Choose Your Career Track
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight mb-3">
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

        {/* Role Grid */}
        {!isLoading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
            {roles.map((role, idx) => (
              <RoleCardItem
                key={role.id}
                role={role}
                paletteIdx={idx}
                isSelected={selectedRoleId === role.id}
                isHovered={hoveredRoleId === role.id}
                onSelect={() => setSelectedRoleId(prev => prev === role.id ? null : role.id)}
                onHover={() => setHoveredRoleId(role.id)}
                onLeave={() => setHoveredRoleId(null)}
              />
            ))}
          </div>
        )}

        {/* Selection CTA — appears when a role is selected */}
        {!isLoading && !error && (
          <div
            className={`transition-all duration-500 ${
              selectedRole ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
            }`}
          >
            <div className="max-w-3xl mx-auto">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-xl shadow-indigo-100/50 p-6">
                {/* Continue button */}
                <button
                  id="btn-confirm-role"
                  onClick={handleConfirm}
                  disabled={!selectedRoleId}
                  className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-base shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-200 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none active:scale-[0.98] flex items-center justify-center gap-2.5"
                >
                  <span>Continue with {selectedRole?.name ?? 'selected role'}</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>

                <p className="text-center text-xs text-gray-400 mt-3 mb-5">
                  You can change your Career Track later in Settings
                </p>
                <div className="mt-5">
                  <SkillLegend weightDescriptions={selectedRole?.weight_descriptions} />
                </div>
                {/* Skill Weights + Example Questions — below the button */}
                {selectedRole && (() => {
                  const paletteIdx = roles.findIndex(r => r.id === selectedRole.id)
                  const palette = ROLE_PALETTE[paletteIdx % ROLE_PALETTE.length]
                  const weights = extractWeights(selectedRole.init_weights)
                  const exampleQs = getExampleQuestions(selectedRole.example_question)
                  return (
                    <div className="space-y-4 pt-4 border-t border-gray-100 animate-in fade-in duration-200">
                      {/* Skill Weights */}
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Skill Weights</p>
                        <SkillBar axis="D" value={weights.D} weightDescriptions={selectedRole.weight_descriptions} />
                        <SkillBar axis="C" value={weights.C} weightDescriptions={selectedRole.weight_descriptions} />
                        <SkillBar axis="T" value={weights.T} weightDescriptions={selectedRole.weight_descriptions} />
                        <SkillBar axis="G" value={weights.G} weightDescriptions={selectedRole.weight_descriptions} />
                      </div>

                      {/* Example Questions */}
                      <div className={`rounded-xl p-3 bg-gradient-to-br ${palette.gradient} border border-white/60`}>
                        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                          <span>💬</span>
                          <span>Example Questions</span>
                        </p>
                        <ul className="space-y-1.5">
                          {exampleQs.length > 0
                            ? exampleQs.map((q, i) => (
                                <li key={i} className="flex items-start gap-1.5 text-[11px] text-gray-700 leading-snug">
                                  <span className="mt-0.5 text-[10px] font-bold text-indigo-500 flex-shrink-0">Q{i + 1}</span>
                                  <span>{q}</span>
                                </li>
                              ))
                            : (
                                <li className="text-[11px] text-gray-500 italic">No example questions available.</li>
                              )
                          }
                        </ul>
                      </div>
                    </div>
                  )
                })()}
              </div>
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
