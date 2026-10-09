import { useState, useEffect } from 'react';
import { cn } from '@/shadcn/lib/util';
import { Label } from '@/shadcn/component/ui/label';
import { Alert, AlertDescription } from '@/shadcn/component/ui/alert';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shadcn/component/ui/tooltip';
import { AlertCircle, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import useSkillDistribution from '@/hooks/useSkillDistribution';
import { DEFAULT_BASELINE, type BudgetVector, type SkillKey } from '../api/adminApi';

const skillInfo = {
  D_doc: { label: 'Documentation (D)', color: '#3b82f6', icon: '📄' },
  C_comm: { label: 'Communication (C)', color: '#10b981', icon: '💬' },
  T_trouble: { label: 'Troubleshooting (T)', color: '#f97316', icon: '⚠️' },
  G_custom: { label: 'Growth (G)', color: '#8b5cf6', icon: '💰' },
};



interface SkillDistributionVisualizerProps {
  skillValues: Record<keyof typeof skillInfo, number>;
  onSegmentClick: (skill: keyof typeof skillInfo) => void;
}

const SkillDistributionVisualizer = ({
  skillValues,
  onSegmentClick,
}: SkillDistributionVisualizerProps) => {
  const currentTotal = Object.values(skillValues).reduce((acc, v) => acc + (Number(v) || 0), 0);
  const data = Object.entries(skillValues).map(([skill, value]) => ({
    name: skill,
    value: Number(value) || 0,
    label: skillInfo[skill as keyof typeof skillInfo].label.split(' ')[0],
  }));

  return (
    <div className="p-4 rounded-xl border dark:border-gray-700 bg-white dark:bg-gray-900">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
          Skill Distribution
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="w-4 h-4 text-gray-500 cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p>This distribution determines how many of the 20 course topics target each skill.</p>
              <p className="mt-2"><strong>Note:</strong> User milestones are determined by the placement test, not this distribution.</p>
            </TooltipContent>
          </Tooltip>
        </h4>
        <span
          className={cn(
            "text-xs font-semibold px-2.5 py-1 rounded-full border",
            currentTotal === 20
              ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
              : "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
          )}
        >
          Total: {currentTotal} / 20 topics
        </span>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            onClick={(e) => onSegmentClick(e.name as keyof typeof skillInfo)}
            label={({ name, value }) => `
              ${skillInfo[name as keyof typeof skillInfo].icon} 
              ${value}`
            }
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={skillInfo[entry.name as keyof typeof skillInfo].color}
              />
            ))}
          </Pie>
          <RechartsTooltip
            formatter={(value, name) => [
              `${value} topics (${Number(value) * 5}%)`,
              skillInfo[name as keyof typeof skillInfo].label,
            ]}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

interface SkillInputsProps {
  skillValues: Record<keyof typeof skillInfo, number>;
  updateSkillValue: (skill: keyof typeof skillInfo, value: number) => void;
  disabled?: boolean;
}

