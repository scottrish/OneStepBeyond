import { useState } from "react";

type LoginPageProps = {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
};

export default function LoginPage({ signIn, signUp }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const isValid = email.trim() !== "" && password.trim() !== "";

  return (
    <main style={{ padding: 32, maxWidth: 420 }}>
      <h1>Login</h1>

      <label htmlFor="email">Email</label>
      <input
        id="email"
        type="email"
        style={{ display: "block", width: "100%", marginBottom: 12 }}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <label htmlFor="password">Password</label>
      <input
        id="password"
        style={{ display: "block", width: "100%", marginBottom: 12 }}
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button disabled={!isValid} onClick={() => signIn(email, password)}>
        Sign in
      </button>
      <button
        disabled={!isValid}
        onClick={() => signUp(email, password)}
        style={{ marginLeft: 8 }}
      >
        Sign up
      </button>
    </main>
  );
}
