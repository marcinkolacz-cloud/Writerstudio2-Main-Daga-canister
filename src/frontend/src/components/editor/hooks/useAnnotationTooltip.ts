import type { Editor } from "@tiptap/core";
import { Check, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface TooltipData {
  id: bigint;
  text: string;
  explanation: string;
  proposal: string;
  alternativeProposal?: string;
  color: string;
  rect: DOMRect;
  from: number;
  to: number;
  approved: boolean;
}

export function useAnnotationTooltip(
  editor: Editor | null,
  onApplyProposal: (params: {
    id: bigint;
    from: number;
    to: number;
    proposal: string;
    text: string;
  }) => void,
  onRevertProposal: (params: {
    id: bigint;
    from: number;
    to: number;
    originalText: string;
  }) => void,
) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  const clearHideTimeout = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  const hideTooltip = useCallback(() => {
    clearHideTimeout();
    hideTimeoutRef.current = setTimeout(() => {
      setTooltip(null);
    }, 150);
  }, [clearHideTimeout]);

  const showTooltip = useCallback(
    (data: TooltipData) => {
      clearHideTimeout();
      setTooltip(data);
    },
    [clearHideTimeout],
  );

  useEffect(() => {
    if (!editor) return;

    const view = editor.view;
    const dom = view.dom as HTMLElement;

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const annotationSpan = target.closest(
        '[data-annotation^="annotation"]',
      ) as HTMLElement | null;

      if (!annotationSpan) {
        hideTooltip();
        return;
      }

      // Don't show tooltip for already-applied annotations
      if (
        annotationSpan.getAttribute("data-annotation") === "annotationApplied"
      ) {
        hideTooltip();
        return;
      }

      const explanation = annotationSpan.getAttribute("data-explanation") ?? "";
      const proposal = annotationSpan.getAttribute("data-proposal") ?? "";
      const alternativeProposal =
        annotationSpan.getAttribute("data-alternative-proposal") ?? undefined;
      const color = annotationSpan.getAttribute("data-annotation") ?? "";
      const annotationIdAttr =
        annotationSpan.getAttribute("data-annotation-id");
      const approvedAttr = annotationSpan.getAttribute("data-approved");

      if (!explanation && !proposal) {
        hideTooltip();
        return;
      }

      // Find the exact range of the annotation mark by searching the document
      let foundFrom: number | null = null;
      let foundTo: number | null = null;
      editor.state.doc.descendants((n, p) => {
        if (!n.isText) return true;
        const mark = n.marks.find(
          (m) =>
            m.type.name === color &&
            m.attrs["data-annotation-id"] === annotationIdAttr,
        );
        if (mark) {
          foundFrom = p;
          foundTo = p + n.nodeSize;
          return false;
        }
        return true;
      });
      if (foundFrom === null || foundTo === null) {
        hideTooltip();
        return;
      }
      const from = foundFrom;
      const to = foundTo;

      const rect = annotationSpan.getBoundingClientRect();
      showTooltip({
        id: annotationIdAttr ? BigInt(annotationIdAttr) : 0n,
        text: annotationSpan.textContent ?? "",
        explanation,
        proposal,
        alternativeProposal: alternativeProposal || undefined,
        color,
        from,
        to,
        rect,
        approved: approvedAttr === "true",
      });
    };

    const handleMouseOut = (e: MouseEvent) => {
      const relatedTarget = e.relatedTarget as HTMLElement | null;
      if (
        tooltipRef.current &&
        relatedTarget &&
        tooltipRef.current.contains(relatedTarget)
      ) {
        return;
      }
      hideTooltip();
    };

    dom.addEventListener("mouseover", handleMouseOver);
    dom.addEventListener("mouseout", handleMouseOut);

    return () => {
      dom.removeEventListener("mouseover", handleMouseOver);
      dom.removeEventListener("mouseout", handleMouseOut);
      clearHideTimeout();
    };
  }, [editor, showTooltip, hideTooltip, clearHideTimeout]);

  const handleApply = useCallback(() => {
    if (!tooltip || !editor) return;
    onApplyProposal({
      id: tooltip.id,
      from: tooltip.from,
      to: tooltip.to,
      proposal: tooltip.proposal,
      text: tooltip.text,
    });
    setTooltip(null);
  }, [tooltip, editor, onApplyProposal]);

  const handleRevert = useCallback(() => {
    if (!tooltip || !editor) return;
    onRevertProposal({
      id: tooltip.id,
      from: tooltip.from,
      to: tooltip.to,
      originalText: tooltip.text,
    });
    setTooltip(null);
  }, [tooltip, editor, onRevertProposal]);

  return {
    tooltip,
    tooltipRef,
    handleApply,
    handleRevert,
    hideTooltip,
    clearHideTimeout,
  };
}
