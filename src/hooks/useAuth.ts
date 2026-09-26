import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { clearOfflineData, setCacheOwner } from "../services/offlineCache";
import { discardQueue, loadQueue } from "../services/offlineQueue";
import { signInErrorMessage } from "../domain/adminAccounts";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // getUser() asks the server. Offline it fails — and must not sign the
    // student out on screen: onAuthStateChange below has already restored
    // the session kept on this device, so a failure changes nothing (PWA
    // phase 2, docs/features/pwa-phase-2-offline-v0.1.md, 2a). The server
    // still enforces who can read what.
    // The offline store's owner is set here, the moment the user is known
    // — before any screen reads (React runs children's effects before this
    // one's parent), so the first reads are already stored and can already
    // fall back offline (PWA phase 2, 2b). Then any changes the student
    // made offline are loaded and sent (2c). A sign-in that simply expired
    // keeps them, for when the same student signs in again.
    function becomeOwner(userId: string | null) {
      setCacheOwner(userId);
      if (userId) void loadQueue(userId);
    }

    supabase.auth.getUser().then(({ data, error }) => {
      if (!error) {
        becomeOwner(data.user?.id ?? null);
        setUser(data.user);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        becomeOwner(session?.user.id ?? null);
        setUser(session?.user ?? null);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  async function signUp(email: string, password: string) {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert(error.message);
    else alert("Check your email if confirmation is enabled.");
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // A turned-off account (admin page, A3) is told so plainly, rather than
    // the auth server's "User is banned".
    if (error) alert(signInErrorMessage(error));
  }

  // Nothing of this student stays on the device after signing out —
  // including unsent changes, which Settings warns about first (2c).
  async function signOut() {
    await supabase.auth.signOut();
    discardQueue();
    await clearOfflineData();
  }

  return { user, signUp, signIn, signOut };
}
