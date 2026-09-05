import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { STATE_NAMES } from "@/lib/regions";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const level = request.nextUrl.searchParams.get("level") ?? "brazil";
  const region = request.nextUrl.searchParams.get("region") ?? undefined;
  const stateCode = request.nextUrl.searchParams.get("stateCode") ?? undefined;

  const scopeFilter =
    level === "region" && region
      ? { regionName: region }
      : level === "state" && stateCode
        ? { stateCode }
        : {};

  const [total, visited] = await Promise.all([
    prisma.municipality.count({ where: scopeFilter }),
    prisma.visitedMunicipality.count({
      where: {
        userId: session.user.id,
        municipality: scopeFilter,
      },
    }),
  ]);

  const percent = total === 0 ? 0 : (visited / total) * 100;

  let scopeLabel = "Brasil";
  if (level === "region" && region) scopeLabel = region;
  if (level === "state" && stateCode) {
    scopeLabel = STATE_NAMES[stateCode] ?? stateCode;
  }

  return NextResponse.json({
    total,
    visited,
    percent,
    scopeLabel,
  });
}
