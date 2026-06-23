import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Key, LogOut, Save, Settings } from "lucide-react";
import { useEffect, useState } from "react";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const [apiKeyOpenAI, setApiKeyOpenAI] = useState("");
  const [apiKeyClaude, setApiKeyClaude] = useState("");
  const [provider, setProvider] = useState<"openai" | "claude">("openai");
  const [systemPrompt, setSystemPrompt] = useState("");

  // Load values from localStorage when modal opens
  useEffect(() => {
    if (open) {
      // Backward compatibility: migrate old single key to OpenAI key
      const oldKey = localStorage.getItem("ws_api_key");
      if (oldKey && !localStorage.getItem("ws_api_key_openai")) {
        localStorage.setItem("ws_api_key_openai", oldKey);
        localStorage.removeItem("ws_api_key");
      }

      setApiKeyOpenAI(localStorage.getItem("ws_api_key_openai") ?? "");
      setApiKeyClaude(localStorage.getItem("ws_api_key_claude") ?? "");
      const savedProvider = localStorage.getItem("ws_api_provider");
      setProvider(savedProvider === "claude" ? "claude" : "openai");
      setSystemPrompt(localStorage.getItem("ws_system_prompt") ?? "");
    }
  }, [open]);

  const handleSave = () => {
    localStorage.setItem("ws_api_key_openai", apiKeyOpenAI);
    localStorage.setItem("ws_api_key_claude", apiKeyClaude);
    localStorage.setItem("ws_api_provider", provider);
    localStorage.setItem("ws_system_prompt", systemPrompt);
    onOpenChange(false);
  };

  const handleResetAccess = () => {
    localStorage.removeItem("ws_access_granted");
    window.location.reload();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Ustawienia ogólnoaplikacyjne
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Section 1 — API Key & Provider */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Key className="h-4 w-4 text-primary" />
              Klucz API i provider
            </h3>
            <div className="space-y-2">
              <Label htmlFor="settings-api-key-openai">Klucz API OpenAI</Label>
              <Input
                id="settings-api-key-openai"
                type="password"
                placeholder="Wprowadź klucz API OpenAI"
                value={apiKeyOpenAI}
                onChange={(e) => setApiKeyOpenAI(e.target.value)}
                data-ocid="settings.api_key_openai_input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="settings-api-key-claude">Klucz API Claude</Label>
              <Input
                id="settings-api-key-claude"
                type="password"
                placeholder="Wprowadź klucz API Claude"
                value={apiKeyClaude}
                onChange={(e) => setApiKeyClaude(e.target.value)}
                data-ocid="settings.api_key_claude_input"
              />
            </div>
            <div className="space-y-2">
              <Label>Provider</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={provider === "openai" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => {
                    setProvider("openai");
                    localStorage.setItem("ws_api_provider", "openai");
                  }}
                  data-ocid="settings.provider_openai_button"
                >
                  OpenAI
                </Button>
                <Button
                  type="button"
                  variant={provider === "claude" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => {
                    setProvider("claude");
                    localStorage.setItem("ws_api_provider", "claude");
                  }}
                  data-ocid="settings.provider_claude_button"
                >
                  Claude
                </Button>
              </div>
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* Section 2 — System Prompt */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Settings className="h-4 w-4 text-primary" />
              Własny system prompt AI
            </h3>
            <div className="space-y-2">
              <Label htmlFor="settings-system-prompt">
                Własny system prompt AI
              </Label>
              <Textarea
                id="settings-system-prompt"
                placeholder="Wpisz własne instrukcje dla AI, które będą dołączane do każdej analizy i rozmowy z asystentem (np. 'Pisz zawsze po polsku', 'Zachowaj styl noir', 'Unikaj słowa bardzo')..."
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={5}
                data-ocid="settings.system_prompt_textarea"
              />
              <p className="text-xs text-muted-foreground">
                Ten prompt będzie dołączany na końcu każdego zapytania do AI.
              </p>
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* Section 3 — Access */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <LogOut className="h-4 w-4 text-destructive" />
              Dostęp
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetAccess}
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
              data-ocid="settings.reset_access_button"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Wyloguj / Zresetuj dostęp
            </Button>
            <p className="text-xs text-muted-foreground">
              Usuwa flagę dostępu i przeładowuje stronę. Będziesz musiał
              ponownie aktywować dostęp kodem zaproszenia.
            </p>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-ocid="settings.cancel_button"
          >
            Anuluj
          </Button>
          <Button onClick={handleSave} data-ocid="settings.save_button">
            <Save className="h-4 w-4 mr-2" />
            Zapisz ustawienia
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
