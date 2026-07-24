import { useState, useEffect, useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'
import tmaLogo from '@/asset/image/tma_logo.png'
import bannerBg from '@/asset/image/banner_background.png'

// ─── Types ────────────────────────────────────────────────────────────────────

type SkillAxis = 'D_doc' | 'C_comm' | 'T_trouble' | 'G_biz'

interface SubQuestion {
  question: string
  options: { id: string; label: string }[]
}

interface SurveyQuestion {
  id: string
  axis: SkillAxis
  question: string
  context: string
  subQuestion: SubQuestion // shown when rating >= 8
}

interface Answer {
  rating: number | null
  subAnswer: string | null // option id
}

// ─── Survey Data (spec: TOEIC_Phase2_Task1.1_ver1.4.html) ────────────────────

const QUESTIONS: SurveyQuestion[] = [
  {
    id: 'q1',
    axis: 'C_comm',
    question: 'Bạn thường xuyên tham gia họp với khách hàng nước ngoài ở mức nào?',
    context: 'Bao gồm: Daily stand-up, Sprint review, Kick-off meeting, Retrospective...',
    subQuestion: {
      question: 'Trong cuộc họp, bạn e ngại nhất điều gì?',
      options: [
        { id: 'a', label: '🙋 Trả lời câu hỏi bất ngờ (Q&A)' },
        { id: 'b', label: '🔧 Diễn đạt thuật ngữ kỹ thuật bằng tiếng Anh' },
        { id: 'c', label: '🗣️ Dẫn dắt, điều phối thảo luận nhóm' },
      ],
    },
  },
  {
    id: 'q2',
    axis: 'C_comm',
    question: 'Bạn phải thuyết trình hoặc demo giải pháp cho khách hàng thường xuyên đến mức nào?',
    context: 'Bao gồm: Demo tính năng mới, bảo vệ kiến trúc, trình bày kết quả Sprint...',
    subQuestion: {
      question: 'Khi Demo, bạn gặp khó khăn nhất ở khâu nào?',
      options: [
        { id: 'a', label: '❓ Trả lời Q&A sau Demo' },
        { id: 'b', label: '📝 Diễn đạt thuật ngữ chuyên ngành' },
        { id: 'c', label: '🐛 Xử lý tình huống Live-bug trong lúc Demo' },
      ],
    },
  },
  {
    id: 'q3',
    axis: 'D_doc',
    question: 'Bạn có thường xuyên viết tài liệu kỹ thuật hoặc báo cáo bằng tiếng Anh không?',
    context: 'Bao gồm: Technical Spec, Bug report, Meeting minutes, Weekly report...',
    subQuestion: {
      question: 'Loại tài liệu nào bạn thấy khó viết nhất?',
      options: [
        { id: 'a', label: '📧 Email chính thức / Formal email' },
        { id: 'b', label: '📋 Technical Specification / Design Doc' },
        { id: 'c', label: '📝 Meeting Minutes & Action Items' },
      ],
    },
  },
  {
    id: 'q4',
    axis: 'T_trouble',
    question: 'Mức độ thường xuyên bạn phải xử lý và báo cáo sự cố kỹ thuật với khách hàng?',
    context: 'Bao gồm: Production outage, SLA breach, Bug escalation, Post-mortem...',
    subQuestion: {
      question: 'Khi xử lý sự cố, khâu nào khó giao tiếp nhất?',
      options: [
        { id: 'a', label: '🔍 Giải thích nguyên nhân lỗi (Root Cause)' },
        { id: 'b', label: '💡 Đề xuất giải pháp và timeline phục hồi' },
        { id: 'c', label: '📊 Viết báo cáo Post-mortem chuyên nghiệp' },
      ],
    },
  },
  {
    id: 'q5',
    axis: 'G_biz',
    question: 'Bạn có tham gia đàm phán yêu cầu hoặc thương thảo hợp đồng với đối tác không?',
    context: 'Bao gồm: Scope negotiation, Deadline extension, Budget discussion...',
    subQuestion: {
      question: 'Tình huống đàm phán nào bạn e ngại nhất?',
      options: [
        { id: 'a', label: '🚫 Từ chối yêu cầu một cách khéo léo (Pushback)' },
        { id: 'b', label: '⏰ Thương lượng gia hạn thời gian / ngân sách' },
        { id: 'c', label: '✍️ Chốt thỏa thuận cuối cùng (Sign-off)' },
      ],
    },
  },
  {
    id: 'q6',
    axis: 'C_comm',
    question: 'Tần suất bạn viết email giao tiếp với khách hàng hoặc đối tác nước ngoài?',
    context: 'Bao gồm: Status update email, apology email, proposal, follow-up...',
    subQuestion: {
      question: 'Loại email nào khó viết nhất với bạn?',
      options: [
        { id: 'a', label: '🙏 Email xin lỗi / giải trình sự cố' },
        { id: 'b', label: '💼 Email đề xuất giải pháp mới' },
        { id: 'c', label: '🤝 Email từ chối lịch sự nhưng vẫn giữ quan hệ' },
      ],
    },
  },
]

const DEEP_DIVE_THRESHOLD = 8

const AXIS_CONFIG: Record<SkillAxis, { label: string; color: string; bg: string; dot: string }> = {
  D_doc:     { label: 'Tài liệu (D)', color: 'text-blue-300',    bg: 'bg-blue-500/20',    dot: 'bg-blue-400' },
  C_comm:    { label: 'Giao tiếp (C)', color: 'text-emerald-300', bg: 'bg-emerald-500/20', dot: 'bg-emerald-400' },
  T_trouble: { label: 'Sự cố (T)',    color: 'text-rose-300',    bg: 'bg-rose-500/20',    dot: 'bg-rose-400' },
  G_biz:     { label: 'Thương mại (G)', color: 'text-amber-300', bg: 'bg-amber-500/20',   dot: 'bg-amber-400' },
}

// ─── Rating Button Component ──────────────────────────────────────────────────

function RatingButtons({
  value,
  onChange,
}: {
  value: number | null
  onChange: (v: number) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      {/* Labels */}
      <div className="flex justify-between text-xs text-white/40 px-1">
        <span>Rất hiếm</span>
        <span>Thường xuyên</span>
      </div>

      {/* Number buttons */}
      <div className="flex gap-1.5 sm:gap-2">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
          const isSelected = value === n
          const isHighlight = n >= DEEP_DIVE_THRESHOLD
          return (
            <button
              key={n}
              id={`rating-btn-${n}`}
              type="button"
              onClick={() => onChange(n)}
              className={`
                flex-1 h-10 sm:h-12 rounded-xl font-bold text-sm sm:text-base transition-all duration-200
                ${isSelected
                  ? isHighlight
                    ? 'bg-amber-400 text-gray-900 shadow-lg shadow-amber-400/30 scale-110'
                    : 'bg-blue-400 text-gray-900 shadow-lg shadow-blue-400/30 scale-110'
                  : isHighlight
                  ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 hover:scale-105 border border-amber-500/30'
                  : 'bg-white/10 text-white/70 hover:bg-white/20 hover:scale-105 border border-white/10'
                }
              `}
            >
              {n}
            </button>
          )
        })}
      </div>

      {/* Deep-dive hint */}
      {value !== null && value >= DEEP_DIVE_THRESHOLD && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/15 border border-amber-500/30 animate-in fade-in slide-in-from-top-2 duration-300">
          <span className="text-amber-400 text-sm">⚡</span>
          <span className="text-xs text-amber-300 font-medium">
            Điểm cao! Hệ thống sẽ hỏi thêm để cá nhân hóa lộ trình của bạn.
          </span>
        </div>
      )}
    </div>
  )
}

