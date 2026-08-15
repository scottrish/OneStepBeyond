import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Plus, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ActivitiesPage from "./ActivitiesPage";
import AssignmentCapturePage from "./AssignmentCapturePage";
import AssignmentDetailPage from "./AssignmentDetailPage";
import CoursesPage from "./CoursesPage";
import SettingsPage from "./SettingsPage";

type HomePageProps = {
  user: User;
  signOut: () => Promise<void>;
};

type View =
  | { name: "home" }
  | { name: "settings" }
  | { name: "activities" }
  | { name: "courses" }
  | { name: "capture-assignment" }
  | { name: "assignment-detail"; assignmentId: string };

export default function HomePage({ user, signOut }: HomePageProps) {
  const [view, setView] = useState<View>({ name: "home" });

  if (view.name === "settings") {
    return (
      <SettingsPage
        onBack={() => setView({ name: "home" })}
        onGoToActivities={() => setView({ name: "activities" })}
        onGoToCourses={() => setView({ name: "courses" })}
        signOut={signOut}
      />
    );
  }

  if (view.name === "activities") {
    return (
      <ActivitiesPage user={user} onBack={() => setView({ name: "home" })} />
    );
  }

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
          >
            <Plus className="size-5" />
          </Button>
          <Button
            aria-label="Settings"
            variant="ghost"
            size="icon"
            onClick={() => setView({ name: "settings" })}
          >
            <Settings2 className="size-5" />
          </Button>
        </div>
      </header>
      <p className="mt-4">You are logged in as {user.email}</p>
    </main>
  );
}
