import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOnlineStatus } from "../hooks/useOnlineStatus";

type LoginPageProps = {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
};

export default function LoginPage({ signIn, signUp }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const isValid = email.trim() !== "" && password.trim() !== "";
  // Signing in needs the server (PWA phase 2 — docs/features/
  // pwa-phase-2-offline-v0.1.md, 2a): say so rather than fail.
  const online = useOnlineStatus();

  return (
    <main className="mx-auto w-full max-w-md px-5 pt-[calc(2rem+env(safe-area-inset-top))] pb-[calc(2rem+env(safe-area-inset-bottom))] sm:px-8">
      <h1 className="mb-6 text-[clamp(1.65rem,7vw,2.1rem)] leading-tight">Login</h1>

      {!online && (
        <p role="status" className="mb-4 rounded-lg border border-border bg-card p-3 text-sm text-card-foreground">
          You&rsquo;re offline. Connect to sign in.
        </p>
      )}

      <div className="mb-4 flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="mb-6 flex flex-col gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          disabled={!isValid || !online}
          onClick={() => signIn(email, password)}
          className="w-full sm:w-auto"
        >
          Sign in
        </Button>
        <Button
          variant="outline"
          disabled={!isValid || !online}
          onClick={() => signUp(email, password)}
          className="w-full sm:w-auto"
        >
          Sign up
        </Button>
      </div>
    </main>
  );
}
