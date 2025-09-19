import {ReactNode} from "react";

export default function FeatureCard({
                                      title,
                                      children,
                                    }: Readonly<{
  title: string,
  children?: ReactNode,
}>) {
  return (
    <div className="
      flex
      flex-col
      p-8
      rounded-4xl
      h-full
      bg-zinc-200
    ">
        <h4
          className="
          mb-4
          text-xl
          font-bold
        "
        >
          {title}
        </h4>
        <div className="flex-1">
          {children}
        </div>
      </div>
  );
}