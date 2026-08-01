const MAX_URL_LENGTH = 2_048;
const MAX_PARAMETERS = 32;
const MAX_PARAMETER_LENGTH = 512;

export function validatePublicQuery(url: URL): string | null {
  if (url.href.length > MAX_URL_LENGTH) return "Request URL is too long.";
  let count = 0;
  const seen = new Set<string>();
  for (const [key, value] of url.searchParams) {
    count += 1;
    if (count > MAX_PARAMETERS) return "Too many query parameters.";
    if (seen.has(key)) return `Duplicate query parameter: ${key}.`;
    seen.add(key);
    if (key.length > 64 || value.length > MAX_PARAMETER_LENGTH) return "Query parameter is too long.";
    if (/[\u0000-\u001f\u007f\ufffd]/u.test(key) || /[\u0000-\u001f\u007f\ufffd]/u.test(value)) return "Query contains invalid characters.";
    if (key === "__proto__" || key === "prototype" || key === "constructor") return "Invalid query parameter.";
  }
  return null;
}

export function secureCompareBearer(request: Request, secret: string | undefined): boolean {
  if (!secret) return false;
  const value = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const encoder = new TextEncoder();
  const left = encoder.encode(value); const right = encoder.encode(secret);
  if (left.length !== right.length) return false;
  let difference = 0; for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index];
  return difference === 0;
}
