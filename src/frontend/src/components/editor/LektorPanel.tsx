import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useSaveRecording } from "@/hooks/useBackend";
import { generateSpeech } from "@/lib/tts";
import type { Editor } from "@tiptap/core";
import {
  AlertTriangle,
  Pause,
  Play,
  Save,
  Square,
  Volume2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const VOICES = [
  { value: "alloy", label: "Alloy" },
  { value: "echo", label: "Echo" },
  { value: "fable", label: "Fable" },
  { value: "onyx", label: "Onyx" },
  { value: "nova", label: "Nova" },
  { value: "shimmer", label: "Shimmer" },
];

interface LektorPanelProps {
  editor: Editor | null;
  chapterId: bigint;
  bookId: bigint;
}

type PlaybackState = "idle" | "loading" | "playing" | "paused";

export function LektorPanel({ editor, chapterId, bookId }: LektorPanelProps) {
  const apiKey = localStorage.getItem("ws_api_key_openai") ?? "";
  const [voice, setVoice] = useState("alloy");
  const [speed, setSpeed] = useState([1.0]);
  const [playbackState, setPlaybackState] = useState<PlaybackState>("idle");
  const [progress, setProgress] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
  const [currentChunk, setCurrentChunk] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [generatedBlob, setGeneratedBlob] = useState<Blob | null>(null);
  const [saving, setSaving] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const saveRecording = useSaveRecording();

  const cleanupAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setPlaybackState("idle");
    setProgress(0);
    setTotalChunks(0);
    setCurrentChunk(0);
    setDuration(0);
  }, []);

  const handleSaveRecording = useCallback(async () => {
    if (!generatedBlob) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const arrayBuffer = await generatedBlob.arrayBuffer();
      const audioData = new Uint8Array(arrayBuffer);
      await saveRecording.mutateAsync({
        chapterId,
        bookId,
        voice,
        audioData,
      });
      setSuccess("Nagranie zostało zapisane pomyślnie.");
      setGeneratedBlob(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Błąd zapisywania nagrania";
      console.error("[LektorPanel] Błąd zapisu nagrania:", err);
      setError(errorMessage);
    } finally {
      setSaving(false);
      // Trigger automatic browser download of the MP3 file
      const downloadUrl = URL.createObjectURL(generatedBlob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `rozdzial_${chapterId}_${Date.now()}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 10000);
    }
  }, [generatedBlob, chapterId, bookId, voice, saveRecording]);

  useEffect(() => {
    return () => cleanupAudio();
  }, [cleanupAudio]);

  const handlePlay = useCallback(async () => {
    if (!editor) return;
    const text = editor.getText();
    if (!text.trim()) {
      setError("Brak tekstu do odczytania");
      return;
    }

    setError(null);
    setPlaybackState("loading");
    setTotalChunks(0);
    setCurrentChunk(0);

    try {
      const blob = await generateSpeech(
        text,
        voice,
        apiKey.trim(),
        (current, total) => {
          setTotalChunks(total);
          setCurrentChunk(current);
          setProgress((current / total) * 100);
        },
      );
      setGeneratedBlob(blob);

      // Clean up previous audio if any
      cleanupAudio();

      const url = URL.createObjectURL(blob);
      objectUrlRef.current = url;

      const audio = new Audio(url);
      audioRef.current = audio;

      audio.addEventListener("loadedmetadata", () => {
        setDuration(audio.duration);
      });

      audio.addEventListener("timeupdate", () => {
        setProgress(audio.currentTime);
      });

      audio.addEventListener("ended", () => {
        setPlaybackState("idle");
        setProgress(0);
      });

      audio.addEventListener("error", () => {
        setError("Błąd odtwarzania audio");
        setPlaybackState("idle");
      });

      await audio.play();
      setPlaybackState("playing");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd generowania audio");
      setPlaybackState("idle");
    }
  }, [editor, apiKey, voice, cleanupAudio]);

  const handlePause = useCallback(() => {
    if (audioRef.current && playbackState === "playing") {
      audioRef.current.pause();
      setPlaybackState("paused");
    } else if (audioRef.current && playbackState === "paused") {
      audioRef.current.play();
      setPlaybackState("playing");
    }
  }, [playbackState]);

  const handleStop = useCallback(() => {
    cleanupAudio();
  }, [cleanupAudio]);

  const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <div
      className="flex flex-wrap items-center gap-4 p-3 rounded-lg border border-border bg-card"
      data-ocid="lektor.panel"
    >
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider shrink-0">
        <Volume2 className="h-3.5 w-3.5" />
        Lektor
      </div>

      {/* Voice selector */}
      <div className="flex items-center gap-2">
        <Label className="text-xs text-muted-foreground shrink-0">Głos</Label>
        <Select value={voice} onValueChange={setVoice}>
          <SelectTrigger
            className="h-8 w-[120px] text-sm"
            data-ocid="lektor.voice_select"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {VOICES.map((v) => (
              <SelectItem key={v.value} value={v.value}>
                {v.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Speed slider */}
      <div className="flex items-center gap-3 min-w-[180px]">
        <Label className="text-xs text-muted-foreground shrink-0">
          Prędkość
        </Label>
        <Slider
          value={speed}
          onValueChange={setSpeed}
          min={0.5}
          max={2.0}
          step={0.1}
          className="w-24"
          data-ocid="lektor.speed_slider"
        />
        <span className="text-xs text-muted-foreground w-10">
          {speed[0].toFixed(1)}x
        </span>
      </div>

      {/* Play / Pause / Stop buttons */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant={playbackState === "playing" ? "outline" : "default"}
          disabled={playbackState === "loading" || !apiKey.trim()}
          onClick={
            playbackState === "playing" || playbackState === "paused"
              ? handlePause
              : handlePlay
          }
          data-ocid="lektor.play_pause_button"
        >
          {playbackState === "loading" ? (
            <span className="h-3.5 w-3.5 mr-1.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : playbackState === "playing" ? (
            <Pause className="h-3.5 w-3.5 mr-1.5" />
          ) : (
            <Play className="h-3.5 w-3.5 mr-1.5" />
          )}
          {playbackState === "loading"
            ? totalChunks > 0
              ? `Generowanie ${currentChunk}/${totalChunks}...`
              : "Generowanie..."
            : playbackState === "playing"
              ? "Pauza"
              : "Odtwórz"}
        </Button>

        <Button
          size="sm"
          variant="outline"
          disabled={playbackState === "idle" || playbackState === "loading"}
          onClick={handleStop}
          data-ocid="lektor.stop_button"
        >
          <Square className="h-3.5 w-3.5 mr-1.5" />
          Stop
        </Button>

        <Button
          size="sm"
          variant="secondary"
          disabled={!generatedBlob || saving}
          onClick={handleSaveRecording}
          data-ocid="lektor.save_recording_button"
        >
          {saving ? (
            <span className="h-3.5 w-3.5 mr-1.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <Save className="h-3.5 w-3.5 mr-1.5" />
          )}
          {saving ? "Zapisywanie..." : "Zapisz nagranie"}
        </Button>
      </div>

      {/* Progress bar */}
      {(playbackState === "playing" || playbackState === "paused") && (
        <div className="flex items-center gap-2 min-w-[160px]">
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-100"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
            {formatTime(progress)} / {formatTime(duration)}
          </span>
        </div>
      )}

      {/* Word count warning */}
      {editor && editor.getText().trim().split(/\s+/).length > 5000 && (
        <div className="w-full flex items-center gap-2 text-xs text-amber-600 bg-amber-50 rounded-md px-3 py-2">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          Długie rozdziały (ponad 5000 słów) mogą nie zmieścić się w limicie —
          podziel tekst na mniejsze fragmenty.
        </div>
      )}

      {/* Success message */}
      {success && (
        <div className="w-full text-xs text-success bg-success/10 rounded-md px-3 py-2">
          {success}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="w-full text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2">
          {error}
        </div>
      )}
    </div>
  );
}
