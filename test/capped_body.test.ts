import assert from "node:assert/strict";
import {describe, it} from "node:test";
import {readCappedBody} from "../src/app/api/contact/capped_body.ts";

const CAP = 100;
const encoder = new TextEncoder();

// A body streamed in the given chunks, recording how many were pulled and
// whether the reader cancelled.
function streamedRequest(chunks: string[], headers: Record<string, string> = {}) {
  const log = {pulled: 0, cancelled: false};
  let index = 0;
  const body = new ReadableStream<Uint8Array>({
    pull(controller) {
      log.pulled += 1;
      if (index < chunks.length) {
        controller.enqueue(encoder.encode(chunks[index++]));
      } else {
        controller.close();
      }
    },
    cancel() {
      log.cancelled = true;
    },
  }, {highWaterMark: 0}); // pull only when the reader asks
  const request = new Request("http://localhost/api/contact", {
    method: "POST",
    body,
    headers,
    duplex: "half",
  } as RequestInit);
  return {request, log};
}

describe("readCappedBody", () => {
  it("returns a body within the cap as text", async () => {
    const request = new Request("http://localhost/", {method: "POST", body: "{\"a\":1}"});
    assert.equal(await readCappedBody(request, CAP), "{\"a\":1}");
  });

  it("returns an empty string when there is no body", async () => {
    assert.equal(await readCappedBody(new Request("http://localhost/", {method: "POST"}), CAP), "");
  });

  it("rejects a declared length over the cap without reading the body", async () => {
    const {request, log} = streamedRequest(["x"], {"content-length": String(CAP + 1)});
    assert.equal(await readCappedBody(request, CAP), null);
    assert.equal(log.pulled, 0);
  });

  it("rejects a declared length that isn't a plain integer", async () => {
    for (const declared of ["abc", "-1", "1e3", "10, 10"]) {
      const {request} = streamedRequest(["x"], {"content-length": declared});
      assert.equal(await readCappedBody(request, CAP), null, declared);
    }
  });

  it("rejects an oversize body that declares no length, and cancels the stream", async () => {
    const {request, log} = streamedRequest(["x".repeat(60), "x".repeat(60), "x".repeat(60)]);
    assert.equal(await readCappedBody(request, CAP), null);
    assert.equal(log.cancelled, true);
    assert.ok(log.pulled < 4, "stopped before draining the stream");
  });

  it("rejects an oversize body whose declared length lies", async () => {
    const {request, log} = streamedRequest(["x".repeat(60), "x".repeat(60)], {"content-length": "10"});
    assert.equal(await readCappedBody(request, CAP), null);
    assert.equal(log.cancelled, true);
  });

  it("counts UTF-8 bytes, not UTF-16 units", async () => {
    // 40 CJK characters: 40 UTF-16 units but 120 bytes.
    const {request} = streamedRequest(["\u8A9E".repeat(40)]);
    assert.equal(await readCappedBody(request, CAP), null);
    const {request: fits} = streamedRequest(["\u8A9E".repeat(33)]);
    assert.equal(await readCappedBody(fits, CAP), "\u8A9E".repeat(33));
  });

  it("decodes a character split across chunks", async () => {
    const bytes = encoder.encode("\u8A9E");
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(bytes.slice(0, 1));
        controller.enqueue(bytes.slice(1));
        controller.close();
      },
    });
    const request = new Request("http://localhost/", {method: "POST", body, duplex: "half"} as RequestInit);
    assert.equal(await readCappedBody(request, CAP), "\u8A9E");
  });
});
