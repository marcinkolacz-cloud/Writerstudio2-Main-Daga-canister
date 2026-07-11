import { createActor } from "@/backend";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  fetchRecordingAudio,
  useDeleteRecording,
  useRecordings,
  useSetRecordingName,
} from "@/hooks/useBackend";
import { Headphones, Mic, Pencil, Play, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useActorLocal } from "../../hooks/useActorLocal";

interface RecordingsPanelProps {
  chapterId: bigint;
}

export function RecordingsPanel({ chapterId }: RecordingsPanelProps) {
  const { actor } = useActorLocal(createActor);
  const { data: recordings, isLoading } = useRecordings(Number(chapterId));
  const deleteRecording = useDeleteRecording();
  const setRecordingName = useSetRecordingName();
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
              <RecordingItem
                key={String(recording.id)}
                recording={recording}
                index={index}
                isPlaying={playingId === recording.id}
                isLoading={loadingId === recording.id}
                voiceLabels={voiceLabels}
                onPlay={() => handlePlay(recording.id)}
                onDelete={() => handleDelete(recording.id)}
                onRename={(newName) =>
                  setRecordingName.mutate({
                    id: recording.id,
                    name: newName,
                    chapterId,
                  })
                }
                formatDate={formatDate}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

interface RecordingItemProps {
  recording: {
    id: bigint;
    voice: string;
    createdAt: bigint;
    name?: string;
  };
  index: number;
  isPlaying: boolean;
  isLoading: boolean;
  voiceLabels: Record<string, string>;
  onPlay: () => void;
  onDelete: () => void;
  onRename: (newName: string) => void;
  formatDate: (timestamp: bigint) => string;
}

function RecordingItem({
  recording,
  index,
  isPlaying,
  isLoading,
  voiceLabels,
  onPlay,
  onDelete,
  onRename,
  formatDate,
}: RecordingItemProps) {
  const displayName =
    recording.name && recording.name.length > 0
      ? recording.name
      : (voiceLabels[recording.voice] ?? recording.voice);

  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(displayName);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  const submitRename = () => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== displayName) {
      onRename(trimmed);
    } else {
      setRenameValue(displayName);
    }
    setIsRenaming(false);
  };

  return (
    <div
      className="group rounded-md border border-border bg-background p-3 hover:border-primary/40 transition-colors"
      data-ocid={`recordings.item.${index + 1}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <Mic className="h-3 w-3 text-muted-foreground shrink-0" />
          {isRenaming ? (
            <input
              ref={inputRef}
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  submitRename();
                } else if (e.key === "Escape") {
                  setRenameValue(displayName);
                  setIsRenaming(false);
                }
              }}
              onBlur={submitRename}
              className="text-sm font-medium bg-transparent border-b border-primary/40 outline-none focus:border-primary flex-1 min-w-0"
              data-ocid={`recordings.rename_input.${index + 1}`}
            />
          ) : (
            <span className="text-sm font-medium truncate">{displayName}</span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {!isRenaming && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => {
                setRenameValue(displayName);
                setIsRenaming(true);
              }}
              data-ocid={`recordings.rename_button.${index + 1}`}
            >
              <Pencil className="h-3 w-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={isLoading}
            onClick={onPlay}
            data-ocid={`recordings.play_button.${index + 1}`}
          >
            {isLoading ? (
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : isPlaying ? (
              <span className="h-3 w-3 rounded-full bg-primary" />
            ) : (
              <Play className="h-3 w-3" />
            )}
          </Button>
          {!isRenaming && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={onDelete}
              data-ocid={`recordings.delete_button.${index + 1}`}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
      <span className="text-[10px] text-muted-foreground/60">
        {formatDate(recording.createdAt)}
      </span>
    </div>
  );
}
