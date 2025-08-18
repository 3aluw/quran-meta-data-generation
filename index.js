"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var QalounData_1 = require("./QalounData");
var thumuns_1 = require("./thumuns");
function normalizeArabic(text) {
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
function levenshtein(a, b) {
    var matrix = Array.from({ length: a.length + 1 }, function () { return []; });
    for (var i = 0; i <= a.length; i++)
        matrix[i][0] = i;
    for (var j = 0; j <= b.length; j++)
        matrix[0][j] = j;
    for (var i = 1; i <= a.length; i++) {
        for (var j = 1; j <= b.length; j++) {
            var cost = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(matrix[i - 1][j] + 1, // deletion
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j - 1] + cost // substitution
            );
        }
    }
    return matrix[a.length][b.length];
}
function getFirstLetters(text, count) {
    if (count === void 0) { count = 10; }
    var normalized = normalizeArabic(text);
    // Only keep Arabic letters (ignoring digits, punctuation, etc.)
    var lettersOnly = normalized.match(/[\u0621-\u063A\u0641-\u064A]/g) || [];
    return lettersOnly.slice(0, count).join('');
}
function compareFirstLetters(text1, text2, comparisonType) {
    if (comparisonType === void 0) { comparisonType = "exact"; }
    if (comparisonType == "exact")
        return getFirstLetters(text1) === getFirstLetters(text2);
    if (comparisonType == "levenshtein")
        return levenshtein(getFirstLetters(text1), getFirstLetters(text2)) <= 2;
}
var isAyahTextRight = function (text, ayahId, comparisonType) {
    var _a;
    if (comparisonType === void 0) { comparisonType = "exact"; }
    var foundAyahText = (_a = QalounData_1.quranData[ayahId - 1]) === null || _a === void 0 ? void 0 : _a.aya_text;
    return compareFirstLetters(text, foundAyahText, comparisonType);
};
var checkSurroundingAyahs = function (text, ayahId, comparisonType) {
    if (comparisonType === void 0) { comparisonType = "levenshtein"; }
    var maxId = 6236;
    var maxOffset = 25;
    for (var offset = 1; offset <= maxOffset; offset++) {
        var backId = ayahId - offset;
        if (backId >= 1 && isAyahTextRight(text, backId, comparisonType)) {
            return backId;
        }
        var forwardId = ayahId + offset;
        if (forwardId <= maxId && isAyahTextRight(text, forwardId, comparisonType)) {
            return forwardId;
        }
    }
    return undefined;
};
var findAyah = function (ayahId) { var _a; return (_a = QalounData_1.quranData[ayahId - 1]) === null || _a === void 0 ? void 0 : _a.aya_text; };
/* const newAyahIds = HizbEighthList.map((verseId, index) => {
  const comparisonText = textArray[index]
  const IdAyah = findAyah(verseId)
  if (!comparisonText) return
  const result = isAyahTextRight(comparisonText, verseId) ? verseId : checkSurroundingAyahs(comparisonText, verseId)
  if (!result) unfoundAyahs.push([verseId, comparisonText, IdAyah])
  return result
}) */
var getNewAyahIds = function (comparisonType) {
    return thumuns_1.newIds.map(function (verseId, index) {
        var comparisonText = thumuns_1.textArray[index];
        if (!comparisonText)
            return;
        var result = isAyahTextRight(comparisonText, verseId, comparisonType) ? verseId : checkSurroundingAyahs(comparisonText, verseId, comparisonType);
        return result;
    });
};
var unfoundAyahs = [];
var idsAddedByLevenshteinMethod = [];
var exactMatchIds = getNewAyahIds("exact");
var levenshteinIds = getNewAyahIds("levenshtein");
var hybridIds = exactMatchIds.map(function (id, index) {
    if (id)
        return id;
    if (levenshteinIds[index]) {
        var foundId = levenshteinIds[index];
        idsAddedByLevenshteinMethod.push({ id: foundId, ayahText: findAyah(foundId), datasetText: thumuns_1.textArray[index], thumunIndex: index });
        return foundId;
    }
    var defaultId = thumuns_1.newIds[index];
    unfoundAyahs.push({ id: defaultId, ayahText: findAyah(defaultId), datasetText: thumuns_1.textArray[index], thumunIndex: index });
});
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
var pickedWithoutMark = QalounData_1.quranData.filter(function (ayahObj, index) {
    return !ayahObj.aya_text.includes('۞') && thumuns_1.newIds.includes(ayahObj.id);
});
console.log(pickedWithoutMark.length);
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
