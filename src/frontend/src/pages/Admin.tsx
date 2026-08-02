import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useGenerateInviteCode,
  useListInviteCodes,
  useRevokeInviteCode,
  useSetAdminPrincipal,
} from "@/hooks/useBackend";
import { useAppStore } from "@/store/useAppStore";
import { AlertCircle, Copy, Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

export function AdminPage() {
  const principal = useAppStore((s) => s.principal);
  const setAdminMutation = useSetAdminPrincipal();
  const autoSetAdminMutation = useSetAdminPrincipal();
  const [newAdminInput, setNewAdminInput] = useState("");
  const [setAdminError, setSetAdminError] = useState<string | null>(null);
  const [setAdminSuccess, setSetAdminSuccess] = useState(false);

  const handleSetAdmin = async () => {
    setSetAdminError(null);
    setSetAdminSuccess(false);
    try {
      const { Principal } = await import("@icp-sdk/core/principal");
      const p = Principal.fromText(newAdminInput.trim());
      await setAdminMutation.mutateAsync(p);
      setSetAdminSuccess(true);
      setNewAdminInput("");
    } catch (err) {
      setSetAdminError(err instanceof Error ? err.message : "Nieznany błąd");
    }
  };

  // Run once per principal change only — not on every render (autoSetAdminMutation
  // is intentionally omitted from deps; it is a stable mutation object we only
  // fire-and-forget here, and including it previously caused a render loop).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (principal) {
      autoSetAdminMutation.mutate(principal);
    }
  }, [principal]);
  const { data: inviteCodes, isLoading } = useListInviteCodes();
  const generateMutation = useGenerateInviteCode();
  const revokeMutation = useRevokeInviteCode();
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setGenerateError(null);
    setGeneratedCode(null);
    try {
      const code = await generateMutation.mutateAsync();
      setGeneratedCode(code);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Nieznany błąd";
      setGenerateError(`Błąd: ${message}`);
      // error handled by mutation
    }
  };

  const handleCopy = async () => {
    if (!generatedCode) return;
    await navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRevoke = async (code: string) => {
    await revokeMutation.mutateAsync({ code });
  };

  const formatDate = (ts: bigint) => {
    return new Date(Number(ts) / 1_000_000).toLocaleString("pl-PL");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold text-foreground">
            Panel administratora
          </h1>
          <p className="text-xs font-mono text-muted-foreground break-all">Twój principal: {principal ? principal.toString() : "brak"}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Zarządzanie kodami zaproszeń
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-border p-4 space-y-2">
        <h2 className="text-sm font-semibold text-foreground">Zmień administratora</h2>
        <p className="text-xs text-muted-foreground">
          Ustaw nowego admina (musisz być zalogowany jako obecny admin).
        </p>
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-mono"
            placeholder="nowy-principal-tekst"
            value={newAdminInput}
            onChange={(e) => setNewAdminInput(e.target.value)}
          />
          <Button
            size="sm"
            onClick={handleSetAdmin}
            disabled={setAdminMutation.isPending || !newAdminInput}
          >
            {setAdminMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Ustaw"
            )}
          </Button>
        </div>
        {setAdminError && <p className="text-xs text-destructive">{setAdminError}</p>}
        {setAdminSuccess && (
          <p className="text-xs text-muted-foreground">Admin zmieniony.</p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {generateError && (
            <div className="flex items-center gap-1.5 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{generateError}</span>
            </div>
          )}
          <Button
            onClick={handleGenerate}
            disabled={generateMutation.isPending}
            data-ocid="admin.generate_invite_button"
          >
            {generateMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Generuj nowy kod
          </Button>
        </div>
      </div>

      <Dialog
        open={!!generatedCode}
        onOpenChange={(open) => {
          if (!open) setGeneratedCode(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nowy kod zaproszenia</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-md bg-muted px-3 py-2 text-lg font-mono tracking-wider">
                {generatedCode}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                data-ocid="admin.copy_invite_code_button"
              >
                <Copy className="h-4 w-4 mr-1" />
                {copied ? "Skopiowano" : "Kopiuj"}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Kod jest gotowy do udostępnienia. Użytkownik musi go wpisać na
              stronie dostępu, aby uzyskać dostęp do aplikacji.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <div className="rounded-lg border border-border bg-card">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !inviteCodes || inviteCodes.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-12 text-center"
            data-ocid="admin.empty_state"
          >
            <p className="text-muted-foreground">
              Brak kodów zaproszeń. Wygeneruj pierwszy kod powyżej.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kod</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Użycia</TableHead>
                <TableHead>Utworzony</TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {inviteCodes.map((ic, idx) => (
                <TableRow
                  key={ic.code}
                  data-ocid={`admin.invite_code.item.${idx + 1}`}
                >
                  <TableCell>
                    <code className="font-mono text-sm">{ic.code}</code>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        !ic.usedBy
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      }`}
                    >
                      {!ic.usedBy ? "Aktywny" : "Użyty"}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {ic.usedBy ? "1 / 1" : "0 / 1"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(ic.createdAt)}
                  </TableCell>
                  <TableCell>
                    {!ic.usedBy && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevoke(ic.code)}
                        disabled={revokeMutation.isPending}
                        data-ocid={`admin.revoke_invite_button.item.${idx + 1}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
