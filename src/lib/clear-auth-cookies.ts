const SESSION_COOKIE_BASES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
] as const;

/** Nomes atuais e fatias antigas (.0, .1…) que o Auth.js pode ter deixado. */
export function sessionCookieNames() {
  const names: string[] = [];
  for (const base of SESSION_COOKIE_BASES) {
    names.push(base);
    for (let index = 0; index < 5; index += 1) {
      names.push(`${base}.${index}`);
    }
  }
  return names;
}

function expireLine(name: string, secure: boolean) {
  const secureAttr = secure ? "; Secure" : "";
  return `${name}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax${secureAttr}`;
}

export function freshSessionCookieNames(response: Response) {
  const lines =
    typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : [];
  const names = new Set<string>();
  for (const line of lines) {
    const expired = /(?:^|;)\s*max-age=0(?:;|$)/i.test(line);
    if (expired) continue;
    const name = line.split("=", 1)[0]?.trim();
    if (name) names.add(name);
  }
  return names;
}

/** Apaga cookies de sessão que não são o cookie novo desta resposta. */
export function appendExpiredSessionCookies(
  response: Response,
  keep: Set<string> = new Set(),
) {
  for (const name of sessionCookieNames()) {
    if (keep.has(name)) continue;
    const prefixed = name.startsWith("__Secure-") || name.startsWith("__Host-");
    response.headers.append("Set-Cookie", expireLine(name, prefixed));
    if (!prefixed) {
      response.headers.append("Set-Cookie", expireLine(name, true));
    }
  }
}
