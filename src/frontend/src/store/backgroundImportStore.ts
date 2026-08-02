import type { Identity } from "@icp-sdk/core/agent";
import { toast } from "sonner";
import { create } from "zustand";
import { createImportActor } from "@/lib/importActor";
import { runImport, type BackupFile, type ImportProgress, type ImportSummary } from "@/lib/importLogic";

const TOAST_ID = "backup-import";

interface BackgroundImportState {
  isImporting: boolean;
  progress: ImportProgress | null;
  error: string | null;
  summary: ImportSummary | null;
  start: (file: File, identity: Identity) => Promise<void>;
  dismiss: () => void;
}

function formatSummaryLines(summary: ImportSummary): string {
  return Object.keys(summary.imported)
    .filter((k) => summary.imported[k] > 0 || summary.skipped[k] > 0)
    .map((k) => `${k}: +${summary.imported[k]} (pominięto ${summary.skipped[k]})`)
    .join("\n");
}

export const useBackgroundImportStore = create<BackgroundImportState>((set, get) => ({
  isImporting: false,
  progress: null,
  error: null,
  summary: null,

  dismiss: () => {
    toast.dismiss(TOAST_ID);
    set({ error: null, summary: null });
  },

  start: async (file: File, identity: Identity) => {
    if (get().isImporting) {
      toast.info("Import już trwa w tle — poczekaj na zakończenie.");
      return;
    }

    set({ isImporting: true, error: null, summary: null, progress: null });
    toast.loading("Wczytywanie pliku...", {
      id: TOAST_ID,
      duration: Infinity,
      description: "Import kontynuuje się w tle — możesz zamknąć to okno i przełączać zakładki.",
    });

    try {
      const text = await file.text();
      const backup: BackupFile = JSON.parse(text);
      const actor = await createImportActor(identity);
      const ownerId = identity.getPrincipal();

      const result = await runImport(actor, backup, ownerId, (p: ImportProgress) => {
        set({ progress: p });
        toast.loading(`${p.currentLabel} (${p.done}/${p.total || "?"})`, {
          id: TOAST_ID,
          duration: Infinity,
          description: "Import w tle — nie zamykaj karty przeglądarki.",
        });
      });

      set({ summary: result });
      toast.success("Import zakończony", {
        id: TOAST_ID,
        duration: 10000,
        description: formatSummaryLines(result) || undefined,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Nieznany błąd importu";
      set({ error: message });
      toast.error("Błąd importu", {
        id: TOAST_ID,
        duration: 10000,
        description: message,
      });
    } finally {
      set({ isImporting: false, progress: null });
    }
  },
}));
