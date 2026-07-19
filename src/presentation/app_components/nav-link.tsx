'use client';

import {Link, usePathname} from '@/i18n/navigation';
import React from "react";

const NavLink = ({
                   href,
                   children,
                   activeClassName = 'text-stone-400',
                   className,
                   exact = false,
                   ...props
                 }: Readonly<{
  href: string,
  children?: React.ReactNode;
  activeClassName?: string;
  className?: string,
  exact?: boolean;
}>) => {
  // next-intl's usePathname returns the path WITHOUT the locale prefix, so the
  // existing "/" and "/locale" comparisons keep working across all locales.
  const pathname = usePathname();

  const isActive = exact ? pathname === href : pathname.startsWith(href);
  const classNameList = [className];

  if (isActive) {
    classNameList.push(activeClassName);

    return (
      <span className={classNameList.join(' ')} {...props}>
        {children}
      </span>
    );
  } else {
    return (
      <Link href={href} className={classNameList.join(' ')} {...props}>
        {children}
      </Link>
    );
  }
};

export default NavLink;