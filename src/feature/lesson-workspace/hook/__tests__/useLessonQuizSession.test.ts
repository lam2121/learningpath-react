import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLessonQuizSession } from '../useLessonQuizSession'

describe('useLessonQuizSession hook', () => {
  it('initializes with pristine quiz state', () => {
    const { result } = renderHook(() => useLessonQuizSession())

    expect(result.current.currentQuestionIndex).toBe(0)
    expect(result.current.answers).toEqual({})
    expect(result.current.submitted).toBe(false)
    expect(result.current.quizStarted).toBe(false)
    expect(result.current.showSummary).toBe(false)
    expect(result.current.hintedQuestions).toEqual({})
  })

  it('updates answers for specific questions', () => {
    const { result } = renderHook(() => useLessonQuizSession())

    act(() => {
      result.current.handleAnswerChange(0, 'option_b')
      result.current.handleAnswerChange(1, 'option_d')
    })

    expect(result.current.answers).toEqual({
      0: 'option_b',
      1: 'option_d',
    })
  })

  it('records hint usage for specific questions', () => {
    const { result } = renderHook(() => useLessonQuizSession())

    act(() => {
      result.current.handleHintUsed(2)
    })

    expect(result.current.hintedQuestions).toEqual({
      2: true,
    })
  })

  it('resets session back to clean initial state', () => {
    const { result } = renderHook(() => useLessonQuizSession())

    act(() => {
      result.current.setQuizStarted(true)
      result.current.setCurrentQuestionIndex(3)
      result.current.handleAnswerChange(0, 'ans')
      result.current.handleHintUsed(0)
      result.current.setSubmitted(true)
    })

    expect(result.current.quizStarted).toBe(true)

    act(() => {
      result.current.resetSession()
    })

    expect(result.current.currentQuestionIndex).toBe(0)
    expect(result.current.answers).toEqual({})
    expect(result.current.quizStarted).toBe(false)
    expect(result.current.submitted).toBe(false)
    expect(result.current.hintedQuestions).toEqual({})
  })
})
