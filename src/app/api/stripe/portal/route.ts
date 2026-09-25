import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAppBaseUrl, getStripe, isStripeConfigured } from "@/lib/stripe";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe ainda não está configurado." },
      { status: 503 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stripeCustomerId: true },
  });

  if (!user?.stripeCustomerId) {
    return NextResponse.json(
      { error: "Nenhuma assinatura encontrada para gerenciar." },
      { status: 400 },
    );
  }

  const stripe = getStripe();
  const portal = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${getAppBaseUrl()}/prime`,
  });

  return NextResponse.json({ url: portal.url });
}
