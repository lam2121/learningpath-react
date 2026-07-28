import { useState, useEffect, useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'
import tmaLogo from '@/asset/image/tma_logo.png'
import bannerBg from '@/asset/image/banner_background.png'
import { PLACEMENT_QUESTIONS } from '../api/placementTestData'
import { TestQuestionCard } from './TestQuestionCard'
import type { QuestionResult } from '../api/placementTestTypes'

const TOTAL = PLACEMENT_QUESTIONS.length // 24

// ─── Quit Confirmation Modal ──────────────────────────────────────────────────

function QuitModal({ onStay, onQuit }: { onStay: () => void; onQuit: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onStay} />
      <div className="relative z-10 bg-gray-900/95 border border-white/20 rounded-2xl p-7 max-w-sm w-full shadow-2xl animate-in zoom-in-90 fade-in duration-200">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-rose-500/15 border border-rose-400/30 flex items-center justify-center text-2xl">
          ⚠️
        </div>
        <h3 className="text-lg font-bold text-white text-center mb-2">Thoát bài test?</h3>
        <p className="text-sm text-white/60 text-center mb-6 leading-relaxed">
          Tiến độ bài test <span className="text-rose-300 font-semibold">sẽ bị mất hoàn toàn</span> nếu bạn thoát. Bạn có chắc chắn?
        </p>
        <div className="flex gap-3">
          <button
            id="btn-quit-cancel"
            onClick={onStay}
            className="flex-1 py-3 rounded-xl bg-blue-500/30 border border-blue-400/40 text-blue-300 hover:bg-blue-500/40 font-bold text-sm transition-all"
          >
            Tiếp tục làm bài
          </button>
          <button
            id="btn-quit-confirm"
            onClick={onQuit}
            className="flex-1 py-3 rounded-xl border border-white/20 text-white/60 hover:bg-white/10 font-medium text-sm transition-all"
          >
            Thoát
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Engine Component ────────────────────────────────────────────────────

export function PlacementTestEngine() {
  const navigate = useNavigate()

  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [results, setResults] = useState<QuestionResult[]>([])
  const [visible, setVisible] = useState(true)
  const [showQuit, setShowQuit] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const current = PLACEMENT_QUESTIONS[currentIndex]
  const progress = ((currentIndex) / TOTAL) * 100
  const isLastQuestion = currentIndex === TOTAL - 1

  // ── Block browser back button (US-10) ──────────────────────────────────────
  useEffect(() => {
    // Push a state so the back button pops back to this state, not leaves
    window.history.pushState(null, '', window.location.href)
    const handlePopState = () => {
      // Re-push to stay on this page and show quit modal instead
      window.history.pushState(null, '', window.location.href)
      setShowQuit(true)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // ── Auto-scroll to top when question changes ───────────────────────────────
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentIndex])

  function handleSelect(optionId: string) {
    setSelectedId(optionId)
  }

  function handleNext() {
    if (!selectedId || isSubmitting) return

    const isCorrect = selectedId === current.correctId
    const newResult: QuestionResult = {
      questionId: current.id,
      axis: current.axis,
      difficulty: current.difficulty,
      selectedId,
      isCorrect,
    }
    const updatedResults = [...results, newResult]

    if (isLastQuestion) {
      // Submit — navigate to result page with results in state
      setIsSubmitting(true)
      setTimeout(() => {
        navigate({
          to: '/placement-result',
          state: { results: updatedResults },
        })
      }, 600)
      return
    }

    // Animate transition to next question
    setVisible(false)
    setTimeout(() => {
      setResults(updatedResults)
      setCurrentIndex((i) => i + 1)
      setSelectedId(null)
      setVisible(true)
    }, 250)
  }

  return (
    <div
      className="min-h-screen relative"
      style={{ backgroundImage: `url(${bannerBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      {/* Blue overlay */}
      <div className="fixed inset-0 bg-blue-700/80" />

      {/* Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl" />
      </div>

      {/* TMA Logo */}
      <img src={tmaLogo} alt="TMA Solutions" className="absolute top-6 left-6 w-45 h-auto z-20" />

      {/* Exit Button */}
      <button
        id="btn-exit-test"
        type="button"
        onClick={() => setShowQuit(true)}
        className="absolute top-6 right-6 z-20 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white/70 hover:text-white transition-colors text-xs font-medium flex items-center gap-1.5 backdrop-blur-md"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
        <span>Thoát</span>
      </button>

      {/* Progress bar — top */}
      <div className="fixed top-0 left-0 right-0 z-30 h-1 bg-white/10">
        <div
          className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-20">
        <div className="w-full max-w-xl">

          {/* Header Stepper & Badge */}
          <div className="flex flex-col items-center mb-8">
            {/* Progress Steps */}
            <div className="flex items-center justify-center mb-6">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${step <= 3
                      ? 'bg-blue-400 text-white shadow-md shadow-blue-900'
                      : 'bg-white/10 text-white/40'
                      }`}
                  >
                    {step < 3 ? '✓' : step}
                  </div>

                  {step < 4 && (
                    <div className="w-10 h-0.5 bg-white/20 mx-2 rounded-full" />
                  )}
                </div>
              ))}
            </div>

            {/* Badge */}
            <div className="flex justify-center w-full">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-blue-200 text-sm font-medium">
                <span className="w-2 h-2 rounded-full bg-blue-300 animate-pulse" />
                Bước 3 / 4 — Bài Test Trình Độ
              </div>
            </div>
          </div>

          {/* Sub-step dots progress & counter bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 overflow-hidden">
              {/* Step dots */}
              <div className="flex gap-1.5 flex-wrap max-w-[280px] sm:max-w-none">
                {PLACEMENT_QUESTIONS.map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-full transition-all duration-300 ${i === currentIndex
                      ? 'w-5 h-2 bg-blue-300'
                      : i < currentIndex
                        ? 'w-2 h-2 bg-blue-400/60'
                        : 'w-2 h-2 bg-white/20'
                      }`}
                  />
                ))}
              </div>
            </div>
            <span className="text-white/40 text-sm font-mono shrink-0 ml-3">
              {currentIndex + 1} / {TOTAL}
            </span>
          </div>

          {/* Question Card */}
          <TestQuestionCard
            question={current}
            questionNumber={currentIndex + 1}
            total={TOTAL}
            selectedId={selectedId}
            onSelect={handleSelect}
            visible={visible}
          />

          {/* Next / Submit Button */}
          <div className={`mt-5 transition-all duration-300 ${selectedId ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
            <button
              id="btn-next-question"
              type="button"
              onClick={handleNext}
              disabled={!selectedId || isSubmitting}
              className={`w-full py-4 px-6 rounded-xl font-bold text-base transition-all duration-300 flex items-center justify-center gap-2.5 shadow-lg
                ${isSubmitting
                  ? 'bg-emerald-500/30 border border-emerald-400/40 text-emerald-300 cursor-default'
                  : 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white hover:scale-[1.01] hover:shadow-xl active:scale-[0.98] shadow-blue-500/20'
                }
              `}
            >
              {isSubmitting ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Đang tổng hợp kết quả...</span>
                </>
              ) : isLastQuestion ? (
                <>
                  <span>Nộp bài</span>
                  <span>🎉</span>
                </>
              ) : (
                <>
                  <span>Câu tiếp theo</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>

            {/* No-back reminder */}
            {!isLastQuestion && (
              <p className="text-center text-[11px] text-white/25 mt-2">
                🔒 Không thể quay lại câu trước — hãy chọn cẩn thận
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Quit Modal */}
      {showQuit && (
        <QuitModal
          onStay={() => setShowQuit(false)}
          onQuit={() => navigate({ to: '/survey' })}
        />
      )}
    </div>
  )
}
