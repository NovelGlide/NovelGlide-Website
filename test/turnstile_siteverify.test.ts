import assert from "node:assert/strict";
import {afterEach, describe, it} from "node:test";
import {
  isAllowedTurnstileHostname,
  verifyTurnstileToken,
  type TurnstileDeployment,
} from "../src/data/turnstile_siteverify.ts";
import {TurnstileUnreachableError} from "../src/domain/contact_message.ts";

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

const ACCEPTED = {success: true, hostname: "novelglide.kai-wu.net", action: "contact"};

// Replaces fetch with one that answers `reply` and records each request body.
function stubSiteverify(reply: () => Response): URLSearchParams[] {
  const sent: URLSearchParams[] = [];
  globalThis.fetch = async (_input, init) => {
    sent.push(new URLSearchParams(String(init?.body)));
    return reply();
  };
  return sent;
}

function verify(result: unknown, deployment: TurnstileDeployment = "production") {
  stubSiteverify(() => Response.json(result));
  return verifyTurnstileToken({secret: "s", token: "t", remoteIp: null, deployment});
}

describe("verifyTurnstileToken", () => {
  it("accepts a successful result for this site and action", async () => {
    assert.equal(await verify(ACCEPTED), true);
  });

  it("sends the secret, token, remote IP and a fresh idempotency key", async () => {
    const sent = stubSiteverify(() => Response.json(ACCEPTED));
    await verifyTurnstileToken({secret: "s", token: "t", remoteIp: "203.0.113.7", deployment: "production"});
    await verifyTurnstileToken({secret: "s", token: "t", remoteIp: null, deployment: "production"});
    assert.equal(sent[0].get("secret"), "s");
    assert.equal(sent[0].get("response"), "t");
    assert.equal(sent[0].get("remoteip"), "203.0.113.7");
    assert.equal(sent[1].has("remoteip"), false);
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
    assert.match(sent[0].get("idempotency_key") ?? "", uuid);
    assert.match(sent[1].get("idempotency_key") ?? "", uuid);
    assert.notEqual(sent[0].get("idempotency_key"), sent[1].get("idempotency_key"));
  });

  it("rejects an unsuccessful result", async () => {
    assert.equal(await verify({...ACCEPTED, success: false}), false);
    assert.equal(await verify({...ACCEPTED, success: "true"}), false);
  });

  it("rejects a missing or non-string hostname", async () => {
    assert.equal(await verify({success: true, action: "contact"}), false);
    assert.equal(await verify({...ACCEPTED, hostname: null}), false);
  });

  it("rejects a hostname from another site", async () => {
    assert.equal(await verify({...ACCEPTED, hostname: "example.com"}), false);
  });

  it("rejects a missing or different action", async () => {
    assert.equal(await verify({success: true, hostname: ACCEPTED.hostname}), false);
    assert.equal(await verify({...ACCEPTED, action: "login"}), false);
    assert.equal(await verify({...ACCEPTED, action: ""}), false);
  });

  it("rejects a result that isn't an object", async () => {
    assert.equal(await verify(null), false);
    assert.equal(await verify(true), false);
  });

  it("throws TurnstileUnreachableError when no verdict arrives", async () => {
    const attempt = () => verifyTurnstileToken({secret: "s", token: "t", remoteIp: null, deployment: "production"});
    stubSiteverify(() => new Response("oops", {status: 500}));
    await assert.rejects(attempt(), TurnstileUnreachableError);
    stubSiteverify(() => new Response("not json", {status: 200}));
    await assert.rejects(attempt(), TurnstileUnreachableError);
    globalThis.fetch = async () => {
      throw new TypeError("fetch failed");
    };
    await assert.rejects(attempt(), TurnstileUnreachableError);
  });
});

describe("isAllowedTurnstileHostname", () => {
  it("allows only the production hostname in production", () => {
    assert.equal(isAllowedTurnstileHostname("novelglide.kai-wu.net", "production"), true);
    for (const hostname of ["x.vercel.app", "localhost", "kai-wu.net", "novelglide.kai-wu.net.evil.com"]) {
      assert.equal(isAllowedTurnstileHostname(hostname, "production"), false, hostname);
    }
  });

  it("also allows *.vercel.app on a preview deployment", () => {
    for (const hostname of ["novelglide.kai-wu.net", "novelglide-git-x-kai.vercel.app"]) {
      assert.equal(isAllowedTurnstileHostname(hostname, "preview"), true, hostname);
    }
    for (const hostname of ["vercel.app", "evilvercel.app", "x.vercel.app.evil.com", "localhost"]) {
      assert.equal(isAllowedTurnstileHostname(hostname, "preview"), false, hostname);
    }
  });

  it("allows only localhost in development", () => {
    assert.equal(isAllowedTurnstileHostname("localhost", "development"), true);
    assert.equal(isAllowedTurnstileHostname("novelglide.kai-wu.net", "development"), false);
    assert.equal(isAllowedTurnstileHostname("example.com", "development"), false);
  });
});
