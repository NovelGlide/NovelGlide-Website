'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';

const NavLink = ({
                   href,
                   children,
                   activeClassName = 'text-stone-400',
                   className,
                   exact = false,
                   ...props
                 }) => {
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