//generates a list of ids based on another riwaya list of ids
/**************************TAKE AN AYAH ID ARRAY (ie: FROM HAFS) AND TRANSFORM IT TO QALUN */
import { compareFirstLetters, arrayLog } from './utils'
import type { AyahId, Surah } from 'quran-meta'
import { getSurahMeta } from 'quran-meta'
import hafsData from './HafsData'
import { qulunData } from "./QalounData"

type comparisonType = "exact" | "levenshtein"

interface ICheckAyah {
  id: AyahId
  ayahText: string
  datasetText: string
  thumunIndex: number
}
//hafs ruku ids

const sourceIds: AyahId[] = [
    1160,
    1722,
    1951,
    2138,
    2308,
    2613,
    2672,
    2915,
    3185,
    3518,
    3994,
    4256,
    4846,
    5905,
    6125
]
const sourceDataset = hafsData;
const outputDataset = qulunData;
const findAyahInSource = (ayahId: AyahId) => sourceDataset[ayahId - 1]?.aya_text;
const findAyahInOutput = (ayahId: AyahId) => outputDataset[ayahId - 1]?.aya_text;

const isAyahTextRight = (text: string, ayahId: AyahId, comparisonType: comparisonType = "exact") => {
  const foundAyahText = outputDataset[ayahId - 1]?.aya_text;

  return text && foundAyahText ? compareFirstLetters(text, foundAyahText, comparisonType
  ) : false;
}

const checkSurroundingAyahs = (text: string, ayahId: number, comparisonType: comparisonType = "levenshtein"): number | undefined => {
  const maxId = outputDataset.length;
  const maxOffset = 25;

  for (let offset = 0; offset <= maxOffset; offset++) {
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
const findAyahIdInOutput = (surahId: number, ayahNo: number) => {
  const lastAyahId = getSurahMeta(surahId as Surah).lastAyahId
  return outputDataset.find(ayah => ayah.sura_no === surahId && ayah.aya_no === ayahNo)?.id || lastAyahId
}
//enter an ayahId of source and get the corresponding ayahId in output that matches it in sura_no and aya_no 
const adjustAyahToOutput = (ayahId: AyahId) => {
  const source_sura_no = sourceDataset[ayahId - 1].sura_no;
  const source_aya_no = sourceDataset[ayahId - 1].aya_no;
  const outputAyah = outputDataset.find(ayah => ayah.id === ayahId);
  const isAyahNumbersMatch = outputAyah && source_sura_no === outputAyah.sura_no && source_aya_no === outputAyah.aya_no
  return isAyahNumbersMatch ? ayahId : findAyahIdInOutput(source_sura_no, source_aya_no)
}
//generate new Ids based on source ids
const mapToOutput = (comparisonType: comparisonType) => {
  const outputIds = sourceIds.map((ayahId) => {
    const hafsText = findAyahInSource(ayahId);
    const adjustedId = adjustAyahToOutput(ayahId);
    const outputText = findAyahInOutput(adjustedId)
    if (!hafsText || !outputText) return undefined
    const result = compareFirstLetters(hafsText, outputText, comparisonType) ? adjustedId : checkSurroundingAyahs(hafsText, adjustedId, comparisonType)
    return result
  })
  return outputIds
}
const exactMatchIds = mapToOutput("exact") 
const levenshteinIds = mapToOutput("levenshtein")
const unfoundAyahs: any = []
const idsAddedByLevenshteinMethod: any = []

//hybrid approach: first exact match, then levenshtein, then default to same id adjusted to output dataset
const hybridIds = exactMatchIds.map((id, index) => {
  if (id) return id
  if (levenshteinIds[index]) {
    const foundId = levenshteinIds[index]
    idsAddedByLevenshteinMethod.push({ id: foundId, sourceId: sourceIds[index], index })
    return foundId
  }
  const defaultId = sourceIds[index]
  const sourceAyah = sourceDataset[defaultId - 1]
  const outputId = adjustAyahToOutput(defaultId)
  unfoundAyahs.push({ outputId, ayahText: sourceAyah.aya_text, surah: sourceAyah.sura_no, ayah: sourceAyah.aya_no, })
  return outputId
})
//arrayLog(hybridIds);
//CHECK ids that are not added by exact match manually
//console.log(idsAddedByLevenshteinMethod); //ALL CHECKED
//console.log(unfoundAyahs) //ALL CHECKED

 /* LOGICAL TEST */
//log each id that is larger then the next id (which is an error)
 const IdLargerThenNext = hybridIds.filter((id,index,array)=>{
  return id <=  array[index-1]
})
//console.log(IdLargerThenNext); //CHECKED
//log ids that are not from the same surah as the source ids 
const notSameSurah = hybridIds.filter((id,index)=>{
const surahInSource = sourceDataset[sourceIds[index]-1].sura_no
const surahInOutput = outputDataset[id!-1].sura_no
return surahInOutput !== surahInSource
})
//console.log(notSameSurah); //CHECKED