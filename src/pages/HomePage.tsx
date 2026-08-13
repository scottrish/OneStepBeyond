import type { User } from "@supabase/supabase-js";

type HomePageProps = {
  user: User;
  signOut: () => Promise<void>;
};

export default function HomePage({ user, signOut }: HomePageProps) {
  return (
    <main style={{ padding: 32 }}>
      <h1>Home</h1>
      <p>You are logged in as {user.email}</p>
      <button onClick={signOut}>Sign out</button>
    </main>
  );
}
