import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAppStore } from "@/store/useAppStore";
import { useNavigate } from "@tanstack/react-router";
import { BookOpen, LogIn } from "lucide-react";
import { useEffect } from "react";
import { useAuthClient } from "../hooks/useAuthClient";

export function LoginPage() {
  const navigate = useNavigate();
  const { login, loginStatus, identity } = useAuthClient();
  const { setPrincipal, isAuthenticated } = useAppStore();

  useEffect(() => {
    if (identity && loginStatus === "success" && !isAuthenticated) {
      setPrincipal(identity.getPrincipal());
      navigate({ to: "/dashboard" });
    }
  }, [identity, loginStatus, isAuthenticated, setPrincipal, navigate]);

  const handleLogin = async () => {
    await login();
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
          <Button
            onClick={handleLogin}
            className="w-full"
            disabled={loginStatus === "logging-in"}
            data-ocid="login.submit_button"
          >
            <LogIn className="h-4 w-4 mr-2" />
            {loginStatus === "logging-in"
              ? "Logowanie..."
              : "Zaloguj się przez Internet Identity"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
