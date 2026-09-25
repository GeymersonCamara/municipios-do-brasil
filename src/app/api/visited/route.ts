import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { IBGE_ID_TO_STATE, STATE_NAMES, STATE_TO_REGION } from "@/lib/regions";

export type VisitedItem = {
  ibgeCode: string;
  visitedAt: string;
  hasPhoto: boolean;
};

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const visited = await prisma.visitedMunicipality.findMany({
    where: { userId: session.user.id },
    select: {
      municipalityIbgeCode: true,
      visitedAt: true,
      photoMimeType: true,
    },
  });

  const items: VisitedItem[] = visited.map((v) => ({
    ibgeCode: v.municipalityIbgeCode,
    visitedAt: v.visitedAt.toISOString(),
    hasPhoto: Boolean(v.photoMimeType),
  }));

  return NextResponse.json({
    items,
    codes: items.map((item) => item.ibgeCode),
  });
}

const toggleSchema = z.object({
  ibgeCode: z.string().min(6).max(7),
  name: z.string().min(1).optional(),
  stateCode: z.string().length(2).optional(),
  stateName: z.string().min(1).optional(),
});

async function ensureMunicipality(input: z.infer<typeof toggleSchema>) {
  const existing = await prisma.municipality.findUnique({
    where: { ibgeCode: input.ibgeCode },
  });
  if (existing) return existing;

  const stateId = input.ibgeCode.slice(0, 2);
  const stateCode =
    input.stateCode?.toUpperCase() ?? IBGE_ID_TO_STATE[stateId];

  if (!stateCode || !input.name) {
    return null;
  }

  const stateName = input.stateName ?? STATE_NAMES[stateCode] ?? stateCode;
  const regionName = STATE_TO_REGION[stateCode] ?? "Desconhecida";

  return prisma.municipality.create({
    data: {
      ibgeCode: input.ibgeCode,
      name: input.name,
      stateCode,
      stateName,
      regionName,
    },
  });
}

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

  const municipality = await ensureMunicipality(parsed.data);

  if (!municipality) {
    return NextResponse.json(
      {
        error:
          "Município não encontrado. Informe o nome ao marcar ou rode o seed do IBGE.",
      },
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
    return NextResponse.json({
      visited: false,
      ibgeCode: parsed.data.ibgeCode,
      hasPhoto: false,
    });
  }

  await prisma.visitedMunicipality.create({
    data: {
      userId: session.user.id,
      municipalityIbgeCode: parsed.data.ibgeCode,
    },
  });

  return NextResponse.json({
    visited: true,
    ibgeCode: parsed.data.ibgeCode,
    hasPhoto: false,
  });
}
