import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { clearOfflineData, setCacheOwner } from "../services/offlineCache";

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
    // fall back offline (PWA phase 2, 2b).
    supabase.auth.getUser().then(({ data, error }) => {
      if (!error) {
        setCacheOwner(data.user?.id ?? null);
        setUser(data.user);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setCacheOwner(session?.user.id ?? null);
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

    if (error) alert(error.message);
  }

  // Nothing of this student stays on the device after signing out.
  async function signOut() {
    await supabase.auth.signOut();
    await clearOfflineData();
  }

  return { user, signUp, signIn, signOut };
}
