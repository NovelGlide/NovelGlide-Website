import { useTranslations } from "next-intl";

export default function ErrorComponent() {
    const t = useTranslations("ErrorComponent");

    return (
        <div className="flex min-h-xl flex-col items-center justify-center">
            <h2 className="text-center text-2xl font-semibold text-red-600">
                {t("error")}
            </h2>
            <p className="max-w-lg text-center text-gray-600">
                {t("description")}
            </p>
        </div>
    );
}