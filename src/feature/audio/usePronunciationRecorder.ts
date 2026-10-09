import { useCallback, useEffect, useRef, useState } from 'react'

import {
  uploadPronunciationAudio,
  type PronunciationResponse,
  type VocabWordContext,
} from '@/feature/audio/audioApi'

/**
 * One microphone shared across many practice targets.
 *
 * Every target (a drill sentence, a phrase example) passes its own stable `id`.
 * Only one recording can be active at a time, so starting a new one implicitly
 * discards the previous take - which is what learners expect when they move down
 * a list of sentences.
 *
 * Recording mechanics follow the existing MediaRecorder usage in
 * feature/dev-mode/page/DevAudioTestPage.tsx.
 */
export function usePronunciationRecorder() {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [evaluatingId, setEvaluatingId] = useState<string | null>(null)
  const [blobs, setBlobs] = useState<Record<string, Blob>>({})
  const [audioUrls, setAudioUrls] = useState<Record<string, string>>({})
  const [results, setResults] = useState<Record<string, PronunciationResponse>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [activeStream, setActiveStream] = useState<MediaStream | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // Object URLs are revoked on unmount; a lesson page can stay mounted a long time.
  const objectUrlsRef = useRef<string[]>([])

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const releaseMic = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setActiveStream(null)
  }, [])

  useEffect(() => {
    return () => {
      clearTimer()
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
      releaseMic()
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
      objectUrlsRef.current = []
    }
  }, [clearTimer, releaseMic])

  const stop = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)
    clearTimer()
  }, [clearTimer])

  const start = useCallback(
    async (id: string) => {
      // Starting a new take cancels any in-flight one.
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
      clearTimer()
      releaseMic()

      setErrors((prev) => ({ ...prev, [id]: '' }))
      setResults((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
      audioChunksRef.current = []

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        streamRef.current = stream
        setActiveStream(stream)
        const recorder = new MediaRecorder(stream)
        mediaRecorderRef.current = recorder

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) audioChunksRef.current.push(event.data)
        }

        recorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: recorder.mimeType || 'audio/webm',
          })
          setBlobs((prev) => ({ ...prev, [id]: audioBlob }))
          const url = URL.createObjectURL(audioBlob)
          objectUrlsRef.current.push(url)
          setAudioUrls((prev) => ({ ...prev, [id]: url }))
          // Release the mic so the browser's recording indicator goes away.
          stream.getTracks().forEach((track) => track.stop())
          streamRef.current = null
          setActiveStream(null)
        }

        recorder.start(100)
        setActiveId(id)
        setIsRecording(true)
        setSeconds(0)
        timerRef.current = setInterval(() => setSeconds((prev) => prev + 1), 1000)
      } catch (err) {
        setErrors((prev) => ({
          ...prev,
          [id]: `Microphone access error: ${(err as Error).message}`,
        }))
        setIsRecording(false)
      }
    },
    [clearTimer, releaseMic]
  )

  const evaluate = useCallback(
    async (id: string, expectedText: string, wordContext?: VocabWordContext) => {
      const blob = blobs[id]
      if (!blob) return

      setEvaluatingId(id)
      setErrors((prev) => ({ ...prev, [id]: '' }))
      try {
        const res = await uploadPronunciationAudio(blob, expectedText, wordContext)
        setResults((prev) => ({ ...prev, [id]: res }))
      } catch (err) {
        setErrors((prev) => ({ ...prev, [id]: (err as Error).message }))
      } finally {
        setEvaluatingId(null)
      }
    },
    [blobs]
  )

  const reset = useCallback((id: string) => {
    setBlobs((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    setAudioUrls((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    setResults((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    setErrors((prev) => ({ ...prev, [id]: '' }))
  }, [])

  return {
    activeId,
    isRecording,
    seconds,
    evaluatingId,
    blobs,
    audioUrls,
    results,
    errors,
    /** The live MediaStream while recording — use for waveform visualization. */
    activeStream,
    start,
    stop,
    evaluate,
    reset,
  }
}

export type PronunciationRecorder = ReturnType<typeof usePronunciationRecorder>
