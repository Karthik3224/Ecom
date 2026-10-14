const MOJIBAKE_PATTERN = /(?:Ã.|Â.|â.|à.|ð.|�)/;

const replacements = [
  [/Ã¢â‚¬Â¢|â€¢|Â·/g, '•'],
  [/Ã¢â€šÂ¹|â‚¹/g, '₹'],
  [/Ã¢â‚¬â€|â€”/g, '—'],
  [/Ã¢â‚¬â€œ|â€“/g, '–'],
  [/Ã¢â‚¬Ëœ|â€˜/g, '‘'],
  [/Ã¢â‚¬â„¢|â€™/g, '’'],
  [/Ã¢â‚¬Å“|â€œ/g, '“'],
  [/Ã¢â‚¬Â|â€/g, '”'],
  [/Ã¢â‚¬Â¦|â€¦/g, '…'],
  [/Ã¢â€žÂ¢|â„¢/g, '™'],
  [/Ã¢Å“â€œ|âœ“/g, '✓'],
  [/Ã—/g, '×'],
];

const brokenScore = (text) => {
  const value = String(text || '');
  const brokenMatches = value.match(/[ÃÂâàð�]/g)?.length || 0;
  const controlMatches = value.match(/[\u0080-\u009f]/g)?.length || 0;
  return brokenMatches * 3 + controlMatches * 2 + (value.includes('�') ? 10 : 0);
};

const latin1ToUtf8 = (value) => {
  const decoder = new TextDecoder('windows-1252');
  const mapping = new Map(Array.from({ length: 256 }, (_, byte) => [decoder.decode(Uint8Array.of(byte)), byte]));
  const bytes = Array.from(value, (char) => {
    if (mapping.has(char)) return mapping.get(char);
    if (char.codePointAt(0) <= 255) return char.codePointAt(0);
    throw new Error('Text includes characters that are not reversible Western bytes');
  });
  return new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(bytes));
};

export const cleanDisplayText = (value) => {
  if (value == null) return '';
  if (typeof value !== 'string') return value;

  let current = value;
  for (const [pattern, replacement] of replacements) {
    current = current.replace(pattern, replacement);
  }

  if (MOJIBAKE_PATTERN.test(current)) {
    try {
      const decoded = latin1ToUtf8(current);
      let repaired = decoded;
      for (const [pattern, replacement] of replacements) {
        repaired = repaired.replace(pattern, replacement);
      }
      if (brokenScore(repaired) < brokenScore(current)) {
        current = repaired;
      }
    } catch {
      // Keep the original text if the browser cannot repair it safely.
    }
  }

  return current.replace(/\s+/g, ' ').trim();
};

export const cleanDisplayList = (items) => Array.isArray(items)
  ? items.map((item) => cleanDisplayText(item)).filter(Boolean)
  : [];
