import { meta, findPage, getSurahMeta, findSurahAyahByAyahId, checkValidSurahAyah, findAyahIdBySurah, findJuz } from 'quran-meta'

import type { Surah, Page, AyahId, Juz, AyahNo, SurahMeta } from 'quran-meta'

import { quranJson } from './quran'
import { quranData } from "./QalounData"
import { thumunObjects, HizbEighthList, textArray } from './thumuns'

function normalizeArabic(text: string) {
  return text
    // Replace special letters (ٱ → ا)
    .replace(/\u0671/g, 'ا')
    .replace(/\u0670/g, 'ا')
    .replace(/[إأآءؤئٶٷٸ]/g, 'أ') // all visible Hamzas → أ
    .replace(/[\u0654\u0655]/g, 'أ')      // combining Hamza above (ٔ) → أ
    // Remove tashkeel
    .replace(/[\u0610-\u061A\u064B-\u065F\u06D6-\u06ED\u0670]/g, '')
    .replace(/\u06CC/g, 'ي') // Persian ی → Arabic ي (optional)    
    .replace(/\s+/g, ''); // Remove all whitespace
}
// Levenshtein distance
function levenshtein(a: String, b: string) {
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

function getFirstLetters(text: string, count = 8) {
  const normalized = normalizeArabic(text);
  // Only keep Arabic letters (ignoring digits, punctuation, etc.)
  const lettersOnly = normalized.match(/[\u0621-\u063A\u0641-\u064A]/g) || [];
  return lettersOnly.slice(0, count).join('');
}

function compareFirstLetters(text1: string, text2: string) {
  //return getFirstLetters(text1) === getFirstLetters(text2);
  return levenshtein(getFirstLetters(text1), getFirstLetters(text2)) <= 2;
}

const isAyahTextRight = (text: string, ayahId: AyahId) => {

  const foundAyahText = quranData[ayahId - 1]?.aya_text;
  return compareFirstLetters(text, foundAyahText)
}

const checkSurroundingAyahs = (text: string, ayahId: number): number | undefined => {
  const maxId = 6236;
  const maxOffset = 25;

  for (let offset = 1; offset <= maxOffset; offset++) {
    const backId = ayahId - offset;
    if (backId >= 1 && isAyahTextRight(text, backId)) {
      return backId;
    }

    const forwardId = ayahId + offset;
    if (forwardId <= maxId && isAyahTextRight(text, forwardId)) {
      return forwardId;
    }
  }

  return undefined;
};

const findAyah = (ayahId: AyahId) => quranData[ayahId - 1]?.aya_text;

const unfoundAyahs: [number, string, string][] = []

const newAyahIds = HizbEighthList.map((verseId, index) => {
  const comparisonText = textArray[index]
  const IdAyah = findAyah(verseId)
  if (!comparisonText) return
  const result = isAyahTextRight(comparisonText, verseId) ? verseId : checkSurroundingAyahs(comparisonText, verseId)
  if (!result) unfoundAyahs.push([verseId, comparisonText, IdAyah])
  return result
})

/* 
const foundTexts = HizbEighthList.map((verseId, index) => {
  const obj = { datasetText: textArray[index], foundText: findAyah(verseId) }
  if (index < 10) console.log(index, obj)
  return obj
}) */
//unfoundAyahs.forEach(e => console.log(e))
newAyahIds.forEach(e => console.log(e))
