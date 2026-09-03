// ─────────────────────────────────────────────────────────────────────────────
// User Profile UI Text Constants — powered by react-i18next
// ─────────────────────────────────────────────────────────────────────────────

import i18n from '@/i18n/i18n'

/** Shorthand for reading a profile translation key */
function t(key: string, options?: Record<string, unknown>): string {
  return i18n.t(key, { ns: 'profile', ...options })
}

export const userProfileTexts = {
  // ─── Header & Roadmap Card ──────────────────────────────────────────────────
  nextStepBadge: () => t('nextStepBadge'),
  exploreLearningPath: () => t('exploreLearningPath'),
  continueRoadmap: () => t('continueRoadmap'),
  loadingLearningPath: () => t('loadingLearningPath'),
  topicsCount: (count: number) => t('topicsCount', { count }),
  exploreTopics: () => t('exploreTopics'),
  openRoadmapDesc: () => t('openRoadmapDesc'),
  openRoadmapPendingDesc: () => t('openRoadmapPendingDesc'),
  openLearningPath: () => t('openLearningPath'),

  // ─── UserProfileCard ────────────────────────────────────────────────────────
  dayStreak: () => t('dayStreak'),
  lessons: () => t('lessons'),
  accuracy: () => t('accuracy'),
  studyTime: () => t('studyTime'),
  changeTrack: () => t('changeTrack'),
  studySettings: () => t('studySettings'),
  learningTimeline: () => t('learningTimeline'),
  started: () => t('started'),
  targetFinish: () => t('targetFinish'),
  onTrackFor: (month: string) => t('onTrackFor', { month }),
  notStartedYet: () => t('notStartedYet'),
  estimatePending: () => t('estimatePending'),
  skillsOverview: () => t('skillsOverview'),
  roleRequirements: () => t('roleRequirements'),
  currentLevel: () => t('currentLevel'),
  level: () => t('level'),
  activeCareerTrack: () => t('activeCareerTrack'),
  viewRoadmap: () => t('viewRoadmap'),
  changeAvatar: () => t('changeAvatar'),
  uploadPhoto: () => t('uploadPhoto'),

  // ─── DailyPlanView ──────────────────────────────────────────────────────────
  dailyPlan: () => t('dailyPlan'),
  dailyStudyGoal: () => t('dailyStudyGoal'),
  todayTarget: (minutes: number) => t('todayTarget', { minutes }),
  todayProgress: (studied: number, target: number) => t('todayProgress', { studied, target }),
  completed: () => t('completed'),
  inProgress: () => t('inProgress'),
  nextUp: () => t('nextUp'),
  readyToStudy: () => t('readyToStudy'),
  startLesson: () => t('startLesson'),
  review: () => t('review'),
  studyStreak: () => t('studyStreak'),
  currentStreak: () => t('currentStreak'),
  longestStreak: () => t('longestStreak'),
  days: () => t('days'),
  editGoal: () => t('editGoal'),
  noRoadmap: () => t('noRoadmap'),
  studySettingsCardDesc: () => t('studySettingsCardDesc'),

  // ─── LearningHistoryChart ───────────────────────────────────────────────────
  studyActivity: () => t('studyActivity'),
  quizHistory: () => t('quizHistory'),
  lessonQuizHistory: () => t('lessonQuizHistory'),
  totalStudyTime: () => t('totalStudyTime'),
  averageScore: () => t('averageScore'),
  passedLessons: () => t('passedLessons'),
  allSkills: () => t('allSkills'),
  filterBySkill: () => t('filterBySkill'),
  searchLesson: () => t('searchLesson'),
  passed: () => t('passed'),
  needsPractice: () => t('needsPractice'),
  loginHistory: () => t('loginHistory'),
  daysLoggedIn: () => t('daysLoggedIn'),
  loggedInToday: () => t('loggedInToday'),

  // ─── SkillsOverview ─────────────────────────────────────────────────────────
  skillDoc: () => t('skillDoc'),
  skillComm: () => t('skillComm'),
  skillTrouble: () => t('skillTrouble'),
  skillCustom: () => t('skillCustom'),
  actualScore: () => t('actualScore'),
  targetLevel: () => t('targetLevel'),
  targetMilestone: () => t('targetMilestone'),
  skillProficiency: () => t('skillProficiency'),

  // ─── Dialogs & Alerts ───────────────────────────────────────────────────────
  changeCareerTitle: () => t('changeCareerTitle'),
  changeCareerDesc: () => t('changeCareerDesc'),
  studyTimeTitle: () => t('studyTimeTitle'),
  studyTimeDesc: () => t('studyTimeDesc'),
  save: () => t('save'),
  cancel: () => t('cancel'),
  confirm: () => t('confirm'),
  updatePreferences: () => t('updatePreferences'),
  careerTrack: () => t('careerTrack'),
  dailyStudyTime: () => t('dailyStudyTime'),
  hoursPerDay: (hours: number) => t('hoursPerDay', { hours }),
  hoursPerDaySingle: () => t('hoursPerDaySingle'),
  resetJourneyDesc: () => t('resetJourneyDesc'),
  beforeYouContinue: () => t('beforeYouContinue'),
  retakePlacement: () => t('retakePlacement'),
  progressDeleted: () => t('progressDeleted'),
  newRoadmapCreated: () => t('newRoadmapCreated'),
  actionCannotUndone: () => t('actionCannotUndone'),
  understandDeleted: () => t('understandDeleted'),
  keepCurrentTrack: () => t('keepCurrentTrack'),
  deleting: () => t('deleting'),
  chooseStudyTime: () => t('chooseStudyTime'),
  selectedHours: (hours: number) => t('selectedHours', { hours }),
  aiRecommendation: () => t('aiRecommendation'),
  aiRecommendationText: () => t('aiRecommendationText'),
  saveChanges: () => t('saveChanges'),
  increaseDailyStudyTime: () => t('increaseDailyStudyTime'),
  reduceDailyStudyTime: () => t('reduceDailyStudyTime'),
  current: () => t('current'),
  new: () => t('new'),
  saving: () => t('saving'),
  confirmNewSchedule: () => t('confirmNewSchedule'),
}
