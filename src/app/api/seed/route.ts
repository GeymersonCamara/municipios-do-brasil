import { NextRequest, NextResponse } from "next/server";
import { seedAllMunicipalities } from "@/lib/municipality-names";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Popula a tabela Municipality a partir da API do IBGE.
 * Protegido por SEED_SECRET (header x-seed-secret ou ?secret=).
 */
export async function POST(request: NextRequest) {
  const expected = process.env.SEED_SECRET?.trim();
  if (!expected) {
    return NextResponse.json(
      {
        error:
          "Configure SEED_SECRET na Vercel para liberar o seed em produção.",
      },
      { status: 503 },
    );
  }

  const provided =
    request.headers.get("x-seed-secret") ??
    request.nextUrl.searchParams.get("secret") ??
    "";

  if (provided !== expected) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const before = await prisma.municipality.count();
    const total = await seedAllMunicipalities();
    return NextResponse.json({
      ok: true,
      before,
      total,
      message: `Seed concluído com ${total} municípios.`,
    });
  } catch (error) {
    console.error("seed error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Falha ao executar seed",
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  const total = await prisma.municipality.count();
  return NextResponse.json({ total });
}
