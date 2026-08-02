import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/providers/AuthProvider";
import { createImportActor } from "@/lib/importActor";
import { runImport, type BackupFile, type ImportProgress, type ImportSummary } from "@/lib/importLogic";
import { Upload, Loader2 } from "lucide-react";
import { useRef, useState } from "react";

export function ImportBackupSection() {
  const { identity } = useAuthContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !identity) return;
    setError(null);
    setSummary(null);
    setIsImporting(true);
    setProgress({ total: 0, done: 0, currentLabel: "Wczytywanie pliku..." });
    try {
      const text = await file.text();
      const backup: BackupFile = JSON.parse(text);
      const actor = await createImportActor(identity);
      const ownerId = identity.getPrincipal();
      const result = await runImport(actor, backup, ownerId, setProgress);
      setSummary(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nieznany błąd importu");
    } finally {
      setIsImporting(false);
      setProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={isImporting}
        className="w-full justify-start"
      >
        {isImporting ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Upload className="h-4 w-4 mr-2" />
        )}
        Importuj kopię zapasową (JSON)
      </Button>
      {progress && (
        <p className="text-xs text-muted-foreground">
          {progress.currentLabel} ({progress.done}/{progress.total || "?"})
        </p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
      {summary && (
        <div className="text-xs text-muted-foreground space-y-1">
          {Object.keys(summary.imported).map((k) => (
            <p key={k}>
              {k}: +{summary.imported[k]} (pominięto {summary.skipped[k]})
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
