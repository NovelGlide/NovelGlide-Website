import FeatureCard from "@/app/app_sections/components/feature-card";
import {useTranslations} from "next-intl";

export default function FeatureSection() {
  const t = useTranslations('FeatureSection');
  return (
    <section id="features" className="mt-20 p-8">
      <h3
        className="mb-4 text-center text-3xl font-bold leading-tight"
      >
        {t('title')}
      </h3>
      <FeatureCard title={t('customFeatTitle')}>
        {t('customFeatDescription')}
      </FeatureCard>
      <div className="flex flex-col md:flex-row flex-wrap items-stretch mt-8 gap-8">
        <div className="flex-1">
          <FeatureCard title={t('cloudFeatTitle')}>
            {t('cloudFeatDescription')}
          </FeatureCard>
        </div>
        <div className="flex-1">
          <FeatureCard title={t('exploreFeatTitle')}>
            {t('exploreFeatDescription')}
          </FeatureCard>
        </div>
      </div>
    </section>
  );
}