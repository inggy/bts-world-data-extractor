import fs from 'fs';
import { convertGameDataFile } from './GameFiles/GameFileCSVConverter';
import { Dictionary, Card, memberMapping, statMapping } from './model/model';
import { convertToObject } from './GameFiles/GameCSVToObjectConverter';
import { writeDataToCSV } from './GameFiles/CSVFileWriter';

convertGameDataFile({
    inputFileName: "membercard",
    outputFileName: "cards_raw.csv",
    columnCount: 61,
});

setTimeout(function() {

const validChar = ["’", "\n", "★", " "];
function isValidChar(char: String): boolean {
    if ((char >= "!" && char <= "~") || (validChar.indexOf(char.toString()) >= 0)) {
        return true;
    }
    return false; 
}

let text: string = fs.readFileSync("./game_data/mtf_string_string_en", 'utf-8');

let outText = "";
for (var i = 0; i < text.length; i++) {
    let char = text.charAt(i);
    if (isValidChar(char)) {
        outText+= char;
    }
}

outText = outText.replace(/\\n/g, "");
outText = outText.replace(/\n/g, "");
outText = outText.replace(/\d{2}[.]\d{2}[.]\d{2}/g, "");
outText = outText.replace(/★\n/g, "★");
outText = outText.replace(/’/g, "'");
outText = outText.replace(/card_1star/gmi, "/card_1star");
outText = outText.replace(/card_2star/gmi, "/card_2star");
outText = outText.replace(/card_3star/gmi, "/card_3star");
outText = outText.replace(/card_4star/gmi, "/card_4star");
outText = outText.replace(/card_5star/gmi, "/card_5star");
outText = outText.replace(/[\s]+\//gm, "/");
outText = outText.replace(/\/[\s]+/gm, "/");
outText = outText.replace(/[/]+/gm, "/");

fs.writeFileSync("./output/tmp/raw_strings.txt",outText, 'utf-8');
const corpus = outText;

function findCardTitleFromCorpus(card: Card): string {

    const template = `${card.id}[\\d]*/Card${card.stars}★([^/]+)`;

    const regex1 = new RegExp(template,'igm');

    const regexResult = regex1.exec(corpus);
    
    if (regexResult ) {
        return regexResult[1];
    } else {
        return "NO_MATCH";
    }
}

const cardDatabase: Dictionary<Card> = convertToObject("cards_raw.csv", {
    id: (record =>  record['membercard_name'].toLowerCase()),
    name: (record =>  record['membercard_name'].toLowerCase()),
    member: (record =>  memberMapping[record['membercard_member']]),
    primaryStat: (record =>  statMapping[record['membercard_temper']]),
    stars: (record => parseInt(record['membercard_grade'])),
    empathy: (record => parseInt(record['membercard_active_basic'])),
    passion: (record => parseInt(record['membercard_manage_basic'])), 
    stamina: (record => parseInt(record['membercard_idea_basic'])),
    wisdom: (record => parseInt(record['membercard_design_basic'])),
});

writeDataToCSV("consumable_cards.csv", Object.values(cardDatabase)
    .filter((card) => card.name.indexOf("_max") < 0)
    .map((card) => {
    return [
        card.id,
        card.stars,
        findCardTitleFromCorpus(card),
        card.primaryStat,
        card.empathy,
        card.passion,
        card.stamina,
        card.wisdom
    ];
}));

}, 3000);