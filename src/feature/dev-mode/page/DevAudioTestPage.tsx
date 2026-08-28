import { useEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  AlertCircle,
  ArrowLeft,
  AudioLines,
  Award,
  CheckCircle2,
  Download,
  Headphones,
  Loader2,
  Mic,
  MicOff,
  Pause,
  Play,
  Radio,
  RotateCcw,
  Sparkles,
  Square,
  Volume2,
  XCircle,
} from 'lucide-react'

import { Badge } from '@/shadcn/component/ui/badge'
import { Button } from '@/shadcn/component/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shadcn/component/ui/card'
import { Progress } from '@/shadcn/component/ui/progress'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/shadcn/component/ui/select'
import { Slider } from '@/shadcn/component/ui/slider'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/shadcn/component/ui/tabs'
import { Textarea } from '@/shadcn/component/ui/textarea'
import {
  fetchVoices,
  generateTTSAudio,
  prepareTTSPlaybackUrl,
  uploadSTTAudio,
  type STTResponse,
  type TTSGenerateResponse,
  type VoiceProfile,
} from '../api/devAudioApi'

// Preset sample phrases for quick testing
const TTS_PRESETS = [
  {
    category: 'TOEIC Part 1: Photos',
    text: 'Several people are seated around a conference table looking at a projection screen.',
  },
  {
    category: 'TOEIC Part 2: Q&A',
    text: 'Could you please let me know when the revised project timeline will be ready?',
  },
  {
    category: 'TOEIC Part 3: Dialogue',
    text: 'Good morning, Ms. Jenkins. I reviewed the budget proposal for the new IT infrastructure, and everything looks solid.',
  },
  {
    category: 'TOEIC Part 4: Announcement',
    text: 'Attention passengers on flight 402 to London Heathrow. The departure gate has been moved to Terminal B, Gate 14.',
  },
  {
    category: 'IT Technical English',
    text: 'The backend microservice crashed due to a concurrent memory leak in the database connection pool.',
  },
]

const STT_TARGET_PRESETS = [
  'The server crashed due to a memory leak.',
  'We should schedule a follow-up meeting next Monday.',
  'Please submit the quarterly expenditure report before five PM.',
  'Our development team successfully deployed the hotfix to production.',
]

