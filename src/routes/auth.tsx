import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { errMsg } from "@/lib/game";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — RunQuest" },
      { name: "description", content: "Entra o crea tu cuenta de corredor en RunQuest." },
      { property: "og:title", content: "Entrar — RunQuest" },
      { property: "og:description", content: "Entra o crea tu cuenta de corredor en RunQuest." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/home", replace: true });
    });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s) navigate({ to: "/home", replace: true });
    });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "up") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/auth", data: { display_name: name } },
        });
        if (error) throw error;
        setSent(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (r.error) toast.error(errMsg(r.error));
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background bg-grid px-5">
      <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 card-glow">
        <h1 className="font-display text-5xl leading-none text-primary text-glow">RunQuest</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "in" ? "Entra y sigue tu aventura" : "Crea tu corredor"}
        </p>
        {sent ? (
          <p className="mt-6 rounded-xl bg-secondary p-4 text-sm text-foreground">
            Te hemos enviado un email a <b>{email}</b>. Ábrelo y confirma tu cuenta para empezar.
          </p>
        ) : (
          <>
            <form onSubmit={submit} className="mt-6 flex flex-col gap-3">
              {mode === "up" && (
                <Input placeholder="Tu nombre" value={name} onChange={(e) => setName(e.target.value)} required />
              )}
              <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <Input
                type="password"
                placeholder="Contraseña"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Button type="submit" disabled={loading} className="font-display text-lg tracking-wide">
                {mode === "in" ? "Entrar" : "Crear cuenta"}
              </Button>
            </form>
            <div className="my-4 text-center text-xs text-muted-foreground">o</div>
            <Button variant="secondary" className="w-full" onClick={google}>
              Continuar con Google
            </Button>
            <button
              className="mt-4 w-full text-center text-sm text-muted-foreground"
              onClick={() => setMode(mode === "in" ? "up" : "in")}
            >
              {mode === "in" ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Entra"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
