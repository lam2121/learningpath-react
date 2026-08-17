import type { TestQuestion } from '../api/placementTestTypes'

const AXIS_META: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  D_doc: { label: 'Documentation', color: 'text-blue-700', bg: 'bg-blue-50', dot: 'bg-blue-500' },
  C_comm: { label: 'Communication', color: 'text-emerald-700', bg: 'bg-emerald-50', dot: 'bg-emerald-500' },
  T_trouble: { label: 'Troubleshooting', color: 'text-rose-700', bg: 'bg-rose-50', dot: 'bg-rose-500' },
  G_custom: { label: 'Business', color: 'text-amber-700', bg: 'bg-amber-50', dot: 'bg-amber-500' },
}

/** Map string level to a 1-3 tier index for dot display */
function getDifficultyTier(level: string): 1 | 2 | 3 {
  switch (level) {
    case 'Easy': return 1
    case 'Medium': return 2
    case 'Hard': return 3
    default: return 1
  }
}

const TIER_LABEL: Record<1 | 2 | 3, string> = {
  1: 'Easy',
  2: 'Medium',
  3: 'Hard',
}

const TIER_COLOR: Record<1 | 2 | 3, string> = {
  1: 'text-emerald-600',
  2: 'text-blue-600',
  3: 'text-orange-500',
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
      {/* Card */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-xl">
        {/* Top meta */}
        <div className="flex items-center justify-between mb-6">
          {/* Axis badge */}
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${axis.bg} border border-gray-100`}>
            <div className={`w-2 h-2 rounded-full ${axis.dot}`} />
            <span className={`text-xs font-semibold ${axis.color}`}>{axis.label}</span>
          </div>

          {/* Difficulty dots — Easy | Medium | Hard */}
          <div className="flex items-center gap-2">
            {Array.from({ length: 3 }, (_, i) => {
              const tier = getDifficultyTier(question.difficulty)
              return (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${i < tier ? axis.dot : 'bg-gray-200'
                    }`}
                />
              )
            })}
            <span className={`text-xs font-semibold ml-1 ${TIER_COLOR[getDifficultyTier(question.difficulty)]}`}>
              {TIER_LABEL[getDifficultyTier(question.difficulty)]}
            </span>
          </div>
        </div>

        {/* Question */}
        <h2 className="text-base sm:text-lg font-bold text-gray-900 leading-snug mb-6">
          <span className="text-gray-400 mr-2">Q{questionNumber}.</span>
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
                    ? `${axis.bg} border-2 ${axis.dot.replace('bg-', 'border-')} text-gray-900 shadow-md scale-[1.01]`
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900 hover:scale-[1.005]'
                  }
                `}
              >
                {/* Option letter */}
                <span
                  className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${isSelected ? 'bg-white text-gray-900 shadow-sm border border-gray-200' : 'bg-gray-100 text-gray-500'
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
      <p className="text-center text-xs text-gray-400 mt-4">
        Question {questionNumber} / {total} — Select an answer to continue
      </p>
    </div>
  )
}
