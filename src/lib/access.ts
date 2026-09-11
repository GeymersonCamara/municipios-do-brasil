/** E-mails com acesso admin a recursos Plus / privados. */
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
 * Recursos pagos (Plus) ou privados.
 * Hoje so admins tem acesso; assinantes entram aqui depois.
 */
export function hasPlusAccess(email?: string | null) {
  return isAdminEmail(email);
}
