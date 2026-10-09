// ─────────────────────────────────────────────────────────────────────────────
// Onboarding UI Text Constants — powered by react-i18next
//
// This file provides the same API shape that all onboarding components use,
// but now reads from the i18next translation files under src/i18n/locales/.
//
// Components can EITHER:
//   1. Keep importing `onboardingTexts` (works, always reflects current language)
//   2. Use `useTranslation('onboarding')` hook directly for reactive re-renders
//
// For language switching in React components, prefer the useTranslation hook
// since it triggers re-renders when the language changes.
// ─────────────────────────────────────────────────────────────────────────────

import i18n from '@/i18n/i18n'

/** Shorthand for reading an onboarding translation key */
function t(key: string, options?: Record<string, unknown>): string {
  return i18n.t(key, { ns: 'onboarding', ...options })
}

export const onboardingTexts = {
  // ─── Common ──────────────────────────────────────────────────────────────────
  common: {
    get logoutButton() { return t('common.logoutButton') },
    get signInButton() { return t('common.signInButton') },
  },

  // ─── RoleSelectionGrid ───────────────────────────────────────────────────────
  roleSelection: {
    get stepIndicator() { return t('roleSelection.stepIndicator') },
    get pageTitle() { return t('roleSelection.pageTitle') },
    get pageTitleHighlight() { return t('roleSelection.pageTitleHighlight') },
    get pageSubtitle() { return t('roleSelection.pageSubtitle') },
    get pageSubtitleHighlight() { return t('roleSelection.pageSubtitleHighlight') },
    get pageSubtitleEnd() { return t('roleSelection.pageSubtitleEnd') },
    get loadingText() { return t('roleSelection.loadingText') },
    get errorTitle() { return t('roleSelection.errorTitle') },
    get retryButton() { return t('roleSelection.retryButton') },
    get careerTrackBadge() { return t('roleSelection.careerTrackBadge') },
    get selectTrackTitle() { return t('roleSelection.selectTrackTitle') },
    get selectTrackDescription() { return t('roleSelection.selectTrackDescription') },
    get selectTrackHint() { return t('roleSelection.selectTrackHint') },
    continueWith: (roleName: string) => t('roleSelection.continueWith', { roleName }),
    get jobDescriptionHeading() { return t('roleSelection.jobDescriptionHeading') },
    get skillOverviewHeading() { return t('roleSelection.skillOverviewHeading') },
    get skillOverviewHint() { return t('roleSelection.skillOverviewHint') },
    get skillWeightsHeading() { return t('roleSelection.skillWeightsHeading') },
    get exampleQuestionsHeading() { return t('roleSelection.exampleQuestionsHeading') },
    get noExampleQuestions() { return t('roleSelection.noExampleQuestions') },
  },

  // ─── ConfirmRoleModal ────────────────────────────────────────────────────────
  confirmModal: {
    get title() { return t('confirmModal.title') },
    get subtitle() { return t('confirmModal.subtitle') },
    get bodyStart() { return t('confirmModal.bodyStart') },
    get placementTestLabel() { return t('confirmModal.placementTestLabel') },
    get bodyCareerTrackPrefix() { return t('confirmModal.bodyCareerTrackPrefix') },
    get bulletPoints() {
      return [
        { icon: '🎯', text: t('confirmModal.bullet1') },
        { icon: '🔒', text: t('confirmModal.bullet2') },
        { icon: '⏱️', text: t('confirmModal.bullet3') },
      ]
    },
    readyPrompt: (roleName: string) => t('confirmModal.readyPrompt', { roleName }),
    get cancelButton() { return t('confirmModal.cancelButton') },
    get confirmButton() { return t('confirmModal.confirmButton') },
    get devModeLabel() { return t('confirmModal.devModeLabel') },
    get devModeDescription() { return t('confirmModal.devModeDescription') },
    get devSetScoresButton() { return t('confirmModal.devSetScoresButton') },
  },

  // ─── InactiveRoleModal ───────────────────────────────────────────────────────
  inactiveModal: {
    get title() { return t('inactiveModal.title') },
    get subtitle() { return t('inactiveModal.subtitle') },
    get bodyDeactivated() { return t('inactiveModal.bodyDeactivated') },
    get bodyEnd() { return t('inactiveModal.bodyEnd') },
    get bulletPoints() {
      return [
        { icon: '📚', text: t('inactiveModal.bullet1') },
        { icon: '👥', text: t('inactiveModal.bullet2') },
        { icon: '🛠️', text: t('inactiveModal.bullet3') },
      ]
    },
    get selectActiveTrack() { return t('inactiveModal.selectActiveTrack') },
    get closeButton() { return t('inactiveModal.closeButton') },
  },

  // ─── DevPlacementPanel ───────────────────────────────────────────────────────
  devPanel: {
    get title() { return t('devPanel.title') },
    get subtitle() { return t('devPanel.subtitle') },
    get trackPreviewLabel() { return t('devPanel.trackPreviewLabel') },
    get trackLabels(): Record<string, string> {
      return {
        basic: t('devPanel.trackBasic'),
        intermediate: t('devPanel.trackIntermediate'),
        advanced: t('devPanel.trackAdvanced'),
      }
    },
    get correctSuffix() { return t('devPanel.correctSuffix') },
    earnedLabel: (earned: number, max: number, pct: number) =>
      t('devPanel.earnedLabel', { earned, max, pct }),
    get cancelButton() { return t('devPanel.cancelButton') },
    get generateButton() { return t('devPanel.generateButton') },
    get generatingButton() { return t('devPanel.generatingButton') },
  },

  // ─── PlacementTestEngine ─────────────────────────────────────────────────────
  placementTest: {
    get stepIndicator() { return t('placementTest.stepIndicator') },
    get loadingText() { return t('placementTest.loadingText') },
    get noQuestionsTitle() { return t('placementTest.noQuestionsTitle') },
    get noQuestionsDescription() { return t('placementTest.noQuestionsDescription') },
    get backToRoleSelection() { return t('placementTest.backToRoleSelection') },
    get exitButton() { return t('placementTest.exitButton') },
    get timeLeftLabel() { return t('placementTest.timeLeftLabel') },
    get timeUpText() { return t('placementTest.timeUpText') },
    get nextQuestion() { return t('placementTest.nextQuestion') },
    get submitButton() { return t('placementTest.submitButton') },
    get compilingResults() { return t('placementTest.compilingResults') },
    get cannotGoBack() { return t('placementTest.cannotGoBack') },
    quitModal: {
      get title() { return t('placementTest.quitTitle') },
      get bodyStart() { return t('placementTest.quitBodyStart') },
      get bodyHighlight() { return t('placementTest.quitBodyHighlight') },
      get bodyEnd() { return t('placementTest.quitBodyEnd') },
      get stayButton() { return t('placementTest.quitStayButton') },
      get exitButton() { return t('placementTest.quitExitButton') },
    },
    get noRoleError() { return t('placementTest.noRoleError') },
  },

  // ─── TestQuestionCard ────────────────────────────────────────────────────────
  testQuestionCard: {
    progressText: (questionNumber: number, total: number) =>
      t('testQuestionCard.progressText', { questionNumber, total }),
    get tierLabels(): Record<number, string> {
      return {
        1: t('testQuestionCard.tierEasy'),
        2: t('testQuestionCard.tierMedium'),
        3: t('testQuestionCard.tierHard'),
      }
    },
  },

  // ─── PlacementResultView ─────────────────────────────────────────────────────
  placementResult: {
    get loadingText() { return t('placementResult.loadingText') },
    get noResultsEmoji() { return t('placementResult.noResultsEmoji') },
    get noResultsTitle() { return t('placementResult.noResultsTitle') },
    get noResultsDescription() { return t('placementResult.noResultsDescription') },
    get startPlacementTest() { return t('placementResult.startPlacementTest') },
    get logoutButton() { return t('placementResult.logoutButton') },
    get celebrationEmoji() { return t('placementResult.celebrationEmoji') },
    get testCompleteTitle() { return t('placementResult.testCompleteTitle') },
    testCompleteSubtitle: (totalQuestions: number) =>
      t('placementResult.testCompleteSubtitle', { totalQuestions }),
    get outOf10() { return t('placementResult.outOf10') },
    correctOverall: (correct: number, total: number) =>
      t('placementResult.correctOverall', { correct, total }),
    gradeLabels: {
      get excellent() { return t('placementResult.gradeExcellent') },
      get good() { return t('placementResult.gradeGood') },
      get needsWork() { return t('placementResult.gradeNeedsWork') },
      get keepPracticing() { return t('placementResult.gradeKeepPracticing') },
    },
    get recommendedTrack() { return t('placementResult.recommendedTrack') },
    get skillBreakdownHeader() { return t('placementResult.skillBreakdownHeader') },
    get actualScoreLegend() { return t('placementResult.actualScoreLegend') },
    get targetLevelLegend() { return t('placementResult.targetLevelLegend') },
    get targetLabel() { return t('placementResult.targetLabel') },
    get outOf100() { return t('placementResult.outOf100') },
    get viewDetailedResults() { return t('placementResult.viewDetailedResults') },
    get advisorHeader() { return t('placementResult.advisorHeader') },
    get weeklyStudyHoursHeader() { return t('placementResult.dailyStudyTimeHeader') },
    get dailyStudyTimeHeader() { return t('placementResult.dailyStudyTimeHeader') },
    hoursPerWeek: (hours: number) => t('placementResult.hoursPerWeek', { hours }),
    minsPerDay: (minutes: number) => t('placementResult.minsPerDay', { minutes }),
    get paceRelaxed() { return t('placementResult.paceRelaxed') },
    get paceBalanced() { return t('placementResult.paceBalanced') },
    get paceIntensive() { return t('placementResult.paceIntensive') },
    get estimatedCompletionHeader() { return t('placementResult.estimatedCompletionHeader') },
    get weeksLabel() { return t('placementResult.weeksLabel') },
    get daysLabel() { return t('placementResult.daysLabel') },
    monthsAt: (days: number, months: string, minutes: number) =>
      t('placementResult.monthsAt', { days, months, minutes }),
    get paceGreat() { return t('placementResult.paceGreat') },
    get paceSteady() { return t('placementResult.paceSteady') },
    get paceAddMore() { return t('placementResult.paceAddMore') },
    get createMyCourse() { return t('placementResult.createMyCourse') },
    get aiFooter() { return t('placementResult.aiFooter') },
    detailedResultsTitle: (correct: number, total: number) =>
      t('placementResult.detailedResultsTitle', { correct, total }),
    get correctBadge() { return t('placementResult.correctBadge') },
    get incorrectBadge() { return t('placementResult.incorrectBadge') },
    get trackLabels(): Record<string, string> {
      return {
        basic: t('placementResult.trackBasic'),
        intermediate: t('placementResult.trackIntermediate'),
        advanced: t('placementResult.trackAdvanced'),
      }
    },
  },

  // ─── CourseLoading ───────────────────────────────────────────────────────────
  courseLoading: {
    get pageTitle() { return t('courseLoading.pageTitle') },
    get pageSubtitle() { return t('courseLoading.pageSubtitle') },
    get progressLabel() { return t('courseLoading.progressLabel') },
    get estimatedRemaining() { return t('courseLoading.estimatedRemaining') },
    get steps() {
      return [
        t('courseLoading.step1'),
        t('courseLoading.step2'),
        t('courseLoading.step3'),
        t('courseLoading.step4'),
        t('courseLoading.step5'),
      ]
    },
    get statusDone() { return t('courseLoading.statusDone') },
    get statusRunning() { return t('courseLoading.statusRunning') },
    get statusWaiting() { return t('courseLoading.statusWaiting') },
    get tips() {
      return [
        t('courseLoading.tip1'),
        t('courseLoading.tip2'),
        t('courseLoading.tip3'),
        t('courseLoading.tip4'),
        t('courseLoading.tip5'),
      ]
    },
    get aiTipLabel() { return t('courseLoading.aiTipLabel') },
    get autoResumeTitle() { return t('courseLoading.autoResumeTitle') },
    get autoResumeDescription() { return t('courseLoading.autoResumeDescription') },
    get continueInBackground() { return t('courseLoading.continueInBackground') },
  },
}
