import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LandRadarLogo } from "@/components/LandRadarLogo";

export const Route = createFileRoute("/login")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/" });
  },
  head: () => ({
    meta: [
      { title: "Entrar — LandRadar | OTC Intelligence Terminal" },
      { name: "description", content: "Acesse o terminal LandRadar." },
      { property: "og:title", content: "Entrar — LandRadar" },
      { property: "og:description", content: "Acesse o terminal LandRadar." },
    ],
  }),
  component: LoginPage,
});

function translate(msg: string) {
  const m = msg.toLowerCase();
  if (m.includes("invalid login")) return "E-mail ou senha incorretos.";
  if (m.includes("email not confirmed")) return "E-mail ainda não confirmado. Verifique sua caixa de entrada.";
  if (m.includes("already registered")) return "Este e-mail já possui uma conta.";
  if (m.includes("password should be")) return "A senha deve ter pelo menos 6 caracteres.";
  if (m.includes("invalid") && m.includes("email")) return "E-mail inválido.";
  if (m.includes("rate limit")) return "Muitas tentativas. Aguarde alguns minutos.";
  if (m.includes("pwned") || m.includes("weak")) return "Senha fraca ou vazada. Escolha outra senha.";
  return msg;
}

function AuthForm({ mode }: { mode: "signin" | "signup" }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return setError(translate(error.message));
        navigate({ to: "/", replace: true });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) return setError(translate(error.message));
        if (data.session) navigate({ to: "/", replace: true });
        else setInfo("Conta criada. Confirme o e-mail para entrar.");
      }
    } catch {
      setError("Falha de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor={`${mode}-email`} className="text-xs text-muted-foreground">E-mail</Label>
        <Input id={`${mode}-email`} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-9" />
      </div>
      <div className="space-y-1">
        <Label htmlFor={`${mode}-pw`} className="text-xs text-muted-foreground">Senha</Label>
        <Input id={`${mode}-pw`} type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="h-9" />
      </div>
      {error && <p className="rounded border border-destructive/40 bg-destructive/10 px-2 py-1.5 text-xs text-destructive">{error}</p>}
      {info && <p className="rounded border border-primary/40 bg-primary/10 px-2 py-1.5 text-xs text-primary">{info}</p>}
      <Button type="submit" disabled={loading} className="h-9 w-full">
        {loading ? "Aguarde..." : mode === "signin" ? "Entrar" : "Criar conta"}
      </Button>
    </form>
  );
}

function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-md border border-border bg-card p-5">
        <div className="mb-4 flex justify-center">
          <LandRadarLogo />
        </div>
        <Tabs defaultValue="signin">
          <TabsList className="mb-3 grid w-full grid-cols-2">
            <TabsTrigger value="signin">Entrar</TabsTrigger>
            <TabsTrigger value="signup">Criar conta</TabsTrigger>
          </TabsList>
          <TabsContent value="signin"><AuthForm mode="signin" /></TabsContent>
          <TabsContent value="signup"><AuthForm mode="signup" /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