// ─── Sub-Question Component ───────────────────────────────────────────────────

function SubQuestionPanel({
  subQ,
  selected,
  onSelect,
}: {
  subQ: SubQuestion
  selected: string | null
  onSelect: (id: string) => void
}) {
  return (
    <div className="mt-6 animate-in fade-in slide-in-from-top-3 duration-400">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
        <span className="text-xs text-amber-300 font-semibold uppercase tracking-widest px-2">Câu hỏi nâng cao</span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
      </div>

      <p className="text-sm font-medium text-white/90 mb-3 text-center">{subQ.question}</p>

      <div className="flex flex-col gap-2">
        {subQ.options.map((opt) => (
          <button
            key={opt.id}
            id={`sub-option-${opt.id}`}
            type="button"
            onClick={() => onSelect(opt.id)}
            className={`
              w-full px-4 py-3 rounded-xl text-left text-sm font-medium transition-all duration-200
              ${selected === opt.id
                ? 'bg-amber-400/25 border-2 border-amber-400 text-white shadow-md shadow-amber-400/10 scale-[1.01]'
                : 'bg-white/5 border border-white/15 text-white/70 hover:bg-white/10 hover:border-white/30 hover:text-white'
              }
            `}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Summary / Result View ────────────────────────────────────────────────────

function SurveyResult({ answers }: { answers: Record<string, Answer> }) {
  const navigate = useNavigate()

  // Compute axis averages
  const axisScores: Record<SkillAxis, { total: number; count: number }> = {
    D_doc: { total: 0, count: 0 },
    C_comm: { total: 0, count: 0 },
    T_trouble: { total: 0, count: 0 },
    G_biz: { total: 0, count: 0 },
  }
  QUESTIONS.forEach((q) => {
    const a = answers[q.id]
    if (a?.rating !== null && a?.rating !== undefined) {
      axisScores[q.axis].total += a.rating
      axisScores[q.axis].count += 1
    }
  })

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-8">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-emerald-500/20 border-2 border-emerald-400/50 flex items-center justify-center text-4xl">
          🎉
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Hoàn thành Khảo sát!</h2>
        <p className="text-blue-200/70 text-sm max-w-sm mx-auto">
          Dưới đây là hồ sơ năng lực giao tiếp của bạn. Hệ thống sẽ dùng dữ liệu này để tạo Placement Test phù hợp.
        </p>
      </div>

      {/* Axis Score Bars */}
      <div className="space-y-4 mb-8">
        {(Object.keys(axisScores) as SkillAxis[]).map((axis) => {
          const { total, count } = axisScores[axis]
          const avg = count > 0 ? total / count : 0
          const pct = (avg / 10) * 100
          const cfg = AXIS_CONFIG[axis]
          return (
            <div key={axis}>
              <div className="flex justify-between items-center mb-1.5">
                <span className={`text-sm font-semibold ${cfg.color}`}>{cfg.label}</span>
                <span className="text-white/60 text-xs font-mono">
                  {avg.toFixed(1)} / 10
                </span>
              </div>
              <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${cfg.dot.replace('bg-', 'bg-')}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Sub-answers summary */}
      {QUESTIONS.some((q) => answers[q.id]?.subAnswer) && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-8">
          <p className="text-amber-300 text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
            <span>⚡</span> Điểm cần cải thiện sâu
          </p>
          <div className="space-y-2">
            {QUESTIONS.map((q) => {
              const a = answers[q.id]
              if (!a?.subAnswer) return null
              const opt = q.subQuestion.options.find((o) => o.id === a.subAnswer)
              return (
                <div key={q.id} className="flex items-start gap-2 text-sm text-white/80">
                  <span className="text-amber-400 mt-0.5 flex-shrink-0">→</span>
                  <span>{opt?.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <button
        id="btn-go-to-placement"
        onClick={() => navigate({ to: '/placement-test' })}
        className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold text-base shadow-lg shadow-blue-500/20 hover:shadow-xl hover:scale-[1.01] transition-all duration-300 flex items-center justify-center gap-2"
      >
        <span>Bắt đầu Placement Test</span>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </button>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function DynamicSurveyForm() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, Answer>>(
    Object.fromEntries(QUESTIONS.map((q) => [q.id, { rating: null, subAnswer: null }]))
  )
  const [direction, setDirection] = useState<'forward' | 'back'>('forward')
  const [animating, setAnimating] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const total = QUESTIONS.length
  const current = QUESTIONS[currentIndex]
  const currentAnswer = answers[current?.id ?? ''] ?? { rating: null, subAnswer: null }
  const needsSubAnswer =
    (currentAnswer.rating ?? 0) >= DEEP_DIVE_THRESHOLD && currentAnswer.subAnswer === null
  const canProceed = currentAnswer.rating !== null && !needsSubAnswer

  function updateRating(rating: number) {
    setAnswers((prev) => ({
      ...prev,
      [current.id]: { ...prev[current.id], rating, subAnswer: rating < DEEP_DIVE_THRESHOLD ? null : prev[current.id].subAnswer },
    }))
  }

  function updateSubAnswer(subAnswer: string) {
    setAnswers((prev) => ({
      ...prev,
      [current.id]: { ...prev[current.id], subAnswer },
    }))
  }

  function animateTransition(cb: () => void) {
    if (animating) return
    setAnimating(true)
    setTimeout(() => {
      cb()
      setAnimating(false)
    }, 250)
  }

  function handleNext() {
    if (!canProceed) return
    if (currentIndex < total - 1) {
      setDirection('forward')
      animateTransition(() => setCurrentIndex((i) => i + 1))
    } else {
      setIsDone(true)
    }
  }

  function handleBack() {
    if (currentIndex === 0) return
    setDirection('back')
    animateTransition(() => setCurrentIndex((i) => i - 1))
  }

  // Keyboard shortcut: Enter to proceed
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Enter' && canProceed) handleNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [canProceed, currentIndex])

  const progress = isDone ? 100 : ((currentIndex) / total) * 100
  const axisConfig = current ? AXIS_CONFIG[current.axis] : null

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

      {/* Progress bar — top */}
      <div className="fixed top-0 left-0 right-0 z-30 h-1 bg-white/10">
        
        <div
          className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-20">
        <div className="w-full max-w-lg">
          {/* Header */}
<div className="flex flex-col items-center mb-8">
  {/* Progress Steps */}
  <div className="flex items-center justify-center mb-6">
    {[1, 2, 3, 4].map((step) => (
      <div key={step} className="flex items-center">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
            step === 1 || step === 2
              ? "bg-blue-400 text-white shadow-md shadow-blue-900"
              : "bg-white/10 text-white/40"
          }`}
        >
          {step === 1 ? "✓" : step}
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
      Bước 2 / 4 — Thực Hiện Khảo Sát
    </div>
  </div>
</div>
          {isDone ? (
            <SurveyResult answers={answers} />
          ) : (
            <>
              {/* Step counter */}
              <div className="flex items-center justify-between mb-6">
                
                <div className="flex items-center gap-2">
                  {/* Step dots */}
                  <div className="flex gap-1.5">
                    {QUESTIONS.map((_, i) => (
                      <div
                        key={i}
                        className={`rounded-full transition-all duration-300 ${
                          i === currentIndex
                            ? 'w-5 h-2 bg-blue-300'
                            : i < currentIndex
                            ? 'w-2 h-2 bg-blue-400/60'
                            : 'w-2 h-2 bg-white/20'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <span className="text-white/40 text-sm font-mono">
                  {currentIndex + 1} / {total}
                </span>
              </div>

              {/* Card */}
              <div
                ref={cardRef}
                className={`bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-7 shadow-2xl transition-all duration-250 ${
                  animating
                    ? direction === 'forward'
                      ? 'opacity-0 translate-x-4'
                      : 'opacity-0 -translate-x-4'
                    : 'opacity-100 translate-x-0'
                }`}
              >
                {/* Axis badge */}
                {axisConfig && (
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${axisConfig.bg} border border-white/10 mb-4`}>
                    <div className={`w-2 h-2 rounded-full ${axisConfig.dot}`} />
                    <span className={`text-xs font-semibold ${axisConfig.color}`}>{axisConfig.label}</span>
                  </div>
                )}

                {/* Question */}
                <h2 className="text-lg sm:text-xl font-bold text-white leading-snug mb-2">
                  {current.question}
                </h2>
                <p className="text-sm text-white/50 mb-6">{current.context}</p>

                {/* Rating */}
                <RatingButtons value={currentAnswer.rating} onChange={updateRating} />

                {/* Sub-question (deep-dive) */}
                {(currentAnswer.rating ?? 0) >= DEEP_DIVE_THRESHOLD && (
                  <SubQuestionPanel
                    subQ={current.subQuestion}
                    selected={currentAnswer.subAnswer}
                    onSelect={updateSubAnswer}
                  />
                )}
              </div>

              {/* Navigation */}
              <div className="flex items-center gap-3 mt-5">
                <button
                  id="btn-survey-back"
                  type="button"
                  onClick={handleBack}
                  disabled={currentIndex === 0}
                  className="w-12 h-12 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white/60 hover:text-white transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <button
                  id="btn-survey-next"
                  type="button"
                  onClick={handleNext}
                  disabled={!canProceed}
                  className="flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold text-sm shadow-lg shadow-blue-500/20 hover:shadow-xl hover:scale-[1.01] transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none flex items-center justify-center gap-2"
                >
                  {currentIndex < total - 1 ? (
                    <>
                      <span>Câu tiếp theo</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  ) : (
                    <>
                      <span>Hoàn thành khảo sát</span>
                      <span>🎉</span>
                    </>
                  )}
                </button>
              </div>

              {/* Hint */}
              {!canProceed && currentAnswer.rating !== null && (
                <p className="text-center text-xs text-amber-300/70 mt-3 animate-pulse">
                  ☝️ Hãy chọn câu trả lời nâng cao để tiếp tục
                </p>
              )}
              {currentAnswer.rating === null && (
                <p className="text-center text-xs text-white/30 mt-3">
                  Chọn điểm từ 1-10 để tiếp tục
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
