import FeatureCard from "@/app/app_sections/components/feature-card";

export default function FeatureSection() {
  return (
    <section id="features" className="mt-20 p-8">
      <h3
        className="mb-4 text-center text-3xl font-bold leading-tight"
      >
        Features
      </h3>
      <FeatureCard title="Customizable Reading Environment">
        You can adjust font size and line-height, turn on / off the dark mode, and the pagination.
        Create your own reading environment.
      </FeatureCard>
      <div className="flex flex-col md:flex-row flex-wrap items-stretch mt-8 gap-8">
        <div className="flex-1">
          <FeatureCard title="Cloud Backup">
            You can back up your books, bookmarks, and collections to your personal cloud drive.
            Also, you can easily restore your backups from your cloud drive.
          </FeatureCard>
        </div>
        <div className="flex-1">
          <FeatureCard title="OPDS Support">
            NovelGlide support reading the catalog in Open Publication Distribution System (OPDS) format.
            You can download books from an OPDS server to your bookshelf.
          </FeatureCard>
        </div>
      </div>
    </section>
  );
}