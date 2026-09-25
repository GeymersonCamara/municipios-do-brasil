/** E-mails com acesso admin a recursos Prime / privados. */
export const ADMIN_EMAILS = [
  "geymerson.camara2015@gmail.com",
  "raylla.cs@ufrn.edu.br",
] as const;

export function normalizeEmail(email?: string | null) {
  return email?.trim().toLowerCase() ?? "";
}

export function isAdminEmail(email?: string | null) {
  const normalized = normalizeEmail(email);
  return (ADMIN_EMAILS as readonly string[]).includes(normalized);
}

/**
 * Visitados Prime (pago) e recursos privados.
 * Hoje so admins tem acesso; assinantes Prime entram aqui depois.
 */
export function hasPrimeAccess(email?: string | null) {
  return isAdminEmail(email);
}

/** @deprecated Use hasPrimeAccess */
export function hasPlusAccess(email?: string | null) {
  return hasPrimeAccess(email);
}
