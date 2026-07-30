import type { TestQuestion } from '../api/placementTestTypes'

const AXIS_META: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  D_doc:     { label: 'Documentation', color: 'text-blue-300',    bg: 'bg-blue-500/20',    dot: 'bg-blue-400' },
  C_comm:    { label: 'Communication', color: 'text-emerald-300', bg: 'bg-emerald-500/20', dot: 'bg-emerald-400' },
  T_trouble: { label: 'Troubleshooting', color: 'text-rose-300',  bg: 'bg-rose-500/20',    dot: 'bg-rose-400' },
  G_biz:     { label: 'Business',       color: 'text-amber-300',  bg: 'bg-amber-500/20',   dot: 'bg-amber-400' },
}

/** Map level 1-10 to a visible tier (1, 2, or 3 dots) */
function getDifficultyTier(level: number): 1 | 2 | 3 {
  if (level <= 3) return 1
  if (level <= 7) return 2
  return 3
}

const TIER_LABEL: Record<1 | 2 | 3, string> = {
  1: 'Easy',
  2: 'Medium',
  3: 'Hard',
}

interface TestQuestionCardProps {
  question: TestQuestion
  questionNumber: number
  total: number
  selectedId: string | null
  onSelect: (optionId: string) => void
  visible: boolean
}

export function TestQuestionCard({
  question,
  questionNumber,
  total,
  selectedId,
  onSelect,
  visible,
}: TestQuestionCardProps) {
  const axis = AXIS_META[question.axis]
  const optionLabels = ['A', 'B', 'C', 'D']

  return (
    <div
      className={`transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
    >
      {/* Card */}
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl">
        {/* Top meta */}
        <div className="flex items-center justify-between mb-6">
          {/* Axis badge */}
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${axis.bg} border border-white/10`}>
            <div className={`w-2 h-2 rounded-full ${axis.dot}`} />
            <span className={`text-xs font-semibold ${axis.color}`}>{axis.label}</span>
          </div>

          {/* Difficulty dots — 1-3: 1 dot | 4-7: 2 dots | 8-10: 3 dots */}
          <div className="flex items-center gap-2">
            {Array.from({ length: 3 }, (_, i) => {
              const tier = getDifficultyTier(question.difficulty)
              return (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i < tier ? axis.dot : 'bg-white/20'
                  }`}
                />
              )
            })}
            <span className="text-xs text-white/40 ml-1">
              {TIER_LABEL[getDifficultyTier(question.difficulty)]}
              <span className="text-white/20 ml-1">Lv {question.difficulty}</span>
            </span>
          </div>
        </div>

        {/* Question */}
        <h2 className="text-base sm:text-lg font-bold text-white leading-snug mb-6">
          <span className="text-white/40 mr-2">Q{questionNumber}.</span>
          {question.question}
        </h2>

        {/* Options */}
        <div className="space-y-3">
          {question.options.map((opt, idx) => {
            const isSelected = selectedId === opt.id
            return (
              <button
                key={opt.id}
                id={`option-${opt.id}`}
                type="button"
                onClick={() => onSelect(opt.id)}
                className={`
                  w-full flex items-start gap-4 px-5 py-4 rounded-xl text-left transition-all duration-200
                  ${isSelected
                    ? `${axis.bg} border-2 ${axis.dot.replace('bg-', 'border-').replace('-400', '-400/80')} text-white shadow-lg scale-[1.01]`
                    : 'bg-white/5 border border-white/15 text-white/70 hover:bg-white/10 hover:border-white/30 hover:text-white hover:scale-[1.005]'
                  }
                `}
              >
                {/* Option letter */}
                <span
                  className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${isSelected ? 'bg-white/20 text-white' : 'bg-white/10 text-white/50'
                    }`}
                >
                  {optionLabels[idx]}
                </span>
                <span className="text-sm sm:text-base leading-snug mt-0.5">{opt.text}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Progress sub-text */}
      <p className="text-center text-xs text-white/30 mt-4">
        Question {questionNumber} / {total} — Select an answer to continue
      </p>
    </div>
  )
}
