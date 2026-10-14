import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ visitId: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { visitId } = await context.params;
  const visit = await prisma.visitedMunicipality.findUnique({
    where: { id: visitId },
    select: { id: true, userId: true },
  });

  if (!visit) {
    return NextResponse.json({ error: "Publicação não encontrada" }, { status: 404 });
  }

  if (visit.userId !== session.user.id) {
    return NextResponse.json(
      { error: "Só quem fez a publicação pode apagá-la." },
      { status: 403 },
    );
  }

  await prisma.visitedMunicipality.delete({ where: { id: visit.id } });

  return NextResponse.json({ ok: true });
}
