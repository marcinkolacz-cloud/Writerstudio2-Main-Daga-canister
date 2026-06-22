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
} from "@/hooks/useBackend";
import { AlertCircle, Copy, Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

export function AdminPage() {
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
          <p className="text-sm text-muted-foreground mt-1">
            Zarządzanie kodami zaproszeń
          </p>
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
