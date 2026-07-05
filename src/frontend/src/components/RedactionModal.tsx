import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  AlignLeft,
  FileEdit,
  FileText,
  Hash,
  IndentIncrease,
  Ruler,
  Sparkles,
  Type,
} from "lucide-react";
import { useEffect, useState } from "react";

export interface RedactionSettings {
  justify: boolean;
  lineSpacing: number;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  fontSize: number;
  firstLineIndent: number;
  pageNumbers: boolean;
}

interface RedactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (settings: RedactionSettings, aiParagraphs: boolean) => void;
}

const DEFAULT_SETTINGS: RedactionSettings = {
  justify: true,
  lineSpacing: 1.5,
  marginTop: 2.5,
  marginBottom: 2.5,
  marginLeft: 2.5,
  marginRight: 2.5,
  fontSize: 12,
  firstLineIndent: 1.25,
  pageNumbers: true,
};

export function RedactionModal({
  open,
  onOpenChange,
  onGenerate,
}: RedactionModalProps) {
  const [settings, setSettings] = useState<RedactionSettings>(DEFAULT_SETTINGS);
  const [aiParagraphs, setAiParagraphs] = useState(false);

  // Reset to defaults whenever the modal opens
  useEffect(() => {
    if (open) {
      setSettings(DEFAULT_SETTINGS);
      setAiParagraphs(false);
    }
  }, [open]);

  const update = <K extends keyof RedactionSettings>(
    key: K,
    value: RedactionSettings[K],
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleGenerate = () => {
    onGenerate(settings, aiParagraphs);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileEdit className="h-5 w-5" />
            Ustawienia redakcji
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Section 0 — AI paragraph recognition */}
          <div className="space-y-3 rounded-md border border-primary/30 bg-primary/5 px-3 py-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Formatowanie AI
            </h3>
            <div className="flex items-start gap-3">
              <Checkbox
                id="redaction-ai-paragraphs"
                checked={aiParagraphs}
                onCheckedChange={(checked) => setAiParagraphs(checked === true)}
                data-ocid="redaction.ai_paragraphs_checkbox"
              />
              <Label
                htmlFor="redaction-ai-paragraphs"
                className="text-sm cursor-pointer leading-snug"
              >
                Automatycznie rozpoznaj akapity i dialogi (AI)
              </Label>
            </div>
            <p className="text-xs text-muted-foreground leading-snug">
              AI wstawi podziały akapitów i wydzieli linie dialogowe w kopii
              pliku DOCX. Tekst w edytorze pozostaje niezmieniony.
            </p>
          </div>

          <div className="h-px bg-border" />

          {/* Section 1 — Układ tekstu */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <AlignLeft className="h-4 w-4 text-primary" />
              Układ tekstu
            </h3>
            <div className="flex items-center gap-3">
              <Checkbox
                id="redaction-justify"
                checked={settings.justify}
                onCheckedChange={(checked) =>
                  update("justify", checked === true)
                }
                data-ocid="redaction.justify_checkbox"
              />
              <Label
                htmlFor="redaction-justify"
                className="text-sm cursor-pointer"
              >
                Justowanie tekstu
              </Label>
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* Section 2 — Interlinia */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Interlinia
            </h3>
            <div className="flex items-center gap-4">
              <Slider
                value={[settings.lineSpacing]}
                onValueChange={(value) =>
                  update("lineSpacing", value[0] ?? 1.5)
                }
                min={1.0}
                max={2.0}
                step={0.1}
                className="flex-1"
                data-ocid="redaction.line_spacing_slider"
              />
              <span className="text-sm font-medium text-foreground tabular-nums w-10 text-right">
                {settings.lineSpacing.toFixed(1)}
              </span>
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* Section 3 — Marginesy */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Ruler className="h-4 w-4 text-primary" />
              Marginesy (cm)
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="redaction-margin-top">Górny</Label>
                <Input
                  id="redaction-margin-top"
                  type="number"
                  step="0.1"
                  min="0"
                  value={settings.marginTop}
                  onChange={(e) =>
                    update("marginTop", Number(e.target.value) || 0)
                  }
                  data-ocid="redaction.margin_top_input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="redaction-margin-bottom">Dolny</Label>
                <Input
                  id="redaction-margin-bottom"
                  type="number"
                  step="0.1"
                  min="0"
                  value={settings.marginBottom}
                  onChange={(e) =>
                    update("marginBottom", Number(e.target.value) || 0)
                  }
                  data-ocid="redaction.margin_bottom_input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="redaction-margin-left">Lewy</Label>
                <Input
                  id="redaction-margin-left"
                  type="number"
                  step="0.1"
                  min="0"
                  value={settings.marginLeft}
                  onChange={(e) =>
                    update("marginLeft", Number(e.target.value) || 0)
                  }
                  data-ocid="redaction.margin_left_input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="redaction-margin-right">Prawy</Label>
                <Input
                  id="redaction-margin-right"
                  type="number"
                  step="0.1"
                  min="0"
                  value={settings.marginRight}
                  onChange={(e) =>
                    update("marginRight", Number(e.target.value) || 0)
                  }
                  data-ocid="redaction.margin_right_input"
                />
              </div>
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* Section 4 — Typografia */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Type className="h-4 w-4 text-primary" />
              Typografia
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="redaction-font-size">
                  Rozmiar czcionki (pt)
                </Label>
                <Input
                  id="redaction-font-size"
                  type="number"
                  step="0.5"
                  min="1"
                  value={settings.fontSize}
                  onChange={(e) =>
                    update("fontSize", Number(e.target.value) || 0)
                  }
                  data-ocid="redaction.font_size_input"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="redaction-first-line-indent"
                  className="flex items-center gap-1"
                >
                  <IndentIncrease className="h-3.5 w-3.5" />
                  Wcięcie pierwszej linii (cm)
                </Label>
                <Input
                  id="redaction-first-line-indent"
                  type="number"
                  step="0.05"
                  min="0"
                  value={settings.firstLineIndent}
                  onChange={(e) =>
                    update("firstLineIndent", Number(e.target.value) || 0)
                  }
                  data-ocid="redaction.first_line_indent_input"
                />
              </div>
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* Section 5 — Strony */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Hash className="h-4 w-4 text-primary" />
              Strony
            </h3>
            <div className="flex items-center gap-3">
              <Checkbox
                id="redaction-page-numbers"
                checked={settings.pageNumbers}
                onCheckedChange={(checked) =>
                  update("pageNumbers", checked === true)
                }
                data-ocid="redaction.page_numbers_checkbox"
              />
              <Label
                htmlFor="redaction-page-numbers"
                className="text-sm cursor-pointer"
              >
                Numeracja stron
              </Label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-ocid="redaction.cancel_button"
          >
            Anuluj
          </Button>
          <Button
            onClick={handleGenerate}
            data-ocid="redaction.generate_button"
          >
            <FileEdit className="h-4 w-4 mr-2" />
            Generuj plik DOCX
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
