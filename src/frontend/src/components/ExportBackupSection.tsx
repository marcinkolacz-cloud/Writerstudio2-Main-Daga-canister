import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/providers/AuthProvider";
import { createExportActor } from "@/lib/exportActor";
import { runExport, type ExportProgress } from "@/lib/exportLogic";
import { Download, Loader2 } from "lucide-react";
import { useState } from "react";

function buildBackupFileName(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `writerstudio-backup-${yyyy}-${mm}-${dd}.json`;
}

function triggerJsonDownload(data: unknown, fileName: string): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExportBackupSection() {
  const { identity } = useAuthContext();
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleExport = async () => {
    if (!identity) return;
    setError(null);
    setSuccess(false);
    setIsExporting(true);
    setProgress({ total: 0, done: 0, currentLabel: "Rozpoczynanie eksportu..." });
    try {
      const actor = await createExportActor(identity);
      const backup = await runExport(actor, setProgress);
      triggerJsonDownload(backup, buildBackupFileName());
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nieznany błąd eksportu");
    } finally {
      setIsExporting(false);
      setProgress(null);
    }
  };

  return (
    <div className="space-y-3">
      <Button
        variant="outline"
        size="sm"
        onClick={handleExport}
        disabled={isExporting}
        className="w-full justify-start"
      >
        {isExporting ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Download className="h-4 w-4 mr-2" />
        )}
        {isExporting ? "Eksportowanie..." : "Eksportuj kopię zapasową (JSON)"}
      </Button>
      {progress && (
        <p className="text-xs text-muted-foreground">
          {progress.currentLabel} ({progress.done}/{progress.total || "?"})
        </p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
      {success && !error && (
        <p className="text-xs text-muted-foreground">Plik JSON został pobrany.</p>
      )}
    </div>
  );
}
