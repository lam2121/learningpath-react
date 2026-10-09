import { fetchWithAuthRetry } from "@/common/lib/authSession";
import { API_BASE_URL as BASE_URL } from "@/const/appConst";

export interface VoiceProfile {
  id: string
  name: string
  gender: 'Female' | 'Male'
  accent: 'US' | 'UK' | 'AU' | 'CA'
  flag: string
  locale: string
  description: string
  sample_text: string
}

export interface VoiceListResponse {
  voices: VoiceProfile[]
  default_voice: string
}

export interface TTSGenerateRequest {
  text: string
  voice?: string
  rate?: string
  pitch?: string
}

export interface TTSGenerateResponse {
  audio_url: string
  filename: string
  cached: boolean
  voice: string
  rate: string
  text_length: number
}

export interface STTWordMatch {
  word: string
  status: 'correct' | 'missing' | 'mispronounced' | 'extra'
}

export interface STTResponse {
  transcript: string
  confidence: number
  target_text: string | null
  accuracy_score: number
  is_match: boolean
  word_analysis: STTWordMatch[]
  missing_words: string[]
  extra_words: string[]
  feedback: string
}

/** Fallback voices for instant offline/zero-latency UI rendering */
export const DEFAULT_VOICES: VoiceProfile[] = [
  {
    id: 'en-US-JennyNeural',
    name: 'Jenny',
    gender: 'Female',
    accent: 'US',
    flag: '🇺🇸',
    locale: 'en-US',
    description: 'Clear, natural American female voice (TOEIC Standard)',
    sample_text: 'Welcome to the TOEIC CareerPath listening practice.',
  },
  {
    id: 'en-US-GuyNeural',
    name: 'Guy',
    gender: 'Male',
    accent: 'US',
    flag: '🇺🇸',
    locale: 'en-US',
    description: 'Professional, calm American male voice',
    sample_text: 'The quarterly financial reports have been uploaded to the shared drive.',
  },
  {
    id: 'en-US-AriaNeural',
    name: 'Aria',
    gender: 'Female',
    accent: 'US',
    flag: '🇺🇸',
    locale: 'en-US',
    description: 'Conversational American female voice for dialogues',
    sample_text: 'Could you please send me the updated meeting agenda before noon?',
  },
  {
    id: 'en-GB-SoniaNeural',
    name: 'Sonia',
    gender: 'Female',
    accent: 'UK',
    flag: '🇬🇧',
    locale: 'en-GB',
    description: 'Refined British female voice (Part 3 & 4 conversations)',
    sample_text: 'Mind the gap between the train and the platform, please.',
  },
  {
    id: 'en-GB-RyanNeural',
    name: 'Ryan',
    gender: 'Male',
    accent: 'UK',
    flag: '🇬🇧',
    locale: 'en-GB',
    description: 'Clear British male voice for business dialogues',
    sample_text: 'We should definitely schedule a follow-up call next Tuesday.',
  },
  {
    id: 'en-AU-NatashaNeural',
    name: 'Natasha',
    gender: 'Female',
    accent: 'AU',
    flag: '🇦🇺',
    locale: 'en-AU',
    description: 'Friendly Australian female voice',
    sample_text: 'The flight from Sydney to Melbourne has been delayed by thirty minutes.',
  },
  {
    id: 'en-AU-WilliamNeural',
    name: 'William',
    gender: 'Male',
    accent: 'AU',
    flag: '🇦🇺',
    locale: 'en-AU',
    description: 'Authentic Australian male voice',
    sample_text: "Let's grab a coffee and review the project timeline together.",
  },
  {
    id: 'en-CA-ClaraNeural',
    name: 'Clara',
    gender: 'Female',
    accent: 'CA',
    flag: '🇨🇦',
    locale: 'en-CA',
    description: 'Natural Canadian female voice',
    sample_text: 'The software update is now available for download on all workstations.',
  },
  {
    id: 'en-CA-LiamNeural',
    name: 'Liam',
    gender: 'Male',
    accent: 'CA',
    flag: '🇨🇦',
    locale: 'en-CA',
    description: 'Professional Canadian male voice',
    sample_text: 'Our team has resolved the database issue and restored full access.',
  },
]

export const DEFAULT_VOICE_ID = import.meta.env.VITE_DEFAULT_VOICE_ID || 'en-US-JennyNeural'
export const DEFAULT_RATE = import.meta.env.VITE_DEFAULT_VOICE_RATE || '-15%' // Slower default for optimal listening comprehension

function resolveAudioUrl(audioUrl: string): string {
  if (!audioUrl) {
    return audioUrl
  }

  const apiBase = new URL(BASE_URL, window.location.origin)
  const apiPrefix = apiBase.pathname.replace(/\/+$/, '')
  const appOrigin = apiBase.origin

  if (/^https?:\/\//i.test(audioUrl)) {
    return audioUrl
  }

  if (audioUrl.startsWith('/career/static/')) {
    return `${appOrigin}${apiPrefix}/static/${audioUrl.slice('/career/static/'.length)}`
  }

  if (audioUrl.startsWith('/api/static/')) {
    const baseWithoutApi = apiPrefix.endsWith('/api')
      ? apiPrefix.slice(0, -'/api'.length)
      : ''
    return `${appOrigin}${baseWithoutApi}${audioUrl}`
  }

  if (audioUrl.startsWith('/static/')) {
    return `${appOrigin}${apiPrefix}${audioUrl}`
  }

  if (audioUrl.startsWith('/')) {
    return `${appOrigin}${audioUrl}`
  }

  return `${appOrigin}${apiPrefix}/${audioUrl.replace(/^\/+/, '')}`
}

