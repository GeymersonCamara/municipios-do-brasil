import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const visited = await prisma.visitedMunicipality.findMany({
    where: { userId: session.user.id },
    select: { municipalityIbgeCode: true, visitedAt: true },
  });

  return NextResponse.json({
    codes: visited.map((v) => v.municipalityIbgeCode),
  });
}

const toggleSchema = z.object({
  ibgeCode: z.string().min(6).max(7),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = toggleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Código IBGE inválido" }, { status: 400 });
  }

  const municipality = await prisma.municipality.findUnique({
    where: { ibgeCode: parsed.data.ibgeCode },
  });

  if (!municipality) {
    return NextResponse.json(
      { error: "Município não encontrado. Rode o seed do IBGE." },
      { status: 404 },
    );
  }

  const existing = await prisma.visitedMunicipality.findUnique({
    where: {
      userId_municipalityIbgeCode: {
        userId: session.user.id,
        municipalityIbgeCode: parsed.data.ibgeCode,
      },
    },
  });

  if (existing) {
    await prisma.visitedMunicipality.delete({ where: { id: existing.id } });
    return NextResponse.json({ visited: false, ibgeCode: parsed.data.ibgeCode });
  }

  await prisma.visitedMunicipality.create({
    data: {
      userId: session.user.id,
      municipalityIbgeCode: parsed.data.ibgeCode,
    },
  });

  return NextResponse.json({ visited: true, ibgeCode: parsed.data.ibgeCode });
}
