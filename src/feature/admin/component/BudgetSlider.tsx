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
  const data = Object.entries(skillValues).map(([skill, value]) => ({
    name: skill,
    value,
    label: skillInfo[skill as keyof typeof skillInfo].label.split(' ')[0],
  }));

  return (
    <div className="p-4 rounded-xl border bg-white">
      <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
        Skill Distribution
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="w-4 h-4 text-gray-500 cursor-help" />
          </TooltipTrigger>
          <TooltipContent>
            <p>This distribution is used to generate topics and lesson shells for the role.</p>
            <p className="mt-2"><strong>Note:</strong> User milestones are determined by the placement test, not this distribution.</p>
          </TooltipContent>
        </Tooltip>
      </h4>
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
            label={({ name, percent }) => `
              ${skillInfo[name as keyof typeof skillInfo].icon} 
              ${Math.round((percent ?? 0) * 100)}%`
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
              `${value}%`,
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl border bg-gray-50">
      {Object.entries(skillValues).map(([skill, value]) => (
        <div key={skill} className="space-y-2">
          <Label className="font-medium text-gray-700 flex items-center gap-2">
            {skillInfo[skill as keyof typeof skillInfo].icon}
            {skillInfo[skill as keyof typeof skillInfo].label}
          </Label>
          <input
            type="number"
            min="0"
            max="100"
            step="5"
            value={value}
            onChange={(e) => updateSkillValue(skill as keyof typeof skillInfo, Number(e.target.value))}
            onBlur={(e) => {
              let val = Number(e.target.value);
              val = Math.round(val / 5) * 5;
              val = Math.max(0, Math.min(100, val));
              updateSkillValue(skill as keyof typeof skillInfo, val);
            }}
            disabled={disabled}
            className="w-full p-2 border rounded text-center"
          />
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
    <div className="p-4 rounded-xl border bg-white mt-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-900">Skill Distribution Table</h4>
        <button onClick={toggleCollapse} className="text-gray-500 hover:text-gray-700">
          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>
      {!isCollapsed && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="pb-2">Skill</th>
                <th className="pb-2 text-center">Value</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(skillValues).map(([skill, value]) => {
                const isBelowFloor = value < 10;
                return (
                  <tr key={skill} className="border-b border-gray-50">
                    <td className="py-2 font-medium flex items-center gap-2">
                      {skillInfo[skill as keyof typeof skillInfo].icon}
                      {skillInfo[skill as keyof typeof skillInfo].label}
                    </td>
                    <td className={cn('py-2 text-center', isBelowFloor ? 'text-red-600' : 'text-gray-700')}>{value}%</td>
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
    <Alert className="mt-3 border-red-200 bg-red-50">
      <AlertCircle className="h-4 w-4 text-red-600" />
      <AlertDescription className="text-red-800">
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


  // Sync skillValues back to the v2.1 BudgetVector
  useEffect(() => {
    const budget: BudgetVector = { ...DEFAULT_BASELINE };
    (Object.keys(skillInfo) as SkillKey[]).forEach((skill) => {
      budget[skill] = skillValues[skill];
    });
    onChange(budget);
  }, [skillValues, onChange]);

  return (
    <div className="space-y-6">


      {/* Interactive Visual Breakdown (Pie Chart) */}
      <SkillDistributionVisualizer
        skillValues={skillValues}
        onSegmentClick={(skill) => {
          alert(`${skillInfo[skill].label}: ${skillValues[skill]}%`);
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