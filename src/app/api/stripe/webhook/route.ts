import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import {
  clearPrimeSubscription,
  syncPrimeSubscription,
} from "@/lib/stripe-prime";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET não configurada" },
      { status: 503 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Assinatura ausente" }, { status: 400 });
  }

  const rawBody = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error("stripe webhook signature", error);
    return NextResponse.json({ error: "Assinatura inválida" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") break;
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;
        if (!subscriptionId) break;
        const subscription =
          await stripe.subscriptions.retrieve(subscriptionId);
        await syncPrimeSubscription({
          userId: session.metadata?.userId ?? session.client_reference_id,
          customerId:
            typeof session.customer === "string"
              ? session.customer
              : session.customer?.id,
          subscription,
        });
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await syncPrimeSubscription({
          userId: subscription.metadata?.userId,
          customerId:
            typeof subscription.customer === "string"
              ? subscription.customer
              : subscription.customer?.id,
          subscription,
        });
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await clearPrimeSubscription(subscription.id);
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.error("stripe webhook handler", error);
    return NextResponse.json({ error: "Falha ao processar evento" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
