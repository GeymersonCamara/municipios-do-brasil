"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Camera,
  Check,
  Crown,
  Images,
  MapPinned,
  Sparkles,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { PRIME_BENEFITS } from "@/lib/prime";

const icons = [Camera, Images, Trophy, Sparkles, MapPinned] as const;

export function PrimePageView() {
  const { data: session, update } = useSession();
  const searchParams = useSearchParams();
  const isPrime = Boolean(session?.user?.isPrime);
  const [busy, setBusy] = useState<"checkout" | "portal" | null>(null);

  useEffect(() => {
    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");
    if (success === "1") {
      toast.success("Pagamento iniciado. Seu Prime será liberado em instantes.");
      void update();
    }
    if (canceled === "1") {
      toast.message("Checkout cancelado. Você pode tentar de novo quando quiser.");
    }
  }, [searchParams, update]);

  async function startCheckout() {
    setBusy("checkout");
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "Não foi possível iniciar o pagamento");
      }
      if (!data.url) throw new Error("URL de checkout ausente");
      window.location.assign(data.url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro no checkout");
      setBusy(null);
    }
  }

  async function openPortal() {
    setBusy("portal");
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "Não foi possível abrir o portal");
      }
      if (!data.url) throw new Error("URL do portal ausente");
      window.location.assign(data.url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro no portal");
      setBusy(null);
    }
  }

  return (
    <>
      <AppHeader />
      <main className="flex-1 bg-page">
        <div className="mx-auto max-w-3xl px-3 py-6 sm:px-4 sm:py-12">
          <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-10">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-visited/15 text-visited">
                <Crown className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-visited">
                  Visitados Prime
                </p>
                <h1
                  className="text-2xl font-semibold tracking-tight sm:text-3xl"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Viaje com mais recursos
                </h1>
              </div>
            </div>

            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              O Prime libera as ferramentas exclusivas do Visitados: fotos
              nítidas no feed, álbum completo, ranking Top 5 e os próximos
              recursos pagos.
            </p>

            {isPrime ? (
              <div className="mt-6 rounded-xl border border-visited/30 bg-visited/10 px-4 py-3 text-sm">
                <p className="font-medium text-foreground">
                  Sua conta tem acesso Prime.
                </p>
                <p className="mt-1 text-muted-foreground">
                  Álbum, fotos do feed, ranking e demais exclusivos já estão
                  liberados.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button asChild variant="outline">
                    <Link href="/">Voltar ao feed</Link>
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={busy === "portal"}
                    onClick={() => void openPortal()}
                  >
                    {busy === "portal" ? "Abrindo…" : "Gerenciar assinatura"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Button
                    type="button"
                    className="w-full bg-visited text-white hover:bg-visited-hover sm:w-auto"
                    disabled={busy === "checkout"}
                    onClick={() => void startCheckout()}
                  >
                    <Crown className="h-4 w-4" aria-hidden />
                    {busy === "checkout" ? "Redirecionando…" : "Assinar Prime"}
                  </Button>
                  <Button asChild variant="outline" className="w-full sm:w-auto">
                    <Link href="/">Continuar no plano gratuito</Link>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  O pagamento é processado com segurança pelo Stripe. Após
                  confirmar, o acesso Prime é liberado automaticamente.
                </p>
              </div>
            )}

            <section className="mt-10">
              <h2 className="text-lg font-semibold">O que o Prime inclui</h2>
              <ul className="mt-4 space-y-3">
                {PRIME_BENEFITS.map((benefit, index) => {
                  const Icon = icons[index] ?? Check;
                  return (
                    <li
                      key={benefit.title}
                      className="flex gap-3 rounded-xl border bg-background/60 p-4"
                    >
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-visited">
                        <Icon className="h-4 w-4" aria-hidden />
                      </span>
                      <div>
                        <p className="font-medium">{benefit.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {benefit.description}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className="mt-10 rounded-xl border border-dashed bg-muted/40 p-5">
              <h2 className="font-semibold">Como funciona a assinatura</h2>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
                <li>Clique em Assinar Prime e conclua o pagamento no Stripe.</li>
                <li>
                  O webhook libera o Prime na sua conta assim que a assinatura
                  fica ativa.
                </li>
                <li>
                  Você pode cancelar ou atualizar o cartão em Gerenciar
                  assinatura.
                </li>
              </ol>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
