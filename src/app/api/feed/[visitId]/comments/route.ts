import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ visitId: string }>;
};

const createSchema = z.object({
  body: z.string().trim().min(1).max(500),
  parentId: z.string().min(1).optional(),
});

function serializeAuthor(user: { id: string; name: string }, viewerId: string) {
  return {
    id: user.id,
    name: user.name,
    isYou: user.id === viewerId,
  };
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { visitId } = await context.params;
  const visit = await prisma.visitedMunicipality.findUnique({
    where: { id: visitId },
    select: { id: true },
  });
  if (!visit) {
    return NextResponse.json({ error: "Publicação não encontrada" }, { status: 404 });
  }

  const comments = await prisma.visitComment.findMany({
    where: { visitId, parentId: null },
    orderBy: { createdAt: "asc" },
    include: {
      user: { select: { id: true, name: true } },
      replies: {
        orderBy: { createdAt: "asc" },
        include: { user: { select: { id: true, name: true } } },
      },
    },
  });

  return NextResponse.json({
    comments: comments.map((comment) => ({
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt.toISOString(),
      user: serializeAuthor(comment.user, session.user.id),
      replies: comment.replies.map((reply) => ({
        id: reply.id,
        body: reply.body,
        createdAt: reply.createdAt.toISOString(),
        user: serializeAuthor(reply.user, session.user.id),
      })),
    })),
  });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { visitId } = await context.params;
  const visit = await prisma.visitedMunicipality.findUnique({
    where: { id: visitId },
    select: { id: true },
  });
  if (!visit) {
    return NextResponse.json({ error: "Publicação não encontrada" }, { status: 404 });
  }

  const json = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Escreva um comentário de até 500 caracteres." },
      { status: 400 },
    );
  }

  let parentId: string | null = null;
  if (parsed.data.parentId) {
    const parent = await prisma.visitComment.findFirst({
      where: { id: parsed.data.parentId, visitId },
      select: { id: true, parentId: true },
    });
    if (!parent) {
      return NextResponse.json(
        { error: "Comentário para resposta não encontrado." },
        { status: 400 },
      );
    }
    parentId = parent.parentId ?? parent.id;
  }

  const created = await prisma.visitComment.create({
    data: {
      visitId,
      userId: session.user.id,
      parentId,
      body: parsed.data.body,
    },
    include: { user: { select: { id: true, name: true } } },
  });

  return NextResponse.json({
    id: created.id,
    body: created.body,
    createdAt: created.createdAt.toISOString(),
    parentId: created.parentId,
    user: serializeAuthor(created.user, session.user.id),
  });
}
