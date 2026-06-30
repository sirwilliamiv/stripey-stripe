import { describe, it, expect } from 'vitest'
import { getQuestionsForFlow, gradeAnswer, EXAM_QUESTIONS } from '@/engine/exam-mode'

describe('EXAM_QUESTIONS', () => {
  it('has at least 5 seeded questions', () => {
    expect(EXAM_QUESTIONS.length).toBeGreaterThanOrEqual(5)
  })

  it('every question has 4 options', () => {
    for (const q of EXAM_QUESTIONS) {
      expect(q.options).toHaveLength(4)
      expect(q.correctIndex).toBeGreaterThanOrEqual(0)
      expect(q.correctIndex).toBeLessThan(4)
    }
  })
})

describe('getQuestionsForFlow', () => {
  it('returns questions for fake-payment flow', () => {
    const qs = getQuestionsForFlow('fake-payment')
    expect(qs.length).toBeGreaterThan(0)
  })

  it('returns empty array for unknown flow', () => {
    expect(getQuestionsForFlow('nonexistent-flow')).toHaveLength(0)
  })
})

describe('gradeAnswer', () => {
  it('returns correct: true when index matches', () => {
    const q = EXAM_QUESTIONS[0]!
    const result = gradeAnswer(q.id, q.correctIndex)
    expect(result.correct).toBe(true)
  })

  it('returns correct: false for wrong answer', () => {
    const q = EXAM_QUESTIONS[0]!
    const wrongIndex = q.correctIndex === 0 ? 1 : 0
    const result = gradeAnswer(q.id, wrongIndex)
    expect(result.correct).toBe(false)
    expect(result.explanation).toBeTruthy()
  })
})
