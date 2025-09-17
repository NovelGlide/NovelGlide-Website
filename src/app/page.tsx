import AppButton from "@/components/app-button";
import Image from "next/image";

export default function Home() {
  return (
    <main className="relative min-h-screen">
      // Navigation
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

      // Header section
      <header className="
        p-8
        w-full
      ">
        <p>
          Your personal e-book reader and library manager.
        </p>
      </header>

      // Feature section
      <section id="features" className="p-8">

      </section>

      // Downloads section
      <section id="downloads" className="p-8">
        <h2 className="text-2xl font-bold mb-4">Downloads</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AppButton>
            Google Play
          </AppButton>
          <AppButton>
            App Store
          </AppButton>
        </div>
      </section>

      // Footer section
      <footer className="p-8">
        <p>&copy; 2025 NovelGlide. All rights reserved.</p>
      </footer>

      // Decoration Elements
      <div className="
        absolute
        top-0
        right-0
        w-0
        md:w-1/3
        h-80
        bg-stone-900
        -z-10
      "></div>
    </main>
  );
}
