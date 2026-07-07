// Extract valid Indian 10-digit mobile numbers (starting with 6-9) from arbitrary text.
// Works with any separator (comma, space, newline, dash, none) — we scan globally.
export function extractIndianMobiles(input: string): {
  valid: string[];
  invalid: string[];
  totalTokens: number;
} {
  const valid: string[] = [];
  const seen = new Set<string>();

  // Match optional +91 / 91 / 0 prefix followed by a 10-digit mobile starting 6-9.
  // Allow spaces/dashes/parens inside; we normalize by stripping non-digits.
  const re = /(?:\+?9\s*1[\s\-]?|0)?[6-9](?:[\s\-()]*\d){9}/g;
  const matches = input.match(re) ?? [];

  for (const m of matches) {
    const digits = m.replace(/\D+/g, "");
    let num: string | null = null;
    if (digits.length === 10 && /^[6-9]/.test(digits)) num = digits;
    else if (digits.length === 12 && digits.startsWith("91") && /^[6-9]/.test(digits[2])) num = digits.slice(2);
    else if (digits.length === 11 && digits.startsWith("0") && /^[6-9]/.test(digits[1])) num = digits.slice(1);
    else if (digits.length === 13 && digits.startsWith("091") && /^[6-9]/.test(digits[3])) num = digits.slice(3);
    if (num && !seen.has(num)) {
      seen.add(num);
      valid.push(num);
    }
  }

  // "totalTokens" = rough count of number-like chunks the user pasted
  const tokenCount = (input.match(/\d[\d\s\-()+]*\d|\d/g) ?? []).length;
  const invalid: string[] = [];
  // Anything that looked like a number chunk but didn't yield a valid mobile
  for (const chunk of input.match(/\d[\d\s\-()+]*\d|\d/g) ?? []) {
    const d = chunk.replace(/\D+/g, "");
    const isValidShape =
      (d.length === 10 && /^[6-9]/.test(d)) ||
      (d.length === 12 && d.startsWith("91") && /^[6-9]/.test(d[2])) ||
      (d.length === 11 && d.startsWith("0") && /^[6-9]/.test(d[1])) ||
      (d.length === 13 && d.startsWith("091") && /^[6-9]/.test(d[3]));
    if (!isValidShape) invalid.push(chunk.trim());
  }

  return { valid, invalid, totalTokens: tokenCount };
}

export function formatIndianMobile(num: string): string {
  if (num.length !== 10) return num;
  return `+91 ${num.slice(0, 5)} ${num.slice(5)}`;
}