const SkillInputs = ({ skillValues, updateSkillValue, disabled }: SkillInputsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 p-4 rounded-xl border dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
      {Object.entries(skillValues).map(([skill, value]) => (
        <div key={skill} className="space-y-2 min-w-0">
          <Label className="font-medium text-xs sm:text-[13px] text-gray-700 dark:text-gray-300 flex items-center justify-between gap-1 whitespace-nowrap">
            <span className="flex items-center gap-1 whitespace-nowrap shrink-0">
              <span className="shrink-0">{skillInfo[skill as keyof typeof skillInfo].icon}</span>
              <span className="whitespace-nowrap">{skillInfo[skill as keyof typeof skillInfo].label}</span>
            </span>
            <span className="text-[11px] text-gray-400 dark:text-gray-500 whitespace-nowrap shrink-0">({value * 5}%)</span>
          </Label>
          <div className="relative flex items-center">
            <input
              type="number"
              min="0"
              max="20"
              step="1"
              value={value}
              onChange={(e) => updateSkillValue(skill as keyof typeof skillInfo, Number(e.target.value))}
              onBlur={(e) => {
                let val = Math.round(Number(e.target.value));
                val = Math.max(0, Math.min(20, isNaN(val) ? 0 : val));
                updateSkillValue(skill as keyof typeof skillInfo, val);
              }}
              disabled={disabled}
              className="w-full p-2 pr-14 border dark:border-gray-700 rounded text-center dark:bg-gray-800 dark:text-gray-100 font-medium"
            />
            <span className="absolute right-3 text-xs text-gray-400 dark:text-gray-500 pointer-events-none">
              topics
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

interface SkillDistributionTableProps {
  skillValues: Record<keyof typeof skillInfo, number>;
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

const SkillDistributionTable = ({ skillValues, isCollapsed, toggleCollapse }: SkillDistributionTableProps) => {
  return (
    <div className="p-4 rounded-xl border dark:border-gray-700 bg-white dark:bg-gray-900 mt-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-900 dark:text-gray-100">Skill Distribution Table</h4>
        <button onClick={toggleCollapse} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>
      {!isCollapsed && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                <th className="pb-2">Skill</th>
                <th className="pb-2 text-center">Topics (out of 20)</th>
                <th className="pb-2 text-center">Equivalent %</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(skillValues).map(([skill, value]) => {
                const isBelowFloor = value < 2;
                return (
                  <tr key={skill} className="border-b border-gray-50 dark:border-gray-800">
                    <td className="py-2 font-medium flex items-center gap-2 text-gray-900 dark:text-gray-100">
                      {skillInfo[skill as keyof typeof skillInfo].icon}
                      {skillInfo[skill as keyof typeof skillInfo].label}
                    </td>
                    <td className={cn('py-2 text-center font-medium', isBelowFloor ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300')}>
                      {value} {value === 1 ? 'topic' : 'topics'}
                    </td>
                    <td className="py-2 text-center text-gray-500 dark:text-gray-400">
                      {value * 5}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};


interface WarningMessageProps {
  message: string;
  isBlocking: boolean;
}

const WarningMessage = ({ message, isBlocking }: WarningMessageProps) => {
  return (
    <Alert className="mt-3 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950">
      <AlertCircle className="h-4 w-4 text-red-600" />
      <AlertDescription className="text-red-800 dark:text-red-200">
        {message}
        {isBlocking && <span className="font-bold ml-1">(Form submission blocked until resolved)</span>}
      </AlertDescription>
    </Alert>
  );
};

interface BudgetSlidersGroupProps {
  initialBudget?: BudgetVector;
  onChange: (budget: BudgetVector) => void;
  disabled?: boolean;
}

export function BudgetSlidersGroup({ initialBudget, onChange, disabled }: BudgetSlidersGroupProps) {
  const {
    skillValues,
    updateSkillValue,
    showWarning,
    warningMessage,
    isFloorViolated,
    isSumViolated,
  } = useSkillDistribution({ initialValues: initialBudget ?? DEFAULT_BASELINE });

  const [isTableCollapsed, setIsTableCollapsed] = useState<boolean>(true);


  // Sync skillValues back to the v2.1 BudgetVector in percentages (multiplied by 5)
  useEffect(() => {
    const budget: BudgetVector = { ...DEFAULT_BASELINE };
    (Object.keys(skillInfo) as SkillKey[]).forEach((skill) => {
      budget[skill] = (skillValues[skill] ?? 5) * 5;
    });
    onChange(budget);
  }, [skillValues, onChange]);

  return (
    <div className="space-y-6">


      {/* Interactive Visual Breakdown (Pie Chart) */}
      <SkillDistributionVisualizer
        skillValues={skillValues}
        onSegmentClick={(skill) => {
          alert(`${skillInfo[skill].label}: ${skillValues[skill]} topics (${skillValues[skill] * 5}%)`);
        }}
      />

      {/* Skill Distribution Table (Collapsible) */}
      <SkillDistributionTable
        skillValues={skillValues}
        isCollapsed={isTableCollapsed}
        toggleCollapse={() => setIsTableCollapsed(!isTableCollapsed)}
      />



      {/* Skill Inputs */}
      <SkillInputs
        skillValues={skillValues}
        updateSkillValue={updateSkillValue}
        disabled={disabled}
      />

      {/* Warning Message (Blocking) */}
      {showWarning && (
        <WarningMessage
          message={warningMessage}
          isBlocking={isFloorViolated || isSumViolated}
        />
      )}
    </div>
  );
}