import { useState, type MouseEvent } from "react";
import { Volume2 } from "lucide-react";
import { prepareTTSPlaybackUrl, DEFAULT_VOICE_ID } from "@/feature/audio/audioApi";
import {
    STORAGE_VOICE_KEY,
    STORAGE_RATE_KEY,
} from "../audio/ListeningAudioPlayer";

let activeGlobalAudio: HTMLAudioElement | null = null;
let activeSpeechRequestId = 0;

export function stopSpeech() {
    activeSpeechRequestId += 1;
    if (activeGlobalAudio) {
        activeGlobalAudio.pause();
        activeGlobalAudio.currentTime = 0;
        activeGlobalAudio = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
    }
}

export async function speakText(text: string, onEnd?: () => void, voiceOverride?: string) {
    const requestId = activeSpeechRequestId + 1;
    stopSpeech();
    if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("app:stop-listening-audio"));
    }
    activeSpeechRequestId = requestId;
    const defaultSavedVoice =
        (typeof window !== "undefined" &&
            localStorage.getItem(STORAGE_VOICE_KEY)) ||
        DEFAULT_VOICE_ID;
    const selectedVoice = voiceOverride || defaultSavedVoice;

    const savedRate =
        (typeof window !== "undefined" &&
            localStorage.getItem(STORAGE_RATE_KEY)) ||
        "-15";
    const rateNum = parseInt(savedRate, 10);
    const formattedRate = `${rateNum >= 0 ? "+" : ""}${rateNum}%`;

    let fallbackTriggered = false;
    const triggerFallback = () => {
        if (fallbackTriggered) return;
        fallbackTriggered = true;
        if (requestId !== activeSpeechRequestId) {
            return;
        }
        if (typeof window === "undefined" || !("speechSynthesis" in window)) {
            onEnd?.();
            return;
        }
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "en-US";
        utterance.rate = Math.max(0.65, Math.min(1.2, 1 + rateNum / 100));
        if (onEnd) {
            utterance.onend = onEnd;
            utterance.onerror = onEnd;
        }
        window.speechSynthesis.speak(utterance);
    };

    let audio: HTMLAudioElement;
    try {
        const audioUrl = await prepareTTSPlaybackUrl(text, selectedVoice, formattedRate);
        if (requestId !== activeSpeechRequestId) {
            return;
        }
        audio = new Audio(audioUrl);
        activeGlobalAudio = audio;
    } catch {
        triggerFallback();
        return;
    }

    audio.onended = () => {
        activeGlobalAudio = null;
        onEnd?.();
    };
    audio.onerror = () => {
        triggerFallback();
    };

    audio.play().catch(() => {
        triggerFallback();
    });
}

export function getDialogueVoiceForSpeaker(speaker: string, index: number): string {
    const s = speaker.toLowerCase().trim();
    const femaleTerms = [
        "taylor",
        "sarah",
        "emma",
        "jenny",
        "sonia",
        "natasha",
        "clara",
        "aria",
        "anna",
        "lisa",
        "mary",
        "rachel",
        "woman",
        "female",
        "she",
        "ms",
    ];
    const maleTerms = [
        "jamie",
        "alex",
        "guy",
        "ryan",
        "william",
        "liam",
        "john",
        "david",
        "michael",
        "tom",
        "man",
        "male",
        "he",
        "mr",
    ];

    if (femaleTerms.some((term) => s.includes(term))) {
        return "en-US-JennyNeural"; // Female voice for Taylor
    }
    if (maleTerms.some((term) => s.includes(term))) {
        return "en-US-GuyNeural"; // Male voice for Jamie
    }

    // Default alternate across 4 diverse neural voices for 3-4 speakers:
    const voiceRotation = [
        "en-US-JennyNeural",
        "en-US-GuyNeural",
        "en-US-AriaNeural",
        "en-US-DavisNeural",
    ];
    return voiceRotation[index % voiceRotation.length];
}

export function AudioSpeakButton({
    text,
    label,
    className,
    voice,
}: {
    text: string;
    label?: string;
    className?: string;
    voice?: string;
}) {
    const [isPlaying, setIsPlaying] = useState(false);

    const handlePlay = (e: MouseEvent) => {
        e.stopPropagation();
        if (isPlaying) {
            stopSpeech();
            setIsPlaying(false);
            return;
        }
        setIsPlaying(true);
        void speakText(text, () => setIsPlaying(false), voice);
    };

    return (
        <button
            type="button"
            onClick={handlePlay}
            title={label ?? "Listen to pronunciation"}
            className={
                className ??
                "inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 transition hover:bg-blue-100 dark:bg-blue-950/50 dark:text-blue-300 dark:hover:bg-blue-900/50"
            }
        >
            <Volume2
                className={`h-3.5 w-3.5 ${isPlaying
                    ? "animate-pulse text-blue-600 dark:text-blue-400"
                    : ""
                    }`}
            />
            {label ? <span>{label}</span> : <span>Listen</span>}
        </button>
    );
}
