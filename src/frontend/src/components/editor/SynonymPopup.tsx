import type { Editor } from "@tiptap/core";
import { Loader2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface SynonymPopupProps {
  editor: Editor;
  word: string;
  synonyms: string[];
  isLoading: boolean;
  error: string | null;
  onSelect: (synonym: string) => void;
  onClose: () => void;
  anchorElement: HTMLElement;
}

export function SynonymPopup({
  synonyms,
  isLoading,
  error,
  onSelect,
  onClose,
  anchorElement,
}: SynonymPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);

  // Compute position relative to anchor element
  const [popupPos, setPopupPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const rect = anchorElement.getBoundingClientRect();
    setPopupPos({
      top: rect.bottom + 8,
      left: rect.left + rect.width / 2,
    });
  }, [anchorElement]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      ref={popupRef}
      className="fixed z-50 min-w-[180px] max-w-[280px] rounded-lg border border-border bg-popover shadow-elevated text-popover-foreground"
      style={{
        top: popupPos.top,
        left: popupPos.left,
        transform: "translateX(-50%)",
      }}
      data-ocid="editor.synonym_popup"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Synonimy
        </span>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center justify-center w-5 h-5 rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Zamknij"
          data-ocid="editor.synonym_close_button"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      {/* Content */}
      <div className="px-3 py-2.5">
        {isLoading ? (
          <div className="flex items-center gap-2 py-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Wyszukiwanie...
            </span>
          </div>
        ) : error ? (
          <p
            className="text-sm text-destructive py-1"
            data-ocid="editor.synonym_error_state"
          >
            {error}
          </p>
        ) : synonyms.length === 0 ? (
          <p
            className="text-sm text-muted-foreground py-1"
            data-ocid="editor.synonym_empty_state"
          >
            Brak synonimów
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {synonyms.map((synonym, idx) => (
              <button
                key={synonym}
                type="button"
                onClick={() => {
                  onSelect(synonym);
                  onClose();
                }}
                className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full
                  bg-secondary text-secondary-foreground
                  hover:bg-primary hover:text-primary-foreground
                  active:scale-95
                  transition-all duration-150"
                data-ocid={`editor.synonym_item.${idx + 1}`}
              >
                {synonym}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Arrow */}
      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-popover border-r border-b border-border" />
    </div>
  );
}
