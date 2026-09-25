import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPrimeAccess } from "@/lib/access";
import {
  getAppBaseUrl,
  getStripe,
  getStripePriceId,
  isStripeConfigured,
} from "@/lib/stripe";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  if (!isStripeConfigured()) {
    return NextResponse.json(
      {
        error:
          "Stripe ainda não está configurado. Defina as variáveis de ambiente.",
      },
      { status: 503 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      stripeCustomerId: true,
      primeStatus: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }

  if (hasPrimeAccess(user.email, user.primeStatus)) {
    return NextResponse.json(
      { error: "Você já possui acesso Prime." },
      { status: 400 },
    );
  }

  const stripe = getStripe();
  const priceId = getStripePriceId();
  const baseUrl = getAppBaseUrl();

  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: session.user.name ?? undefined,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: user.id,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/prime?success=1`,
    cancel_url: `${baseUrl}/prime?canceled=1`,
    metadata: { userId: user.id },
    subscription_data: {
      metadata: { userId: user.id },
    },
    allow_promotion_codes: true,
  });

  if (!checkout.url) {
    return NextResponse.json(
      { error: "Não foi possível criar a sessão de pagamento" },
      { status: 500 },
    );
  }

  return NextResponse.json({ url: checkout.url });
}
