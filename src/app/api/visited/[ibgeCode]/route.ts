import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ ibgeCode: string }>;
};

const descriptionSchema = z.object({
  description: z.string().max(2000),
});

export async function PATCH(request: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { ibgeCode } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = descriptionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "A descrição pode ter no máximo 2000 caracteres." },
      { status: 400 },
    );
  }

  const visit = await prisma.visitedMunicipality.findUnique({
    where: {
      userId_municipalityIbgeCode: {
        userId: session.user.id,
        municipalityIbgeCode: ibgeCode,
      },
    },
    select: { id: true },
  });

  if (!visit) {
    return NextResponse.json(
      { error: "Marque o município como visitado antes de descrever a viagem." },
      { status: 400 },
    );
  }

  const description = parsed.data.description.trim();

  await prisma.visitedMunicipality.update({
    where: { id: visit.id },
    data: { description: description.length > 0 ? description : null },
  });

  return NextResponse.json({
    ok: true,
    ibgeCode,
    description: description.length > 0 ? description : null,
  });
}
