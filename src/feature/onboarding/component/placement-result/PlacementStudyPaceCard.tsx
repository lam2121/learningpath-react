import { onboardingTexts } from '../../onboardingTexts'

interface PlacementStudyPaceCardProps {
  dailyMinutes: number
  setDailyMinutes: (minutes: number) => void
  estimatedDays: number
  estimatedMonths: string
}

export function PlacementStudyPaceCard({
  dailyMinutes,
  setDailyMinutes,
  estimatedDays,
  estimatedMonths,
}: PlacementStudyPaceCardProps) {
  return (
    <div className="flex flex-col gap-6 mb-8">
      {/* Daily Study Time Card */}
      <div className="bg-white border border-slate-200/80 shadow-sm rounded-3xl p-8">
        <div className="flex items-center justify-between mb-8">
          <p className="text-sm text-slate-700 font-bold uppercase tracking-wider">
            {onboardingTexts.placementResult.dailyStudyTimeHeader}
          </p>
          <div className="flex flex-col items-end gap-1">
            <div className="px-4 py-1.5 rounded-xl text-sm font-black bg-blue-50 text-[#007aff] border border-blue-200">
              {onboardingTexts.placementResult.minsPerDay(dailyMinutes)}
            </div>
          </div>
        </div>

        <div className="relative mb-2">
          <div className="absolute top-1/2 left-0 right-0 h-2 -mt-1 bg-slate-100 rounded-full" />
          <div
            className="absolute top-1/2 left-0 h-2 -mt-1 bg-gradient-to-r from-blue-400 to-[#007aff] rounded-full pointer-events-none"
            style={{ width: `${((dailyMinutes - 5) / (360 - 5)) * 100}%` }}
          />
          <input
            type="range"
            min={5}
            max={360}
            step={5}
            value={dailyMinutes}
            onChange={(e) => setDailyMinutes(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none bg-transparent cursor-pointer relative z-10 
                       [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 
                       [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#007aff] 
                       [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md"
          />
        </div>
        <div className="flex justify-between text-[11px] text-slate-500 font-bold mt-3">
          <span>{onboardingTexts.placementResult.paceRelaxed}</span>
          <span>{onboardingTexts.placementResult.paceBalanced}</span>
          <span>{onboardingTexts.placementResult.paceIntensive}</span>
        </div>
      </div>

      {/* Estimated Completion Time Card */}
      <div className="bg-white border border-slate-200/80 shadow-sm rounded-3xl p-8 text-center">
        <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-4">
          {onboardingTexts.placementResult.estimatedCompletionHeader}
        </p>

        <div className="flex items-end justify-center gap-2 mb-2">
          <span className="text-5xl font-black text-indigo-700">{estimatedDays}</span>
          <span className="text-slate-500 text-lg font-bold mb-1">{onboardingTexts.placementResult.daysLabel}</span>
        </div>

        <p className="text-slate-600 text-sm mb-6 font-semibold">
          {onboardingTexts.placementResult.monthsAt(estimatedDays, estimatedMonths, dailyMinutes)}
        </p>

        <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-slate-100 border border-slate-200/60 mb-3">
          <div
            className="h-full rounded-full bg-[#007aff] transition-all duration-500"
            style={{ width: `${Math.min((dailyMinutes / 360) * 100, 100)}%` }}
          />
        </div>

        <div className="flex justify-between text-[10px] text-slate-400 font-bold px-1 mb-4">
          <span>5m</span>
          <span>120m</span>
          <span>360m</span>
        </div>

        <div className="text-sm text-slate-600 font-semibold">
          {dailyMinutes >= 120
            ? onboardingTexts.placementResult.paceGreat
            : dailyMinutes >= 45
              ? onboardingTexts.placementResult.paceSteady
              : onboardingTexts.placementResult.paceAddMore}
        </div>
      </div>
    </div>
  )
}
