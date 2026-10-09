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
  trackName: (track?: string | null) => {
    if (!track) return ''
    const lower = track.toLowerCase()
    if (lower === 'basic' || lower === 'beginner') return t('trackBasic', { defaultValue: 'Basic' })
    if (lower === 'intermediate') return t('trackIntermediate', { defaultValue: 'Intermediate' })
    if (lower === 'advanced') return t('trackAdvanced', { defaultValue: 'Advanced' })
    return track.split('_').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
  },
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
  uploadAvatar: () => t('uploadAvatar'),
  adjustOrChangeAvatar: () => t('adjustOrChangeAvatar'),
  uploadPhoto: () => t('uploadPhoto'),
  adjustAvatarTitle: () => t('adjustAvatarTitle'),
  adjustAvatarDescription: () => t('adjustAvatarDescription'),
  cropPreview: () => t('cropPreview'),
  dragToReposition: () => t('dragToReposition'),
  zoom: () => t('zoom'),
  rotate: () => t('rotate'),
  rotateLeft: () => t('rotateLeft'),
  rotateRight: () => t('rotateRight'),
  flipHorizontal: () => t('flipHorizontal'),
  resetAdjustments: () => t('resetAdjustments'),
  chooseDifferentPhoto: () => t('chooseDifferentPhoto'),
  applyAndSaveAvatar: () => t('applyAndSaveAvatar'),
  savingAvatar: () => t('savingAvatar'),
  avatarSavedSuccess: () => t('avatarSavedSuccess'),
  streakKeepGoing: () => t('streakKeepGoing'),
  streakFirstDay: () => t('streakFirstDay'),
  completedLessons: () => t('completedLessons'),
  firstLessonMomentum: () => t('firstLessonMomentum'),
  noPassedLessonYet: () => t('noPassedLessonYet'),
  averageScorePassedRoadmapLessons: () => t('averageScorePassedRoadmapLessons'),
  appearsAfterFirstPassedLesson: () => t('appearsAfterFirstPassedLesson'),
  totalTimeLearned: () => t('totalTimeLearned'),
  timeAppearsAfterActivity: () => t('timeAppearsAfterActivity'),

  // ─── DailyPlanView ──────────────────────────────────────────────────────────
  dailyPlan: () => t('dailyPlan'),
  todayFocus: () => t('todayFocus'),
  personalGuidance: () => t('personalGuidance'),
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
  todayTimeBudget: () => t('todayTimeBudget'),
  dailyGoalReached: () => t('dailyGoalReached'),
  plannedToday: () => t('plannedToday'),
  learnedToday: () => t('learnedToday'),
  bonusTime: () => t('bonusTime'),
  remaining: () => t('remaining'),
  newLesson: () => t('newLesson'),
  aiCoach: () => t('aiCoach'),

  // ─── LearningHistoryChart ───────────────────────────────────────────────────
  studyActivity: () => i18n.t('studyActivity', { ns: 'history' }),
  quizHistory: () => i18n.t('quizHistory', { ns: 'history' }),
  lessonQuizHistory: () => i18n.t('lessonQuizHistory', { ns: 'history', defaultValue: 'Lesson Quiz History' }),
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
  selectedMinutes: (minutes: number) => t('selectedMinutes', { minutes }),
  aiRecommendation: () => t('aiRecommendation'),
  aiRecommendationText: () => t('aiRecommendationText'),
  saveChanges: () => t('saveChanges'),
  increaseDailyStudyTime: () => t('increaseDailyStudyTime'),
  reduceDailyStudyTime: () => t('reduceDailyStudyTime'),
  current: () => t('current'),
  new: () => t('new'),
  saving: () => t('saving'),
  confirmNewSchedule: () => t('confirmNewSchedule'),

  // ─── Flashcards ─────────────────────────────────────────────────────────────
  flashcards: () => t('flashcards'),
  flashcardsTitle: () => t('flashcardsTitle'),
  flashcardsSubtitle: () => t('flashcardsSubtitle'),
  reviewFlashcards: () => t('reviewFlashcards'),
  openFlashcards: () => t('openFlashcards'),
  deckMode: () => t('deckMode'),
  listMode: () => t('listMode'),
  clickToFlip: () => t('clickToFlip'),
  clickToFlipBack: () => t('clickToFlipBack'),
  cardCounter: (current: number, total: number) => t('cardCounter', { current, total }),
  listenPronunciation: () => t('listenPronunciation'),
  listenExample: () => t('listenExample'),
  vietnameseMeaning: () => t('vietnameseMeaning'),
  workplaceExample: () => t('workplaceExample'),
  contextExplanation: () => t('contextExplanation'),
  deleteFlashcard: () => t('deleteFlashcard'),
  confirmDeleteFlashcard: () => t('confirmDeleteFlashcard'),
  searchFlashcards: () => t('searchFlashcards'),
  noFlashcardsTitle: () => t('noFlashcardsTitle'),
  noFlashcardsDesc: () => t('noFlashcardsDesc'),
  previousCard: () => t('previousCard'),
  nextCard: () => t('nextCard'),
  flipCard: () => t('flipCard'),
  shuffleCards: () => t('shuffleCards'),
  savedWordsCount: (count: number) => t('savedWordsCount', { count }),
  noMatchingWords: () => t('noMatchingWords'),
  practiceThisWord: () => t('practiceThisWord'),
  keyboardHint: () => t('keyboardHint'),
  flashcardsSectionDesc: () => t('flashcardsSectionDesc'),
  readyToReview: () => t('readyToReview'),
  backToProfile: () => t('backToProfile'),
  enterVietnamesePlaceholder: () => t('enterVietnamesePlaceholder'),
  submitAnswer: () => t('submitAnswer'),
  correct: () => t('correct'),
  incorrect: () => t('incorrect'),
  expectedAnswer: () => t('expectedAnswer'),
  yourAnswer: () => t('yourAnswer'),
  tryAgain: () => t('tryAgain'),
  showAnswer: () => t('showAnswer'),
  speakAnswer: () => t('speakAnswer'),
  stopListening: () => t('stopListening'),
  listeningHint: () => t('listeningHint'),
  speechNotSupported: () => t('speechNotSupported'),
  speechError: () => t('speechError'),
  japaneseMeaning: () => t('japaneseMeaning'),
  studyMode: () => t('studyMode'),
  studyModeVI: () => t('studyModeVI'),
  studyModeJA: () => t('studyModeJA'),
  studyModeEN: () => t('studyModeEN'),
  enterJapanesePlaceholder: () => t('enterJapanesePlaceholder'),
  enterEnglishPlaceholder: () => t('enterEnglishPlaceholder'),
  listeningHintJA: () => t('listeningHintJA'),
  listeningHintEN: () => t('listeningHintEN'),
  definitionPrompt: () => t('definitionPrompt'),
  maskedExample: () => t('maskedExample'),
  hintIpa: () => t('hintIpa'),
  quizScore: () => t('quizScore'),
  totalDeck: () => t('totalDeck'),
  flipCardAll: () => t('flipCardAll'),
  hint: () => t('hint'),
  hideHint: () => t('hideHint'),
  startsWith: (letter: string) => t('startsWith', { letter }),
  englishSolution: () => t('englishSolution'),
  lessonProgressFraction: (completed: number, total: number, percent: number) =>
    t('lessonProgressFraction', { completed, total, percent, defaultValue: `${completed} / ${total} lessons (${percent}%)` }),
  upNextLabel: () => t('upNextLabel', { defaultValue: 'Up Next:' }),
  lessonLabelPrefix: () => t('lessonLabelPrefix', { defaultValue: 'Lesson:' }),
  topicLabelPrefix: () => t('topicLabelPrefix', { defaultValue: 'Topic:' }),
  exampleScenarios: () => t('exampleScenarios', { defaultValue: 'Example Scenarios:' }),
  baseline: () => t('baseline', { defaultValue: 'Baseline:' }),
  formatEstimatedHours: (minutes: number | null | undefined) => {
    if (minutes == null || minutes <= 0) {
      return t('estimatePending', { defaultValue: 'Estimate pending' })
    }
    const minUnit = t('min', { defaultValue: 'min' })
    const hourUnit = t('hourShort', { defaultValue: 'h' })
    const minShortUnit = t('minShort', { defaultValue: 'm' })

    if (minutes < 60) {
      return `${minutes} ${minUnit}`
    }
    const hours = Math.floor(minutes / 60)
    const remainder = minutes % 60
    if (remainder === 0) {
      return `${hours}${hourUnit}`
    }
    return `${hours}${hourUnit} ${remainder}${minShortUnit}`
  },
}



