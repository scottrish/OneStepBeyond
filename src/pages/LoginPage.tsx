import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginPageProps = {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
};

export default function LoginPage({ signIn, signUp }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const isValid = email.trim() !== "" && password.trim() !== "";

  return (
    <main className="mx-auto w-full max-w-[420px] p-8">
      <h1 className="mb-6 text-3xl">Login</h1>

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
          disabled={!isValid}
          onClick={() => signIn(email, password)}
          className="w-full sm:w-auto"
        >
          Sign in
        </Button>
        <Button
          variant="outline"
          disabled={!isValid}
          onClick={() => signUp(email, password)}
          className="w-full sm:w-auto"
        >
          Sign up
        </Button>
      </div>
    </main>
  );
}
