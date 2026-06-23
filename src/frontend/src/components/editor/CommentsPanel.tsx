import type { Comment } from "@/backend";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Trash2, X } from "lucide-react";

interface CommentsPanelProps {
  comments: Comment[];
  onDelete: (id: bigint) => void;
  onHighlight: (anchorText: string) => void;
  onClose: () => void;
}

export function CommentsPanel({
  comments,
  onDelete,
  onHighlight,
  onClose,
}: CommentsPanelProps) {
  return (
    <div className="flex-1 min-w-0 border-l border-border bg-card flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Komentarze</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onClose}
          data-ocid="comments.panel_close_button"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {comments.length === 0 ? (
            <div
              className="text-center py-8 text-sm text-muted-foreground"
              data-ocid="comments.empty_state"
            >
              Brak komentarzy
            </div>
          ) : (
            comments.map((comment, index) => (
              <button
                key={String(comment.id)}
                type="button"
                className="group rounded-md border border-border bg-background p-3 hover:border-primary/40 transition-colors cursor-pointer text-left w-full"
                onClick={() => onHighlight(comment.anchorText)}
                data-ocid={`comments.item.${index + 1}`}
              >
                <p className="text-xs text-muted-foreground mb-1.5 line-clamp-1 italic">
                  &ldquo;{comment.anchorText}&rdquo;
                </p>
                <p className="text-sm text-foreground">{comment.content}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-muted-foreground/60">
                    {new Date(
                      Number(comment.createdAt) / 1_000_000,
                    ).toLocaleDateString("pl-PL")}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(comment.id);
                    }}
                    data-ocid={`comments.delete_button.${index + 1}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
