import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
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
    <main className="p-8">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl">Home</h1>
        <Button
          aria-label="Settings"
          variant="ghost"
          size="icon"
          onClick={() => setView("courses")}
          className="text-2xl"
        >
          ⚙️
        </Button>
      </header>
      <p className="mt-4">You are logged in as {user.email}</p>
      <Button variant="outline" onClick={signOut} className="mt-6">
        Sign out
      </Button>
    </main>
  );
}
