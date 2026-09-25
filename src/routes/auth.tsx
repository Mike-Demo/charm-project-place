import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Studio Sign In — Fresh Ink: Book your session" },
      { name: "description", content: "Studio sign in for Tattoo Atelier: artist access to the booking ledger. Appointment-only custom linework studio in Saint Paul." },
      { property: "og:title", content: "Studio Sign In — Fresh Ink: Book your session" },
      { property: "og:description", content: "Studio sign in for Tattoo Atelier: artist access to the booking ledger. Appointment-only custom linework studio in Saint Paul." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) void navigate({ to: "/admin" });
    });
  }, [navigate]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: `${window.location.origin}/admin` },
        });
        if (signUpError) throw signUpError;
        if (data.session) {
          await navigate({ to: "/admin" });
          return;
        }
        setMessage("Check your inbox to confirm the address, then sign in.");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) throw signInError;
        await navigate({ to: "/admin" });
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const googleSignIn = async () => {
    setBusy(true);
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError("Google sign-in did not complete. Try again.");
      setBusy(false);
      return;
    }
    if (result.redirected) return;
    await navigate({ to: "/admin" });
  };

  return (
    <div className="sketchbook-canvas relative flex min-h-dvh items-center justify-center px-5 py-10 font-hand text-foreground">
      <div aria-hidden="true" className="paper-fiber" />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-ink-dim/30 bg-paper-deep/60 p-6 sm:p-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-pencil/70">
          Tattoo Atelier // Studio Access
        </p>
        <h1 className="mt-2 text-3xl font-normal sm:text-4xl">
          {mode === "signin" ? "Sign in to the ledger" : "Create a studio login"}
        </h1>

        <form className="mt-6 space-y-4" onSubmit={submit}>
          <label className="block">
            <span className="font-mono text-[11px] uppercase tracking-widest text-ink-pencil/70">Email</span>
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded-xl border border-ink-dim/40 bg-transparent px-3 py-2 text-lg outline-none focus:border-foreground"
              placeholder="artist@atelier.ink"
            />
          </label>
          <label className="block">
            <span className="font-mono text-[11px] uppercase tracking-widest text-ink-pencil/70">Password</span>
            <input
              required
              minLength={6}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full rounded-xl border border-ink-dim/40 bg-transparent px-3 py-2 text-lg outline-none focus:border-foreground"
              placeholder="••••••••"
            />
          </label>

          {error !== null && <p className="text-base text-pencil-red">{error}</p>}
          {message !== null && <p className="text-base text-pencil-green">{message}</p>}

          <Button
            type="submit"
            disabled={busy}
            className="ink-stamp-btn h-auto w-full rounded-2xl px-6 py-3 font-hand text-xl font-bold"
          >
            {mode === "signin" ? "Sign in ✦" : "Create login ✦"}
          </Button>
        </form>

        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => void googleSignIn()}
          className="mt-3 h-auto w-full rounded-2xl border-ink-dim/40 bg-transparent px-6 py-3 font-hand text-lg text-foreground hover:bg-paper-line"
        >
          Continue with Google
        </Button>

        <button
          type="button"
          className="mt-5 w-full text-center text-sm text-ink-pencil underline decoration-ink-dim/40 underline-offset-4"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
            setMessage(null);
          }}
        >
          {mode === "signin" ? "Need a studio login? Create one" : "Already have a login? Sign in"}
        </button>
      </div>
    </div>
  );
}
