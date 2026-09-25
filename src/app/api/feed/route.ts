import { NextRequest, NextResponse } from "next/server";
import { getPrimeAccessForUserId } from "@/lib/access";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const canSeePhotos = await getPrimeAccessForUserId(session.user.id);

  const limitParam = Number(
    request.nextUrl.searchParams.get("limit") ?? DEFAULT_LIMIT,
  );
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, Number.isFinite(limitParam) ? limitParam : DEFAULT_LIMIT),
  );
  const cursor = request.nextUrl.searchParams.get("cursor");

  const visits = await prisma.visitedMunicipality.findMany({
    take: limit + 1,
    ...(cursor
      ? {
          cursor: { id: cursor },
          skip: 1,
        }
      : {}),
    orderBy: [{ visitedAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      visitedAt: true,
      photoMimeType: true,
      user: {
        select: { id: true, name: true },
      },
      municipality: {
        select: {
          ibgeCode: true,
          name: true,
          stateCode: true,
          stateName: true,
        },
      },
    },
  });

  const hasMore = visits.length > limit;
  const page = hasMore ? visits.slice(0, limit) : visits;

  return NextResponse.json({
    canSeePhotos,
    items: page.map((visit) => {
      const hasPhoto = Boolean(visit.photoMimeType);
      return {
        id: visit.id,
        createdAt: visit.visitedAt.toISOString(),
        user: visit.user,
        municipality: visit.municipality,
        hasPhoto,
        photoUrl: hasPhoto ? `/api/feed/${visit.id}/photo` : null,
        isYou: visit.user.id === session.user.id,
      };
    }),
    nextCursor: hasMore ? page[page.length - 1]?.id ?? null : null,
  });
}
