import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q")?.trim() ?? "";
  const stateCode = searchParams.get("stateCode") ?? undefined;
  const region = searchParams.get("region") ?? undefined;
  const limit = Math.min(Number(searchParams.get("limit") ?? 20), 50);

  if (q.length < 2 && !stateCode && !region) {
    return NextResponse.json({ municipalities: [] });
  }

  const municipalities = await prisma.municipality.findMany({
    where: {
      AND: [
        q.length >= 2 ? { name: { contains: q } } : {},
        stateCode ? { stateCode } : {},
        region ? { regionName: region } : {},
      ],
    },
    orderBy: [{ name: "asc" }],
    take: limit,
  });

  return NextResponse.json({ municipalities });
}
