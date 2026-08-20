import { useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  Check,
  ChevronDown,
  FileText,
  Gauge,
  Headphones,
  Loader2,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
} from 'lucide-react'

import {
  DEFAULT_VOICE_ID,
  DEFAULT_VOICES,
  fetchVoices,
  getTTSStreamUrl,
  type VoiceProfile,
} from '@/feature/audio/audioApi'
import { Badge } from '@/shadcn/component/ui/badge'
import { Button } from '@/shadcn/component/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shadcn/component/ui/dropdown-menu'
import { Slider } from '@/shadcn/component/ui/slider'

const STORAGE_VOICE_KEY = 'toeic_audio_voice'
const STORAGE_RATE_KEY = 'toeic_audio_rate'

// Standard speed presets for listening practice
const SPEED_PRESETS = [
  { label: '0.75x Slowest', rate: -25, description: 'Deep focus on phonetics & difficult words' },
  { label: '0.85x Slow', rate: -15, description: 'Recommended learner pace for comprehension' },
  { label: '1.0x Normal', rate: 0, description: 'Real-world TOEIC exam standard speed' },
  { label: '1.15x Fast', rate: 15, description: 'Advanced challenge for fast listeners' },
]

interface ListeningAudioPlayerProps {
  scriptText: string
  rawTranscript?: string
  title?: string
  subtitle?: string
}

