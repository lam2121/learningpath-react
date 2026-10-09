import { useState, useEffect } from 'react';

type Skill = 'D_doc' | 'C_comm' | 'T_trouble' | 'G_custom';
type SkillValues = Record<Skill, number>;

export const TOTAL_TOPICS = 20;
export const MIN_TOPICS_PER_SKILL = 2; // Equivalent to 10% floor out of 20 topics

interface UseSkillDistributionOptions {
  initialValues?: SkillValues;
}

const normalizeToTopics = (values?: SkillValues): SkillValues => {
  if (!values) {
    return {
      D_doc: 5,
      C_comm: 5,
      T_trouble: 5,
      G_custom: 5,
    };
  }

  const sum = Object.values(values).reduce((acc, val) => acc + (val || 0), 0);
  // If values were passed as percentages (sum > 30, e.g. ~100), convert to topic count (divide by 5)
  if (sum > 30) {
    return {
      D_doc: Math.round((values.D_doc || 0) / 5),
      C_comm: Math.round((values.C_comm || 0) / 5),
      T_trouble: Math.round((values.T_trouble || 0) / 5),
      G_custom: Math.round((values.G_custom || 0) / 5),
    };
  }

  return {
    D_doc: Math.round(values.D_doc ?? 5),
    C_comm: Math.round(values.C_comm ?? 5),
    T_trouble: Math.round(values.T_trouble ?? 5),
    G_custom: Math.round(values.G_custom ?? 5),
  };
};

const useSkillDistribution = ({ initialValues }: UseSkillDistributionOptions = {}) => {
  const [skillValues, setSkillValues] = useState<SkillValues>(() => normalizeToTopics(initialValues));
  const [showWarning, setShowWarning] = useState<boolean>(false);
  const [warningMessage, setWarningMessage] = useState<string>('');
  const [isSumViolated, setIsSumViolated] = useState<boolean>(false);
  const [isFloorViolated, setIsFloorViolated] = useState<boolean>(false);

  // Validate that the sum of topic counts is exactly 20
  const validateSum = (values: SkillValues): boolean => {
    const sum = Object.values(values).reduce((acc, val) => acc + (val || 0), 0);
    return sum === TOTAL_TOPICS;
  };

  // Validate Content-Pool Floor (minimum 2 topics per skill, equivalent to 10%)
  const validateFloor = (values: SkillValues): boolean => {
    return Object.values(values).every((value) => (value || 0) >= MIN_TOPICS_PER_SKILL);
  };

  useEffect(() => {
    const isSumValid = validateSum(skillValues);
    const isFloorValid = validateFloor(skillValues);
    
    setIsSumViolated(!isSumValid);
    setIsFloorViolated(!isFloorValid);

    const currentSum = Object.values(skillValues).reduce((acc, val) => acc + (Number(val) || 0), 0);

    if (!isSumValid) {
        setWarningMessage(`Total sum of all skills must be exactly ${TOTAL_TOPICS} topics (currently ${currentSum}).`);
        setShowWarning(true);
    } else if (!isFloorValid) {
        setWarningMessage(`Each skill must have at least ${MIN_TOPICS_PER_SKILL} topics (10% minimum).`);
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