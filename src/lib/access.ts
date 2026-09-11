/** E-mail com acesso admin a recursos Plus / privados. */
export const ADMIN_EMAIL = "geymerson.camara2015@gmail.com";

export function normalizeEmail(email?: string | null) {
  return email?.trim().toLowerCase() ?? "";
}

export function isAdminEmail(email?: string | null) {
  return normalizeEmail(email) === ADMIN_EMAIL;
}

/**
 * Recursos pagos (Plus) ou privados.
 * Hoje só o admin tem acesso; assinantes entram aqui depois.
 */
export function hasPlusAccess(email?: string | null) {
  return isAdminEmail(email);
}
