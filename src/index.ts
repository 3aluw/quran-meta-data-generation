
import type {  AyahId } from 'quran-meta'
import { compareFirstLetters, getFirstLetters, normalizeArabic } from './utils'
import { qulunData } from "./QalounData"
import {  newIds, textArray } from './thumuns'
type comparisonType = "exact" | "levenshtein"

const isAyahTextRight = (text: string, ayahId: AyahId, comparisonType: comparisonType = "exact") => {
  const foundAyahText = qulunData[ayahId - 1]?.aya_text;
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

const findAyah = (ayahId: AyahId) => qulunData[ayahId - 1]?.aya_text;


/**************************************PROVIDE A TEXT ARRAY / APPROXIMATE AYAH IDs AND GET THUMUNS IDS... */
const getNewAyahIds = (comparisonType: comparisonType) => {
  return newIds.map((verseId, index) => {
    if( verseId === 0) return undefined; // Skip if verseId is 0
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
/*  const unPickedThumuns = qulunData.filter((ayahObj,index)=>{
  return ayahObj.aya_text.startsWith('۞') && !newIds.includes(ayahObj.id)
 })
console.log(unPickedThumuns); // getting [] SO all ayahs starting with ۞ are picked up   */

//this will log all thumuns that are picked but not marked in the Qaloun dataset
/*   const pickedWithoutMark = qulunData.filter((ayahObj,index)=>{
  return !ayahObj.aya_text.startsWith('۞') && newIds.includes(ayahObj.id)
 })
 console.log(pickedWithoutMark); */

 

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



