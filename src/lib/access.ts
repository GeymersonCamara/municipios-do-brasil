import { prisma } from "@/lib/prisma";

/** E-mails com acesso admin a recursos Prime / privados. */
export const ADMIN_EMAILS = [
  "geymerson.camara2015@gmail.com",
  "raylla.cs@ufrn.edu.br",
] as const;

const ACTIVE_PRIME_STATUSES = new Set(["active", "trialing"]);

export function normalizeEmail(email?: string | null) {
  return email?.trim().toLowerCase() ?? "";
}

export function isAdminEmail(email?: string | null) {
  const normalized = normalizeEmail(email);
  return (ADMIN_EMAILS as readonly string[]).includes(normalized);
}

export function isActivePrimeStatus(status?: string | null) {
  if (!status) return false;
  return ACTIVE_PRIME_STATUSES.has(status);
}

/** Acesso Prime por e-mail admin ou status de assinatura. */
export function hasPrimeAccess(
  email?: string | null,
  primeStatus?: string | null,
) {
  return isAdminEmail(email) || isActivePrimeStatus(primeStatus);
}

export async function getPrimeAccessForUserId(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, primeStatus: true },
  });
  if (!user) return false;
  return hasPrimeAccess(user.email, user.primeStatus);
}

/** @deprecated Use hasPrimeAccess */
export function hasPlusAccess(
  email?: string | null,
  primeStatus?: string | null,
) {
  return hasPrimeAccess(email, primeStatus);
}
