import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEYS = {
  left: "ws_indent_left",
  right: "ws_indent_right",
  firstLine: "ws_indent_first_line",
};

const MAX_INDENT = 150;

function getStoredIndent(key: string): number {
  const stored = localStorage.getItem(key);
  if (stored === null) return 0;
  const val = Number.parseInt(stored, 10);
  return Number.isNaN(val) ? 0 : Math.max(0, Math.min(MAX_INDENT, val));
}

function setStoredIndent(key: string, value: number) {
  localStorage.setItem(key, String(Math.max(0, Math.min(MAX_INDENT, value))));
}

interface IndentRulerProps {
  editorElement: HTMLElement | null;
  onChange?: (left: number, right: number, firstLine: number) => void;
}

type DragTarget = "left" | "right" | "firstLine" | null;

export function IndentRuler({ editorElement, onChange }: IndentRulerProps) {
  const [left, setLeft] = useState(() => getStoredIndent(STORAGE_KEYS.left));
  const [right, setRight] = useState(() => getStoredIndent(STORAGE_KEYS.right));
  const [firstLine, setFirstLine] = useState(() =>
    getStoredIndent(STORAGE_KEYS.firstLine),
  );
  const [trackWidth, setTrackWidth] = useState(0);
  const [leftOffset, setLeftOffset] = useState(0);

  const trackRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragTarget = useRef<DragTarget>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Measure the actual editor DOM element passed as prop
  useEffect(() => {
    const updateMetrics = () => {
      const container = containerRef.current;
      if (!editorElement || !container) {
        setTrackWidth(0);
        setLeftOffset(0);
        return;
      }

      const editorRect = editorElement.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      // Width of the actual text area
      setTrackWidth(Math.max(0, editorRect.width));
      // Left offset of text area relative to our container
      setLeftOffset(Math.max(0, editorRect.left - containerRect.left));
    };

    updateMetrics();

    const ro = new ResizeObserver(updateMetrics);
    if (editorElement) {
      ro.observe(editorElement);
    }
    // Also observe container for left-offset changes
    if (containerRef.current) {
      ro.observe(containerRef.current);
    }

    window.addEventListener("resize", updateMetrics);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateMetrics);
    };
  }, [editorElement]);

  const saveToStorage = useCallback((l: number, r: number, f: number) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setStoredIndent(STORAGE_KEYS.left, l);
      setStoredIndent(STORAGE_KEYS.right, r);
      setStoredIndent(STORAGE_KEYS.firstLine, f);
    }, 500);
  }, []);

  const updateValues = useCallback(
    (l: number, r: number, f: number) => {
      setLeft(l);
      setRight(r);
      setFirstLine(f);
      saveToStorage(l, r, f);
      onChange?.(l, r, f);
    },
    [onChange, saveToStorage],
  );

  const handleMouseDown = useCallback(
    (target: NonNullable<DragTarget>) => (e: React.MouseEvent) => {
      e.preventDefault();
      dragTarget.current = target;
    },
    [],
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragTarget.current || !trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      // Scale pixel position to MAX_INDENT range based on actual track width
      const scale = trackWidth > 0 ? MAX_INDENT / trackWidth : 1;
      const px = Math.max(0, Math.min(MAX_INDENT, Math.round(x * scale)));

      switch (dragTarget.current) {
        case "left":
          updateValues(px, right, firstLine);
          break;
        case "right":
          updateValues(left, px, firstLine);
          break;
        case "firstLine":
          updateValues(left, right, px);
          break;
      }
    };

    const handleMouseUp = () => {
      dragTarget.current = null;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [left, right, firstLine, updateValues, trackWidth]);

  // Listen for storage changes from other tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.left) {
        setLeft(getStoredIndent(STORAGE_KEYS.left));
      } else if (e.key === STORAGE_KEYS.right) {
        setRight(getStoredIndent(STORAGE_KEYS.right));
      } else if (e.key === STORAGE_KEYS.firstLine) {
        setFirstLine(getStoredIndent(STORAGE_KEYS.firstLine));
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // Convert indent value (0-MAX_INDENT) to visual position within track
  const toVisualPos = (val: number) => {
    if (trackWidth <= 0) return val;
    return (val / MAX_INDENT) * trackWidth;
  };

  const effectiveTrackWidth = Math.max(0, trackWidth);

  const tickCount = trackWidth > 0 ? Math.floor(trackWidth / 20) : 16;

  return (
    <div
      ref={containerRef}
      className="w-full select-none"
      data-ocid="editor.indent_ruler"
    >
      {/* Ruler track */}
      <div
        ref={trackRef}
        className="relative h-6 bg-muted/30 border border-border rounded-md cursor-default"
        style={{
          marginLeft: `${leftOffset}px`,
          width: `${effectiveTrackWidth}px`,
        }}
      >
        {/* Tick marks */}
        {Array.from({ length: Math.max(0, tickCount) }, (_, i) => i).map(
          (i) => {
            const leftPos =
              (i / Math.max(1, tickCount - 1)) * effectiveTrackWidth;
            return (
              <div
                key={i}
                className="absolute top-0 h-2 border-l border-border/60"
                style={{ left: `${leftPos}px` }}
              />
            );
          },
        )}

        {/* Left indent handle */}
        <div
          className="absolute top-0 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-primary cursor-ew-resize hover:scale-110 transition-transform"
          style={{
            left: `${toVisualPos(left) - 6 + leftOffset}px`,
            top: "2px",
          }}
          onMouseDown={handleMouseDown("left")}
          title={`Lewe wcięcie: ${left}px`}
          data-ocid="editor.indent_left_handle"
        />
        {/* Left indent guide line */}
        <div
          className="absolute top-3 w-px bg-primary/30 pointer-events-none"
          style={{
            left: `${toVisualPos(left) + leftOffset}px`,
            height: "calc(100% - 12px)",
          }}
        />

        {/* First line indent handle */}
        <div
          className="absolute top-0 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[9px] border-t-accent cursor-ew-resize hover:scale-110 transition-transform"
          style={{
            left: `${toVisualPos(firstLine) - 5 + leftOffset}px`,
            top: "14px",
          }}
          onMouseDown={handleMouseDown("firstLine")}
          title={`Wcięcie pierwszej linii: ${firstLine}px`}
          data-ocid="editor.indent_first_line_handle"
        />
        {/* First line indent guide line */}
        <div
          className="absolute top-3 w-px bg-accent/30 pointer-events-none"
          style={{
            left: `${toVisualPos(firstLine) + leftOffset}px`,
            height: "calc(100% - 12px)",
          }}
        />

        {/* Right indent handle */}
        <div
          className="absolute top-0 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-secondary-foreground cursor-ew-resize hover:scale-110 transition-transform"
          style={{
            left: `${toVisualPos(MAX_INDENT - right) - 6 + leftOffset}px`,
            top: "2px",
          }}
          onMouseDown={handleMouseDown("right")}
          title={`Prawe wcięcie: ${right}px`}
          data-ocid="editor.indent_right_handle"
        />
        {/* Right indent guide line */}
        <div
          className="absolute top-3 w-px bg-secondary-foreground/30 pointer-events-none"
          style={{
            left: `${toVisualPos(MAX_INDENT - right) + leftOffset}px`,
            height: "calc(100% - 12px)",
          }}
        />
      </div>

      {/* Labels */}
      <div className="flex items-center gap-4 mt-1 text-[10px] text-muted-foreground/60">
        <span>L: {left}px</span>
        <span>P: {right}px</span>
        <span>1L: {firstLine}px</span>
      </div>
    </div>
  );
}

export function getGlobalIndents(): {
  left: number;
  right: number;
  firstLine: number;
} {
  return {
    left: getStoredIndent(STORAGE_KEYS.left),
    right: getStoredIndent(STORAGE_KEYS.right),
    firstLine: getStoredIndent(STORAGE_KEYS.firstLine),
  };
}
