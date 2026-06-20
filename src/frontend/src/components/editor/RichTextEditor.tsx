import { cn } from "@/lib/utils";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Italic,
  Redo,
  Underline as UnderlineIcon,
  Undo,
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none min-h-[200px] px-4 py-3",
      },
    },
  });

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
