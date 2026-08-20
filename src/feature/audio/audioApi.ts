const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api'

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

export const DEFAULT_VOICE_ID = 'en-US-JennyNeural'
export const DEFAULT_RATE = '-15%' // Slower default for optimal listening comprehension

/** Fetch list of available multi-accent TOEIC English voices */
export async function fetchVoices(): Promise<VoiceListResponse> {
  try {
    const res = await fetch(`${BASE_URL}/audio/voices`)
    if (!res.ok) {
      return { voices: DEFAULT_VOICES, default_voice: DEFAULT_VOICE_ID }
    }
    return await res.json()
  } catch {
    return { voices: DEFAULT_VOICES, default_voice: DEFAULT_VOICE_ID }
  }
}

/** Build direct audio streaming URL for instant playback */
export function getTTSStreamUrl(
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

/** Generate and cache MP3 audio on the server */
export async function generateTTSAudio(
  request: TTSGenerateRequest
): Promise<TTSGenerateResponse> {
  const res = await fetch(`${BASE_URL}/audio/tts/generate`, {
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
  return res.json()
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

  const res = await fetch(`${BASE_URL}/audio/stt`, {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail ?? 'Failed to process speech to text')
  }
  return res.json()
}
