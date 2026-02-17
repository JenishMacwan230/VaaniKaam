import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n';

export default createMiddleware({
  locales,
  defaultLocale
});

export const config = {
  matcher: ['/', '/(en|hi|gu)/:path*', '/((?!_next|_vercel|.*\\..*).*)']
};
