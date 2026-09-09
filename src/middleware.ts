import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const protectedPaths = ["/dashboard", "/perfil"];
const authPaths = ["/login", "/cadastro"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = protectedPaths.some((path) =>
    pathname.startsWith(path),
  );
  const isAuthPage = authPaths.some((path) => pathname.startsWith(path));

  // Na Vercel (HTTPS) o Auth.js v5 grava `__Secure-authjs.session-token`.
  // Sem secureCookie=true o getToken procura o cookie errado e parece "deslogado".
  const secureCookie =
    request.nextUrl.protocol === "https:" || Boolean(process.env.VERCEL);

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie,
  });

  if (isProtected && !token) {
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthPage && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/perfil/:path*", "/login", "/cadastro"],
};
