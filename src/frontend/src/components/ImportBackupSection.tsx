import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/providers/AuthProvider";
import { useBackgroundImportStore } from "@/store/backgroundImportStore";
import { Upload, Loader2 } from "lucide-react";
import { useRef } from "react";

export function ImportBackupSection() {
  const { identity } = useAuthContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isImporting = useBackgroundImportStore((s) => s.isImporting);
  const start = useBackgroundImportStore((s) => s.start);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !identity) return;
    void start(file, identity);
    if (fileInputRef.current) fileInputRef.current.value = "";
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
        {isImporting ? "Import w tle... (możesz zamknąć to okno)" : "Importuj kopię zapasową (JSON)"}
      </Button>
    </div>
  );
}
