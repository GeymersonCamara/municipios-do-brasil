import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  ALLOWED_PHOTO_TYPES,
  MAX_PHOTO_BYTES,
  deletePhotoFile,
  photoAbsolutePath,
  saveVisitedPhoto,
} from "@/lib/photos";

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
    include: {
      municipality: {
        select: { name: true, stateName: true, stateCode: true },
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

  if (!visit?.photoPath || !visit.photoMimeType) {
    return NextResponse.json({ error: "Foto não encontrada" }, { status: 404 });
  }

  const absolutePath = photoAbsolutePath(visit.photoPath);

  try {
    await stat(absolutePath);
  } catch {
    return NextResponse.json({ error: "Arquivo ausente" }, { status: 404 });
  }

  const stream = createReadStream(absolutePath);
  const webStream = Readable.toWeb(stream) as ReadableStream;

  return new NextResponse(webStream, {
    headers: {
      "Content-Type": visit.photoMimeType,
      "Cache-Control": "private, max-age=3600",
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

  if (!ALLOWED_PHOTO_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Use JPEG, PNG ou WebP." },
      { status: 400 },
    );
  }

  if (file.size > MAX_PHOTO_BYTES) {
    return NextResponse.json(
      { error: "A foto deve ter no máximo 5 MB." },
      { status: 400 },
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const relativePath = await saveVisitedPhoto({
    userId: session.user.id,
    ibgeCode,
    bytes,
    mimeType: file.type,
    previousPath: visit.photoPath,
  });

  await prisma.visitedMunicipality.update({
    where: { id: visit.id },
    data: {
      photoPath: relativePath,
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

  await deletePhotoFile(visit.photoPath);
  await prisma.visitedMunicipality.update({
    where: { id: visit.id },
    data: { photoPath: null, photoMimeType: null },
  });

  return NextResponse.json({ ok: true, ibgeCode, hasPhoto: false });
}
