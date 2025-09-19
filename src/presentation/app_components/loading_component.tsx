import { useTranslations } from "next-intl";

export default function LoadingComponent() {
    const t = useTranslations("LoadingComponent");

    return (
        <div className="flex min-h-xl flex-col items-center justify-center">
            <span className="loader"></span>
            <h2 className="text-center text-xl font-semibold">
                {t("loading")}
            </h2>
            <p className="max-w-lg text-center text-gray-600">
                {t("description")}
            </p>
        </div>
    );
}