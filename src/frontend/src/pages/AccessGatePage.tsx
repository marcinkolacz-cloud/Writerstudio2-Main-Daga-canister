import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useClaimInviteCode } from "@/hooks/useBackend";
import { BookOpen, KeyRound, Loader2 } from "lucide-react";
import { useState } from "react";

export function AccessGatePage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const claimMutation = useClaimInviteCode();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!code.trim()) {
      setError("Wprowadź kod zaproszenia");
      return;
    }
    try {
      const result = await claimMutation.mutateAsync({ code: code.trim() });
      if (result) {
        localStorage.setItem("ws_access_granted", "true");
        window.location.reload();
      } else {
        setError("Nieprawidłowy lub już użyty kod zaproszenia");
      }
    } catch {
      setError("Wystąpił błąd podczas weryfikacji kodu");
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center space-y-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
            <BookOpen className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-display font-semibold text-foreground text-center">
            WriterStudio TipTap
          </h1>
          <p className="text-sm text-muted-foreground text-center">
            Wprowadź kod zaproszenia, aby uzyskać dostęp do aplikacji
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="invite-code"
              className="text-sm font-medium text-foreground"
            >
              Kod zaproszenia
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="invite-code"
                type="text"
                placeholder="np. ABCD1234"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="pl-10 font-mono tracking-wider"
                autoComplete="off"
                data-ocid="access_gate.input"
              />
            </div>
          </div>

          {error && (
            <div
              className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
              data-ocid="access_gate.error_state"
            >
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={claimMutation.isPending}
            data-ocid="access_gate.submit_button"
          >
            {claimMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Weryfikacja...
              </>
            ) : (
              "Aktywuj dostęp"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
