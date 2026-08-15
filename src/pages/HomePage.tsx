import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import AssignmentCapturePage from "./AssignmentCapturePage";
import AssignmentDetailPage from "./AssignmentDetailPage";
import CoursesPage from "./CoursesPage";

type HomePageProps = {
  user: User;
  signOut: () => Promise<void>;
};

type View =
  | { name: "home" }
  | { name: "courses" }
  | { name: "capture-assignment" }
  | { name: "assignment-detail"; assignmentId: string };

export default function HomePage({ user, signOut }: HomePageProps) {
  const [view, setView] = useState<View>({ name: "home" });

  if (view.name === "courses") {
    return (
      <CoursesPage user={user} onBack={() => setView({ name: "home" })} />
    );
  }

  if (view.name === "capture-assignment") {
    return (
      <AssignmentCapturePage
        user={user}
        onCancel={() => setView({ name: "home" })}
        onGoToCourses={() => setView({ name: "courses" })}
        onSaved={(assignmentId) =>
          setView({ name: "assignment-detail", assignmentId })
        }
      />
    );
  }

  if (view.name === "assignment-detail") {
    return (
      <AssignmentDetailPage
        user={user}
        assignmentId={view.assignmentId}
        onBack={() => setView({ name: "home" })}
      />
    );
  }

  return (
    <main className="p-8">
      <header className="flex items-center justify-between gap-1">
        <h1 className="text-3xl">Home</h1>
        <div className="flex items-center gap-1">
          <Button
            aria-label="New assignment"
            variant="ghost"
            size="icon"
            onClick={() => setView({ name: "capture-assignment" })}
            className="text-2xl"
          >
            +
          </Button>
          <Button
            aria-label="Settings"
            variant="ghost"
            size="icon"
            onClick={() => setView({ name: "courses" })}
            className="text-2xl"
          >
            ⚙️
          </Button>
        </div>
      </header>
      <p className="mt-4">You are logged in as {user.email}</p>
      <Button variant="outline" onClick={signOut} className="mt-6">
        Sign out
      </Button>
    </main>
  );
}
