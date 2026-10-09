import type { JobRole } from '../../api/onboardingApi'
import { onboardingTexts } from '../../onboardingTexts'
import { ROLE_PALETTE } from './roleTrackUtils'

interface RoleCardItemProps {
  role: JobRole
  paletteIdx: number
  isSelected: boolean
  isHovered: boolean
  onSelect: () => void
  onHover: () => void
  onLeave: () => void
}

export function RoleCardItem({
  role,
  paletteIdx,
  isSelected,
  isHovered,
  onSelect,
  onHover,
  onLeave,
}: RoleCardItemProps) {
  const palette = ROLE_PALETTE[paletteIdx % ROLE_PALETTE.length]

  return (
    <div
      id={`role-card-${role.id}`}
      onClick={onSelect}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className={`
        relative min-w-0 cursor-pointer rounded-xl border-2 p-3 sm:p-4 2xl:p-5 transition-all duration-200 select-none bg-white
        ${isSelected
          ? 'border-indigo-500 bg-indigo-50/30 shadow-md scale-[1.02]'
          : isHovered
            ? 'border-gray-300 shadow-sm scale-[1.01]'
            : 'border-gray-100 hover:border-gray-300'
        }
      `}
    >
      <div className="flex items-center gap-3 pr-4">
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${palette.color} flex items-center justify-center text-xl shadow-sm flex-shrink-0`}>
          {palette.icon}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className={`font-bold text-sm leading-tight truncate ${isSelected ? 'text-indigo-600' : 'text-gray-900'}`}>{role.name}</h3>
          <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${isSelected ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
            {onboardingTexts.roleSelection.careerTrackBadge}
          </span>
        </div>
      </div>

      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-1/2 right-4 -translate-y-1/2">
          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      )}
    </div>
  )
}
