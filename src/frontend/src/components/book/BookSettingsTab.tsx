import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateBookMetadata } from "@/hooks/useBackend";
import { useState } from "react";
import { toast } from "sonner";

interface BookSettingsTabProps {
  bookId: bigint;
  ageCategory: string;
  authorSummary: string;
  keyContext: string;
  themes: string;
  writingStyle?: string;
}

export function BookSettingsTab({
  bookId,
  ageCategory,
  authorSummary,
  keyContext,
  themes,
  writingStyle = "",
}: BookSettingsTabProps) {
  const [ageCategoryValue, setAgeCategoryValue] = useState(
    ageCategory || "adult",
  );
  const [authorSummaryValue, setAuthorSummaryValue] = useState(
    authorSummary || "",
  );
  const [keyContextValue, setKeyContextValue] = useState(keyContext || "");
  const [themesValue, setThemesValue] = useState(themes || "");
  const [writingStyleValue, setWritingStyleValue] = useState(
    writingStyle || "",
  );

  const updateMetadata = useUpdateBookMetadata();

  const handleSave = () => {
    updateMetadata.mutate(
      {
        id: bookId,
        ageCategory: ageCategoryValue,
        authorSummary: authorSummaryValue,
        keyContext: keyContextValue,
        themes: themesValue,
        writingStyle: writingStyleValue,
      },
      {
        onSuccess: () => {
          toast.success("Zapisano ustawienia książki");
        },
        onError: () => {
          toast.error("Nie udało się zapisać ustawień");
        },
      },
    );
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="space-y-2">
        <Label htmlFor="age-category">Kategoria wiekowa</Label>
        <Select value={ageCategoryValue} onValueChange={setAgeCategoryValue}>
          <SelectTrigger id="age-category" data-ocid="book_settings.age_select">
            <SelectValue placeholder="Wybierz kategorię" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="adult">Dorosła</SelectItem>
            <SelectItem value="young_adult">Młodzieżowa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="author-summary">Streszczenie książki (autorskie)</Label>
        <Textarea
          id="author-summary"
          value={authorSummaryValue}
          onChange={(e) => setAuthorSummaryValue(e.target.value)}
          placeholder="Napisz krótkie streszczenie książki..."
          rows={4}
          data-ocid="book_settings.author_summary_input"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="key-context">Kluczowe informacje kontekstowe</Label>
        <Textarea
          id="key-context"
          value={keyContextValue}
          onChange={(e) => setKeyContextValue(e.target.value)}
          placeholder="np. zasady świata, ważne fakty, których AI powinno być świadome"
          rows={4}
          data-ocid="book_settings.key_context_input"
        />
        <p className="text-xs text-muted-foreground">
          np. zasady świata, ważne fakty, których AI powinno być świadome
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="themes">Motywy przewodnie</Label>
        <Textarea
          id="themes"
          value={themesValue}
          onChange={(e) => setThemesValue(e.target.value)}
          placeholder="Wymień główne motywy przewodnie książki..."
          rows={3}
          data-ocid="book_settings.themes_input"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="writing-style">Styl pisarski autora</Label>
        <Textarea
          id="writing-style"
          value={writingStyleValue}
          onChange={(e) => setWritingStyleValue(e.target.value)}
          placeholder="np. ton, długość zdań, ulubione środki stylistyczne"
          rows={3}
          data-ocid="book_settings.writing_style_input"
        />
        <p className="text-xs text-muted-foreground">
          np. ton, długość zdań, ulubione środki stylistyczne
        </p>
      </div>

      <Button
        onClick={handleSave}
        disabled={updateMetadata.isPending}
        data-ocid="book_settings.save_button"
      >
        {updateMetadata.isPending
          ? "Zapisywanie..."
          : "Zapisz ustawienia książki"}
      </Button>
    </div>
  );
}
