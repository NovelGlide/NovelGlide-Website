// A message sent through the website's contact form, shared by the browser form
// (native constraints) and the API route (authoritative validation) so the two
// can't drift.

export const CONTACT_CATEGORIES = ["bug", "feature", "account", "other"] as const;
export type ContactCategory = (typeof CONTACT_CATEGORIES)[number];

// The device the sender picked, if any; a blank choice is null, not "other".
export const CONTACT_DEVICES = ["apple", "android", "other"] as const;
export type ContactDevice = (typeof CONTACT_DEVICES)[number];

// RFC 5321 caps a forward path at 254 characters.
export const CONTACT_EMAIL_MAX_LENGTH = 254;
export const CONTACT_MESSAGE_MAX_LENGTH = 5000;
export const CONTACT_NAME_MAX_LENGTH = 100;

export type ContactMessage = {
  // null when the sender left the field blank: we then have no way to reply.
  email: string | null;
  // null when left blank: the sender stays anonymous.
  name: string | null;
  category: ContactCategory;
  message: string;
  device: ContactDevice | null;
};

// Deliberately loose: the address is only ever used by a human replying, so
// anything with one "@" and a dotted domain is accepted.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Raw input longer than this many times a field's limit is rejected before any
// cleaning runs; cleaning only shortens text, so it could never fit.
const RAW_LENGTH_FACTOR = 4;

// C0 and C1 control characters (U+0000–U+001F, U+007F–U+009F).
const CONTROL_CHARS = /[\u0000-\u001F\u007F-\u009F]/g;
// The same set minus tab (U+0009) and line feed (U+000A).
const CONTROL_CHARS_EXCEPT_TAB_LF = /[\u0000-\u0008\u000B-\u001F\u007F-\u009F]/g;
// Bidi embeddings, overrides and isolates: they reorder how the surrounding
// text displays, so a value can read differently from what it contains.
const BIDI_CONTROLS = /[‪-‮⁦-⁩]/g;
// Zero-width space, non-joiner, joiner and BOM: invisible, so two values that
// look identical can differ.
const ZERO_WIDTH_CHARS = /[​-‍﻿]/g;

function isContactCategory(value: unknown): value is ContactCategory {
  return CONTACT_CATEGORIES.some((category) => category === value);
}

// "" is the select's blank choice; absent and null mean the same. undefined
// marks a value outside the set.
function optionalDevice(value: unknown): ContactDevice | null | undefined {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  return CONTACT_DEVICES.find((device) => device === value);
}

// Shared shape of the text-field cleaners: null for absent or blank once
// cleaned, undefined for a value that must reject the whole submission.
function cleanTextField(
  value: unknown,
  maxLength: number,
  clean: (raw: string) => string | undefined,
): string | null | undefined {
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value !== "string" || value.length > maxLength * RAW_LENGTH_FACTOR) {
    return undefined;
  }
  const cleaned = clean(value.normalize("NFC"));
  if (cleaned === undefined || cleaned.length > maxLength) {
    return undefined;
  }
  return cleaned === "" ? null : cleaned;
}

function cleanMessage(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(CONTROL_CHARS_EXCEPT_TAB_LF, "")
    .replace(BIDI_CONTROLS, "")
    .trim();
}

// Tabs and line breaks count as whitespace and collapse with the rest; other
// controls are dropped.
function cleanName(text: string): string {
  return text
    .replace(BIDI_CONTROLS, "")
    .replace(ZERO_WIDTH_CHARS, "")
    .replace(/[\t\n\v\f\r]/g, " ")
    .replace(CONTROL_CHARS, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Any control character, line breaks included, rejects the address: unlike a
// name it can't be repaired without guessing what was meant. Only the domain is
// lowercased; the local part is case-sensitive by RFC 5321.
function cleanEmail(text: string): string | undefined {
  const stripped = text.replace(BIDI_CONTROLS, "").replace(ZERO_WIDTH_CHARS, "");
  if (new RegExp(CONTROL_CHARS.source).test(stripped)) {
    return undefined;
  }
  const trimmed = stripped.trim();
  const at = trimmed.lastIndexOf("@");
  if (at < 0) {
    return trimmed;
  }
  return trimmed.slice(0, at + 1) + trimmed.slice(at + 1).toLowerCase();
}

// Returns the cleaned message, or null when any field is missing, malformed or
// over its limit. Text is NFC-normalized and stripped of controls and invisible
// formatting first; limits apply to what remains.
export function parseContactMessage(input: unknown): ContactMessage | null {
  if (typeof input !== "object" || input === null) {
    return null;
  }
  const fields = input as Record<string, unknown>;

  const email = cleanTextField(fields.email, CONTACT_EMAIL_MAX_LENGTH, cleanEmail);
  const name = cleanTextField(fields.name, CONTACT_NAME_MAX_LENGTH, cleanName);
  const message = cleanTextField(fields.message, CONTACT_MESSAGE_MAX_LENGTH, cleanMessage);
  const device = optionalDevice(fields.device);
  if (email === undefined || name === undefined || device === undefined || !message) {
    return null;
  }
  if (email !== null && !EMAIL_PATTERN.test(email)) {
    return null;
  }
  if (!isContactCategory(fields.category)) {
    return null;
  }

  return {email, name, category: fields.category, message, device};
}

// A store or verifier the contact flow needs has no credentials in this
// environment. Callers reject the submission; nothing is skipped.
export class ContactServiceUnconfiguredError extends Error {}

// Cloudflare's verification endpoint could not be reached or answered with an
// HTTP error, so whether the token is valid is unknown.
export class TurnstileUnreachableError extends Error {}

// Why the browser's submission didn't land; each maps to its own message.
// invalid: the API rejected the fields · verification: Turnstile said no ·
// network: the request never reached the site · unavailable: the site answered
// but couldn't store the message (or didn't answer in time).
export type ContactSendFailureCode = "invalid" | "verification" | "network" | "unavailable";

export class ContactSendError extends Error {
  readonly code: ContactSendFailureCode;

  constructor(code: ContactSendFailureCode) {
    super(code);
    this.code = code;
  }
}
