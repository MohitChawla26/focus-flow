import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "@/types/database";

export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookies, headers) {
        cookies.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookies.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        Object.entries(headers).forEach(([name, value]) =>
          response.headers.set(name, value),
        );
      },
    },
  });
  const { data } = await supabase.auth.getClaims();
  const isPublicAuthRoute =
    /^\/(login|signup|forgot-password|reset-password|auth(?:\/|$))/.test(
      request.nextUrl.pathname,
    );
  const isPublicProductRoute = /^\/(?:$|admin(?:\/|$))/.test(
    request.nextUrl.pathname,
  );
  const isGuestOnlyRoute = /^\/(login|signup|forgot-password)(?:\/|$)/.test(
    request.nextUrl.pathname,
  );

  if (!data?.claims && !isPublicAuthRoute && !isPublicProductRoute) {
    const next = request.nextUrl.clone();
    next.pathname = "/login";
    return NextResponse.redirect(next);
  }
  if (data?.claims && isGuestOnlyRoute) {
    const next = request.nextUrl.clone();
    next.pathname = "/dashboard";
    return NextResponse.redirect(next);
  }
  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
