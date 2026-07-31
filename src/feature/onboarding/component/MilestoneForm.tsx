import { useState, useEffect, useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'
import tmaLogo from '@/asset/image/tma_logo.png'
import bannerBg from '@/asset/image/banner_background.png'

// ─── Types & Constants ────────────────────────────────────────────────────────

type MilestoneLevel = 'basic' | 'intermediate' | 'advanced'
type RoleId =
  | 'pm' | 'ba' | 'tech-lead' | 'sa' | 'qa' | 'devops' | 'frontend' | 'data-ai'

interface RoleInfo {
  id: RoleId
  label: string
  icon: string
  weights: { D: number; C: number; T: number; G: number }
}

// Roles with baseline D/C/T/G weights (sum = 100)
const ROLES: RoleInfo[] = [
  { id: 'pm',        label: 'Project Manager',         icon: '🎯', weights: { D: 20, C: 50, T: 10, G: 20 } },
  { id: 'ba',        label: 'Business Analyst',         icon: '📊', weights: { D: 35, C: 45, T:  5, G: 15 } },
  { id: 'tech-lead', label: 'Tech Lead',                icon: '⚡', weights: { D: 20, C: 40, T: 30, G: 10 } },
  { id: 'sa',        label: 'Software Architect',       icon: '🏗️', weights: { D: 40, C: 30, T: 20, G: 10 } },
  { id: 'qa',        label: 'QA / Tester',             icon: '🔍', weights: { D: 35, C: 25, T: 30, G: 10 } },
  { id: 'devops',    label: 'DevOps / SRE',            icon: '🛠️', weights: { D: 25, C: 15, T: 50, G: 10 } },
  { id: 'frontend',  label: 'Frontend / UI-UX',         icon: '🎨', weights: { D: 20, C: 40, T: 30, G: 10 } },
  { id: 'data-ai',   label: 'Data / AI Engineer',       icon: '🤖', weights: { D: 30, C: 20, T: 40, G: 10 } },
]

// Milestone levels — multiplier applied to weights to get target D/C/T/G points (out of 100)
const MILESTONE_CONFIG: Record<MilestoneLevel, {
  label: string
  sublabel: string
  multiplier: number // total budget points = 100 × multiplier (proportionally distributed)
  totalBudget: number
  color: string
  border: string
  glow: string
  tag: string
  tagColor: string
  hours: number    // estimated study hours to complete
  icon: string
  desc: string
}> = {
  basic: {
    label: 'Basic',
    sublabel: 'Communication Foundation',
    multiplier: 0.60,
    totalBudget: 60,
    color: 'from-sky-400 to-blue-500',
    border: 'border-sky-400/60',
    glow: 'shadow-sky-400/20',
    tag: 'Getting Started',
    tagColor: 'bg-sky-500/20 text-sky-300 border-sky-400/30',
    hours: 48,
    icon: '🌱',
    desc: 'Build essential IT communication foundation — emails, basic meetings, status reports.',
  },
  intermediate: {
    label: 'Intermediate',
    sublabel: 'Proactive Communication',
    multiplier: 0.78,
    totalBudget: 78,
    color: 'from-violet-400 to-indigo-500',
    border: 'border-violet-400/60',
    glow: 'shadow-violet-400/20',
    tag: 'Most Popular',
    tagColor: 'bg-violet-500/20 text-violet-300 border-violet-400/30',
    hours: 96,
    icon: '🚀',
    desc: 'Confidently present solutions, handle Q&A, and write professional technical documentation.',
  },
  advanced: {
    label: 'Advanced',
    sublabel: 'Expert Communication',
    multiplier: 0.95,
    totalBudget: 95,
    color: 'from-amber-400 to-orange-500',
    border: 'border-amber-400/60',
    glow: 'shadow-amber-400/20',
    tag: 'High Challenge',
    tagColor: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
    hours: 144,
    icon: '👑',
    desc: 'Negotiation, strategic pitching, crisis management, and persuading C-level executives.',
  },
}

const AXIS_META = [
  { key: 'D' as const, label: 'Documentation', color: 'bg-blue-400',    track: 'bg-blue-400/20',  text: 'text-blue-300' },
  { key: 'C' as const, label: 'Communication', color: 'bg-emerald-400', track: 'bg-emerald-400/20', text: 'text-emerald-300' },
  { key: 'T' as const, label: 'Troubleshooting', color: 'bg-rose-400',    track: 'bg-rose-400/20',   text: 'text-rose-300' },
  { key: 'G' as const, label: 'Commercial', color: 'bg-amber-400', track: 'bg-amber-400/20',  text: 'text-amber-300' },
]

// Compute D/C/T/G targets for a given role + level
function computeTargets(
  role: RoleInfo,
  level: MilestoneLevel
): { D: number; C: number; T: number; G: number } {
  const { totalBudget } = MILESTONE_CONFIG[level]
  return {
    D: Math.round((role.weights.D / 100) * totalBudget),
    C: Math.round((role.weights.C / 100) * totalBudget),
    T: Math.round((role.weights.T / 100) * totalBudget),
    G: Math.round((role.weights.G / 100) * totalBudget),
  }
}

// Compute ETA in weeks
function computeETA(level: MilestoneLevel, hoursPerWeek: number): number {
  const totalHours = MILESTONE_CONFIG[level].hours
  return Math.ceil(totalHours / hoursPerWeek)
}

// ─── Animated Counter ─────────────────────────────────────────────────────────

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(value)
  const prevRef = useRef(value)

  useEffect(() => {
    if (prevRef.current === value) return
    const start = prevRef.current
    const end = value
    const diff = end - start
    const duration = 350
    const startTime = performance.now()

    function tick(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      setDisplay(Math.round(start + diff * eased))
      if (progress < 1) requestAnimationFrame(tick)
      else prevRef.current = end
    }
    requestAnimationFrame(tick)
  }, [value])

  return <>{display}</>
}

