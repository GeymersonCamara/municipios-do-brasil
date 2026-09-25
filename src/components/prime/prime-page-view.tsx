"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Camera,
  Check,
  Crown,
  Images,
  MapPinned,
  Sparkles,
  Trophy,
} from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { hasPrimeAccess } from "@/lib/access";
import { PRIME_BENEFITS } from "@/lib/prime";

const icons = [Camera, Images, Trophy, Sparkles, MapPinned] as const;

export function PrimePageView() {
  const { data: session } = useSession();
  const isPrime = hasPrimeAccess(session?.user?.email);

  return (
    <>
      <AppHeader />
      <main className="flex-1 bg-page">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
          <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-10">
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
              nítidas no feed, álbum completo e os próximos recursos pagos que
              forem chegando. Hoje a assinatura ainda está em preparação —
              confira o que você terá ao assinar.
            </p>

            {isPrime ? (
              <div className="mt-6 rounded-xl border border-visited/30 bg-visited/10 px-4 py-3 text-sm">
                <p className="font-medium text-foreground">
                  Sua conta já tem acesso Prime (admin).
                </p>
                <p className="mt-1 text-muted-foreground">
                  Você já pode usar álbum, fotos do feed e demais recursos
                  exclusivos.
                </p>
                <Button asChild variant="outline" className="mt-3">
                  <Link href="/">Voltar ao feed</Link>
                </Button>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    className="bg-visited text-white hover:bg-visited-hover"
                    disabled
                  >
                    <Crown className="h-4 w-4" aria-hidden />
                    Assinatura em breve
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/">Continuar no plano gratuito</Link>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  A cobrança do Prime ainda não está ativa. Quando liberarmos,
                  você assina por aqui e os recursos são desbloqueados na hora.
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
              <h2 className="font-semibold">Como vai funcionar a assinatura</h2>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
                <li>
                  Você escolhe o plano Prime nesta página quando a cobrança
                  estiver disponível.
                </li>
                <li>
                  Após confirmar, os recursos exclusivos são liberados na sua
                  conta automaticamente.
                </li>
                <li>
                  Enquanto isso, o plano gratuito continua com mapa, visitas,
                  ranking e feed (fotos com blur).
                </li>
              </ol>
              {!isPrime ? (
                <p className="mt-5 text-sm font-medium text-foreground">
                  Use o botão <span className="text-visited">Tornar-se Prime</span>{" "}
                  nas ferramentas bloqueadas para voltar a esta página quando
                  quiser revisar os benefícios.
                </p>
              ) : null}
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
