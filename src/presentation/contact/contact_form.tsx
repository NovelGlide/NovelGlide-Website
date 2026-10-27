'use client';

import Script from "next/script";
import {useLocale, useTranslations} from "next-intl";
import {type FormEvent, useCallback, useEffect, useId, useRef, useState} from "react";
import ContactApiRepository from "@/domain/contact_api_repository";
import {
  CONTACT_CATEGORIES,
  CONTACT_DEVICES,
  CONTACT_EMAIL_MAX_LENGTH,
  CONTACT_MESSAGE_MAX_LENGTH,
  CONTACT_NAME_MAX_LENGTH,
  ContactSendError,
  type ContactSendFailureCode,
  parseContactMessage,
} from "@/domain/contact_message";

// The subset of Cloudflare's Turnstile browser API this form calls.
type TurnstileApi = {
  render: (container: HTMLElement, options: {
    sitekey: string;
    language: string;
    theme: "light";
    callback: (token: string) => void;
    "expired-callback": () => void;
    "error-callback": () => void;
  }) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

// Inlined at build time; unset in a local checkout without the Vercel env.
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

type ContactFormStatus =
  | {kind: "idle"}
  | {kind: "submitting"}
  | {kind: "sent"}
  | {kind: "failed"; code: ContactSendFailureCode};

const FAILURE_MESSAGE_KEY = {
  invalid: "errorInvalid",
  verification: "errorVerification",
  network: "errorNetwork",
  unavailable: "errorUnavailable",
} as const satisfies Record<ContactSendFailureCode, string>;

const FIELD_CLASS =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-base text-stone-800 " +
  "placeholder:text-stone-400 focus:border-sky-500 focus:outline-none focus:ring-2 " +
  "focus:ring-sky-500/30 disabled:bg-stone-100";

export default function ContactForm() {
  const t = useTranslations("Contact");
  const locale = useLocale();
  const id = useId();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [device, setDevice] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [status, setStatus] = useState<ContactFormStatus>({kind: "idle"});

  const widgetContainer = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  const renderTurnstile = useCallback(() => {
    // onReady also fires on remount, when the widget may already be drawn.
    if (!window.turnstile || !widgetContainer.current || widgetId.current !== null) {
      return;
    }
    widgetId.current = window.turnstile.render(widgetContainer.current, {
      sitekey: TURNSTILE_SITE_KEY,
      language: locale,
      theme: "light",
      callback: setTurnstileToken,
      "expired-callback": () => setTurnstileToken(null),
      "error-callback": () => setTurnstileToken(null),
    });
  }, [locale]);

  useEffect(() => () => {
    if (widgetId.current !== null) {
      window.turnstile?.remove(widgetId.current);
      widgetId.current = null;
    }
  }, []);

  const configured = TURNSTILE_SITE_KEY !== "";
  const submitting = status.kind === "submitting";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // The button is disabled without a token; Enter in a field still submits.
    if (turnstileToken === null) {
      return;
    }
    const parsed = parseContactMessage({email, name, category, message, device});
    if (parsed === null) {
      setStatus({kind: "failed", code: "invalid"});
      return;
    }

    setStatus({kind: "submitting"});
    try {
      await ContactApiRepository.send(parsed, turnstileToken);
      setStatus({kind: "sent"});
    } catch (error) {
      if (!(error instanceof ContactSendError)) {
        throw error;
      }
      setStatus({kind: "failed", code: error.code});
      // A token is single-use once the server has checked it, so every failed
      // attempt draws a fresh challenge.
      setTurnstileToken(null);
      if (widgetId.current !== null) {
        window.turnstile?.reset(widgetId.current);
      }
    }
  }

  if (status.kind === "sent") {
    return (
      <section
        role="status"
        className="rounded-xl border border-stone-200 bg-white p-6 text-center"
      >
        <h3 className="text-xl font-bold">{t("sentTitle")}</h3>
        <p className="mt-2 text-stone-600">{t("sentBody")}</p>
      </section>
    );
  }

  const nameHintId = `${id}-name-hint`;
  const emailHintId = `${id}-email-hint`;
  const messageCountId = `${id}-message-count`;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {configured ? (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
          onReady={renderTurnstile}
        />
      ) : (
        <p className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {t("unconfigured")}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-name`} className="font-semibold">
          {t("nameLabel")}
          <span className="ml-2 text-sm font-normal text-stone-500">{t("optional")}</span>
        </label>
        <input
          id={`${id}-name`}
          name="name"
          type="text"
          autoComplete="nickname"
          maxLength={CONTACT_NAME_MAX_LENGTH}
          value={name}
          onChange={(event) => setName(event.target.value)}
          aria-describedby={nameHintId}
          className={FIELD_CLASS}
        />
        <p id={nameHintId} className="text-sm text-stone-500">{t("nameHint")}</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-email`} className="font-semibold">
          {t("emailLabel")}
          <span className="ml-2 text-sm font-normal text-stone-500">{t("optional")}</span>
        </label>
        <input
          id={`${id}-email`}
          name="email"
          type="email"
          autoComplete="email"
          maxLength={CONTACT_EMAIL_MAX_LENGTH}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-describedby={emailHintId}
          className={FIELD_CLASS}
        />
        <p id={emailHintId} className="text-sm text-stone-500">{t("emailHint")}</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-category`} className="font-semibold">
          {t("categoryLabel")}
        </label>
        <select
          id={`${id}-category`}
          name="category"
          required
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className={`${FIELD_CLASS} ${category === "" ? "text-stone-400" : ""}`}
        >
          <option value="" disabled>{t("categoryPlaceholder")}</option>
          {CONTACT_CATEGORIES.map((key) => (
            <option key={key} value={key} className="text-stone-800">
              {t(`category.${key}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-device`} className="font-semibold">
          {t("deviceTypeLabel")}
          <span className="ml-2 text-sm font-normal text-stone-500">{t("optional")}</span>
        </label>
        <select
          id={`${id}-device`}
          name="device"
          value={device}
          onChange={(event) => setDevice(event.target.value)}
          className={`${FIELD_CLASS} ${device === "" ? "text-stone-400" : ""}`}
        >
          <option value="">{t("deviceTypePlaceholder")}</option>
          {CONTACT_DEVICES.map((key) => (
            <option key={key} value={key} className="text-stone-800">
              {t(`device.${key}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-message`} className="font-semibold">
          {t("messageLabel")}
        </label>
        <textarea
          id={`${id}-message`}
          name="message"
          required
          rows={7}
          maxLength={CONTACT_MESSAGE_MAX_LENGTH}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          aria-describedby={messageCountId}
          className={`${FIELD_CLASS} resize-y`}
        />
        <p id={messageCountId} className="self-end text-sm text-stone-500 tabular-nums">
          {t("messageLength", {count: message.length, max: CONTACT_MESSAGE_MAX_LENGTH})}
        </p>
      </div>

      {configured && <div ref={widgetContainer} className="min-h-[65px]"/>}

      {status.kind === "failed" && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {t(FAILURE_MESSAGE_KEY[status.code])}
        </p>
      )}

      <button
        type="submit"
        disabled={!configured || submitting || turnstileToken === null}
        className="self-start rounded-full bg-zinc-800 px-6 py-2.5 font-bold text-stone-50 transition-colors duration-300 ease-in-out hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-zinc-400"
      >
        {submitting ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}
