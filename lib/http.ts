import { DomainError } from "./domain";
export async function readJson(
  request: Request,
  limit = 65536,
): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader)
    throw new DomainError("INVALID_INPUT", "A request body is required.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > limit) {
      await reader.cancel();
      throw new DomainError("PAYLOAD_TOO_LARGE", "Request is too large.", 413);
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new DomainError("INVALID_INPUT", "Invalid JSON body.");
  }
}
