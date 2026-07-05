import { createActor } from "@/backend";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  fetchRecordingAudio,
  useDeleteRecording,
  useRecordings,
} from "@/hooks/useBackend";
import { Headphones, Mic, Play, Trash2, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { useActorLocal } from "../../hooks/useActorLocal";

interface RecordingsPanelProps {
  chapterId: bigint;
}

export function RecordingsPanel({ chapterId }: RecordingsPanelProps) {
  const { actor } = useActorLocal(createActor);
  const { data: recordings, isLoading } = useRecordings(Number(chapterId));
  const deleteRecording = useDeleteRecording();
  const [playingId, setPlayingId] = useState<bigint | null>(null);
  const [loadingId, setLoadingId] = useState<bigint | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

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
    setPlayingId(null);
  }, []);

  const handlePlay = useCallback(
    async (id: bigint) => {
      // If already playing this recording, stop it
      if (playingId === id) {
        cleanupAudio();
        return;
      }

      // Stop any other playing audio first
      cleanupAudio();
      setLoadingId(id);

      try {
        if (!actor) {
          setLoadingId(null);
          return;
        }
        const audioData = await fetchRecordingAudio(actor, id);
        if (!audioData || audioData.length === 0) {
          setLoadingId(null);
          return;
        }

        const blob = new Blob([audioData.buffer as BlobPart], {
          type: "audio/mpeg",
        });
        const url = URL.createObjectURL(blob);
        objectUrlRef.current = url;

        const audio = new Audio(url);
        audioRef.current = audio;

        audio.addEventListener("ended", () => {
          setPlayingId(null);
        });

        audio.addEventListener("error", () => {
          setPlayingId(null);
        });

        await audio.play();
        setPlayingId(id);
      } catch {
        // Silently handle error
      } finally {
        setLoadingId(null);
      }
    },
    [playingId, cleanupAudio, actor],
  );

  const handleDelete = useCallback(
    (id: bigint) => {
      if (playingId === id) {
        cleanupAudio();
      }
      deleteRecording.mutate({ id, chapterId });
    },
    [playingId, cleanupAudio, deleteRecording, chapterId],
  );

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) / 1_000_000).toLocaleDateString("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const voiceLabels: Record<string, string> = {
    alloy: "Alloy",
    echo: "Echo",
    fable: "Fable",
    onyx: "Onyx",
    nova: "Nova",
    shimmer: "Shimmer",
  };

  if (isLoading) {
    return (
      <div
        className="p-3 text-xs text-muted-foreground"
        data-ocid="recordings.loading_state"
      >
        Ładowanie nagrań...
      </div>
    );
  }

  return (
    <div className="w-full border border-border rounded-lg bg-card flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Mic className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Nagrania</h3>
        </div>
      </div>

      {/* List */}
      <ScrollArea className="max-h-64 overflow-y-auto">
        <div className="p-3 space-y-2">
          {!recordings || recordings.length === 0 ? (
            <div
              className="text-center py-8 text-sm text-muted-foreground"
              data-ocid="recordings.empty_state"
            >
              <Headphones className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
              Brak zapisanych nagrań
            </div>
          ) : (
            recordings.map((recording, index) => (
              <div
                key={String(recording.id)}
                className="group rounded-md border border-border bg-background p-3 hover:border-primary/40 transition-colors"
                data-ocid={`recordings.item.${index + 1}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Mic className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {voiceLabels[recording.voice] ?? recording.voice}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={loadingId === recording.id}
                      onClick={() => handlePlay(recording.id)}
                      data-ocid={`recordings.play_button.${index + 1}`}
                    >
                      {loadingId === recording.id ? (
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : playingId === recording.id ? (
                        <span className="h-3 w-3 rounded-full bg-primary" />
                      ) : (
                        <Play className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDelete(recording.id)}
                      data-ocid={`recordings.delete_button.${index + 1}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground/60">
                  {formatDate(recording.createdAt)}
                </span>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
