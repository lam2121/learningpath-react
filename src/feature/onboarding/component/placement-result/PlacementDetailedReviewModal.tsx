import type { QuestionResult, SkillAxis } from '../../api/placementTestTypes'
import { onboardingTexts } from '../../onboardingTexts'
import { AXIS_META_DISPLAY, getDifficultyLabel } from './placementScoring'

interface PlacementDetailedReviewModalProps {
  showDetails: boolean
  onClose: () => void
  activeTab: SkillAxis
  setActiveTab: (tab: SkillAxis) => void
  totalCorrect: number
  totalQuestions: number
  resultsToUse: QuestionResult[]
  useBackend: boolean
}

export function PlacementDetailedReviewModal({
  showDetails,
  onClose,
  activeTab,
  setActiveTab,
  totalCorrect,
  totalQuestions,
  resultsToUse,
  useBackend,
}: PlacementDetailedReviewModalProps) {
  if (!showDetails) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 fade-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-2xl font-extrabold text-slate-800">
            {onboardingTexts.placementResult.detailedResultsTitle(totalCorrect, totalQuestions)}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Tabs ──────────────────────────────────────────────────────── */}
        <div className="flex px-6 pt-2 space-x-2 border-b border-slate-100 overflow-x-auto shrink-0 bg-white">
          {AXIS_META_DISPLAY.map((ax) => {
            const isActive = activeTab === ax.key
            const axisResults = resultsToUse.filter((r: QuestionResult) => r.axis === ax.key)
            const axisCorrect = axisResults.filter((r: QuestionResult) => r.isCorrect).length
            const axisTotal = useBackend ? axisResults.length : totalQuestions / 4
            return (
              <button
                key={ax.key}
                onClick={() => setActiveTab(ax.key)}
                className={`px-4 py-3 font-bold text-sm border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
                  isActive
                    ? `border-blue-600 text-blue-600`
                    : `border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300`
                }`}
              >
                <span className={isActive ? ax.color : ''}>{ax.label}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {axisCorrect}/{axisTotal}
                </span>
              </button>
            )
          })}
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
          {AXIS_META_DISPLAY.filter((ax) => ax.key === activeTab).map((ax) => {
            const axisResults = resultsToUse.filter((r: QuestionResult) => r.axis === ax.key)
            return (
              <div key={ax.key} className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="space-y-6">
                  {axisResults.map((r: QuestionResult, idx: number) => {
                    const qText =
                      r.questionText ||
                      `This is a sample question about ${ax.label} (Question ${idx + 1}). How would you handle this scenario?`
                    const options = r.options || [
                      { id: 'a', text: 'The correct approach for the situation.' },
                      { id: 'b', text: 'An incorrect, less optimal option.' },
                      { id: 'c', text: 'Another wrong choice that might seem right.' },
                      { id: 'd', text: 'Completely off topic.' },
                    ]
                    const correctId =
                      r.correctId || (r.isCorrect ? r.selectedId || 'a' : r.selectedId === 'a' ? 'b' : 'a')

                    return (
                      <div key={idx} className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200 shadow-sm">
                        <div className="flex items-start gap-4 mb-5">
                          <div
                            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-sm ${
                              r.isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {idx + 1}
                          </div>
                          <p className="text-slate-800 font-semibold leading-relaxed mt-1 flex-1">{qText}</p>
                          <div className="flex-shrink-0 flex flex-row items-center gap-2">
                            {/* Difficulty badge */}
                            {r.difficulty != null &&
                              (() => {
                                const diff = getDifficultyLabel(r.difficulty)
                                return (
                                  <span
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${diff.bg} ${diff.color} ${diff.border}`}
                                  >
                                    {diff.label}
                                  </span>
                                )
                              })()}
                            {/* Correct / Incorrect badge */}
                            {r.isCorrect ? (
                              <span className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                                {onboardingTexts.placementResult.correctBadge}
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5 text-rose-600 text-xs font-bold bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-100">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                {onboardingTexts.placementResult.incorrectBadge}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2.5 md:pl-12">
                          {options.map((opt) => {
                            const isSelected = r.selectedId === opt.id
                            const isCorrectAnswer = correctId === opt.id

                            let containerClass = 'flex items-center gap-3 p-3.5 rounded-xl border transition-colors '
                            let icon = null

                            if (isSelected && isCorrectAnswer) {
                              containerClass += 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                              icon = (
                                <svg
                                  className="w-5 h-5 text-emerald-600 shrink-0"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                              )
                            } else if (isSelected && !isCorrectAnswer) {
                              containerClass += 'bg-rose-50 border-rose-300 text-rose-900 font-bold'
                              icon = (
                                <svg
                                  className="w-5 h-5 text-rose-600 shrink-0"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              )
                            } else if (!isSelected && isCorrectAnswer) {
                              containerClass += 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                              icon = (
                                <svg
                                  className="w-5 h-5 text-emerald-600 shrink-0"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                              )
                            } else {
                              containerClass +=
                                'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600 font-medium'
                              icon = <div className="w-5 h-5 rounded-full border-2 border-slate-300 shrink-0" />
                            }

                            return (
                              <div key={opt.id} className={containerClass}>
                                {icon}
                                <span
                                  className={`text-sm ${
                                    isSelected && !isCorrectAnswer ? 'line-through opacity-70' : ''
                                  }`}
                                >
                                  {opt.text}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
