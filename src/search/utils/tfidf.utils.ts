import { stemmer } from 'stemmer';

export const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'by',
  'for',
  'from',
  'has',
  'he',
  'in',
  'is',
  'it',
  'its',
  'of',
  'on',
  'that',
  'the',
  'to',
  'was',
  'were',
  'will',
  'with',
  'this',
  'these',
  'those',
  'i',
  'you',
  'we',
  'they',
]);

export function tokenize(text: string): string[] {
  if (!text) return [];

  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((word) => word.trim())
    .filter((word) => word.length > 1 && !STOP_WORDS.has(word))
    .map((word) => stemmer(word));
}

export function computeTF(tokens: string[]): Record<string, number> {
  const freq: Record<string, number> = {};
  tokens.forEach((t) => {
    freq[t] = (freq[t] || 0) + 1;
  });

  const total = tokens.length;
  if (total === 0) return {};

  const tf: Record<string, number> = {};
  Object.entries(freq).forEach(([term, count]) => {
    tf[term] = count / total;
  });

  return tf;
}
