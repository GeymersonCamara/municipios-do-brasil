import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY não configurada");
  }
  if (!stripeClient) {
    stripeClient = new Stripe(key, {
      apiVersion: "2026-08-26.dahlia",
      typescript: true,
    });
  }
  return stripeClient;
}

export function getStripePriceId() {
  const priceId = process.env.STRIPE_PRICE_ID?.trim();
  if (!priceId) {
    throw new Error("STRIPE_PRICE_ID não configurada");
  }
  return priceId;
}

export function getAppBaseUrl() {
  const fromEnv =
    process.env.AUTH_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();

  if (fromEnv) {
    return fromEnv.startsWith("http") ? fromEnv.replace(/\/$/, "") : `https://${fromEnv}`;
  }
  return "http://localhost:3000";
}

export function getStripePublishableKey() {
  return (
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ||
    process.env.STRIPE_PUBLISHABLE_KEY?.trim() ||
    ""
  );
}

export function isStripeConfigured() {
  return Boolean(
    process.env.STRIPE_SECRET_KEY?.trim() &&
      process.env.STRIPE_PRICE_ID?.trim() &&
      getStripePublishableKey(),
  );
}
