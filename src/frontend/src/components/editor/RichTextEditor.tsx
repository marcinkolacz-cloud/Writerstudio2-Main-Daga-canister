import {
  annotationBlue,
  annotationOrange,
  annotationPurple,
  annotationRed,
  annotationYellow,
} from "@/components/editor/extensions/AnnotationMark";
import { commentMark } from "@/components/editor/extensions/CommentMark";
import { useAnnotationTooltip } from "@/components/editor/hooks/useAnnotationTooltip";
import { useUpdateAnnotationApproved } from "@/hooks/useBackend";
import { cn } from "@/lib/utils";
import { type Editor, EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Check,
  Italic,
  Redo,
  RotateCcw,
  Underline as UnderlineIcon,
  Undo,
} from "lucide-react";
import { useCallback, useEffect, useRef } from "react";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  onEditorReady?: (editor: Editor) => void;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  onEditorReady,
}: RichTextEditorProps) {
  const lastEmittedValue = useRef(value);

  const editor = useEditor({
    extensions: [
      StarterKit,

      annotationYellow,
      annotationRed,
      annotationBlue,
      annotationOrange,
      annotationPurple,
      commentMark,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      lastEmittedValue.current = editor.getHTML();
      onChange(editor.getHTML());
    },
    onCreate: ({ editor }) => {
      onEditorReady?.(editor);
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none min-h-[200px] px-4 py-3",
      },
    },
  });

  const updateAnnotationApproved = useUpdateAnnotationApproved();

  const handleApplyProposal = useCallback(
    ({
      id,
      from,
      to,
      proposal,
      text,
    }: {
      id: bigint;
      from: number;
      to: number;
      proposal: string;
      text: string;
    }) => {
      if (!editor) return;

      // Verify the text at from/to matches the expected annotation text
      const currentText = editor.state.doc.textBetween(from, to, " ");
      let actualFrom = from;
      let actualTo = to;

      if (currentText !== text) {
        // Try to re-locate the fragment near the original position
        const docText = editor.getText();
        const searchStart = Math.max(0, from - 100);
        const idx = docText.indexOf(text, searchStart);
        if (idx !== -1) {
          actualFrom = idx;
          actualTo = idx + text.length;
        } else {
          // Fallback: try from the beginning
          const idx2 = docText.indexOf(text);
          if (idx2 !== -1) {
            actualFrom = idx2;
            actualTo = idx2 + text.length;
          }
        }
      }

      editor
        .chain()
        .focus()
        .deleteRange({ from: actualFrom, to: actualTo })
        .insertContent(proposal)
        .run();

      // Update backend approval status
      if (id !== 0n) {
        updateAnnotationApproved.mutate({ id, approved: true });
      }
    },
    [editor, updateAnnotationApproved],
  );

  const handleRevertProposal = useCallback(
    ({
      id,
      from,
      to,
      originalText,
    }: {
      id: bigint;
      from: number;
      to: number;
      originalText: string;
    }) => {
      if (!editor) return;

      // Verify the text at from/to matches the proposal (current text after apply)
      const currentText = editor.state.doc.textBetween(from, to, " ");
      let actualFrom = from;
      let actualTo = to;

      // If the exact range doesn't match, try to locate the proposal text
      if (currentText !== originalText) {
        const docText = editor.getText();
        const searchStart = Math.max(0, from - 100);
        const idx = docText.indexOf(originalText, searchStart);
        if (idx !== -1) {
          actualFrom = idx;
          actualTo = idx + originalText.length;
        } else {
          const idx2 = docText.indexOf(originalText);
          if (idx2 !== -1) {
            actualFrom = idx2;
            actualTo = idx2 + originalText.length;
          }
        }
      }

      editor
        .chain()
        .focus()
        .deleteRange({ from: actualFrom, to: actualTo })
        .insertContent(originalText)
        .run();

      // Update backend approval status
      if (id !== 0n) {
        updateAnnotationApproved.mutate({ id, approved: false });
      }
    },
    [editor, updateAnnotationApproved],
  );

  const { tooltip, tooltipRef, handleApply, handleRevert, clearHideTimeout } =
    useAnnotationTooltip(editor, handleApplyProposal, handleRevertProposal);

  useEffect(() => {
    if (editor && value !== lastEmittedValue.current) {
      editor.commands.setContent(value, { emitUpdate: false });
      lastEmittedValue.current = value;
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  const toolbarButtons = [
    {
      icon: Bold,
      label: "Pogrubienie",
      action: () => editor.chain().focus().toggleBold().run(),
      isActive: () => editor.isActive("bold"),
      dataOcid: "editor.bold_button",
    },
    {
      icon: Italic,
      label: "Kursywa",
      action: () => editor.chain().focus().toggleItalic().run(),
      isActive: () => editor.isActive("italic"),
      dataOcid: "editor.italic_button",
    },
    {
      icon: UnderlineIcon,
      label: "Podkreślenie",
      action: () => editor.chain().focus().toggleUnderline().run(),
      isActive: () => editor.isActive("underline"),
      dataOcid: "editor.underline_button",
    },
    {
      icon: Undo,
      label: "Cofnij",
      action: () => editor.chain().focus().undo().run(),
      isActive: () => false,
      dataOcid: "editor.undo_button",
    },
    {
      icon: Redo,
      label: "Ponów",
      action: () => editor.chain().focus().redo().run(),
      isActive: () => false,
      dataOcid: "editor.redo_button",
    },
  ];

  return (
    <div className="flex flex-col h-full border border-border rounded-md overflow-hidden bg-card">
      {/* Sticky Toolbar */}
      <div className="sticky top-0 z-10 flex items-center gap-1 px-3 py-2 bg-muted/50 border-b border-border">
        {toolbarButtons.map((button) => (
          <button
            key={button.label}
            type="button"
            onClick={button.action}
            className={cn(
              "inline-flex items-center justify-center w-8 h-8 rounded-md text-sm transition-smooth",
              "hover:bg-accent hover:text-accent-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              button.isActive()
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground",
            )}
            title={button.label}
            aria-label={button.label}
            data-ocid={button.dataOcid}
          >
            <button.icon className="h-4 w-4" />
          </button>
        ))}
      </div>

      {/* Annotation Tooltip */}
      {tooltip && (
        <div
          ref={tooltipRef}
          className="fixed z-50 max-w-xs p-3 rounded-lg border border-border bg-popover shadow-lg text-popover-foreground"
          style={{
            left: tooltip.rect.left + tooltip.rect.width / 2,
            top: tooltip.rect.bottom + 8,
            transform: "translateX(-50%)",
          }}
          onMouseEnter={clearHideTimeout}
          data-ocid="editor.annotation_tooltip"
        >
          <div className="space-y-2">
            {tooltip.explanation && (
              <p className="text-sm">{tooltip.explanation}</p>
            )}
            {tooltip.proposal && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase">
                  Propozycja:
                </p>
                <p className="text-sm font-medium text-primary">
                  {tooltip.proposal}
                </p>
              </div>
            )}
            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={handleApply}
                className="flex-1 px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                data-ocid="editor.apply_proposal_button"
              >
                Wstaw propozycję
              </button>
              {tooltip.approved && (
                <button
                  type="button"
                  onClick={handleRevert}
                  className="flex-1 px-3 py-1.5 text-xs font-medium rounded-md bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                  data-ocid="editor.revert_proposal_button"
                >
                  <RotateCcw className="h-3 w-3 inline mr-1" />
                  Cofnij zmianę
                </button>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
              <Check
                className={`h-3.5 w-3.5 ${tooltip.approved ? "text-success" : "text-muted-foreground/40"}`}
              />
              <span>
                {tooltip.approved ? "Zatwierdzone" : "Niezatwierdzone"}
              </span>
            </div>
          </div>
          {/* Arrow */}
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-popover border-l border-t border-border" />
        </div>
      )}

      {/* Editor Content */}
      <div className="flex-1 overflow-auto">
        <EditorContent
          editor={editor}
          className="h-full font-serif-editor"
          data-ocid="editor.content"
        />
        {placeholder && editor.isEmpty && (
          <div className="absolute top-[52px] left-4 text-muted-foreground pointer-events-none select-none">
            {placeholder}
          </div>
        )}
      </div>
    </div>
  );
}
