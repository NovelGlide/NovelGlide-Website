import Image from "next/image";

export default function AppNav() {
  return (
    <nav className="p-8 flex justify-between items-center">
      <div className="flex items-center space-x-4">
        <Image
          className="rounded-xl"
          src="/images/app_icon.png"
          alt="NovelGlide Logo"
          width={48}
          height={48}
        />
        <h1 className="text-xl font-bold">
          NovelGlide
        </h1>
      </div>
    </nav>
  );
}