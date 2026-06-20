import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateBook } from "@/hooks/useBackend";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const CATEGORIES = [
  "młodzieżowa",
  "fantasy",
  "science fiction",
  "thriller",
  "romans",
  "literatura piękna",
  "biografia",
  "inne",
];

interface CreateBookDialogProps {
  variant?: "button" | "empty";
}

export function CreateBookDialog({
  variant = "button",
}: CreateBookDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const createBook = useCreateBook();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !category) return;

    try {
      await createBook.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        category,
      });
      toast.success("Książka została utworzona");
      setTitle("");
      setDescription("");
      setCategory("");
      setOpen(false);
    } catch {
      toast.error("Nie udało się utworzyć książki");
    }
  };

  const triggerContent =
    variant === "empty" ? (
      <Button
        onClick={() => setOpen(true)}
        data-ocid="book.empty_state.add_button"
      >
        <Plus className="h-4 w-4 mr-2" />
        Dodaj pierwszą książkę
      </Button>
    ) : (
      <Button onClick={() => setOpen(true)} data-ocid="book.open_modal_button">
        <Plus className="h-4 w-4 mr-2" />
        Nowa książka
      </Button>
    );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{triggerContent}</DialogTrigger>
      <DialogContent className="sm:max-w-md" data-ocid="book.dialog">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Nowa książka</DialogTitle>
            <DialogDescription>
              Wprowadź szczegóły nowej książki, którą chcesz utworzyć.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Tytuł</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Tytuł książki"
                required
                data-ocid="book.input.title"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Kategoria</Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger data-ocid="book.select.category">
                  <SelectValue placeholder="Wybierz kategorię" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Opis</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Krótki opis książki..."
                rows={3}
                data-ocid="book.textarea.description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              data-ocid="book.cancel_button"
            >
              Anuluj
            </Button>
            <Button
              type="submit"
              disabled={createBook.isPending || !title.trim() || !category}
              data-ocid="book.submit_button"
            >
              {createBook.isPending ? "Tworzenie..." : "Utwórz książkę"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
