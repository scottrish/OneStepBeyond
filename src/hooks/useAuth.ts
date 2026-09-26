import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // getUser() asks the server. Offline it fails — and must not sign the
    // student out on screen: onAuthStateChange below has already restored
    // the session kept on this device, so a failure changes nothing (PWA
    // phase 2, docs/features/pwa-phase-2-offline-v0.1.md, 2a). The server
    // still enforces who can read what.
    supabase.auth.getUser().then(({ data, error }) => {
      if (!error) setUser(data.user);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
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

  async function signOut() {
    await supabase.auth.signOut();
  }

  return { user, signUp, signIn, signOut };
}
