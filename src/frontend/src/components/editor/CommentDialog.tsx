import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

interface CommentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anchorText: string;
  onSave: (content: string) => void;
}

export function CommentDialog({
  open,
  onOpenChange,
  anchorText,
  onSave,
}: CommentDialogProps) {
  const [content, setContent] = useState("");

  const handleSave = () => {
    if (!content.trim()) return;
    onSave(content.trim());
    setContent("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Dodaj komentarz</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground border border-border">
            <span className="font-medium text-foreground">Fragment: </span>
            <span className="italic">&ldquo;{anchorText}&rdquo;</span>
          </div>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Wpisz treść komentarza..."
            className="min-h-[100px] resize-none"
            data-ocid="comment.dialog_textarea"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              data-ocid="comment.dialog_cancel_button"
            >
              Anuluj
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!content.trim()}
              data-ocid="comment.dialog_save_button"
            >
              Zapisz komentarz
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
