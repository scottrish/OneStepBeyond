import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import CoursesPage from "./CoursesPage";

type HomePageProps = {
  user: User;
  signOut: () => Promise<void>;
};

export default function HomePage({ user, signOut }: HomePageProps) {
  const [view, setView] = useState<"home" | "courses">("home");

  if (view === "courses") {
    return <CoursesPage user={user} onBack={() => setView("home")} />;
  }

  return (
    <main style={{ padding: 32 }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h1>Home</h1>
        <button
          aria-label="Settings"
          onClick={() => setView("courses")}
          style={{
            minWidth: 44,
            minHeight: 44,
            background: "none",
            border: "none",
            fontSize: 24,
            cursor: "pointer",
          }}
        >
          ⚙️
        </button>
      </header>
      <p>You are logged in as {user.email}</p>
      <button onClick={signOut}>Sign out</button>
    </main>
  );
}
