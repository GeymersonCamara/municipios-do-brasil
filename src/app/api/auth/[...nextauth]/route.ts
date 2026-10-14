import { NextRequest, NextResponse } from "next/server";
import { handlers } from "@/lib/auth";
import {
  appendExpiredSessionCookies,
  freshSessionCookieNames,
} from "@/lib/clear-auth-cookies";

function shouldClearStaleCookies(pathname: string, method: string) {
  if (pathname.endsWith("/signout")) return true;
  return method === "POST" && pathname.includes("/callback/");
}

async function withStaleCookieCleanup(request: NextRequest, response: Response) {
  if (!shouldClearStaleCookies(request.nextUrl.pathname, request.method)) {
    return response;
  }

  const next = new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
  const keep = request.nextUrl.pathname.endsWith("/signout")
    ? new Set<string>()
    : freshSessionCookieNames(response);
  appendExpiredSessionCookies(next, keep);
  return next;
}

export async function GET(request: NextRequest) {
  return withStaleCookieCleanup(request, await handlers.GET(request));
}

export async function POST(request: NextRequest) {
  return withStaleCookieCleanup(request, await handlers.POST(request));
}