// ─── Warning Modal ────────────────────────────────────────────────────────────

function WarningModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />
      {/* Dialog */}
      <div className="relative z-10 bg-gray-900/95 border border-white/20 rounded-2xl p-7 max-w-sm w-full shadow-2xl animate-in zoom-in-90 fade-in duration-200">
        <div className="flex items-center justify-center w-14 h-14 mx-auto mb-4 rounded-full bg-amber-500/15 border border-amber-400/30">
          <span className="text-2xl">⚠️</span>
        </div>
        <h3 className="text-lg font-bold text-white text-center mb-2">
          Changing Goal will RESET Progress
        </h3>
        <p className="text-sm text-white/60 text-center mb-6 leading-relaxed">
          Changing your Milestone will reset all your current learning progress and regenerate the course from scratch. 
          <span className="text-amber-300 font-medium"> Are you sure you want to continue?</span>
        </p>
        <div className="flex gap-3">
          <button
            id="btn-modal-cancel"
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl border border-white/20 text-white/70 hover:bg-white/10 hover:text-white transition-all duration-200 font-medium text-sm"
          >
            Cancel
          </button>
          <button
            id="btn-modal-confirm"
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-sm shadow-lg shadow-amber-500/20 transition-all duration-200 active:scale-95"
          >
            Confirm Change
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── ETA Display Component ────────────────────────────────────────────────────

