import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";

interface ConfirmDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The exact text the user must type to enable the confirm button. */
  expectedText: string;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  isPending?: boolean;
  /** Danger level styling — "trash" (recoverable) vs "permanent" (irreversible). */
  variant?: "trash" | "permanent";
}

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  expectedText,
  title,
  description,
  confirmLabel,
  onConfirm,
  isPending,
  variant = "trash",
}: ConfirmDeleteDialogProps) {
  const [typed, setTyped] = useState("");
  const matches = typed.trim() === expectedText.trim() && expectedText.trim().length > 0;

  const handleOpenChange = (next: boolean) => {
    if (!next) setTyped("");
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent data-ocid="confirm_delete.dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle
              className={`h-5 w-5 ${variant === "permanent" ? "text-destructive" : "text-amber-500"}`}
            />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Aby potwierdzić, wpisz dokładnie:{" "}
            <span className="font-mono font-semibold text-foreground">
              {expectedText}
            </span>
          </p>
          <Input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={expectedText}
            data-ocid="confirm_delete.input"
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            data-ocid="confirm_delete.cancel_button"
          >
            Anuluj
          </Button>
          <Button
            variant="destructive"
            disabled={!matches || isPending}
            onClick={onConfirm}
            data-ocid="confirm_delete.confirm_button"
          >
            {isPending ? "Przetwarzanie..." : confirmLabel ?? "Usuń"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
