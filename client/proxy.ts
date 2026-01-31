import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { defaultLocale, locales } from "./i18n";

const findLocaleInPath = (pathname: string) =>
  locales.find(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  );

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const localeInPath = findLocaleInPath(pathname);

  if (localeInPath) {
    const strippedPathname = pathname.replace(`/${localeInPath}`, "") || "/";
    const redirectUrl = new URL(strippedPathname, request.url);
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.set("NEXT_LOCALE", localeInPath);
    return response;
  }

  const response = NextResponse.next();
  if (!request.cookies.get("NEXT_LOCALE")) {
    response.cookies.set("NEXT_LOCALE", defaultLocale);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico).*)"],
};
