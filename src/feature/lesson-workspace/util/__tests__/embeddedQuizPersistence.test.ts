import { describe, it, expect } from 'vitest'
import {
  getEmbeddedLessonQuizDraftStorageKey,
  getEmbeddedLessonQuizCompletedStorageKey,
  isEmbeddedQuizQuestion,
  isEmbeddedLessonQuizDraft,
  hasAnswer,
  HINT_CREDIT,
  HINT_UNLOCK_AFTER_FAILURES,
} from '../embeddedQuizPersistence'

describe('embeddedQuizPersistence utils', () => {
  it('generates consistent draft storage keys for users and lessons', () => {
    const key = getEmbeddedLessonQuizDraftStorageKey(42, 101)
    expect(key).toBe('learning-embedded-quiz-draft:42:101')
  })

  it('generates consistent completed storage keys', () => {
    const key = getEmbeddedLessonQuizCompletedStorageKey(42, 101)
    expect(key).toBe('learning-embedded-quiz-completed:42:101')
  })

  it('correctly validates question structures', () => {
    const validQuestion = {
      id: 'q1',
      type: 'fill_blank',
      data: [{ text: 'Hello', is_blank: false }],
    }
    expect(isEmbeddedQuizQuestion(validQuestion)).toBe(true)

    const invalidQuestion = {
      id: 'q2',
      type: 'unknown_type',
      data: 'not an array',
    }
    expect(isEmbeddedQuizQuestion(invalidQuestion)).toBe(false)
    expect(isEmbeddedQuizQuestion(null)).toBe(false)
  })

  it('correctly identifies answer presence with hasAnswer', () => {
    expect(hasAnswer('answered text')).toBe(true)
    expect(hasAnswer('   ')).toBe(false)
    expect(hasAnswer('')).toBe(false)
    expect(hasAnswer(undefined)).toBe(false)
  })

  it('has calibrated pedagogical hint constants', () => {
    expect(HINT_CREDIT).toBe(0.75)
    expect(HINT_UNLOCK_AFTER_FAILURES).toBe(2)
  })

  it('validates embedded quiz drafts strictly', () => {
    const validDraft = {
      version: 2,
      lessonId: 101,
      quizStarted: true,
      currentQuestionIndex: 0,
      answers: { q1: 'test' },
      hintedQuestions: {},
      questions: [
        {
          id: 'q1',
          type: 'fill_blank',
          data: [{ text: 'Answer', is_blank: false }],
        },
      ],
      elapsedSeconds: 45,
      lastUpdatedAt: Date.now(),
    }
    expect(isEmbeddedLessonQuizDraft(validDraft)).toBe(true)
    expect(isEmbeddedLessonQuizDraft({ version: 'invalid' })).toBe(false)
  })
})
