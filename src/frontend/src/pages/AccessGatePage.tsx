import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useClaimInviteCode } from "@/hooks/useBackend";
import { useAppStore } from "@/store/useAppStore";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { BookOpen, KeyRound, Loader2, LogOut } from "lucide-react";
import { useState } from "react";

export function AccessGatePage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const claimMutation = useClaimInviteCode();
  const { clear } = useInternetIdentity();
  const { clearAuth } = useAppStore();

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

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      clear();
      clearAuth();
      window.location.reload();
    } catch {
      setIsLoggingOut(false);
    }
  };

  return (
    <div
      className="relative flex min-h-screen w-full items-center justify-center p-4"
      style={{
        backgroundImage: "url('/assets/images/typewriter.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div
        className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/70"
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-md space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white/95 p-8 shadow-elevated backdrop-blur-sm">
          <div className="flex flex-col items-center space-y-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100">
              <BookOpen className="h-7 w-7 text-slate-700" />
            </div>
            <h1 className="text-center text-2xl font-display font-semibold text-slate-900">
              WriterStudio TipTap
            </h1>
            <p className="text-center text-sm text-slate-600">
              Wprowadź kod zaproszenia, aby uzyskać dostęp do aplikacji
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="invite-code"
                className="text-sm font-medium text-slate-800"
              >
                Kod zaproszenia
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
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

        <Button
          type="button"
          variant="outline"
          className="w-full border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm"
          disabled={isLoggingOut}
          onClick={handleLogout}
          data-ocid="access_gate.logout_button"
        >
          {isLoggingOut ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Wylogowywanie...
            </>
          ) : (
            <>
              <LogOut className="mr-2 h-4 w-4" />
              Wyloguj i zaloguj się inną tożsamością
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
