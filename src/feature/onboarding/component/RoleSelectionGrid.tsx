<<<<<<< HEAD
import { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import tmaLogo from '@/asset/image/tma_logo.png'
import bannerBg from '@/asset/image/banner_background.png'
import { fetchJobRoles, type JobRole } from '../api/onboardingApi'
import { useAuth } from '@/common/context/AuthContext'

// ─── Visual palette — assigned per card index ─────────────────────────────────

const ROLE_PALETTE = [
  { icon: '🎯', color: 'from-violet-500 to-purple-600', gradient: 'from-violet-50 to-purple-50', accentColor: 'violet' },
  { icon: '📊', color: 'from-blue-500 to-indigo-600', gradient: 'from-blue-50 to-indigo-50', accentColor: 'blue' },
  { icon: '⚡', color: 'from-emerald-500 to-teal-600', gradient: 'from-emerald-50 to-teal-50', accentColor: 'emerald' },
  { icon: '🏗️', color: 'from-amber-500 to-orange-600', gradient: 'from-amber-50 to-orange-50', accentColor: 'amber' },
  { icon: '🔍', color: 'from-rose-500 to-pink-600', gradient: 'from-rose-50 to-pink-50', accentColor: 'rose' },
  { icon: '🛠️', color: 'from-slate-500 to-gray-600', gradient: 'from-slate-50 to-gray-50', accentColor: 'slate' },
  { icon: '🎨', color: 'from-cyan-500 to-sky-600', gradient: 'from-cyan-50 to-sky-50', accentColor: 'cyan' },
  { icon: '🤖', color: 'from-fuchsia-500 to-violet-600', gradient: 'from-fuchsia-50 to-violet-50', accentColor: 'fuchsia' },
  { icon: '🚀', color: 'from-green-500 to-emerald-600', gradient: 'from-green-50 to-emerald-50', accentColor: 'green' },
  { icon: '💡', color: 'from-yellow-500 to-amber-600', gradient: 'from-yellow-50 to-amber-50', accentColor: 'yellow' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Extract DCTG weights (0-100) from init_weights. Prefers Basic tier; falls back to flat keys. */
function extractWeights(init_weights: JobRole['init_weights']): { D: number; C: number; T: number; G: number } {
  const src = (init_weights as any)?.Basic ?? init_weights ?? {}
  return {
    D: Number(src.D ?? src.D_doc ?? 25),
    C: Number(src.C ?? src.C_comm ?? 25),
    T: Number(src.T ?? src.T_trouble ?? 25),
    G: Number(src.G ?? src.G_biz ?? 25),
  }
}

/** Get the first 2 example questions to show as a preview on the card. */
function getExampleQuestions(example_question: unknown): string[] {
  if (Array.isArray(example_question)) {
    return (example_question as string[]).slice(0, 2)
  }
  return []
}

// ─── Skill Weight Bar Component ───────────────────────────────────────────────

const SKILL_COLOR: Record<string, string> = {
  D: 'bg-blue-500',
  C: 'bg-emerald-500',
  T: 'bg-rose-500',
  G: 'bg-amber-500',
}
=======

import { useNavigate } from '@tanstack/react-router'
import tmaLogo from '@/asset/image/tma_logo.png'
import bannerBg from '@/asset/image/banner_background.png'
import { useEffect, useState } from "react";
import { getJobRoles } from "@/feature/onboarding/api/career";
// ─── Role Data (sourced from TOEIC_Phase2_Task1.1_ver1.4.html spec) ─────────

interface SkillWeight {
  D_doc: number   // Documentation
  C_comm: number  // Communication
  T_trouble: number // Troubleshooting
  G_biz: number   // Business / Commercial
}
interface JobRoleApi {
  id: number;
  name: string;
  JD: string;
  UI: {
    subtitle: string;
    toeicTarget: string;
    icon: string;
    color: string;
    gradient: string;
    accentColor: string;
  };
  seed_tier: {
    tier: number;
    name: string;
  }[];
  init_weights: SkillWeight;
  example_question: string[];
}
interface RoleCard {
  id: number
  title: string
  subtitle: string
  toeicTarget: string
  weights: SkillWeight
  tier1: string[]
  tier2: string[]
  icon: string
  color: string
  gradient: string
  accentColor: string
  jd: string
  exampleQuestion: string[];
}

// ─── Skill Weight Bar Component ───────────────────────────────────────────────
function SkillBar({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    D_doc: 'bg-blue-500',
    C_comm: 'bg-emerald-500',
    T_trouble: 'bg-rose-500',
    G_biz: 'bg-amber-500',
  }

  const labelMap: Record<string, string> = {
    D_doc: 'D',
    C_comm: 'C',
    T_trouble: 'T',
    G_biz: 'G',
  }
>>>>>>> d4c83d0 (Begin)

function SkillBar({ axis, value }: { axis: 'D' | 'C' | 'T' | 'G'; value: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] font-bold text-gray-500 w-3 flex-shrink-0">{axis}</span>
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
  const weights = extractWeights(role.init_weights)
  const exampleQs = getExampleQuestions(role.example_question)

  return (
    <div
      id={`role-card-${role.id}`}
      onClick={onSelect}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className={`
        relative cursor-pointer rounded-2xl border-2 p-5 transition-all duration-300 select-none
        ${isSelected
          ? 'border-indigo-500 shadow-lg shadow-indigo-100 scale-[1.02] bg-white'
          : isHovered
            ? 'border-gray-300 shadow-md scale-[1.01] bg-white'
            : 'border-gray-200 shadow-sm bg-white/80 hover:bg-white'
        }
      `}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-3 right-3 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center shadow-md animate-in zoom-in-50 duration-200">
          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${palette.color} flex items-center justify-center text-2xl shadow-sm flex-shrink-0`}>
          {palette.icon}
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-gray-900 text-sm leading-tight">{role.name}</h3>
          <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-semibold">
            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            Career Track
          </span>
        </div>
      </div>

      {/* Skill Weights */}
      <div className="mb-4 space-y-1.5">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Skill Weights</p>
        <SkillBar axis="D" value={weights.D} />
        <SkillBar axis="C" value={weights.C} />
        <SkillBar axis="T" value={weights.T} />
        <SkillBar axis="G" value={weights.G} />
      </div>

      {/* Example Questions Preview */}
      <div className={`rounded-xl p-3 bg-gradient-to-br ${palette.gradient} border border-white/60`}>
        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">💬 Example Questions</p>
        <ul className="space-y-1.5">
          {exampleQs.length > 0
            ? exampleQs.map((q, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[11px] text-gray-700 leading-snug">
                  <span className="mt-0.5 text-[10px] font-bold text-gray-400 flex-shrink-0">Q{i + 1}</span>
                  {q}
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
}

// ─── Legend Component ─────────────────────────────────────────────────────────

function SkillLegend() {
  const items = [
    { key: 'D', label: 'Documentation (D_doc)', color: 'bg-blue-500' },
    { key: 'C', label: 'Communication (C_comm)', color: 'bg-emerald-500' },
    { key: 'T', label: 'Troubleshooting (T_trouble)', color: 'bg-rose-500' },
    { key: 'G', label: 'Business (G_biz)', color: 'bg-amber-500' },
  ]
  return (
    <div className="flex flex-wrap justify-center gap-4">
      {items.map(({ key, label, color }) => (
        <div key={key} className="flex items-center gap-1.5">
          <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
          <span className="text-xs text-white/60">{label}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function RoleSelectionGrid() {
<<<<<<< HEAD
  const [roles, setRoles] = useState<JobRole[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
=======
  const [roles, setRoles] = useState<RoleCard[]>([]);
>>>>>>> d4c83d0 (Begin)
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null)
  const [hoveredRoleId, setHoveredRoleId] = useState<number | null>(null)
  const navigate = useNavigate()
  const { logout } = useAuth()

<<<<<<< HEAD
  useEffect(() => {
    fetchJobRoles()
      .then(setRoles)
      .catch(err => setError(err.message ?? 'Unable to load role list.'))
      .finally(() => setIsLoading(false))
  }, [])

  const selectedRole = roles.find(r => r.id === selectedRoleId) ?? null
  const selectedPaletteIdx = selectedRoleId != null ? roles.findIndex(r => r.id === selectedRoleId) : 0
=======
  const selectedRole =
    roles.find((r) => r.id === selectedRoleId) ?? null;
  useEffect(() => {
    async function fetchRoles() {
      try {
        const data: JobRoleApi[] = await getJobRoles();
>>>>>>> d4c83d0 (Begin)

        const mappedRoles: RoleCard[] = data.map((item) => ({
          id: item.id,
          title: item.name,
          subtitle: item.UI.subtitle,
          toeicTarget: item.UI.toeicTarget,
          icon: item.UI.icon,
          color: item.UI.color,
          gradient: item.UI.gradient,
          accentColor: item.UI.accentColor,
          jd: item.JD,

          exampleQuestion: item.example_question,
          weights: item.init_weights,
          tier1: item.seed_tier
            .filter((s) => s.tier === 1)
            .map((s) => s.name),

          tier2: item.seed_tier
            .filter((s) => s.tier === 2)
            .map((s) => s.name),
        }));

        setRoles(mappedRoles);
      } catch (err) {
        console.error(err);
      }
    }

    fetchRoles();
  }, []);
  function handleConfirm() {
    if (!selectedRoleId) return
    localStorage.setItem('pending_role_id', selectedRoleId.toString())
    // Navigate to the next onboarding step (survey)
    navigate({ to: '/onboarding/survey' })
  }

  function handleLogout() {
    logout()
    navigate({ to: '/login' })
  }

  return (
    <div
      className="min-h-screen relative"
      style={{ backgroundImage: `url(${bannerBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      {/* Deep blue overlay */}
      <div className="fixed inset-0 bg-blue-700/80" />

      {/* Subtle radial glow decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      {/* TMA Logo — top left */}
      <img
        src={tmaLogo}
        alt="TMA Solutions"
        className="absolute top-6 left-6 w-45 h-auto z-20"
      />

      {/* Logout Button — top right */}
      <button
        id="btn-logout-role-selection"
        type="button"
        onClick={handleLogout}
        className="absolute top-6 right-6 z-20 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white/70 hover:text-white transition-colors text-xs font-medium flex items-center gap-1.5 backdrop-blur-md cursor-pointer"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        <span>Log out</span>
      </button>


      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24">
        {/* Header */}
        <div className="text-center mb-10">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="flex items-center justify-center mb-6">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${step === 1
                      ? 'bg-blue-400 text-white shadow-md shadow-blue-900'
                      : 'bg-white/10 text-white/40'
                      }`}
                  >
                    {step < 1 ? '✓' : step}
                  </div>

                  {step < 4 && (
                    <div className="w-10 h-0.5 bg-white/20 mx-2 rounded-full" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-blue-200 text-sm font-medium mb-4">
            <span className="w-2 h-2 rounded-full bg-blue-300 animate-pulse" />
            Step 1 / 4 — Choose Your Career Track
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-3 drop-shadow-md">
            What role are you currently in
            <span className="block bg-gradient-to-r from-blue-300 via-cyan-300 to-sky-300 bg-clip-text text-transparent mt-1">
              at TMA?
            </span>
          </h1>
          <p className="text-base sm:text-lg text-blue-100/80 max-w-2xl mx-auto leading-relaxed">
            The system will build a personalized IT English learning path based on the
            <span className="font-semibold text-white"> D/C/T/G skill weights</span> specific to each career track.
          </p>

          {/* Legend */}
          <div className="mt-5">
            <SkillLegend />
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            <p className="text-white/60 text-sm">Loading career tracks…</p>
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div className="max-w-lg mx-auto text-center py-16">
            <p className="text-rose-300 font-semibold text-lg mb-2">⚠️ Unable to load data</p>
            <p className="text-white/60 text-sm">{error}</p>
            <button
              onClick={() => { setError(null); setIsLoading(true); fetchJobRoles().then(setRoles).catch(e => setError(e.message)).finally(() => setIsLoading(false)) }}
              className="mt-4 px-5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Role Grid */}
<<<<<<< HEAD
        {!isLoading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
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
        )}
=======
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
          {roles.map((role) => (
            <RoleCardItem
              key={role.id}
              role={role}
              isSelected={selectedRoleId === role.id}
              isHovered={hoveredRoleId === role.id}
              onSelect={() => setSelectedRoleId(role.id)}
              onHover={() => setHoveredRoleId(role.id)}
              onLeave={() => setHoveredRoleId(null)}
            />
          ))}
        </div>
>>>>>>> d4c83d0 (Begin)

        {/* Selection summary & CTA */}
        {!isLoading && !error && (
          <div
            className={`transition-all duration-500 ${selectedRole ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
          >
            <div className="max-w-2xl mx-auto">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-indigo-100 shadow-lg shadow-indigo-50 p-6">
                {selectedRole && (() => {
                  const palette = ROLE_PALETTE[selectedPaletteIdx % ROLE_PALETTE.length]
                  const exampleQs = getExampleQuestions(selectedRole.example_question)
                  return (
                    <div className="flex items-start gap-4 mb-5">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${palette.color} flex items-center justify-center text-3xl shadow flex-shrink-0`}>
                        {palette.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-bold text-gray-900">{selectedRole.name}</h2>
                        <p className="text-sm text-gray-500 mt-0.5">Career Track</p>
                        <div className="mt-3 space-y-1.5">
                          {exampleQs.map((q, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-gray-700">
                              <span className="font-bold text-indigo-400 flex-shrink-0">Q{i + 1}</span>
                              <span>{q}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
<<<<<<< HEAD
                  )
                })()}
=======
                    <p className="text-sm text-gray-500 mt-0.5">{selectedRole.subtitle}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedRole.tier2.slice(0, 2).map((t, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 text-xs font-medium border border-rose-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 flex-shrink-0" />
                          {t}
                        </span>
                      ))}
                    </div>
                    <div className="border-t pt-5">
                      <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        📋 Job Description
                      </h3>

                      <p className="text-sm leading-7 text-gray-600">
                        {selectedRole.jd}
                      </p>
                    </div>
                    <div className="border-t mt-5 pt-5">
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        💬 Example Questions
                      </h3>

                      <div className="space-y-3">
                        {selectedRole.exampleQuestion.map((question, index) => (
                          <div
                            key={index}
                            className="rounded-xl bg-gray-50 p-3 border border-gray-200"
                          >
                            <span className="font-semibold text-indigo-600">
                              {index + 1}.
                            </span>

                            <span className="ml-2 text-gray-700">
                              {question}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
>>>>>>> d4c83d0 (Begin)

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

                <p className="text-center text-xs text-gray-400 mt-3">
                  You can change your Career Track later in Settings
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Placeholder CTA when nothing selected */}
        {!isLoading && !error && !selectedRole && (
          <div className="text-center mt-4">
            <p className="text-sm text-white/40 animate-pulse">
              ☝️ Select a Career Track to begin your IT English learning journey
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
