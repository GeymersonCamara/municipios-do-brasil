import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertPhotoFile } from "@/lib/photos";

type RouteContext = {
  params: Promise<{ ibgeCode: string }>;
};

async function getOwnedVisit(userId: string, ibgeCode: string) {
  return prisma.visitedMunicipality.findUnique({
    where: {
      userId_municipalityIbgeCode: {
        userId,
        municipalityIbgeCode: ibgeCode,
      },
    },
  });
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { ibgeCode } = await context.params;
  const visit = await getOwnedVisit(session.user.id, ibgeCode);

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

export async function POST(request: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { ibgeCode } = await context.params;
  const visit = await getOwnedVisit(session.user.id, ibgeCode);

  if (!visit) {
    return NextResponse.json(
      { error: "Marque o município como visitado antes de adicionar foto." },
      { status: 400 },
    );
  }

  const form = await request.formData();
  const file = form.get("photo");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Arquivo obrigatório" }, { status: 400 });
  }

  try {
    assertPhotoFile(file);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Arquivo inválido" },
      { status: 400 },
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  await prisma.visitedMunicipality.update({
    where: { id: visit.id },
    data: {
      photoData: bytes,
      photoMimeType: file.type,
    },
  });

  return NextResponse.json({
    ok: true,
    ibgeCode,
    hasPhoto: true,
    photoUrl: `/api/visited/${ibgeCode}/photo?t=${Date.now()}`,
  });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { ibgeCode } = await context.params;
  const visit = await getOwnedVisit(session.user.id, ibgeCode);

  if (!visit) {
    return NextResponse.json({ error: "Visita não encontrada" }, { status: 404 });
  }

  await prisma.visitedMunicipality.update({
    where: { id: visit.id },
    data: { photoData: null, photoMimeType: null },
  });

  return NextResponse.json({ ok: true, ibgeCode, hasPhoto: false });
}
