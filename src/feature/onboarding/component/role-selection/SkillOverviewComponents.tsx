import { useState } from 'react'
import {
  type AxisKey,
  type SkillKey,
  type WeightDescription,
  AXIS_TO_SKILL,
  SKILL_COLOR,
  SKILL_BORDER_COLOR,
  SKILL_TEXT_COLOR,
} from './roleTrackUtils'

export function SkillTooltip({ axis, desc }: { axis: string; desc: WeightDescription }) {
  return (
    <div
      className={`
        absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2
        w-72 rounded-xl border bg-white shadow-xl p-3
        pointer-events-none
        ${SKILL_BORDER_COLOR[axis] ?? 'border-gray-200'}
      `}
    >
      {/* Arrow */}
      <div
        className={`absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent`}
        style={{ borderTopColor: 'white', filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.08))' }}
      />
      <p className={`text-[11px] font-bold uppercase tracking-wider mb-1 ${SKILL_TEXT_COLOR[axis] ?? 'text-gray-700'}`}>
        {desc.name}
      </p>
      <p className="text-[11px] text-gray-600 leading-relaxed">{desc.description}</p>
    </div>
  )
}

export function SkillBar({
  axis,
  value,
  weightDescriptions,
  isActive,
  onClick,
}: {
  axis: 'D' | 'C' | 'T' | 'G'
  value: number
  weightDescriptions?: Record<AxisKey, WeightDescription>
  isActive?: boolean
  onClick?: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const desc = weightDescriptions?.[axis]

  return (
    <div
      className="flex items-center gap-1.5 relative group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ cursor: onClick ? 'pointer' : desc ? 'help' : 'default' }}
      onClick={onClick}
    >
      {hovered && desc && <SkillTooltip axis={axis} desc={desc} />}
      <span
        className={`text-[10px] font-bold w-3 flex-shrink-0 select-none transition-colors duration-150 ${desc ? SKILL_TEXT_COLOR[axis] : 'text-gray-500'
          }`}
      >
        {axis}
      </span>
      <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${isActive ? 'bg-indigo-100 ring-1 ring-indigo-200' : 'bg-gray-100'}`}>
        <div
          className={`h-full rounded-full transition-all duration-700 ${SKILL_COLOR[axis]}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className={`text-[10px] font-semibold w-7 text-right ${isActive ? 'text-indigo-600' : 'text-gray-600'}`}>{value}%</span>
    </div>
  )
}

export function SkillLegend({
  weightDescriptions,
  activeSkill,
  onSkillClick,
}: {
  weightDescriptions?: Record<AxisKey, WeightDescription>
  activeSkill?: SkillKey
  onSkillClick?: (skill: SkillKey) => void
}) {
  const items = [
    { key: 'D', label: 'Documentation (D_doc)', color: 'bg-blue-500' },
    { key: 'C', label: 'Communication (C_comm)', color: 'bg-emerald-500' },
    { key: 'T', label: 'Troubleshooting (T_trouble)', color: 'bg-rose-500' },
    { key: 'G', label: 'Domain/Custom (G_custom)', color: 'bg-amber-500' },
  ] as const
  const [hoveredKey, setHoveredKey] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-3">
      {items.map(({ key, label, color }) => {
        const desc = weightDescriptions?.[key]
        const isHov = hoveredKey === key
        const isActive = activeSkill === AXIS_TO_SKILL[key as AxisKey]
        return (
          <div
            key={key}
            className={`flex items-start gap-2.5 relative rounded-lg px-2 py-1.5 transition-colors ${desc ? 'cursor-pointer' : ''} ${isActive ? 'bg-indigo-50' : ''}`}
            onMouseEnter={() => desc && setHoveredKey(key)}
            onMouseLeave={() => setHoveredKey(null)}
            onClick={() => onSkillClick?.(AXIS_TO_SKILL[key as AxisKey])}
          >
            {isHov && desc && <SkillTooltip axis={key} desc={desc} />}
            <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-0.5 transition-transform duration-150 ${color} ${isHov && desc ? 'scale-125' : ''}`} />
            <span className={`text-sm leading-tight transition-colors duration-150 ${(isHov || isActive) && desc ? SKILL_TEXT_COLOR[key as AxisKey] + ' font-semibold' : 'text-gray-600'}`}>
              {desc?.name ?? label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
