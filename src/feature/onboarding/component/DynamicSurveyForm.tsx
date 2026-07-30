import { useState, useEffect, useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'
import tmaLogo from '@/asset/image/tma_logo.png'
import bannerBg from '@/asset/image/banner_background.png'
import {
  fetchSurveyQuestions,
  type SurveyQuestion,
  type SkillAxis,
  type SubQuestion,
} from '../api/onboardingApi'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Answer {
  rating: number | null
  subAnswer: string | null // option id
}

// ─── Fallback Survey Data ──────────────────────────────────────────────────

const FALLBACK_QUESTIONS: SurveyQuestion[] = [
  {
    id: '1',
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
    id: '2',
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
    id: '3',
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
    id: '4',
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
    id: '5',
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
    id: '6',
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
  D_doc:     { label: 'Documentation (D)', color: 'text-blue-300',    bg: 'bg-blue-500/20',    dot: 'bg-blue-400' },
  C_comm:    { label: 'Communication (C)', color: 'text-emerald-300', bg: 'bg-emerald-500/20', dot: 'bg-emerald-400' },
  T_trouble: { label: 'Troubleshooting (T)', color: 'text-rose-300',  bg: 'bg-rose-500/20',    dot: 'bg-rose-400' },
  G_biz:     { label: 'Business (G)',      color: 'text-amber-300',   bg: 'bg-amber-500/20',   dot: 'bg-amber-400' },
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
        <span>Rarely</span>
        <span>Very Often</span>
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
            High score! The system will ask a follow-up question to personalize your learning path.
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
  subQ?: SubQuestion
  selected: string | null
  onSelect: (id: string) => void
}) {
  if (!subQ) return null
  return (
    <div className="mt-6 animate-in fade-in slide-in-from-top-3 duration-400">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
        <span className="text-xs text-amber-300 font-semibold uppercase tracking-widest px-2">Follow-up Question</span>
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

function SurveyResult({
  questions,
  answers
}: {
  questions: SurveyQuestion[]
  answers: Record<string, Answer>
}) {
  const navigate = useNavigate()

  // Compute axis averages
  const axisScores: Record<SkillAxis, { total: number; count: number }> = {
    D_doc: { total: 0, count: 0 },
    C_comm: { total: 0, count: 0 },
    T_trouble: { total: 0, count: 0 },
    G_biz: { total: 0, count: 0 },
  }
  questions.forEach((q) => {
    const a = answers[q.id]
    if (a?.rating !== null && a?.rating !== undefined && axisScores[q.axis]) {
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
        <h2 className="text-2xl font-bold text-white mb-2">Survey Complete!</h2>
        <p className="text-blue-200/70 text-sm max-w-sm mx-auto">
          Here is your communication skill profile. The system will use this data to create a personalized Placement Test.
        </p>
      </div>

      {/* Axis Score Bars */}
      <div className="space-y-4 mb-8">
        {(Object.keys(axisScores) as SkillAxis[]).map((axis) => {
          const { total, count } = axisScores[axis]
          const avg = count > 0 ? total / count : 0
          const pct = (avg / 10) * 100
          const cfg = AXIS_CONFIG[axis] ?? { label: axis, color: 'text-blue-300', bg: 'bg-blue-500/20', dot: 'bg-blue-400' }
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
                  className={`h-full rounded-full transition-all duration-700 ${cfg.dot}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Sub-answers summary */}
      {questions.some((q) => answers[q.id]?.subAnswer) && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-8">
          <p className="text-amber-300 text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
            <span>⚡</span> Areas to improve
          </p>
          <div className="space-y-2">
            {questions.map((q) => {
              const a = answers[q.id]
              if (!a?.subAnswer || !q.subQuestion) return null
              const opt = q.subQuestion.options.find((o) => o.id === a.subAnswer || o.label === a.subAnswer)
              const displayLabel = opt ? opt.label : a.subAnswer
              return (
                <div key={q.id} className="flex items-start gap-2 text-sm text-white/80">
                  <span className="text-amber-400 mt-0.5 flex-shrink-0">→</span>
                  <span>{displayLabel}</span>
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
        <span>Start Placement Test</span>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </button>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function DynamicSurveyForm() {
  const navigate = useNavigate()
  const [questions, setQuestions] = useState<SurveyQuestion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, Answer>>({})
  const [direction, setDirection] = useState<'forward' | 'back'>('forward')
  const [animating, setAnimating] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let isMounted = true
    fetchSurveyQuestions()
      .then((data) => {
        if (!isMounted) return
        if (data && data.length > 0) {
          setQuestions(data)
          setAnswers(Object.fromEntries(data.map((q) => [q.id, { rating: null, subAnswer: null }])))
        } else {
          setQuestions(FALLBACK_QUESTIONS)
          setAnswers(Object.fromEntries(FALLBACK_QUESTIONS.map((q) => [q.id, { rating: null, subAnswer: null }])))
        }
        setIsLoading(false)
      })
      .catch((err) => {
        if (!isMounted) return
        console.warn('Could not fetch survey from backend API, using fallback questions:', err)
        setQuestions(FALLBACK_QUESTIONS)
        setAnswers(Object.fromEntries(FALLBACK_QUESTIONS.map((q) => [q.id, { rating: null, subAnswer: null }])))
        setIsLoading(false)
      })
    return () => { isMounted = false }
  }, [])

  const total = questions.length
  const current = questions[currentIndex]
  const currentAnswer = answers[current?.id ?? ''] ?? { rating: null, subAnswer: null }
  const needsSubAnswer =
    (currentAnswer.rating ?? 0) >= DEEP_DIVE_THRESHOLD && currentAnswer.subAnswer === null && Boolean(current?.subQuestion)
  const canProceed = currentAnswer.rating !== null && !needsSubAnswer

  function updateRating(rating: number) {
    if (!current) return
    setAnswers((prev) => ({
      ...prev,
      [current.id]: {
        ...prev[current.id],
        rating,
        subAnswer: rating < DEEP_DIVE_THRESHOLD ? null : prev[current.id]?.subAnswer ?? null,
      },
    }))
  }

  function updateSubAnswer(subAnswer: string) {
    if (!current) return
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
    if (currentIndex === 0) {
      navigate({ to: '/onboarding/role-selection' })
      return
    }
    setDirection('back')
    animateTransition(() => setCurrentIndex((i) => i - 1))
  }

  // Save results temporarily on complete (do not persist to DB until placement test is done)
  useEffect(() => {
    if (isDone && questions.length > 0) {
      const payload = questions.map((q) => {
        const a = answers[q.id]
        let subAnswerText: string | null = null
        if (a?.subAnswer) {
          const opt = q.subQuestion?.options.find((o) => o.id === a.subAnswer || o.label === a.subAnswer)
          subAnswerText = opt ? opt.label : a.subAnswer
        }
        return {
          survey_id: parseInt(q.id, 10) || 1,
          rating: a?.rating ?? 0,
          sub_answer: subAnswerText,
        }
      })
      localStorage.setItem('pending_survey_answers', JSON.stringify(payload))
    }
  }, [isDone, questions, answers])



  // Keyboard shortcut: Enter to proceed
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Enter' && canProceed) handleNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [canProceed, currentIndex])

  const progress = isDone ? 100 : total > 0 ? (currentIndex / total) * 100 : 0
  const axisConfig = current ? (AXIS_CONFIG[current.axis] ?? { label: current.axis, color: 'text-blue-300', bg: 'bg-blue-500/20', dot: 'bg-blue-400' }) : null

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

      {/* Back to Role Selection Button */}
      <button
        id="btn-back-to-role-selection"
        type="button"
        onClick={() => navigate({ to: '/onboarding/role-selection' })}
        className="absolute top-6 right-6 z-20 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white/70 hover:text-white transition-colors text-xs font-medium flex items-center gap-1.5 backdrop-blur-md"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span>Change Career Track</span>
      </button>


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
          {/* Header Stepper */}
          <div className="flex flex-col items-center mb-8">
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
                Step 2 / 4 — Complete the Survey
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-12 shadow-2xl text-center">
              <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white font-medium text-sm">Loading survey questions...</p>
            </div>
          ) : isDone ? (
            <SurveyResult questions={questions} answers={answers} />
          ) : current ? (
            <>
              {/* Step counter */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    {questions.map((_, i) => (
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
                {(currentAnswer.rating ?? 0) >= DEEP_DIVE_THRESHOLD && current.subQuestion && (
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
                  className="w-12 h-12 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white/60 hover:text-white transition-all duration-200 flex items-center justify-center"
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
                      <span>Next Question</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  ) : (
                    <>
                      <span>Complete Survey</span>
                      <span>🎉</span>
                    </>
                  )}
                </button>
              </div>

              {/* Hint */}
              {!canProceed && currentAnswer.rating !== null && (
                <p className="text-center text-xs text-amber-300/70 mt-3 animate-pulse">
                  ☝️ Please select a follow-up answer to continue
                </p>
              )}
              {currentAnswer.rating === null && (
                <p className="text-center text-xs text-white/30 mt-3">
                  Select a score from 1-10 to continue
                </p>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
