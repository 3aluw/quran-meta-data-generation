import { qulunData } from "./QalounData"
import { arrayLog } from "./utils"
/* 
//this module will go through a dataset and generate pageList
// it ignores ayahs that expands other two pages ie: 84-85
// in other words it only takes the first ayah starting in page
*/
const dataset = qulunData
const pageList:number[] =[]
dataset.forEach((ayahObj,index,array) => {
if(!Number(ayahObj.page)) return;
if((ayahObj?.page  !== array[index-1]?.page)){
    pageList.push(ayahObj.id)}
})
arrayLog(pageList)
