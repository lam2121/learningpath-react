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

/** Fetch list of available multi-accent TOEIC English voices */
export async function fetchVoices(): Promise<VoiceListResponse> {
  const res = await fetch(`${BASE_URL}/audio/voices`)
  if (!res.ok) {
    throw new Error(`Failed to fetch voices: ${res.statusText}`)
  }
  return res.json()
}

/** Build direct audio streaming URL for instant playback */
export function getTTSStreamUrl(
  text: string,
  voice = 'en-US-JennyNeural',
  rate = '+0%',
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
  // Determine filename based on mime type
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
