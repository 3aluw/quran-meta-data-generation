import type {  AyahId } from 'quran-meta'
type comparisonType = "exact" | "levenshtein"

export function normalizeArabic(text: string) {
  return text
    // Normalize Alef variants to bare Alef
    .replace(/[\u0622\u0623\u0625\u0671\u0670]/g, 'ا')
    // Normalize Hamza-on-Waw or Hamza-on-Ya to plain Hamza form (أ)
    .replace(/[ءؤئ]/g, 'أ')
    // Normalize Yeh forms: Persian (ی), Urdu (ے) → Arabic (ي)
    .replace(/[\u06CC\u06D2]/g, 'ي')
    // Normalize Teh Marbuta to Heh (optional depending on your need)
    .replace(/\u0629/g, 'ه')
    // Remove ALL combining marks (tashkeel, Qur’anic signs, etc.)
    .replace(/\p{M}+/gu, '')
    // Remove extra spaces
    .replace(/\s+/g, '')
    .trim();
}
// Levenshtein distance
export function levenshtein(a: String, b: string) {
  const matrix: number[][] = Array.from({ length: a.length + 1 }, () => []);

  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,    // deletion
        matrix[i][j - 1] + 1,    // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }
  return matrix[a.length][b.length];
}

export function getFirstLetters(text: string, count = 10) {
  const normalized = normalizeArabic(text);
  // Only keep Arabic letters (ignoring digits, punctuation, etc.)
  const lettersOnly = normalized.match(/[\u0621-\u063A\u0641-\u064A]/g) || [];
  return lettersOnly.slice(0, count).join('');
}

export function compareFirstLetters(text1: string, text2: string, comparisonType: comparisonType = "exact") {
  if (comparisonType == "exact") return getFirstLetters(text1) === getFirstLetters(text2);
  if (comparisonType == "levenshtein") return levenshtein(getFirstLetters(text1), getFirstLetters(text2)) <= 4;
}

export const arrayLog = (arr: any[], )=> {
  for (let i = 0; i < arr.length; i += 20) {
  console.log( arr.slice(i, i + 20).map(v => v === undefined ? "undefined" : v).join(',') + ",");
}
}