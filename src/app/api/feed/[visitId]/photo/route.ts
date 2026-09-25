import { NextRequest, NextResponse } from "next/server";
import { hasPrimeAccess } from "@/lib/access";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ visitId: string }>;
};

/**
 * Fotos do feed: autenticados recebem a imagem (teaser).
 * Quem nao tem Prime ve a UI com blur; admins/Prime veem nitido.
 * Header X-Prime-Access indica se o viewer tem liberacao.
 */
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
  const prime = hasPrimeAccess(session.user.email);

  return new NextResponse(bytes, {
    headers: {
      "Content-Type": visit.photoMimeType,
      "Cache-Control": "private, max-age=3600",
      "Content-Length": String(bytes.length),
      "X-Prime-Access": prime ? "1" : "0",
    },
  });
}
