import createMiddleware from 'next-intl/middleware';
import {routing} from '@/i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Match all pathnames except for API routes, Next.js internals, the /images
  // public assets, and files with an extension (e.g. favicon.ico, *.png).
  matcher: '/((?!api|_next|_vercel|images|.*\\..*).*)',
};
