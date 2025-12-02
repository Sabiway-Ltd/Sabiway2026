// utils/contentValidator.ts

// Forbidden patterns: phone numbers, external socials, direct messaging attempts, emails, @handles
const forbiddenPatterns = [
  // Phone numbers: 8–15 digits total, optional +, optional separators
  /\+?\d[\d\s\-()]{7,14}\d/,

  // Explicit "contact me" intent
  /\b(whatsapp|text\s?me|call\s?me|message\s?me|dm\s?me|reach\s?me)\b/i,

  // Email addresses
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,

  // External usernames (platform-specific only)
  /@(instagram|facebook|snapchat|telegram|twitter|x)\b/i,

  // Explicit social platform contacts
  /\b(on|via|through)\s+(whatsapp|telegram|snapchat|instagram|facebook|twitter|x)\b/i,
];


// const forbiddenPatterns = []

/**
 * Returns true if the text contains forbidden contact info
 */
export const isRiskyContent = (text?: string | null): boolean => {
  if (!text?.trim()) return false; // no content means no risk
  return forbiddenPatterns.some((pattern) => pattern.test(text));
};
