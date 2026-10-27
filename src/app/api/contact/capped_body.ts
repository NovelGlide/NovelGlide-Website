// Reads a request body as UTF-8 text without ever holding more than `maxBytes`
// of it. Returns null when the body is, or claims to be, larger.
export async function readCappedBody(request: Request, maxBytes: number): Promise<string | null> {
  // A declared length over the cap is rejected before any byte is read. One
  // that isn't a plain integer can't be trusted either way, so it rejects too.
  const declared = request.headers.get("content-length");
  if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > maxBytes)) {
    return null;
  }
  if (request.body === null) {
    return "";
  }

  // The declared length may lie (or be absent with chunked encoding), so the
  // cap is enforced again on the bytes that actually arrive.
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let received = 0;
  let text = "";
  for (;;) {
    const {done, value} = await reader.read();
    if (done) {
      break;
    }
    received += value.byteLength;
    if (received > maxBytes) {
      await reader.cancel();
      return null;
    }
    text += decoder.decode(value, {stream: true});
  }
  return text + decoder.decode();
}
