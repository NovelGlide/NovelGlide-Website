import assert from "node:assert/strict";
import {describe, it} from "node:test";
import {
  CONTACT_EMAIL_MAX_LENGTH,
  CONTACT_MESSAGE_MAX_LENGTH,
  CONTACT_NAME_MAX_LENGTH,
  parseContactMessage,
} from "../src/domain/contact_message.ts";

const VALID = {category: "bug", message: "Pages skip.", email: "", name: "", device: ""};

function parse(overrides: Record<string, unknown>) {
  return parseContactMessage({...VALID, ...overrides});
}

describe("parseContactMessage", () => {
  describe("NFC normalization", () => {
    it("composes decomposed text in every field", () => {
      const decomposed = "Café";
      const result = parse({message: decomposed, name: decomposed, email: "café@example.com"});
      assert.equal(result?.message, "Café");
      assert.equal(result?.name, "Café");
      assert.equal(result?.email, "café@example.com");
    });

    it("measures the limit after composing", () => {
      const decomposed = "é".repeat(CONTACT_NAME_MAX_LENGTH);
      assert.equal(parse({name: decomposed})?.name, "é".repeat(CONTACT_NAME_MAX_LENGTH));
    });
  });

  describe("message line endings", () => {
    it("turns CRLF and lone CR into LF", () => {
      assert.equal(parse({message: "a\r\nb\rc\nd"})?.message, "a\nb\nc\nd");
    });
  });

  describe("control characters", () => {
    it("drops C0/C1 controls from the message but keeps tab and line feed", () => {
      assert.equal(parse({message: "a\u0000b\u0007c\u001Bd\u007Fe\u0085f\tg\nh"})?.message, "abcdef\tg\nh");
    });

    it("folds tabs and line breaks in the name into single spaces", () => {
      assert.equal(parse({name: "Mika\t\n  \r\nChen"})?.name, "Mika Chen");
    });

    it("drops other controls from the name", () => {
      assert.equal(parse({name: "Mi\u0000ka\u009F"})?.name, "Mika");
    });

    it("rejects an email that contains a line break or tab", () => {
      assert.equal(parse({email: "a@example.com\n"}), null);
      assert.equal(parse({email: "a@exa\tmple.com"}), null);
      assert.equal(parse({email: "a@example.com\r\nBcc: x@y.z"}), null);
    });

    it("rejects an email that contains any other control", () => {
      assert.equal(parse({email: "a\u0000@example.com"}), null);
      assert.equal(parse({email: "a@example.com\u0085"}), null);
    });
  });

  describe("invisible formatting characters", () => {
    it("strips bidi controls and zero-width characters from the name", () => {
      assert.equal(parse({name: "‮Mi​ka⁦‍﻿⁩"})?.name, "Mika");
    });

    it("strips bidi controls and zero-width characters from the email", () => {
      assert.equal(parse({email: "‮a​@exam⁧ple.com﻿"})?.email, "a@example.com");
    });

    it("strips bidi controls from the message but keeps zero-width characters", () => {
      assert.equal(parse({message: "a‪b‮c⁨d‍e"})?.message, "abcd‍e");
    });
  });

  describe("email", () => {
    it("trims and lowercases only the domain", () => {
      assert.equal(parse({email: "  Mika.Chen@Example.COM  "})?.email, "Mika.Chen@example.com");
    });

    it("still rejects an address without a dotted domain", () => {
      assert.equal(parse({email: "mika@localhost"}), null);
      assert.equal(parse({email: "not an email"}), null);
    });

    it("treats a blank email as absent", () => {
      assert.equal(parse({email: " ​ "})?.email, null);
    });

    it("applies the length limit to the cleaned address", () => {
      const local = "a".repeat(CONTACT_EMAIL_MAX_LENGTH - "@example.com".length);
      assert.equal(parse({email: `${local}@example.com​​`})?.email, `${local}@example.com`);
      assert.equal(parse({email: `a${local}@example.com`}), null);
    });
  });

  describe("emptiness after cleaning", () => {
    it("rejects a message that is empty once cleaned", () => {
      assert.equal(parse({message: " \u0000‮\r\n\t "}), null);
    });

    it("turns a name that is empty once cleaned into null", () => {
      assert.equal(parse({name: "​‮ \t"})?.name, null);
    });
  });

  describe("length limits", () => {
    it("accepts a message at the limit once cleaned", () => {
      const message = "a".repeat(CONTACT_MESSAGE_MAX_LENGTH);
      assert.equal(parse({message: `${message}\u0000\u0000`})?.message, message);
    });

    it("rejects a message over the limit once cleaned", () => {
      assert.equal(parse({message: "a".repeat(CONTACT_MESSAGE_MAX_LENGTH + 1)}), null);
    });

    it("rejects absurdly long raw input before cleaning it", () => {
      // All of it would be stripped, so only the raw guard can reject it.
      const raw = "\u0000".repeat(CONTACT_MESSAGE_MAX_LENGTH * 4 + 1);
      assert.equal(parse({message: `ok${raw}`}), null);
      assert.equal(parse({name: "​".repeat(CONTACT_NAME_MAX_LENGTH * 4 + 1)}), null);
    });
  });

  describe("allowlists and types", () => {
    it("accepts a known category and device", () => {
      assert.deepEqual(parse({category: "account", device: "android"}), {
        email: null, name: null, category: "account", message: "Pages skip.", device: "android",
      });
    });

    it("rejects an unknown category or device and non-string fields", () => {
      assert.equal(parse({category: "spam"}), null);
      assert.equal(parse({device: "nokia"}), null);
      assert.equal(parse({message: 42}), null);
      assert.equal(parseContactMessage(null), null);
    });
  });
});
