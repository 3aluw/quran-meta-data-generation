import { meta, findPage, getSurahMeta, findSurahAyahByAyahId, checkValidSurahAyah, findAyahIdBySurah, findJuz } from 'quran-meta'

import type { Surah, Page, AyahId, Juz, AyahNo, SurahMeta } from 'quran-meta'

import { quranJson } from './quran'
import { quranData } from "./QalounData"
import {  newIds, textArray } from './thumuns'
type comparisonType = "exact" | "levenshtein"

function normalizeArabic(text: string) {
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

function getFirstLetters(text: string, count = 10) {
  const normalized = normalizeArabic(text);
  // Only keep Arabic letters (ignoring digits, punctuation, etc.)
  const lettersOnly = normalized.match(/[\u0621-\u063A\u0641-\u064A]/g) || [];
  return lettersOnly.slice(0, count).join('');
}

function compareFirstLetters(text1: string, text2: string, comparisonType: comparisonType = "exact") {
  if (comparisonType == "exact") return getFirstLetters(text1) === getFirstLetters(text2);
  if (comparisonType == "levenshtein") return levenshtein(getFirstLetters(text1), getFirstLetters(text2)) <= 2;
}

const isAyahTextRight = (text: string, ayahId: AyahId, comparisonType: comparisonType = "exact") => {
  const foundAyahText = quranData[ayahId - 1]?.aya_text;
  return compareFirstLetters(text, foundAyahText, comparisonType)
}

const checkSurroundingAyahs = (text: string, ayahId: number, comparisonType: comparisonType = "levenshtein"): number | undefined => {
  const maxId = 6236;
  const maxOffset = 25;

  for (let offset = 1; offset <= maxOffset; offset++) {
    const backId = ayahId - offset;
    if (backId >= 1 && isAyahTextRight(text, backId, comparisonType)) {
      return backId;
    }

    const forwardId = ayahId + offset;
    if (forwardId <= maxId && isAyahTextRight(text, forwardId, comparisonType)) {
      return forwardId;
    }
  }

  return undefined;
};

const findAyah = (ayahId: AyahId) => quranData[ayahId - 1]?.aya_text;



/* const newAyahIds = HizbEighthList.map((verseId, index) => {
  const comparisonText = textArray[index]
  const IdAyah = findAyah(verseId)
  if (!comparisonText) return
  const result = isAyahTextRight(comparisonText, verseId) ? verseId : checkSurroundingAyahs(comparisonText, verseId)
  if (!result) unfoundAyahs.push([verseId, comparisonText, IdAyah])
  return result
}) */
const getNewAyahIds = (comparisonType: comparisonType) => {
  return newIds.map((verseId, index) => {
    const comparisonText = textArray[index]
    if (!comparisonText) return
    const result = isAyahTextRight(comparisonText, verseId,comparisonType) ? verseId : checkSurroundingAyahs(comparisonText, verseId, comparisonType)
    return result
  })
}
interface ICheckAyah {
  id: AyahId
  ayahText: string
  datasetText: string
  thumunIndex:number
}
const unfoundAyahs: ICheckAyah[] = []
const idsAddedByLevenshteinMethod: ICheckAyah[] = []

const exactMatchIds = getNewAyahIds("exact")
const levenshteinIds = getNewAyahIds("levenshtein")


const hybridIds = exactMatchIds.map((id, index) => {
  if (id) return id
  if (levenshteinIds[index]) {
    const foundId = levenshteinIds[index]
    idsAddedByLevenshteinMethod.push({ id: foundId, ayahText: findAyah(foundId), datasetText: textArray[index],thumunIndex:index })
    return foundId
  }
  const defaultId = newIds[index]
  unfoundAyahs.push({ id: defaultId, ayahText: findAyah(defaultId), datasetText: textArray[index],thumunIndex:index })
})

//this will console the best programmatic copy (it contains exactIds if not found: levenshteinId will be added)
//hybridIds.forEach(e => console.log(e))

//this will console data the Ids that are added via levenshtein method (compare the data with te dataset and modify incorrect Ids)
//idsAddedByLevenshteinMethod.forEach(e => console.log(e))

//this will log the Ids that are not found (neither via exact match nor via Levenshtein method )
//unfoundAyahs.forEach(e => console.log(e)) //logs 0 meaning there all ayahs are matched




                   /* Check using ۞ in the Qaloun dataset */
//the Qaloun dataset has 427 marked thumuns(out of 480)
//check using ۞ in the quran Qaloun dataset (thumuns marked in the qaloun dataset but not added to the list)
/*  const unPickedThumuns = quranData.filter((ayahObj,index)=>{
  return ayahObj.aya_text.startsWith('۞') && !newIds.includes(ayahObj.id)
 })
console.log(unPickedThumuns); // getting [] SO all ayahs starting with ۞ are picked up   */

//this will log all thumuns that are picked but not marked in the Qaloun dataset
  const pickedWithoutMark = quranData.filter((ayahObj,index)=>{
  return !ayahObj.aya_text.startsWith('۞') && newIds.includes(ayahObj.id)
 })
 console.log(pickedWithoutMark);

 

 /* LOGICAL TEST */
//this will log each id that is larger then the next id (which is an error)
/* const IdLargerThenNext = newIds.filter((id,index,array)=>{
  return id <=  array[index-1]
})
console.log(IdLargerThenNext); */

//this will log all ids that are very close to each other : A suspect of an error (not always an error bcs some ayahs are large)
/*  const IdCloseToThenNext = newIds.filter((id,index,array)=>{
  return id -  array[index-1] <=3
})
console.log(IdCloseToThenNext); //All checked */