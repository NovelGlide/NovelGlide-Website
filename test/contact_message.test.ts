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
      const decomposed = "Cafe\u0301";
      const result = parse({message: decomposed, name: decomposed});
      assert.equal(result?.message, "Caf\u00E9");
      assert.equal(result?.name, "Caf\u00E9");
    });

    it("measures the limit after composing", () => {
      const decomposed = "e\u0301".repeat(CONTACT_NAME_MAX_LENGTH);
      assert.equal(parse({name: decomposed})?.name, "\u00E9".repeat(CONTACT_NAME_MAX_LENGTH));
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
      assert.equal(parse({name: "\u202EMi\u200Bka\u2066\u200D\uFEFF\u2069"})?.name, "Mika");
    });

    it("strips bidi controls and zero-width characters from the email", () => {
      assert.equal(parse({email: "\u202Ea\u200B@exam\u2067ple.com\uFEFF"})?.email, "a@example.com");
    });

    it("strips bidi controls from the message but keeps zero-width characters", () => {
      assert.equal(parse({message: "a\u202Ab\u202Ec\u2068d\u200De"})?.message, "abcd\u200De");
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
      assert.equal(parse({email: " \u200B "})?.email, null);
    });

    it("applies the length limit to the cleaned address", () => {
      // "a@" + three 63-letter labels + a 57-letter label + "co" = 254.
      const domain = `${"b".repeat(63)}.`.repeat(3) + `${"c".repeat(57)}.co`;
      const address = `a@${domain}`;
      assert.equal(address.length, CONTACT_EMAIL_MAX_LENGTH);
      assert.equal(parse({email: `${address}\u200B\u200B`})?.email, address);
      assert.equal(parse({email: `a${address}`}), null);
    });

    it("accepts dot-atom local parts, plus-addressing and subdomains", () => {
      for (const email of ["a+b@x.co", "first.last@mail.example.org", "o'neil_{x}~=$^|*!-@a-b.io"]) {
        assert.equal(parse({email})?.email, email);
      }
    });

    it("rejects URI metacharacters in the local part", () => {
      for (const char of ["?", "#", "%", "&", "/", ";", ":", ",", "<", ">", "\"", "\\", "`", "(", ")", "[", "]"]) {
        assert.equal(parse({email: `a${char}b@example.com`}), null, char);
      }
    });

    it("rejects malformed dot-atoms and over-long local parts", () => {
      assert.equal(parse({email: ".a@example.com"}), null);
      assert.equal(parse({email: "a.@example.com"}), null);
      assert.equal(parse({email: "a..b@example.com"}), null);
      assert.equal(parse({email: `${"a".repeat(65)}@example.com`}), null);
      assert.equal(parse({email: `${"a".repeat(64)}@example.com`})?.email, `${"a".repeat(64)}@example.com`);
    });

    it("rejects domains outside LDH labels with a 2+ letter TLD", () => {
      for (const email of [
        "a@example.c", "a@example.c0m", "a@-example.com", "a@example-.com",
        "a@exa_mple.com", "a@example..com", "a@[127.0.0.1]", "a@example.com?subject=x",
        `a@${"b".repeat(64)}.com`, "a@b@example.com",
      ]) {
        assert.equal(parse({email}), null, email);
      }
    });

    it("rejects non-ASCII addresses, IDN domains included", () => {
      assert.equal(parse({email: "caf\u00E9@example.com"}), null);
      assert.equal(parse({email: "a@b\u00FCcher.de"}), null);
      assert.equal(parse({email: "a@\u4F8B\u3048.jp"}), null);
    });
  });

  describe("emptiness after cleaning", () => {
    it("rejects a message that is empty once cleaned", () => {
      assert.equal(parse({message: " \u0000\u202E\r\n\t "}), null);
    });

    it("turns a name that is empty once cleaned into null", () => {
      assert.equal(parse({name: "\u200B\u202E \t"})?.name, null);
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
      assert.equal(parse({name: "\u200B".repeat(CONTACT_NAME_MAX_LENGTH * 4 + 1)}), null);
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
