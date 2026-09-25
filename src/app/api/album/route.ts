import { NextResponse } from "next/server";
import { hasPrimeAccess } from "@/lib/access";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  if (!hasPrimeAccess(session.user.email)) {
    return NextResponse.json(
      {
        error: "Recurso Prime",
        code: "PRIME_REQUIRED",
        message:
          "O álbum de fotos é um recurso Prime e será liberado posteriormente.",
      },
      { status: 403 },
    );
  }

  const visits = await prisma.visitedMunicipality.findMany({
    where: {
      userId: session.user.id,
      photoMimeType: { not: null },
    },
    orderBy: { visitedAt: "desc" },
    select: {
      municipalityIbgeCode: true,
      visitedAt: true,
      municipality: {
        select: {
          name: true,
          stateName: true,
          stateCode: true,
        },
      },
    },
  });

  return NextResponse.json({
    items: visits.map((v) => ({
      ibgeCode: v.municipalityIbgeCode,
      name: v.municipality.name,
      stateName: v.municipality.stateName,
      stateCode: v.municipality.stateCode,
      visitedAt: v.visitedAt.toISOString(),
    })),
  });
}
