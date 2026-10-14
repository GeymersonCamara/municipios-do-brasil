import { NextResponse } from "next/server";
import { appendExpiredSessionCookies } from "@/lib/clear-auth-cookies";

function sameOrigin(request: Request) {
  const site = request.headers.get("sec-fetch-site");
  if (site) return site === "same-origin" || site === "none";
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return false;
  return new URL(origin).host === host;
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "Origem inválida" }, { status: 403 });
  }

  const response = NextResponse.redirect(new URL("/login", request.url), 303);
  appendExpiredSessionCookies(response);
  return response;
}
