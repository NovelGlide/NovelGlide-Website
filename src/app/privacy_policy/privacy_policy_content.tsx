'use client';

import HttpRepository from "@/domain/http_repository";
import { LocaleUtils } from "@/i18n/locale_utils";
import ErrorComponent from "@/presentation/app_components/error_component";
import LoadingComponent from "@/presentation/app_components/loading_component";
import MarkdownViewer from "@/presentation/markdown_viewer/markdown_viewer";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";

export default function PrivacyPolicyContent() {

  const locale = useLocale();
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const url = LocaleUtils.getManualUrl('privacy_policy', locale);

  useEffect(() => {
    setLoading(true);
    setError(null);
    
    HttpRepository.fetchMarkdown(url)
        .then((data) => setContent(data))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
  });

  if (loading) {
    return (<LoadingComponent />);
  }

  if (error) {
    return (<ErrorComponent />);
  }

  return (<MarkdownViewer content={content} />);
}