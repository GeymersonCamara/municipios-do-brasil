import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";

function periodEndFromSubscription(subscription: Stripe.Subscription) {
  const fromItem = subscription.items?.data?.[0]?.current_period_end;
  const fromSub = (
    subscription as Stripe.Subscription & { current_period_end?: number }
  ).current_period_end;
  const end = fromItem ?? fromSub;
  if (!end) return null;
  return new Date(end * 1000);
}

export async function syncPrimeSubscription(params: {
  userId?: string | null;
  customerId?: string | null;
  subscription: Stripe.Subscription;
}) {
  const { subscription } = params;
  let userId: string | null =
    params.userId ?? subscription.metadata?.userId ?? null;

  if (!userId && params.customerId) {
    const byCustomer = await prisma.user.findFirst({
      where: { stripeCustomerId: params.customerId },
      select: { id: true },
    });
    userId = byCustomer?.id ?? null;
  }

  if (!userId && typeof subscription.customer === "string") {
    const byCustomer = await prisma.user.findFirst({
      where: { stripeCustomerId: subscription.customer },
      select: { id: true },
    });
    userId = byCustomer?.id ?? null;
  }

  if (!userId) {
    console.error("Stripe sync: userId não encontrado", subscription.id);
    return;
  }

  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id;

  await prisma.user.update({
    where: { id: userId },
    data: {
      stripeCustomerId: customerId ?? undefined,
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0]?.price.id,
      primeStatus: subscription.status,
      primeCurrentPeriodEnd: periodEndFromSubscription(subscription),
    },
  });
}

export async function clearPrimeSubscription(subscriptionId: string) {
  const user = await prisma.user.findFirst({
    where: { stripeSubscriptionId: subscriptionId },
    select: { id: true },
  });
  if (!user) return;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      stripeSubscriptionId: null,
      stripePriceId: null,
      primeStatus: "canceled",
      primeCurrentPeriodEnd: null,
    },
  });
}
