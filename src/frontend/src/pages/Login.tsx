import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";

export function LoginPage() {
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder — no actual login logic yet
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-elevated">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="font-display text-2xl">
            WriterStudio TipTap
          </CardTitle>
          <CardDescription>Zaloguj się, aby kontynuować</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="twoj@email.com"
                data-ocid="login.email_input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Hasło</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                data-ocid="login.password_input"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              data-ocid="login.submit_button"
            >
              Zaloguj się
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
