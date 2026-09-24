import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ visitId: string }>;
};

/** Qualquer usuário autenticado pode ver fotos que aparecem no feed. */
export async function GET(_request: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { visitId } = await context.params;
  const visit = await prisma.visitedMunicipality.findUnique({
    where: { id: visitId },
    select: {
      photoData: true,
      photoMimeType: true,
    },
  });

  if (!visit?.photoData || !visit.photoMimeType) {
    return NextResponse.json({ error: "Foto não encontrada" }, { status: 404 });
  }

  const bytes = Buffer.from(visit.photoData);

  return new NextResponse(bytes, {
    headers: {
      "Content-Type": visit.photoMimeType,
      "Cache-Control": "private, max-age=3600",
      "Content-Length": String(bytes.length),
    },
  });
}
