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
        relative min-w-0 cursor-pointer rounded-2xl border-2 p-3 sm:p-4 2xl:p-5 card-interactive-subtle select-none bg-card transition-all duration-200
        ${isSelected
          ? 'border-primary bg-primary/10 shadow-md ring-2 ring-primary/20 scale-[1.02]'
          : isHovered
            ? 'border-border shadow-xs scale-[1.01]'
            : 'border-border/60 hover:border-border'
        }
      `}
    >
      <div className="flex items-center gap-3 pr-4">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${palette.color} flex items-center justify-center text-xl shadow-xs flex-shrink-0`}>
          {palette.icon}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className={`font-bold text-sm leading-tight truncate ${isSelected ? 'text-primary' : 'text-foreground'}`}>{role.name}</h3>
          <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${isSelected ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
            {onboardingTexts.roleSelection.careerTrackBadge}
          </span>
        </div>
      </div>

      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-1/2 right-4 -translate-y-1/2">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      )}
    </div>
  )
}
