/**
 * Parse one RFC 7233 byte range against a known asset size.
 *
 * Multiple ranges are deliberately rejected because the worker only returns a
 * single 206 body and does not construct multipart responses.
 *
 * @param {string} value
 * @param {number} size
 * @returns {{ start: number; end: number } | null}
 */
export function parseByteRange(value, size) {
  if (!Number.isSafeInteger(size) || size <= 0) return null;

  const match = /^bytes=(\d*)-(\d*)$/u.exec(value.trim());
  if (!match || (!match[1] && !match[2])) return null;

  const requestedStart = match[1] ? Number(match[1]) : null;
  const requestedEnd = match[2] ? Number(match[2]) : null;

  if (
    (requestedStart !== null && !Number.isSafeInteger(requestedStart)) ||
    (requestedEnd !== null && !Number.isSafeInteger(requestedEnd))
  ) {
    return null;
  }

  if (requestedStart === null) {
    if (requestedEnd === null || requestedEnd <= 0) return null;
    return {
      start: Math.max(size - requestedEnd, 0),
      end: size - 1,
    };
  }

  const end = Math.min(requestedEnd ?? size - 1, size - 1);
  if (requestedStart < 0 || requestedStart > end || requestedStart >= size) {
    return null;
  }

  return { start: requestedStart, end };
}
