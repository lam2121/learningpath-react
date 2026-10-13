import { describe, it, expect } from 'vitest'
import {
  formatLabel,
  formatPercent,
  formatScenarioParagraphs,
  localizeField,
} from '../lessonFormatters'

describe('lessonFormatters utils', () => {
  describe('formatLabel', () => {
    it('formats snake_case strings to capitalized words', () => {
      expect(formatLabel('fill_blank')).toBe('Fill Blank')
      expect(formatLabel('multi_select')).toBe('Multi Select')
      expect(formatLabel('single')).toBe('Single')
    })
  })

  describe('formatPercent', () => {
    it('formats integer percentages cleanly without decimals', () => {
      expect(formatPercent(100)).toBe('100%')
      expect(formatPercent(85)).toBe('85%')
      expect(formatPercent(0)).toBe('0%')
    })

    it('formats floating point percentages with 1 decimal precision', () => {
      expect(formatPercent(85.333)).toBe('85.3%')
      expect(formatPercent(99.94)).toBe('99.9%')
    })
  })

  describe('formatScenarioParagraphs', () => {
    it('splits text separated by double newlines into trimmed paragraphs', () => {
      const input = 'Paragraph one.\n\nParagraph two with details.\n\nParagraph three.'
      const result = formatScenarioParagraphs(input)
      expect(result).toHaveLength(3)
      expect(result[0]).toBe('Paragraph one.')
      expect(result[1]).toBe('Paragraph two with details.')
      expect(result[2]).toBe('Paragraph three.')
    })

    it('handles empty or blank inputs safely', () => {
      expect(formatScenarioParagraphs('')).toEqual([])
    })
  })

  describe('localizeField', () => {
    it('extracts target language value from multilingual object', () => {
      const field = { en: 'Hello', vi: 'Xin chào', ja: 'こんにちは' }
      expect(localizeField(field, 'vi')).toBe('Xin chào')
      expect(localizeField(field, 'ja')).toBe('こんにちは')
      expect(localizeField(field, 'en')).toBe('Hello')
    })

    it('falls back to English when target language is missing', () => {
      const field = { en: 'Default English' }
      expect(localizeField(field, 'ja')).toBe('Default English')
    })

    it('returns raw string when field is already a string', () => {
      expect(localizeField('Just a string', 'vi')).toBe('Just a string')
    })
  })
})
