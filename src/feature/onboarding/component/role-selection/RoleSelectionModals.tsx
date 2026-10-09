import { useState } from 'react'
import type { SkillScores, SkillDifficultyBreakdown } from '@/feature/dev-mode/api/devModeApi'
import { onboardingTexts } from '../../onboardingTexts'
import {
  type SkillKey,
  SKILL_KEYS,
  SKILL_LABELS,
  MAX_SKILL_WEIGHT,
  earnedWeight,
  classifyTrackPreview,
} from './roleTrackUtils'

const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true'

// ─── Warning Confirmation Modal ───────────────────────────────────────────────

export function ConfirmRoleModal({
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
              <h2 className="text-white font-bold text-lg leading-tight">{onboardingTexts.confirmModal.title}</h2>
              <p className="text-white/80 text-xs mt-0.5">{onboardingTexts.confirmModal.subtitle}</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-3">
          <p className="text-gray-800 text-sm leading-relaxed">
            {onboardingTexts.confirmModal.bodyStart} <span className="font-bold text-indigo-700">{onboardingTexts.confirmModal.placementTestLabel}</span> for the
            <span className="font-bold text-orange-600"> {roleName}</span>{onboardingTexts.confirmModal.bodyCareerTrackPrefix}
          </p>
          <ul className="space-y-2">
            {onboardingTexts.confirmModal.bulletPoints.map(({ icon, text }) => (
              <li key={text} className="flex items-start gap-2.5 text-xs text-gray-600 leading-relaxed">
                <span className="text-base flex-shrink-0 mt-0.5">{icon}</span>
                <span>{text}</span>
              </li>
            ))}
          </ul>
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
            <p className="text-amber-800 text-xs font-medium leading-relaxed">
              {onboardingTexts.confirmModal.readyPrompt(roleName)}
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
                <span className="font-bold">{onboardingTexts.confirmModal.devModeLabel}</span>{onboardingTexts.confirmModal.devModeDescription}
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
            {onboardingTexts.confirmModal.cancelButton}
          </button>
          {devMode ? (
            <button
              id="modal-btn-set-scores"
              type="button"
              onClick={onSetScores}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-sm shadow-md shadow-indigo-200 hover:shadow-lg transition-all duration-200 active:scale-[0.98] cursor-pointer"
            >
              {onboardingTexts.confirmModal.devSetScoresButton}
            </button>
          ) : (
            <button
              id="modal-btn-confirm"
              type="button"
              onClick={onConfirm}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-sm shadow-md shadow-indigo-200 hover:shadow-lg transition-all duration-200 active:scale-[0.98] cursor-pointer"
            >
              {onboardingTexts.confirmModal.confirmButton}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Deactivated Track Warning Modal ───────────────────────────────────────────

export function InactiveRoleModal({
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
              <h2 className="text-white font-bold text-lg leading-tight">{onboardingTexts.inactiveModal.title}</h2>
              <p className="text-white/80 text-xs mt-0.5">{onboardingTexts.inactiveModal.subtitle}</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-3">
          <p className="text-gray-800 text-sm leading-relaxed">
            <span className="font-bold text-gray-900">{roleName}</span> is currently
            <span className="font-bold text-slate-600">{onboardingTexts.inactiveModal.bodyDeactivated}</span>{onboardingTexts.inactiveModal.bodyEnd}
          </p>
          <ul className="space-y-2">
            {onboardingTexts.inactiveModal.bulletPoints.map(({ icon, text }) => (
              <li key={text} className="flex items-start gap-2.5 text-xs text-gray-600 leading-relaxed">
                <span className="text-base flex-shrink-0 mt-0.5">{icon}</span>
                <span>{text}</span>
              </li>
            ))}
          </ul>
          <div className="rounded-xl bg-slate-100 border border-slate-200 px-4 py-3">
            <p className="text-slate-700 text-xs font-medium leading-relaxed">
              {onboardingTexts.inactiveModal.selectActiveTrack}
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
            {onboardingTexts.inactiveModal.closeButton}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Dev-mode Placement Panel (v3 scoring) ──────────────────────────────────

const DIFFICULTY_META = [
  { key: 'easy' as const, label: 'Easy', weight: 1, color: 'text-emerald-600' },
  { key: 'medium' as const, label: 'Medium', weight: 2, color: 'text-amber-600' },
  { key: 'hard' as const, label: 'Hard', weight: 3, color: 'text-rose-600' },
]

export function DevPlacementPanel({
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
  const [expandedSkill, setExpandedSkill] = useState<SkillKey | null>(null)
  const track = classifyTrackPreview(skills)
  const trackStyles: Record<string, { label: string; color: string; badge: string }> = {
    basic: { label: onboardingTexts.devPanel.trackLabels.basic ?? 'Basic Track', color: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    intermediate: { label: onboardingTexts.devPanel.trackLabels.intermediate ?? 'Intermediate Track', color: 'text-indigo-700', badge: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
    advanced: { label: onboardingTexts.devPanel.trackLabels.advanced ?? 'Advanced Track', color: 'text-violet-700', badge: 'bg-violet-100 text-violet-700 border-violet-200' },
  }
  const style = trackStyles[track]

  function updateBreakdown(skill: SkillKey, tier: keyof SkillDifficultyBreakdown, value: number) {
    onSkillsChange({
      ...skills,
      [skill]: { ...skills[skill], [tier]: value },
    })
  }

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
              <h2 className="text-white font-bold text-lg leading-tight">{onboardingTexts.devPanel.title}</h2>
              <p className="text-white/80 text-xs mt-0.5">{onboardingTexts.devPanel.subtitle}</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-3">
          {SKILL_KEYS.map((key) => {
            const ew = earnedWeight(skills[key])
            const isExpanded = expandedSkill === key
            return (
              <div key={key}>
                <button
                  type="button"
                  onClick={() => setExpandedSkill(isExpanded ? null : key)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/40 transition-all duration-150 cursor-pointer"
                >
                  <span className="text-sm font-medium text-gray-700">{SKILL_LABELS[key]}</span>
                  <span className="text-sm font-bold text-indigo-700">{ew} / {MAX_SKILL_WEIGHT}</span>
                </button>

                {isExpanded && (
                  <div className="mt-2 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                    {DIFFICULTY_META.map(({ key: tier, label, weight, color }) => (
                      <div key={tier}>
                        <div className="flex items-center justify-between mb-1">
                          <label className={`text-xs font-semibold ${color}`}>{label} (×{weight})</label>
                          <span className="text-xs font-bold text-gray-600">{skills[key][tier]} {onboardingTexts.devPanel.correctSuffix}</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={4}
                          step={1}
                          value={skills[key][tier]}
                          onChange={(e) => updateBreakdown(key, tier, Number(e.target.value))}
                          className="w-full accent-indigo-600 cursor-pointer"
                          disabled={isGenerating}
                        />
                      </div>
                    ))}
                    <p className="text-xs text-gray-500 text-right font-medium">
                      {onboardingTexts.devPanel.earnedLabel(ew, MAX_SKILL_WEIGHT, Math.round(Math.min(ew / MAX_SKILL_WEIGHT, 1) * 100))}
                    </p>
                  </div>
                )}
              </div>
            )
          })}

          <div className={`rounded-xl border px-4 py-3 ${style.badge}`}>
            <p className="text-xs font-bold uppercase tracking-wide">{onboardingTexts.devPanel.trackPreviewLabel}</p>
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
            {onboardingTexts.devPanel.cancelButton}
          </button>
          <button
            id="modal-dev-btn-generate"
            type="button"
            onClick={onGenerate}
            disabled={isGenerating}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-sm shadow-md shadow-indigo-200 hover:shadow-lg transition-all duration-200 active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            {isGenerating ? onboardingTexts.devPanel.generatingButton : onboardingTexts.devPanel.generateButton}
          </button>
        </div>
      </div>
    </div>
  )
}
