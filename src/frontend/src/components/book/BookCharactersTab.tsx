import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateBookCharacters } from "@/hooks/useBackend";
import { Trash2, UserPlus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface Character {
  id: string;
  name: string;
  bio: string;
  role: string;
}

function parseCharacters(json: string): Character[] {
  if (!json || json.trim().length === 0) return [];
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) {
      return parsed.map((c) => ({
        id: String(c.id ?? crypto.randomUUID()),
        name: String(c.name ?? ""),
        bio: String(c.bio ?? ""),
        role: String(c.role ?? ""),
      }));
    }
  } catch {
    // ignore parse errors
  }
  return [];
}

function serializeCharacters(characters: Character[]): string {
  return JSON.stringify(characters);
}

export function BookCharactersTab({
  bookId,
  characters,
}: {
  bookId: bigint;
  characters: string;
}) {
  const [items, setItems] = useState<Character[]>(() =>
    parseCharacters(characters),
  );
  const [hasChanges, setHasChanges] = useState(false);
  const updateCharacters = useUpdateBookCharacters();

  useEffect(() => {
    setItems(parseCharacters(characters));
    setHasChanges(false);
  }, [characters]);

  const save = useCallback(
    (next: Character[]) => {
      const json = serializeCharacters(next);
      updateCharacters.mutate(
        { id: bookId, characters: json },
        {
          onSuccess: () => {
            setHasChanges(false);
            toast.success("Bohaterowie zostali zapisani");
          },
          onError: () => {
            toast.error("Nie udało się zapisać bohaterów");
          },
        },
      );
    },
    [bookId, updateCharacters],
  );

  const handleChange = (
    index: number,
    field: keyof Character,
    value: string,
  ) => {
    const next = items.map((c, i) =>
      i === index ? { ...c, [field]: value } : c,
    );
    setItems(next);
    setHasChanges(true);
  };

  const handleAdd = () => {
    const next = [
      ...items,
      { id: crypto.randomUUID(), name: "", bio: "", role: "" },
    ];
    setItems(next);
    setHasChanges(true);
  };

  const handleDelete = (index: number) => {
    const next = items.filter((_, i) => i !== index);
    setItems(next);
    setHasChanges(true);
  };

  const handleSave = () => {
    save(items);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Bohaterowie
        </h2>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <span className="text-xs text-muted-foreground">
              Niezapisane zmiany
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleAdd}
            data-ocid="character.add_button"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Dodaj bohatera
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || updateCharacters.isPending}
            data-ocid="character.save_button"
          >
            Zapisz
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-border rounded-lg"
          data-ocid="character.empty_state"
        >
          <UserPlus className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <h3 className="text-base font-medium text-foreground mb-1">
            Brak bohaterów
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Dodaj pierwszego bohatera, aby rozpocząć.
          </p>
          <Button
            variant="outline"
            onClick={handleAdd}
            data-ocid="character.add_button.empty"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Dodaj bohatera
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map((character, index) => (
            <div
              key={character.id}
              className="p-4 rounded-lg border border-border bg-card space-y-4"
              data-ocid={`character.item.${index + 1}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor={`char-name-${index}`}>Imię</Label>
                    <Input
                      id={`char-name-${index}`}
                      value={character.name}
                      onChange={(e) =>
                        handleChange(index, "name", e.target.value)
                      }
                      placeholder="Imię bohatera"
                      data-ocid={`character.name_input.${index + 1}`}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`char-role-${index}`}>
                      Rola w historii
                    </Label>
                    <Input
                      id={`char-role-${index}`}
                      value={character.role}
                      onChange={(e) =>
                        handleChange(index, "role", e.target.value)
                      }
                      placeholder="Np. protagonista, antagonista"
                      data-ocid={`character.role_input.${index + 1}`}
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => handleDelete(index)}
                  aria-label="Usuń bohatera"
                  data-ocid={`character.delete_button.${index + 1}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`char-bio-${index}`}>Opis / Bio</Label>
                <Textarea
                  id={`char-bio-${index}`}
                  value={character.bio}
                  onChange={(e) => handleChange(index, "bio", e.target.value)}
                  placeholder="Krótki opis bohatera, motywacje, cechy charakteru..."
                  rows={3}
                  data-ocid={`character.bio_textarea.${index + 1}`}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