export function ListeningAudioPlayer({
  scriptText,
  rawTranscript,
  title = 'Workplace Audio Track',
  subtitle = 'Authentic Spoken Workplace Monologue',
}: ListeningAudioPlayerProps) {
  // Voice list & configuration state
  const [voices, setVoices] = useState<VoiceProfile[]>(DEFAULT_VOICES)
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(() => {
    return localStorage.getItem(STORAGE_VOICE_KEY) || DEFAULT_VOICE_ID
  })
  const [ratePercent, setRatePercent] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_RATE_KEY)
    return saved !== null ? parseInt(saved, 10) : -15 // Default to -15% slower speed
  })

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [showTranscript, setShowTranscript] = useState(false)
  const [streamError, setStreamError] = useState<string | null>(null)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const isScrubbingRef = useRef(false)
  const loadTokenRef = useRef(0)

  // Fetch available voices on mount
  useEffect(() => {
    fetchVoices().then((data) => {
      if (data.voices && data.voices.length > 0) {
        setVoices(data.voices)
      }
    })
  }, [])

  // Persist voice & rate settings
  useEffect(() => {
    localStorage.setItem(STORAGE_VOICE_KEY, selectedVoiceId)
  }, [selectedVoiceId])

  useEffect(() => {
    localStorage.setItem(STORAGE_RATE_KEY, ratePercent.toString())
  }, [ratePercent])

  // Formatted speed rate string e.g. "-15%", "+0%", "+15%"
  const formattedRate = `${ratePercent >= 0 ? '+' : ''}${ratePercent}%`

  // Get active voice object
  const activeVoice = voices.find((v) => v.id === selectedVoiceId) ?? voices[0]

  // Setup current stream URL
  const currentStreamUrl = getTTSStreamUrl(scriptText, selectedVoiceId, formattedRate)

  // Robust audio source switcher with token guards and one-time listeners
  const switchAudioTrack = (newVoiceId: string, newRate: number) => {
    const audio = audioRef.current
    if (!audio) return

    const newFormattedRate = `${newRate >= 0 ? '+' : ''}${newRate}%`
    const newUrl = getTTSStreamUrl(scriptText, newVoiceId, newFormattedRate)

    const wasPlaying = isPlaying
    const prevTime = audio.currentTime
    const prevDuration = duration
    const currentToken = ++loadTokenRef.current

    if (wasPlaying) {
      audio.pause()
      setIsLoading(true)
    }

    setStreamError(null)
    audio.src = newUrl
    audio.load()

    const onReady = () => {
      // Ignore if a newer switch request occurred
      if (loadTokenRef.current !== currentToken) return

      audio.removeEventListener('loadeddata', onReady)
      audio.removeEventListener('canplay', onReady)

      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration)
      }

      // Proportional position mapping across rate/voice changes
      if (prevTime > 0 && audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        const ratio = prevDuration > 0 ? prevTime / prevDuration : 0
        const targetTime =
          ratio > 0
            ? Math.min(ratio * audio.duration, Math.max(0, audio.duration - 0.1))
            : Math.min(prevTime, Math.max(0, audio.duration - 0.1))
        audio.currentTime = Math.max(0, targetTime)
        setCurrentTime(Math.max(0, targetTime))
      }

      if (wasPlaying) {
        audio
          .play()
          .then(() => {
            if (loadTokenRef.current === currentToken) {
              setIsPlaying(true)
              setIsLoading(false)
            }
          })
          .catch((err) => {
            if (err?.name !== 'AbortError') {
              console.warn('Playback resume failed:', err)
              setIsPlaying(false)
            }
            setIsLoading(false)
          })
      } else {
        setIsLoading(false)
      }
    }

    audio.addEventListener('loadeddata', onReady, { once: true })
    audio.addEventListener('canplay', onReady, { once: true })
  }

  // Handle Voice Change
  const handleVoiceChange = (voiceId: string) => {
    setSelectedVoiceId(voiceId)
    switchAudioTrack(voiceId, ratePercent)
  }

  // Handle Rate Change
  const handleRateChange = (newRate: number) => {
    setRatePercent(newRate)
    switchAudioTrack(selectedVoiceId, newRate)
  }

  // Play / Pause Toggle
  const togglePlay = async () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setStreamError(null)

    // Ensure audio src is current
    if (!audio.src || audio.src !== currentStreamUrl) {
      audio.src = currentStreamUrl
      audio.load()
    }

    try {
      await audio.play()
      setIsPlaying(true)
      setIsLoading(false)
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        setIsLoading(false)
        return
      }

      console.error('Audio stream play error, falling back to Web Speech API:', err)
      setStreamError('Network stream unavailable. Using browser speech synthesis fallback.')

      // Web Speech API fallback with calibrated rate
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
        const utterance = new SpeechSynthesisUtterance(scriptText)
        utterance.lang = activeVoice.locale || 'en-US'
        // Map ratePercent (-25 to +25) to SpeechSynthesis rate (0.7 to 1.3)
        utterance.rate = Math.max(0.6, Math.min(1.4, 1 + ratePercent / 100))
        utterance.onend = () => {
          setIsPlaying(false)
          setIsLoading(false)
        }
        utterance.onerror = () => {
          setIsPlaying(false)
          setIsLoading(false)
        }
        window.speechSynthesis.speak(utterance)
        setIsPlaying(true)
        setIsLoading(false)
      } else {
        setIsLoading(false)
        setIsPlaying(false)
      }
    }
  }

  // Skip time forward or backward
  const handleSkip = (seconds: number) => {
    const audio = audioRef.current
    if (!audio) return
    const newTime = Math.min(Math.max(0, audio.currentTime + seconds), duration || 0)
    audio.currentTime = newTime
    setCurrentTime(newTime)
  }

  // Seek bar / progress scrubber
  const handleScrub = (newProgress: number[]) => {
    const audio = audioRef.current
    if (!audio || !duration || isNaN(duration)) return
    const targetTime = (newProgress[0] / 100) * duration
    audio.currentTime = targetTime
    setCurrentTime(targetTime)
  }

  // Toggle Mute
  const toggleMute = () => {
    const audio = audioRef.current
    if (!audio) return
    const nextMuted = !isMuted
    audio.muted = nextMuted
    setIsMuted(nextMuted)
  }

  // Audio element event listeners
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handlePlay = () => {
      setIsPlaying(true)
      setIsLoading(false)
    }
    const handlePause = () => {
      setIsPlaying(false)
    }
    const handleEnded = () => {
      setIsPlaying(false)
      setIsLoading(false)
      setCurrentTime(0)
    }
    const handleTimeUpdate = () => {
      if (!isScrubbingRef.current) {
        setCurrentTime(audio.currentTime)
      }
    }
    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration)
      }
      setIsLoading(false)
    }
    const handleDurationChange = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration)
      }
    }
    const handleWaiting = () => {
      setIsLoading(true)
    }
    const handlePlaying = () => {
      setIsPlaying(true)
      setIsLoading(false)
    }
    const handleCanPlay = () => {
      setIsLoading(false)
    }
    const handleError = () => {
      setIsLoading(false)
      setIsPlaying(false)
    }

    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('durationchange', handleDurationChange)
    audio.addEventListener('waiting', handleWaiting)
    audio.addEventListener('playing', handlePlaying)
    audio.addEventListener('canplay', handleCanPlay)
    audio.addEventListener('error', handleError)

    return () => {
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('durationchange', handleDurationChange)
      audio.removeEventListener('waiting', handleWaiting)
      audio.removeEventListener('playing', handlePlaying)
      audio.removeEventListener('canplay', handleCanPlay)
      audio.removeEventListener('error', handleError)
      audio.pause()
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    if (isNaN(secs) || !isFinite(secs) || secs < 0) return '0:00'
    const totalSecs = Math.floor(secs)
    const m = Math.floor(totalSecs / 60)
    const s = totalSecs % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const progressPercent =
    duration > 0 && isFinite(duration)
      ? Math.min(100, Math.max(0, (currentTime / duration) * 100))
      : 0

  return (
    <div className="rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50/90 via-indigo-50/60 to-purple-50/90 p-5 md:p-6 shadow-md dark:border-blue-900/60 dark:bg-gradient-to-br dark:from-slate-900 dark:via-blue-950/40 dark:to-slate-900 transition-all">
      {/* Hidden audio element for high fidelity playback */}
      <audio ref={audioRef} preload="auto" />

      {/* Top Header & Track Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-blue-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 shrink-0">
            <Headphones className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                {title}
              </span>
              {ratePercent < 0 && (
                <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 text-[10px] py-0 px-1.5 font-medium">
                  Slow Learning Pace ({formattedRate})
                </Badge>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {subtitle}
            </h3>
          </div>
        </div>

        {/* Quick Settings: Voice Dropdown & Transcript Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Voice Selector Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 rounded-full border-blue-200 bg-white/80 dark:border-slate-700 dark:bg-slate-800/80 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 shadow-sm"
              >
                <span>{activeVoice.flag}</span>
                <span className="max-w-[90px] sm:max-w-[120px] truncate">{activeVoice.name}</span>
                <span className="text-[10px] text-slate-400">({activeVoice.accent})</span>
                <ChevronDown className="h-3 w-3 opacity-60 ml-0.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-64 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl p-1 z-50"
            >
              <DropdownMenuLabel className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1.5">
                TOEIC Speaker Voices
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800" />

              {/* US Voices */}
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold px-2 py-1">
                  🇺🇸 American Accents
                </DropdownMenuLabel>
                {voices
                  .filter((v) => v.accent === 'US')
                  .map((v) => (
                    <DropdownMenuItem
                      key={v.id}
                      onClick={() => handleVoiceChange(v.id)}
                      className="flex items-center justify-between text-xs px-2 py-1.5 rounded-xl cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/60"
                    >
                      <div className="flex items-center gap-2">
                        <span>{v.flag}</span>
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">
                            {v.name} <span className="text-[10px] text-slate-400">({v.gender})</span>
                          </p>
                          <p className="text-[10px] text-slate-500 line-clamp-1">{v.description}</p>
                        </div>
                      </div>
                      {selectedVoiceId === v.id && (
                        <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                      )}
                    </DropdownMenuItem>
                  ))}
              </DropdownMenuGroup>

              {/* UK Voices */}
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold px-2 py-1">
                  🇬🇧 British Accents
                </DropdownMenuLabel>
                {voices
                  .filter((v) => v.accent === 'UK')
                  .map((v) => (
                    <DropdownMenuItem
                      key={v.id}
                      onClick={() => handleVoiceChange(v.id)}
                      className="flex items-center justify-between text-xs px-2 py-1.5 rounded-xl cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-950/60"
                    >
                      <div className="flex items-center gap-2">
                        <span>{v.flag}</span>
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">
                            {v.name} <span className="text-[10px] text-slate-400">({v.gender})</span>
                          </p>
                          <p className="text-[10px] text-slate-500 line-clamp-1">{v.description}</p>
                        </div>
                      </div>
                      {selectedVoiceId === v.id && (
                        <Check className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
                      )}
                    </DropdownMenuItem>
                  ))}
              </DropdownMenuGroup>

              {/* AU & CA Voices */}
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold px-2 py-1">
                  🇦🇺 Australian & 🇨🇦 Canadian
                </DropdownMenuLabel>
                {voices
                  .filter((v) => v.accent === 'AU' || v.accent === 'CA')
                  .map((v) => (
                    <DropdownMenuItem
                      key={v.id}
                      onClick={() => handleVoiceChange(v.id)}
                      className="flex items-center justify-between text-xs px-2 py-1.5 rounded-xl cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-950/60"
                    >
                      <div className="flex items-center gap-2">
                        <span>{v.flag}</span>
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">
                            {v.name} <span className="text-[10px] text-slate-400">({v.gender})</span>
                          </p>
                          <p className="text-[10px] text-slate-500 line-clamp-1">{v.description}</p>
                        </div>
                      </div>
                      {selectedVoiceId === v.id && (
                        <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      )}
                    </DropdownMenuItem>
                  ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View Transcript Toggle Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTranscript(!showTranscript)}
            className="h-9 gap-1.5 rounded-full border-blue-200 bg-white/80 dark:border-slate-700 dark:bg-slate-800/80 text-xs font-semibold shadow-sm"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>{showTranscript ? 'Hide script' : 'View script'}</span>
          </Button>
        </div>
      </div>

      {/* Main Playback Deck */}
      <div className="mt-5 space-y-4">
        {/* Progress Bar & Time */}
        <div className="space-y-1.5">
          <Slider
            value={[progressPercent]}
            min={0}
            max={100}
            step={0.5}
            onValueChange={handleScrub}
            className="py-1 cursor-pointer"
          />
          <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400 font-semibold px-0.5">
            <span>{formatTime(currentTime)}</span>
            <span>{duration > 0 ? formatTime(duration) : '0:00'}</span>
          </div>
        </div>

        {/* Controls Bar: Play / Pause / Rewind / Speed / Volume */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* Left: Playback Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Rewind 5s */}
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => handleSkip(-5)}
              title="Rewind 5 seconds"
              className="h-10 w-10 rounded-full border-blue-200 bg-white/90 dark:border-slate-700 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-700 shadow-sm"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>

            {/* Main Play/Pause Button */}
            <Button
              type="button"
              onClick={togglePlay}
              disabled={isLoading}
              className="h-12 px-6 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-blue-500/25 flex items-center gap-2 transition-transform active:scale-95"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Loading...</span>
                </>
              ) : isPlaying ? (
                <>
                  <Pause className="h-5 w-5 fill-current" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 fill-current ml-0.5" />
                  <span>Play Track</span>
                </>
              )}
            </Button>

            {/* Fast Forward 5s */}
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => handleSkip(5)}
              title="Forward 5 seconds"
              className="h-10 w-10 rounded-full border-blue-200 bg-white/90 dark:border-slate-700 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-700 shadow-sm"
            >
              <span className="text-xs font-bold font-mono">+5s</span>
            </Button>

            {/* Mute Toggle */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={toggleMute}
              title={isMuted ? 'Unmute' : 'Mute'}
              className="h-9 w-9 rounded-full text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            >
              {isMuted ? <VolumeX className="h-4 w-4 text-red-500" /> : <Volume2 className="h-4 w-4" />}
            </Button>
          </div>

          {/* Right: Reading Speed / Rate Buttons */}
          <div className="flex items-center gap-1.5 bg-white/80 dark:bg-slate-950/60 p-1 rounded-full border border-blue-100 dark:border-slate-800 shadow-sm">
            <Gauge className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 ml-2 mr-1 shrink-0" />
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 hidden sm:inline mr-1">
              Speed:
            </span>
            {SPEED_PRESETS.map((preset) => {
              const isActive = ratePercent === preset.rate
              return (
                <button
                  key={preset.rate}
                  type="button"
                  onClick={() => handleRateChange(preset.rate)}
                  title={preset.description}
                  className={`px-2.5 py-1 text-xs font-bold rounded-full transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {preset.label.split(' ')[0]}
                </button>
              )
            })}
          </div>
        </div>

        {/* Stream Error Notice */}
        {streamError && (
          <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
            <span>{streamError}</span>
          </div>
        )}

        {/* Audio Script / Transcript View (Collapsible) */}
        {showTranscript && (
          <article className="mt-4 rounded-2xl border border-blue-200/80 bg-white p-5 shadow-inner dark:border-blue-900/60 dark:bg-slate-950 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Spoken Audio Script / Monologue Transcript
              </p>
              <Badge variant="outline" className="text-[10px] border-slate-200 dark:border-slate-800 text-slate-500">
                {activeVoice.flag} {activeVoice.name} ({activeVoice.accent}) • {formattedRate}
              </Badge>
            </div>
            <p className="text-sm leading-7 text-slate-700 dark:text-slate-200 font-medium">
              {rawTranscript || scriptText}
            </p>
          </article>
        )}
      </div>
    </div>
  )
}
