import { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import careerPathLogo from '@/asset/image/careerpath_logo.png'
import { fetchJobRoles, type JobRole } from '../../api/onboardingApi'
import { useAuth } from '@/common/context/AuthContext'
import { useRadar } from '@/feature/radar/context/RadarContext'
import { LanguageSwitcher } from '@/common/component/LanguageSwitcher'
import { useTranslation } from 'react-i18next'
import { devGenerateCourse, type SkillScores } from '@/feature/dev-mode/api/devModeApi'
import { onboardingTexts } from '../../onboardingTexts'
import { AdminReturnLink } from '../AdminReturnLink'
import { RoleCardItem } from './RoleCardItem'
import { SkillBar, SkillLegend } from './SkillOverviewComponents'
import { ConfirmRoleModal, InactiveRoleModal, DevPlacementPanel } from './RoleSelectionModals'
import {
  type SkillKey,
  SKILL_TO_AXIS,
  extractWeights,
  getRoleDescription,
  getWeightDescriptions,
  getDefaultActiveSkill,
  getExampleQuestions,
} from './roleTrackUtils'

export function RoleSelectionGrid() {
  const { i18n } = useTranslation('onboarding')
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
    D_doc: { easy: 2, medium: 2, hard: 2 },
    C_comm: { easy: 2, medium: 2, hard: 2 },
    T_trouble: { easy: 2, medium: 2, hard: 2 },
    G_custom: { easy: 2, medium: 2, hard: 2 },
  })
  const [isGeneratingCourse, setIsGeneratingCourse] = useState(false)
  const navigate = useNavigate()
  const { isAuthenticated, logout } = useAuth()
  const { reinitialize: reinitializeRadar } = useRadar()

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
    navigate({ to: '/onboarding/placement-test' })
  }

  async function handleDevGenerate() {
    if (!selectedRoleId) return
    setIsGeneratingCourse(true)
    try {
      localStorage.setItem('pending_role_id', selectedRoleId.toString())
      await devGenerateCourse(selectedRoleId, devSkills)
      await reinitializeRadar(true)
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

  async function handleLogout() {
    await logout()
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

      {/* Developer-mode Placement Panel */}
      {showDevPanel && (
        <DevPlacementPanel
          skills={devSkills}
          onSkillsChange={setDevSkills}
          onGenerate={handleDevGenerate}
          onCancel={() => { setShowDevPanel(false); setShowConfirmModal(true) }}
          isGenerating={isGeneratingCourse}
        />
      )}

      {/* Top Header Bar */}
      <header className="w-full bg-[#0072FF] px-3 sm:px-6 py-2.5 sm:py-3.5 pt-[max(0.6rem,env(safe-area-inset-top))] flex items-center justify-between shadow-md sticky top-0 z-30">
        <div className="flex items-center gap-2 sm:gap-3">
          <img src={careerPathLogo} alt="AI Learning Path" className="h-6 sm:h-8 w-auto brightness-0 invert" />
          <LanguageSwitcher
            variant="ghost"
            showLabel
            className="text-white shadow-md border border-white/30 hover:bg-white/10 [&_svg]:text-white [&_span]:text-white h-7 sm:h-8 text-xs"
          />
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <AdminReturnLink />
          {isAuthenticated ? (
            <button
              id="btn-logout-role-selection"
              type="button"
              onClick={handleLogout}
              className="px-3 sm:px-4 py-1 sm:py-1.5 rounded-full border border-white/40 text-white hover:bg-white/10 transition-colors text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>{onboardingTexts.common.logoutButton}</span>
            </button>
          ) : (
            <button
              id="btn-login-role-selection"
              type="button"
              onClick={() => navigate({ to: '/login' })}
              className="px-3 sm:px-4 py-1 sm:py-1.5 rounded-full border border-white/40 text-white hover:bg-white/10 transition-colors text-xs sm:text-sm font-medium flex items-center gap-1.5 cursor-pointer"
            >
              <span>{onboardingTexts.common.signInButton}</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 w-full max-w-[100vw] overflow-x-hidden px-3 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-4 sm:py-10 pb-28 lg:pb-10">
        {/* Page Header */}
        <div className="text-center mb-5 sm:mb-10">
          {/* Step indicator */}
          <div className="flex items-center justify-center mb-4 sm:mb-6">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${step === 1
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                    : 'bg-gray-100 text-gray-400 border border-gray-200'
                    }`}
                >
                  {step}
                </div>
                {step < 3 && <div className="w-8 sm:w-10 h-0.5 bg-gray-200 mx-1.5 sm:mx-2 rounded-full" />}
              </div>
            ))}
          </div>

          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs sm:text-sm font-medium mb-3 sm:mb-4">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500 animate-pulse" />
            {onboardingTexts.roleSelection.stepIndicator}
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl 2xl:text-6xl font-extrabold text-gray-900 leading-tight mb-2 sm:mb-3">
            {onboardingTexts.roleSelection.pageTitle}
            <span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 bg-clip-text text-transparent mt-0.5 sm:mt-1">
              {onboardingTexts.roleSelection.pageTitleHighlight}
            </span>
          </h1>
          <p className="text-xs sm:text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
            {onboardingTexts.roleSelection.pageSubtitle}
            <span className="font-semibold text-gray-900">{onboardingTexts.roleSelection.pageSubtitleHighlight}</span>{onboardingTexts.roleSelection.pageSubtitleEnd}
          </p>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 text-sm">{onboardingTexts.roleSelection.loadingText}</p>
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div className="max-w-lg mx-auto text-center py-16">
            <p className="text-rose-600 font-semibold text-lg mb-2">{onboardingTexts.roleSelection.errorTitle}</p>
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
              {onboardingTexts.roleSelection.retryButton}
            </button>
          </div>
        )}

        {/* Main Content Split View */}
        {!isLoading && !error && (
          <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
            {/* Left Panel: Role List */}
            <div className="min-w-0 w-full lg:w-1/3 2xl:w-2/5 flex flex-col gap-3 lg:max-h-[70vh] lg:overflow-y-auto lg:overflow-x-hidden px-2 py-1">
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
                      <span>{onboardingTexts.roleSelection.continueWith(selectedRole.name)}</span>
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
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 border-b pb-2">{onboardingTexts.roleSelection.jobDescriptionHeading}</h3>
                        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                          {getRoleDescription(selectedRole, i18n.language)}
                        </p>
                      </div>

                      <div className="pt-2">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 border-b pb-2">{onboardingTexts.roleSelection.skillOverviewHeading}</h3>
                        <SkillLegend
                          weightDescriptions={getWeightDescriptions(selectedRole, i18n.language)}
                          activeSkill={activeSkill}
                          onSkillClick={setActiveSkill}
                        />
                        <p className="text-[11px] text-gray-400 mt-3 italic">
                          {onboardingTexts.roleSelection.skillOverviewHint}
                        </p>
                      </div>
                    </div>

                    {/* Right column in details */}
                    <div className="w-full md:w-1/2 space-y-6">
                      <div>
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 border-b pb-2">{onboardingTexts.roleSelection.skillWeightsHeading}</h3>
                        <div className="space-y-3 mt-4">
                          {(() => {
                            const weights = extractWeights(selectedRole.baseline)
                            const weightDescriptions = getWeightDescriptions(selectedRole, i18n.language)
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
                          {onboardingTexts.roleSelection.exampleQuestionsHeading}
                        </h3>
                        {(() => {
                          const exampleQs = getExampleQuestions(selectedRole, activeSkill)
                          const activeDescription = getWeightDescriptions(selectedRole, i18n.language)[SKILL_TO_AXIS[activeSkill]]
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
                                    {onboardingTexts.roleSelection.noExampleQuestions}
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
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{onboardingTexts.roleSelection.selectTrackTitle}</h3>
                  <p className="text-gray-500 text-sm max-w-sm">
                    {onboardingTexts.roleSelection.selectTrackDescription}
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
              {onboardingTexts.roleSelection.selectTrackHint}
            </p>
          </div>
        )}
      </div>

      {/* Mobile Sticky Continue Bar */}
      {selectedRole && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 border-t border-gray-200 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.1)] backdrop-blur-md flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">Đã chọn lộ trình</p>
            <p className="text-sm font-bold text-gray-900 truncate">{selectedRole.name}</p>
          </div>
          <button
            id="btn-confirm-role-mobile"
            type="button"
            onClick={handleContinueClick}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs shrink-0 shadow-md flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
          >
            <span>Tiếp tục</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