/** Fetch list of available multi-accent TOEIC English voices */
export async function fetchVoices(): Promise<VoiceListResponse> {
  try {
    const res = await fetchWithAuthRetry(`${BASE_URL}/audio/voices`)
    if (!res.ok) {
      return { voices: DEFAULT_VOICES, default_voice: DEFAULT_VOICE_ID }
    }
    return await res.json()
  } catch {
    return { voices: DEFAULT_VOICES, default_voice: DEFAULT_VOICE_ID }
  }
}

function buildTTSStreamUrl(
  text: string,
  voice = DEFAULT_VOICE_ID,
  rate = DEFAULT_RATE,
  pitch = '+0Hz'
): string {
  const params = new URLSearchParams({
    text: text.trim(),
    voice,
    rate,
    pitch,
  })
  return `${BASE_URL}/audio/tts/stream?${params.toString()}`
}

/** Legacy direct stream URL builder. Prefer `prepareTTSPlaybackUrl()` for protected playback. */
export function getTTSStreamUrl(
  text: string,
  voice = DEFAULT_VOICE_ID,
  rate = DEFAULT_RATE,
  pitch = '+0Hz'
): string {
  return buildTTSStreamUrl(text, voice, rate, pitch)
}

/** Generate and cache MP3 audio on the server */
export async function generateTTSAudio(
  request: TTSGenerateRequest
): Promise<TTSGenerateResponse> {
  const res = await fetchWithAuthRetry(`${BASE_URL}/audio/tts/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail ?? 'Failed to generate audio')
  }
  const result = await res.json() as TTSGenerateResponse
  return {
    ...result,
    audio_url: resolveAudioUrl(result.audio_url),
  }
}

/** Prepare an auth-safe playback URL by generating or reusing the cached MP3 file. */
export async function prepareTTSPlaybackUrl(
  text: string,
  voice = DEFAULT_VOICE_ID,
  rate = DEFAULT_RATE,
  pitch = '+0Hz'
): Promise<string> {
  const result = await generateTTSAudio({
    text,
    voice,
    rate,
    pitch,
  })
  return result.audio_url
}

/** Upload recorded audio blob to server for STT and pronunciation scoring */
export async function uploadSTTAudio(
  audioBlob: Blob,
  targetText?: string
): Promise<STTResponse> {
  const formData = new FormData()
  const extension = audioBlob.type.includes('wav')
    ? 'wav'
    : audioBlob.type.includes('mp3')
    ? 'mp3'
    : 'webm'
  formData.append('audio_file', audioBlob, `recording.${extension}`)

  if (targetText && targetText.trim()) {
    formData.append('target_text', targetText.trim())
  }

  const res = await fetchWithAuthRetry(`${BASE_URL}/audio/stt`, {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail ?? 'Failed to process speech to text')
  }
  return res.json()
}

// ─── Pronunciation assessment (phoneme-level) ────────────────────────────────
// Distinct from uploadSTTAudio: that one transcribes and diffs whole words, so it
// can say a word was wrong but not which sound. These mirror the backend's
// PronunciationResponse in app/feature/audio/audio_schema.py exactly.

export interface PronunciationPhone {
  /** Expected phone in IPA */
  expected: string
  /** What was heard; empty string means the phone was silent */
  heard: string
  /** Confidence that THIS phone is wrong, 0.0-1.0 */
  confidence: number
}

export interface PronunciationWordError {
  position: number
  word: string
  expected_ipa: string
  heard_ipa: string
  phone_distance: number
  /** Confidence that this word IS mispronounced, 0.0-1.0 */
  confidence: number
  phones: PronunciationPhone[]
}

export interface PronunciationResponse {
  expected_text: string
  transcript: string
  /** Overall score, 0-100 */
  score: number
  /** Fractions (0.0-1.0), not percentages */
  word_error_rate: number
  phoneme_error_rate: number
  words_with_errors: string[]
  errors: PronunciationWordError[]
  duration_seconds: number | null
  language: string
  /** Coaching feedback in markdown */
  feedback_summary: string
  /** False when scoring succeeded but the LLM call failed */
  llm_feedback_available: boolean
  /** Plain-text recap (<= 75 words) of the words/sounds that went wrong */
  short_summary?: string
}

/**
 * One Section 2 vocabulary card. Send it when the target is a single term: the
 * backend then coaches the word with prompts F4/F5 (syllables, stress, phonemes)
 * instead of F1/F2, which are written for a whole sentence.
 */
export interface VocabWordContext {
  term: string
  ipa?: string
  pos?: string
  vn_meaning?: string
  pronunciation_guide?: string
  example?: string
}

/** Upload a recording for phoneme-level scoring plus AI coaching feedback. */
export async function uploadPronunciationAudio(
  audioBlob: Blob,
  expectedText: string,
  wordContext?: VocabWordContext
): Promise<PronunciationResponse> {
  const formData = new FormData()
  const extension = audioBlob.type.includes('wav')
    ? 'wav'
    : audioBlob.type.includes('mp3')
    ? 'mp3'
    : 'webm'
  formData.append('audio_file', audioBlob, `recording.${extension}`)
  formData.append('expected_text', expectedText.trim())

  if (wordContext) {
    formData.append('word_context', JSON.stringify(wordContext))
  }

  // No Content-Type header: the browser must set the multipart boundary itself.
  const res = await fetchWithAuthRetry(`${BASE_URL}/audio/pronunciation`, {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail ?? 'Failed to assess pronunciation')
  }
  return res.json()
}
