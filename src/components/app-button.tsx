import Link from "next/link";

export default function AppButton({
  children,
  href,
  onClick,
}: Readonly<{
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
}>) {
  const className = `
    px-4
    py-2
    rounded-3xl
    bg-sky-500
    text-sky-100
    hover:bg-sky-400
    hover:text-sky-50
    cursor-pointer
    transition
    duration-300
    ease-in-out
  `;

  if (!href) {
    return (
      <button
        className={className}
        onClick={onClick}
      >
        {children}
      </button>
    );
  }

  return (
    <Link
      href={href}
      className={className}
      onClick={onClick}
    >
      {children}
    </Link>
  );
}