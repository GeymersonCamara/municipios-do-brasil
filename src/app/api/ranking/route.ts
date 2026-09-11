import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { STATE_IBGE_IDS, STATE_NAMES } from "@/lib/regions";

export type RankingEntry = {
  rank: number;
  userId: string;
  name: string;
  visited: number;
  percent: number;
  isYou: boolean;
};

export type RankingBoard = {
  scope: "brazil" | "state";
  label: string;
  totalMunicipalities: number;
  items: RankingEntry[];
};

async function buildBoard(
  scopeFilter: { stateCode?: string },
  label: string,
  scope: "brazil" | "state",
  currentUserId: string,
): Promise<RankingBoard> {
  const totalMunicipalities = await prisma.municipality.count({
    where: scopeFilter,
  });

  const grouped = await prisma.visitedMunicipality.groupBy({
    by: ["userId"],
    where:
      Object.keys(scopeFilter).length > 0
        ? { municipality: scopeFilter }
        : undefined,
    _count: { municipalityIbgeCode: true },
    orderBy: { _count: { municipalityIbgeCode: "desc" } },
    take: 5,
  });

  const userIds = grouped.map((g) => g.userId);
  const users = userIds.length
    ? await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true },
      })
    : [];
  const nameById = new Map(users.map((u) => [u.id, u.name]));

  const items: RankingEntry[] = grouped.map((g, index) => {
    const visited = g._count.municipalityIbgeCode;
    return {
      rank: index + 1,
      userId: g.userId,
      name: nameById.get(g.userId) ?? "Viajante",
      visited,
      percent:
        totalMunicipalities === 0
          ? 0
          : Math.round((visited / totalMunicipalities) * 1000) / 10,
      isYou: g.userId === currentUserId,
    };
  });

  return {
    scope,
    label,
    totalMunicipalities,
    items,
  };
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const stateCodeParam = request.nextUrl.searchParams.get("stateCode");
  const stateCode = stateCodeParam?.trim().toUpperCase() ?? "";

  if (stateCode && !STATE_IBGE_IDS[stateCode]) {
    return NextResponse.json({ error: "UF inválida" }, { status: 400 });
  }

  const brazil = await buildBoard({}, "Brasil", "brazil", session.user.id);

  const state = stateCode
    ? await buildBoard(
        { stateCode },
        STATE_NAMES[stateCode] ?? stateCode,
        "state",
        session.user.id,
      )
    : null;

  return NextResponse.json({ brazil, state });
}
