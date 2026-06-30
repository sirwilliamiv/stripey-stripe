"use client"
import { useState } from 'react'
import { useDVR } from '@/engine/dvr'
import { EXAM_QUESTIONS } from '@/engine/exam-mode'

export function ExamTab() {
  const currentEvent = useDVR((s) => s.currentEvent)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [revealed, setRevealed] = useState<Record<string, boolean>>({})

  const relevantQuestions = currentEvent
    ? EXAM_QUESTIONS.filter(
        (q) => !q.eventRef || q.eventRef === currentEvent.phase
      )
    : EXAM_QUESTIONS

  if (relevantQuestions.length === 0) {
    return (
      <div className="p-4 text-zinc-600 text-sm text-center mt-8">
        No exam questions for this event
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6 text-sm">
      {relevantQuestions.map((q) => {
        const userAnswer = answers[q.id]
        const isRevealed = revealed[q.id] ?? false
        const isCorrect = userAnswer === q.correctIndex

        return (
          <div key={q.id} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
            <p className="text-zinc-100 font-medium">{q.question}</p>
            <div className="space-y-2">
              {q.options.map((opt, i) => {
                let cls = 'border border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700'
                if (isRevealed) {
                  if (i === q.correctIndex) cls = 'border border-green-600 bg-green-950/30 text-green-300'
                  else if (i === userAnswer && !isCorrect) cls = 'border border-red-600 bg-red-950/30 text-red-300'
                  else cls = 'border border-zinc-800 bg-zinc-900 text-zinc-500'
                } else if (userAnswer === i) {
                  cls = 'border border-violet-500 bg-violet-950/30 text-violet-200'
                }

                return (
                  <button
                    key={i}
                    onClick={() => setAnswers((a) => ({ ...a, [q.id]: i }))}
                    disabled={isRevealed}
                    className={`w-full text-left px-3 py-2 rounded text-xs transition-colors ${cls}`}
                  >
                    {opt}
                  </button>
                )
              })}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setRevealed((r) => ({ ...r, [q.id]: true }))}
                disabled={userAnswer === undefined || isRevealed}
                className="px-3 py-1.5 rounded bg-violet-700 text-white text-xs hover:bg-violet-600 disabled:opacity-30 transition-colors"
              >
                Check Answer
              </button>
            </div>
            {isRevealed && (
              <div className={`rounded p-3 text-xs ${isCorrect ? 'bg-green-950/30 text-green-300' : 'bg-red-950/30 text-red-300'}`}>
                <span className="font-medium">{isCorrect ? '✓ Correct' : '✗ Incorrect'}</span>
                <p className="mt-1 text-zinc-400">{q.explanation}</p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