function ETADisplay({
  weeks,
  level,
  hours,
}: {
  weeks: number
  level: MilestoneLevel
  hours: number
}) {
  const months = (weeks / 4.33).toFixed(1)
  const cfg = MILESTONE_CONFIG[level]

  return (
    <div className="bg-white/5 border border-white/15 rounded-2xl p-5 text-center">
      <p className="text-xs text-white/40 uppercase tracking-widest mb-3">Estimated Completion Time</p>

      <div className="flex items-end justify-center gap-2 mb-2">
        <span className={`text-5xl font-black bg-gradient-to-br ${cfg.color} bg-clip-text text-transparent`}>
          <AnimatedNumber value={weeks} />
        </span>
        <span className="text-white/50 text-lg font-medium mb-1.5">weeks</span>
      </div>

      <p className="text-white/40 text-sm mb-4">
        ≈ <span className="text-white/70 font-semibold">{months}</span> months at{' '}
        <span className="text-white/70 font-semibold">{hours}h/week</span>
      </p>

      {/* Timeline bar */}
      <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-white/10">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${cfg.color} transition-all duration-500`}
          style={{ width: `${Math.min((hours / 20) * 100, 100)}%` }}
        />
      </div>

      <div className="flex justify-between text-[10px] text-white/30 mt-1.5 px-0.5">
        <span>1h</span>
        <span>10h</span>
        <span>20h</span>
      </div>

      {/* Smart tips */}
      <div className="mt-4 text-xs text-white/40">
        {hours >= 14
          ? '🔥 Great learning pace!'
          : hours >= 8
          ? '✅ Steady progress, on the right track.'
          : '💡 Adding a few more hours/week will get you to your goal much faster.'}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function MilestoneForm() {
  const navigate = useNavigate()

  // State
  const [selectedRole, setSelectedRole] = useState<RoleId>('pm')
  const [selectedLevel, setSelectedLevel] = useState<MilestoneLevel | null>(null)
  const [pendingLevel, setPendingLevel] = useState<MilestoneLevel | null>(null)
  const [confirmedLevel, setConfirmedLevel] = useState<MilestoneLevel | null>(null) // simulates "already set"
  const [hoursPerWeek, setHoursPerWeek] = useState(8)
  const [showWarning, setShowWarning] = useState(false)
  const [saved, setSaved] = useState(false)

  const role = ROLES.find((r) => r.id === selectedRole)!
  const cfg = selectedLevel ? MILESTONE_CONFIG[selectedLevel] : null
  const targets = selectedLevel ? computeTargets(role, selectedLevel) : null
  const eta = selectedLevel ? computeETA(selectedLevel, hoursPerWeek) : null

  function handleLevelClick(level: MilestoneLevel) {
    // If already confirmed a different level, warn before switching
    if (confirmedLevel && confirmedLevel !== level) {
      setPendingLevel(level)
      setShowWarning(true)
    } else {
      setSelectedLevel(level)
    }
  }

  function handleModalConfirm() {
    if (pendingLevel) {
      setSelectedLevel(pendingLevel)
      setConfirmedLevel(null) // reset "saved" state
      setSaved(false)
    }
    setPendingLevel(null)
    setShowWarning(false)
  }

  function handleModalCancel() {
    setPendingLevel(null)
    setShowWarning(false)
  }

  function handleConfirm() {
    if (!selectedLevel) return
    setConfirmedLevel(selectedLevel)
    setSaved(true)
    // Simulate navigation after brief success flash
    setTimeout(() => navigate({ to: '/dashboard' }), 1800)
  }

  return (
    <div
      className="min-h-screen relative"
      style={{ backgroundImage: `url(${bannerBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      {/* Blue overlay */}
      <div className="fixed inset-0 bg-blue-700/80" />

      {/* Glow decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl" />
      </div>

      {/* TMA Logo */}
      <img src={tmaLogo} alt="TMA Solutions" className="absolute top-6 left-6 w-45 h-auto z-20" />

      {/* Warning Modal */}
      {showWarning && (
        <WarningModal onConfirm={handleModalConfirm} onCancel={handleModalCancel} />
      )}

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-24">
        <div className="w-full max-w-2xl">

          {/* Header */}
          <div className="flex flex-col items-center mb-8 text-center">
            {/* Progress Steps */}
            <div className="flex items-center justify-center mb-6">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      step <= 4
                        ? 'bg-blue-400 text-white shadow-md shadow-blue-900'
                        : 'bg-white/10 text-white/40'
                    }`}
                  >
                    {step < 4 ? '✓' : step}
                  </div>

                  {step < 4 && (
                    <div className="w-10 h-0.5 bg-white/20 mx-2 rounded-full" />
                  )}
                </div>
              ))}
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-blue-200 text-sm font-medium mb-4">
              <span className="w-2 h-2 rounded-full bg-blue-300 animate-pulse" />
              Step 4 / 4 — Set Milestone Goal
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-2 drop-shadow-md">
              Which level do you want to{' '}
              <span className="bg-gradient-to-r from-blue-300 via-cyan-300 to-sky-300 bg-clip-text text-transparent">
                reach?
              </span>
            </h1>
            <p className="text-blue-100/60 text-sm max-w-lg mx-auto">
              The system will convert the milestone into a{' '}
              <span className="font-semibold text-white/80">D/C/T/G</span> budget as the target for your course.
            </p>
          </div>

          {/* Role Selector */}
          <div className="bg-white/5 border border-white/15 rounded-2xl p-4 mb-5">
            <label className="text-xs text-white/40 uppercase tracking-widest mb-2.5 block">
              Your Career Track
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ROLES.map((r) => (
                <button
                  key={r.id}
                  id={`role-select-${r.id}`}
                  type="button"
                  onClick={() => { setSelectedRole(r.id as RoleId); setSelectedLevel(null); setSaved(false); setConfirmedLevel(null) }}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    selectedRole === r.id
                      ? 'bg-blue-500/30 border-2 border-blue-400/70 text-white shadow-md'
                      : 'bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white/80'
                  }`}
                >
                  <span className="text-base">{r.icon}</span>
                  <span className="truncate text-xs">{r.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Milestone Level Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
            {(Object.keys(MILESTONE_CONFIG) as MilestoneLevel[]).map((lvl) => {
              const c = MILESTONE_CONFIG[lvl]
              const isSelected = selectedLevel === lvl
              const t = computeTargets(role, lvl)

              return (
                <button
                  key={lvl}
                  id={`milestone-${lvl}`}
                  type="button"
                  onClick={() => handleLevelClick(lvl)}
                  className={`relative text-left rounded-2xl border-2 p-5 transition-all duration-300 group ${
                    isSelected
                      ? `${c.border} bg-white/10 shadow-xl ${c.glow} scale-[1.02]`
                      : 'border-white/15 bg-white/5 hover:bg-white/8 hover:border-white/25 hover:scale-[1.01]'
                  }`}
                >
                  {/* Popular badge */}
                  {lvl === 'intermediate' && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-violet-500 text-white text-[10px] font-bold shadow-md whitespace-nowrap">
                      ⭐ Most Popular
                    </div>
                  )}

                  {/* Icon + title */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">{c.icon}</span>
                    <div>
                      <div className={`font-bold text-sm bg-gradient-to-r ${c.color} bg-clip-text text-transparent`}>
                        {c.label}
                      </div>
                      <div className="text-[10px] text-white/40">{c.sublabel}</div>
                    </div>
                    {isSelected && (
                      <div className="ml-auto w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-[11px] text-white/50 mb-4 leading-relaxed">{c.desc}</p>

                  {/* D/C/T/G mini bars */}
                  <div className="space-y-1.5">
                    {AXIS_META.map((ax) => (
                      <div key={ax.key} className="flex items-center gap-1.5">
                        <span className={`text-[9px] font-bold w-3 ${ax.text}`}>{ax.key}</span>
                        <div className={`flex-1 h-1.5 ${ax.track} rounded-full overflow-hidden`}>
                          <div
                            className={`h-full ${ax.color} rounded-full transition-all duration-500`}
                            style={{ width: `${(t[ax.key] / c.totalBudget) * 100}%` }}
                          />
                        </div>
                        <span className="text-[9px] font-mono text-white/40 w-5 text-right">{t[ax.key]}</span>
                      </div>
                    ))}
                  </div>

                  {/* Hours badge */}
                  <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                    <span className="text-[10px] text-white/30">Total Budget</span>
                    <span className={`text-xs font-bold bg-gradient-to-r ${c.color} bg-clip-text text-transparent`}>
                      {c.totalBudget} pts
                    </span>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Weekly Hours Slider + ETA */}
          {selectedLevel && (
            <div className="animate-in fade-in slide-in-from-bottom-3 duration-400 space-y-4 mb-5">

              {/* D/C/T/G breakdown detail panel */}
              {targets && (
                <div className="bg-white/5 border border-white/15 rounded-2xl p-5">
                  <p className="text-xs text-white/40 uppercase tracking-widest mb-4">
                    Target D/C/T/G Budget — {role.label} / {MILESTONE_CONFIG[selectedLevel].label}
                  </p>
                  <div className="grid grid-cols-4 gap-3">
                    {AXIS_META.map((ax) => (
                      <div key={ax.key} className="text-center">
                        <div className={`text-2xl font-black ${ax.text} mb-1`}>
                          <AnimatedNumber value={targets[ax.key]} />
                        </div>
                        <div className="text-[10px] text-white/40">{ax.label}</div>
                        <div className={`mt-1.5 h-1.5 ${ax.track} rounded-full overflow-hidden`}>
                          <div
                            className={`h-full ${ax.color} rounded-full transition-all duration-600`}
                            style={{ width: `${(targets[ax.key] / MILESTONE_CONFIG[selectedLevel].totalBudget) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Weekly hours slider */}
              <div className="bg-white/5 border border-white/15 rounded-2xl p-5">
                <div className="flex justify-between items-center mb-4">
                  <label htmlFor="hours-slider" className="text-sm font-semibold text-white/80">
                    Weekly Study Hours
                  </label>
                  <div className={`px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r ${cfg!.color} text-white shadow-sm`}>
                    {hoursPerWeek}h / week
                  </div>
                </div>

                <input
                  id="hours-slider"
                  type="range"
                  min={1}
                  max={20}
                  value={hoursPerWeek}
                  onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer accent-blue-400 bg-white/10"
                />

                <div className="flex justify-between text-[10px] text-white/30 mt-1.5">
                  <span>1h (Relaxed)</span>
                  <span>10h (Balanced)</span>
                  <span>20h (Intensive)</span>
                </div>
              </div>

              {/* ETA */}
              {eta && <ETADisplay weeks={eta} level={selectedLevel} hours={hoursPerWeek} />}
            </div>
          )}

          {/* Confirm Button */}
          <button
            id="btn-confirm-milestone"
            type="button"
            onClick={handleConfirm}
            disabled={!selectedLevel || saved}
            className={`w-full py-4 px-6 rounded-xl font-bold text-base transition-all duration-300 flex items-center justify-center gap-2.5 shadow-lg
              ${saved
                ? 'bg-emerald-500/30 border border-emerald-400/40 text-emerald-300 cursor-default'
                : selectedLevel
                ? `bg-gradient-to-r ${cfg?.color} text-white hover:scale-[1.01] hover:shadow-xl active:scale-[0.98] shadow-blue-500/20`
                : 'bg-white/10 text-white/30 cursor-not-allowed'
              }
            `}
          >
            {saved ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span>Saved! System is initializing course...</span>
              </>
            ) : selectedLevel ? (
              <>
                <span>Confirm: {MILESTONE_CONFIG[selectedLevel].label} — {hoursPerWeek}h/week</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            ) : (
              <span>Select a target level to continue</span>
            )}
          </button>

          {!selectedLevel && (
            <p className="text-center text-xs text-white/30 mt-3 animate-pulse">
              ☝️ Select Basic, Intermediate, or Advanced to get started
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
