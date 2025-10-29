// utils/contentValidator.ts

// Forbidden patterns: phone numbers, external socials, direct messaging attempts, emails, @handles
const forbiddenPatterns = [
  /\b\d{7,15}\b/g, // phone numbers (7-15 digits)
  /\+?\d{1,4}[\s-]?\(?\d+\)?[\s-]?\d+[\s-]?\d+/g, // intl phone formats
  /\b(whatsapp|dm me|text me|call me|message me)\b/i,
  /@[a-z][a-z0-9_.]{2,30}/gi, // usernames on other platforms
  /\b\S+@\S+\.\S+\b/gi, // email addresses
  /(telegram|snapchat|instagram|facebook|twitter|x\.com)/i // social apps
];

/**
 * Returns true if the text contains forbidden contact info
 */
export const isRiskyContent = (text?: string | null): boolean => {
  if (!text?.trim()) return false; // no content means no risk
  return forbiddenPatterns.some((pattern) => pattern.test(text));
};
