import {createNavigation} from 'next-intl/navigation';
import {routing} from '@/i18n/routing';

// Locale-aware navigation APIs. Internal links routed through these get the
// correct locale prefix automatically; usePathname returns the path WITHOUT the
// locale prefix, so existing "/" and "/locale" comparisons stay valid.
export const {Link, redirect, usePathname, useRouter, getPathname} =
  createNavigation(routing);
