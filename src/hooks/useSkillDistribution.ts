import { useState, useEffect } from 'react';

type Skill = 'D_doc' | 'C_comm' | 'T_trouble' | 'G_custom';
type SkillValues = Record<Skill, number>;

interface UseSkillDistributionOptions {
  initialValues?: SkillValues;
}

const useSkillDistribution = ({ initialValues }: UseSkillDistributionOptions = {}) => {
  const [skillValues, setSkillValues] = useState<SkillValues>(() => 
    initialValues ?? {
      D_doc: 25,
      C_comm: 25,
      T_trouble: 25,
      G_custom: 25,
    }
  );
  const [showWarning, setShowWarning] = useState<boolean>(false);
  const [warningMessage, setWarningMessage] = useState<string>('');
  const [isSumViolated, setIsSumViolated] = useState<boolean>(false);
  const [isFloorViolated, setIsFloorViolated] = useState<boolean>(false);

  // Validate that the sum of skillValues is 100
  const validateSum = (values: SkillValues): boolean => {
    const sum = Object.values(values).reduce((acc, val) => acc + val, 0);
    return Math.abs(sum - 100) < 0.1; // Account for floating-point errors
  };

  // Validate Content-Pool Floor (minimum 10% per skill)
  const validateFloor = (values: SkillValues): boolean => {
    return Object.values(values).every((value) => value >= 10);
  };

  useEffect(() => {
    const isSumValid = validateSum(skillValues);
    const isFloorValid = validateFloor(skillValues);
    
    setIsSumViolated(!isSumValid);
    setIsFloorViolated(!isFloorValid);

    if (!isSumValid) {
        setWarningMessage('Total sum of all skills must be exactly 100%.');
        setShowWarning(true);
    } else if (!isFloorValid) {
        setWarningMessage('Each skill must be at least 10%.');
        setShowWarning(true);
    } else {
        setShowWarning(false);
        setWarningMessage('');
    }
  }, [skillValues]);

  const updateSkillValue = (skill: Skill, value: number) => {
    setSkillValues(prev => ({ ...prev, [skill]: value }));
  };

  return {
    skillValues,
    setSkillValues,
    updateSkillValue,
    showWarning,
    warningMessage,
    isFloorViolated,
    isSumViolated,
  };
};

export default useSkillDistribution;