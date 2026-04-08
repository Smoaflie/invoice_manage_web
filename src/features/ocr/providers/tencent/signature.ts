const encoder = new TextEncoder();

async function sha256Hex(input: string) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(input));
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, "0")).join("");
}

async function hmacSha256(key: string | Uint8Array, message: string) {
  const importedKey = await crypto.subtle.importKey(
    "raw",
    typeof key === "string" ? encoder.encode(key) : key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", importedKey, encoder.encode(message));
  return new Uint8Array(signature);
}

function toHex(bytes: Uint8Array) {
  return [...bytes].map((value) => value.toString(16).padStart(2, "0")).join("");
}

export async function buildTencentAuthorization(input: {
  secretId: string;
  secretKey: string;
  timestamp: number;
  payload: string;
  host: string;
  service: string;
  action: string;
  version: string;
}) {
  const date = new Date(input.timestamp * 1000).toISOString().slice(0, 10);
  const credentialScope = `${date}/${input.service}/tc3_request`;
  const hashedPayload = await sha256Hex(input.payload);
  const canonicalHeaders = [
    `content-type:application/json`,
    `host:${input.host}`,
  ].join("\n");
  const canonicalRequest = [
    "POST",
    "/",
    "",
    `${canonicalHeaders}\n`,
    "content-type;host",
    hashedPayload,
  ].join("\n");
  const stringToSign = [
    "TC3-HMAC-SHA256",
    String(input.timestamp),
    credentialScope,
    await sha256Hex(canonicalRequest),
  ].join("\n");
  const secretDate = await hmacSha256(`TC3${input.secretKey}`, date);
  const secretService = await hmacSha256(secretDate, input.service);
  const secretSigning = await hmacSha256(secretService, "tc3_request");
  const signature = toHex(await hmacSha256(secretSigning, stringToSign));

  return `TC3-HMAC-SHA256 Credential=${input.secretId}/${credentialScope}, SignedHeaders=content-type;host, Signature=${signature}`;
}