export function DevAudioTestPage() {
  // Voice list state
  const [voices, setVoices] = useState<VoiceProfile[]>([])
  const [selectedVoice, setSelectedVoice] = useState('en-US-JennyNeural')
  const [ratePercent, setRatePercent] = useState(0) // -25 to +25

  // TTS State
  const [ttsText, setTtsText] = useState(TTS_PRESETS[0].text)
  const [ttsLoading, setTtsLoading] = useState(false)
  const [ttsResult, setTtsResult] = useState<TTSGenerateResponse | null>(null)
  const [ttsError, setTtsError] = useState<string | null>(null)

  // Audio Playback State
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioProgress, setAudioProgress] = useState(0)
  const [audioDuration, setAudioDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // STT State
  const [sttTargetText, setSttTargetText] = useState(STT_TARGET_PRESETS[0])
  const [isRecording, setIsRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [sttLoading, setSttLoading] = useState(false)
  const [sttResult, setSttResult] = useState<STTResponse | null>(null)
  const [sttError, setSttError] = useState<string | null>(null)

  // Browser Web Speech API state
  const [webSpeechSupported, setWebSpeechSupported] = useState(false)
  const [browserTranscript, setBrowserTranscript] = useState('')
  const [isBrowserListening, setIsBrowserListening] = useState(false)
  const recognitionRef = useRef<unknown>(null)

  // MediaRecorder refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Load voices on mount
  useEffect(() => {
    fetchVoices()
      .then((data) => {
        setVoices(data.voices)
        if (data.default_voice) {
          setSelectedVoice(data.default_voice)
        }
      })
      .catch((err) => {
        console.error('Could not load voices:', err)
      })

    // Check browser speech recognition support
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition
    if (SpeechRecognition) {
      setWebSpeechSupported(true)
    }
  }, [])

  // Rate formatted string (+0%, -10%, +15%)
  const formattedRate = `${ratePercent >= 0 ? '+' : ''}${ratePercent}%`

  // Handle TTS Live Stream Playback
  const handlePlayLiveStream = async () => {
    if (!ttsText.trim()) return
    setTtsLoading(true)
    setTtsError(null)
    try {
      const playbackUrl = await prepareTTSPlaybackUrl(ttsText, selectedVoice, formattedRate)
      if (audioRef.current) {
        audioRef.current.src = playbackUrl
        await audioRef.current.play()
      }
    } catch (err) {
      setTtsError(`Audio playback error: ${(err as Error).message}`)
    } finally {
      setTtsLoading(false)
    }
  }

  // Handle Server-Side TTS Generation & Caching
  const handleGenerateTTS = async () => {
    if (!ttsText.trim()) return
    setTtsLoading(true)
    setTtsError(null)
    try {
      const result = await generateTTSAudio({
        text: ttsText,
        voice: selectedVoice,
        rate: formattedRate,
      })
      setTtsResult(result)
      if (audioRef.current) {
        audioRef.current.src = result.audio_url
        audioRef.current.play().catch(() => {})
      }
    } catch (err) {
      setTtsError((err as Error).message)
    } finally {
      setTtsLoading(false)
    }
  }

  // Audio element event listeners
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleEnded = () => {
      setIsPlaying(false)
      setAudioProgress(0)
    }
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
      if (audio.duration) {
        setAudioProgress((audio.currentTime / audio.duration) * 100)
      }
    }
    const handleLoadedMetadata = () => {
      setAudioDuration(audio.duration)
    }

    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)

    return () => {
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
    }
  }, [])

  // Start MediaRecorder (STT)
  const startRecording = async () => {
    setSttError(null)
    setSttResult(null)
    setRecordedAudioUrl(null)
    setRecordedBlob(null)
    audioChunksRef.current = []

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        })
        setRecordedBlob(audioBlob)
        const url = URL.createObjectURL(audioBlob)
        setRecordedAudioUrl(url)

        // Stop all tracks to release mic
        stream.getTracks().forEach((track) => track.stop())
      }

      recorder.start(100)
      setIsRecording(true)
      setRecordingSeconds(0)

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1)
      }, 1000)
    } catch (err) {
      setSttError(`Microphone access error: ${(err as Error).message}`)
    }
  }

  // Stop MediaRecorder (STT)
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }

  // Submit recorded audio to server for STT analysis
  const handleEvaluateAudio = async () => {
    if (!recordedBlob) return
    setSttLoading(true)
    setSttError(null)
    try {
      const res = await uploadSTTAudio(recordedBlob, sttTargetText)
      setSttResult(res)
    } catch (err) {
      setSttError((err as Error).message)
    } finally {
      setSttLoading(false)
    }
  }

  // Browser Web Speech Recognition Toggle
  const toggleBrowserRecognition = () => {
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition

    if (!SpeechRecognition) return

    if (isBrowserListening) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(recognitionRef.current as any)?.stop()
      setIsBrowserListening(false)
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const recognition = new (SpeechRecognition as any)()
      recognition.lang = 'en-US'
      recognition.continuous = true
      recognition.interimResults = true

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        let transcript = ''
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript
        }
        setBrowserTranscript(transcript)
      }

      recognition.onend = () => {
        setIsBrowserListening(false)
      }

      recognition.start()
      recognitionRef.current = recognition
      setIsBrowserListening(true)
    }
  }

  // Selected Voice details
  const activeVoiceObj = voices.find((v) => v.id === selectedVoice)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      {/* Hidden audio element for global playback */}
      <audio ref={audioRef} />

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Link
                to="/dev-course-demo"
                className="text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                Audio & Speech Studio (TTS / STT)
              </h1>
              <Badge variant="outline" className="border-blue-500/40 text-blue-400 bg-blue-950/40">
                Dev Harness
              </Badge>
            </div>
            <p className="text-sm text-slate-400">
              Multi-accent Microsoft Neural Text-to-Speech & Speech Recognition with Pronunciation Scoring.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/dev-course-demo">
              <Button variant="outline" size="sm" className="border-slate-700 hover:bg-slate-800 text-slate-300">
                Roadmap Dev Demo
              </Button>
            </Link>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="tts" className="w-full space-y-6">
          <TabsList className="grid grid-cols-2 max-w-md bg-slate-900 border border-slate-800 p-1">
            <TabsTrigger
              value="tts"
              className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white flex items-center gap-2"
            >
              <Volume2 className="w-4 h-4" />
              Text-to-Speech (TTS)
            </TabsTrigger>
            <TabsTrigger
              value="stt"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white flex items-center gap-2"
            >
              <Mic className="w-4 h-4" />
              Speech-to-Text (STT)
            </TabsTrigger>
          </TabsList>

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 1: TEXT TO SPEECH (TTS)
          ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="tts" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Text Input & Presets */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="bg-slate-900/90 border-slate-800 shadow-xl">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-slate-200 flex items-center gap-2">
                        <AudioLines className="w-5 h-5 text-indigo-400" />
                        Text Prompt & Presets
                      </CardTitle>
                      <span className="text-xs text-slate-500">{ttsText.length} characters</span>
                    </div>
                    <CardDescription className="text-slate-400">
                      Select a standard TOEIC prompt or enter custom English sentences.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Quick Preset Buttons */}
                    <div className="flex flex-wrap gap-2">
                      {TTS_PRESETS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setTtsText(preset.text)}
                          className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                            ttsText === preset.text
                              ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
                              : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                          }`}
                        >
                          {preset.category}
                        </button>
                      ))}
                    </div>

                    <Textarea
                      rows={4}
                      value={ttsText}
                      onChange={(e) => setTtsText(e.target.value)}
                      placeholder="Type English sentence to synthesize..."
                      className="bg-slate-950/80 border-slate-700 text-slate-100 placeholder:text-slate-600 focus:border-indigo-500 resize-none font-medium leading-relaxed"
                    />

                    {/* Action Bar */}
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <Button
                        onClick={handlePlayLiveStream}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center gap-2 shadow-lg shadow-indigo-500/20"
                      >
                        <Play className="w-4 h-4" />
                        Stream & Play Live
                      </Button>

                      <Button
                        onClick={handleGenerateTTS}
                        disabled={ttsLoading}
                        variant="outline"
                        className="border-slate-700 hover:bg-slate-800 text-slate-200 flex items-center gap-2"
                      >
                        {ttsLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 text-indigo-400" />
                            Generate & Cache MP3
                          </>
                        )}
                      </Button>

                      {ttsResult?.cached && (
                        <Badge className="bg-emerald-950/80 text-emerald-300 border-emerald-500/40">
                          ⚡ Served from Cache
                        </Badge>
                      )}
                    </div>

                    {ttsError && (
                      <div className="p-3 bg-red-950/40 border border-red-800 rounded-md text-xs text-red-300 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        <span>{ttsError}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Audio Player Card */}
                <Card className="bg-slate-900/90 border-slate-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-slate-300 flex items-center gap-2">
                      <Headphones className="w-4 h-4 text-indigo-400" />
                      Live Audio Player
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-4">
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={() => {
                          if (!audioRef.current) return
                          if (isPlaying) {
                            audioRef.current.pause()
                          } else {
                            audioRef.current.play().catch(() => {})
                          }
                        }}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-full w-12 h-12 flex items-center justify-center shrink-0"
                      >
                        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                      </Button>

                      <div className="flex-1 space-y-1.5">
                        <Progress value={audioProgress} className="h-2 bg-slate-800" />
                        <div className="flex justify-between text-xs text-slate-400 font-mono">
                          <span>
                            {Math.floor(currentTime / 60)}:
                            {Math.floor(currentTime % 60)
                              .toString()
                              .padStart(2, '0')}
                          </span>
                          <span>
                            {Math.floor(audioDuration / 60)}:
                            {Math.floor(audioDuration % 60)
                              .toString()
                              .padStart(2, '0')}
                          </span>
                        </div>
                      </div>

                      {ttsResult?.audio_url && (
                        <a
                          href={ttsResult.audio_url}
                          download={ttsResult.filename}
                          className="p-2 text-slate-400 hover:text-white transition-colors"
                          title="Download MP3"
                        >
                          <Download className="w-5 h-5" />
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Col: Voice Configuration */}
              <div className="space-y-6">
                <Card className="bg-slate-900/90 border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-base text-slate-200">Voice & Accent Settings</CardTitle>
                    <CardDescription className="text-slate-400">
                      Multi-accent neural voices tailored for TOEIC listening.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {/* Voice Select */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Select Voice
                      </label>
                      <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                        <SelectTrigger className="bg-slate-950 border-slate-700 text-slate-200">
                          <SelectValue placeholder="Choose a voice" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                          <SelectGroup>
                            <SelectLabel className="text-slate-400">🇺🇸 American Accents</SelectLabel>
                            {voices
                              .filter((v) => v.accent === 'US')
                              .map((v) => (
                                <SelectItem key={v.id} value={v.id}>
                                  {v.flag} {v.name} ({v.gender})
                                </SelectItem>
                              ))}
                          </SelectGroup>
                          <SelectGroup>
                            <SelectLabel className="text-slate-400">🇬🇧 British Accents</SelectLabel>
                            {voices
                              .filter((v) => v.accent === 'UK')
                              .map((v) => (
                                <SelectItem key={v.id} value={v.id}>
                                  {v.flag} {v.name} ({v.gender})
                                </SelectItem>
                              ))}
                          </SelectGroup>
                          <SelectGroup>
                            <SelectLabel className="text-slate-400">🇦🇺 Australian Accents</SelectLabel>
                            {voices
                              .filter((v) => v.accent === 'AU')
                              .map((v) => (
                                <SelectItem key={v.id} value={v.id}>
                                  {v.flag} {v.name} ({v.gender})
                                </SelectItem>
                              ))}
                          </SelectGroup>
                          <SelectGroup>
                            <SelectLabel className="text-slate-400">🇨🇦 Canadian Accents</SelectLabel>
                            {voices
                              .filter((v) => v.accent === 'CA')
                              .map((v) => (
                                <SelectItem key={v.id} value={v.id}>
                                  {v.flag} {v.name} ({v.gender})
                                </SelectItem>
                              ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Active Voice Info Card */}
                    {activeVoiceObj && (
                      <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80 space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-indigo-400">
                            {activeVoiceObj.flag} {activeVoiceObj.name} ({activeVoiceObj.gender})
                          </span>
                          <Badge variant="outline" className="border-slate-700 text-slate-400 text-[10px]">
                            {activeVoiceObj.locale}
                          </Badge>
                        </div>
                        <p className="text-slate-400">{activeVoiceObj.description}</p>
                      </div>
                    )}

                    {/* Speech Speed / Rate Slider */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-300 uppercase tracking-wider">
                          Speed / Rate
                        </span>
                        <span className="font-mono text-indigo-400 font-bold">{formattedRate}</span>
                      </div>
                      <Slider
                        min={-25}
                        max={25}
                        step={5}
                        value={[ratePercent]}
                        onValueChange={(val) => setRatePercent(val[0])}
                        className="py-2"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>-25% (Slow)</span>
                        <button
                          type="button"
                          onClick={() => setRatePercent(0)}
                          className="hover:text-indigo-400 transition-colors flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" /> Reset 0%
                        </button>
                        <span>+25% (Fast)</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════
              TAB 2: SPEECH TO TEXT (STT) & PRONUNCIATION
          ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="stt" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Target Phrase & Recording Controls */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="bg-slate-900/90 border-slate-800 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-lg text-slate-200 flex items-center gap-2">
                      <Mic className="w-5 h-5 text-purple-400" />
                      Speaking & Pronunciation Practice
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      Read the target sentence aloud. The system will transcribe your speech and evaluate pronunciation accuracy.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {/* Target Sentence Pickers */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Target Reference Sentence
                      </label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {STT_TARGET_PRESETS.map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSttTargetText(preset)}
                            className={`text-xs px-3 py-1.5 rounded-full border text-left transition-all ${
                              sttTargetText === preset
                                ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                                : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                            }`}
                          >
                            #{idx + 1}
                          </button>
                        ))}
                      </div>
                      <Textarea
                        rows={2}
                        value={sttTargetText}
                        onChange={(e) => setSttTargetText(e.target.value)}
                        placeholder="Enter the expected phrase to evaluate against..."
                        className="bg-slate-950/80 border-slate-700 text-slate-100 placeholder:text-slate-600 focus:border-purple-500 resize-none font-medium"
                      />
                    </div>

                    {/* Microphone Recording Zone */}
                    <div className="p-6 bg-slate-950/60 rounded-xl border border-slate-800 flex flex-col items-center justify-center space-y-4">
                      {isRecording ? (
                        <div className="relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                          <Button
                            onClick={stopRecording}
                            className="relative w-20 h-20 rounded-full bg-red-600 hover:bg-red-500 text-white flex flex-col items-center justify-center gap-1 shadow-lg shadow-red-500/30"
                          >
                            <Square className="w-6 h-6 fill-current" />
                            <span className="text-[10px] uppercase font-bold tracking-wider">Stop</span>
                          </Button>
                        </div>
                      ) : (
                        <Button
                          onClick={startRecording}
                          className="w-20 h-20 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex flex-col items-center justify-center gap-1 shadow-lg shadow-purple-500/30"
                        >
                          <Mic className="w-7 h-7" />
                          <span className="text-[10px] uppercase font-bold tracking-wider">Record</span>
                        </Button>
                      )}

                      {/* Status / Timer */}
                      <div className="text-center space-y-1">
                        {isRecording ? (
                          <div className="flex items-center gap-2 text-red-400 font-mono font-bold text-sm">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                            Recording: 00:
                            {recordingSeconds.toString().padStart(2, '0')}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400">
                            {recordedBlob
                              ? 'Audio recorded. Click "Evaluate Pronunciation" below.'
                              : 'Click the microphone button and read the reference sentence.'}
                          </p>
                        )}
                      </div>

                      {/* Recorded Audio Playback & Action */}
                      {recordedAudioUrl && !isRecording && (
                        <div className="w-full pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800/80">
                          <audio src={recordedAudioUrl} controls className="h-8 max-w-xs" />
                          <Button
                            onClick={handleEvaluateAudio}
                            disabled={sttLoading}
                            className="bg-purple-600 hover:bg-purple-500 text-white font-medium flex items-center gap-2 w-full sm:w-auto"
                          >
                            {sttLoading ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin text-white" />
                                Analyzing Speech...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4" />
                                Evaluate Pronunciation
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>

                    {sttError && (
                      <div className="p-3 bg-red-950/40 border border-red-800 rounded-md text-xs text-red-300 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        <span>{sttError}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Evaluation Results Card */}
                {sttResult && (
                  <Card className="bg-slate-900/90 border-slate-800 animate-in fade-in duration-300">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base text-slate-200 flex items-center gap-2">
                          <Award className="w-5 h-5 text-purple-400" />
                          Pronunciation Assessment Results
                        </CardTitle>
                        <Badge
                          className={`text-sm px-3 py-1 font-bold ${
                            sttResult.accuracy_score >= 85
                              ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                              : sttResult.accuracy_score >= 70
                              ? 'bg-amber-950 border-amber-500 text-amber-300'
                              : 'bg-red-950 border-red-500 text-red-300'
                          }`}
                        >
                          Score: {sttResult.accuracy_score}%
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Transcribed text */}
                      <div className="space-y-1.5 p-3 bg-slate-950/70 rounded-lg border border-slate-800">
                        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                          Recognized Speech:
                        </span>
                        <p className="text-slate-100 font-medium text-sm">
                          "{sttResult.transcript || '(No words recognized)'}"
                        </p>
                      </div>

                      {/* Word Alignment Analysis */}
                      {sttResult.word_analysis.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                            Word-by-Word Analysis:
                          </span>
                          <div className="flex flex-wrap gap-2 p-3 bg-slate-950/50 rounded-lg border border-slate-800">
                            {sttResult.word_analysis.map((item, idx) => (
                              <Badge
                                key={idx}
                                variant="outline"
                                className={`text-xs px-2.5 py-1 ${
                                  item.status === 'correct'
                                    ? 'border-emerald-500/60 bg-emerald-950/40 text-emerald-300'
                                    : item.status === 'mispronounced'
                                    ? 'border-amber-500/60 bg-amber-950/40 text-amber-300'
                                    : item.status === 'missing'
                                    ? 'border-red-500/60 bg-red-950/40 text-red-300 line-through'
                                    : 'border-blue-500/60 bg-blue-950/40 text-blue-300'
                                }`}
                              >
                                {item.word}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Coach Feedback */}
                      {sttResult.feedback && (
                        <div className="p-3 bg-purple-950/30 border border-purple-900/60 rounded-lg text-xs text-purple-200 flex items-start gap-2">
                          <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold block mb-0.5">Coach Feedback:</span>
                            {sttResult.feedback}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Right Col: Browser Web Speech API fallback & Info */}
              <div className="space-y-6">
                <Card className="bg-slate-900/90 border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-base text-slate-200 flex items-center gap-2">
                      <Radio className="w-4 h-4 text-purple-400" />
                      Client-Side Web Speech API
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      Zero-latency browser speech recognition without server roundtrips.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {webSpeechSupported ? (
                      <div className="space-y-3">
                        <Button
                          onClick={toggleBrowserRecognition}
                          variant="outline"
                          className={`w-full border-slate-700 text-xs flex items-center gap-2 ${
                            isBrowserListening
                              ? 'border-red-500 text-red-300 bg-red-950/30 animate-pulse'
                              : 'hover:bg-slate-800 text-slate-300'
                          }`}
                        >
                          {isBrowserListening ? (
                            <>
                              <MicOff className="w-4 h-4" /> Stop Browser Recognition
                            </>
                          ) : (
                            <>
                              <Mic className="w-4 h-4" /> Start Live Browser STT
                            </>
                          )}
                        </Button>

                        <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 min-h-[80px]">
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">
                            Live Browser Stream:
                          </span>
                          <p className="text-xs text-slate-200 font-mono">
                            {browserTranscript || (isBrowserListening ? 'Listening...' : '(Click start to speak)')}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-amber-950/30 border border-amber-800/60 rounded-md text-xs text-amber-300">
                        Web Speech API is not supported in this browser. Please use Chrome/Edge or server STT.
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Legend Card */}
                <Card className="bg-slate-900/90 border-slate-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase tracking-wider text-slate-400">
                      Word Analysis Legend
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-emerald-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Green: Correctly pronounced</span>
                    </div>
                    <div className="flex items-center gap-2 text-amber-300">
                      <AlertCircle className="w-4 h-4 text-amber-400" />
                      <span>Yellow: Mispronounced / close match</span>
                    </div>
                    <div className="flex items-center gap-2 text-red-300">
                      <XCircle className="w-4 h-4 text-red-400" />
                      <span>Red: Missing word from target phrase</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
