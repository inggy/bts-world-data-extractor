import fs from 'fs';
import { Card } from '../model/model';

const validChar = ["’", "\n", "★", " "];
function isValidChar(char: String): boolean {
    if ((char >= "!" && char <= "~") || (validChar.indexOf(char.toString()) >= 0)) {
        return true;
    }
    return false; 
}

function processStringFile():string {
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
    outText = outText.replace(/> \(\)/g, "");
    outText = outText.replace(/<\(  \)20/g, "");
    outText = outText.replace(/:\(  \)20/g, "");
    outText = outText.replace(/\(9 \)20/g, "");
    outText = outText.replace(/A \(\)/g, "");
    
    outText = outText.replace(/card_1star/gmi, "/card_1star");
    outText = outText.replace(/card_2star/gmi, "/card_2star");
    outText = outText.replace(/card_3star/gmi, "/card_3star");
    outText = outText.replace(/card_4star/gmi, "/card_4star");
    outText = outText.replace(/card_5star/gmi, "/card_5star");
    outText = outText.replace(/[\s]+\//gm, "/");
    outText = outText.replace(/\/[\s]+/gm, "/");
    outText = outText.replace(/[/]+/gm, "/");
    
    fs.writeFileSync("./output/tmp/raw_strings.txt", outText, 'utf-8');

    return outText;
}

export function CardNameTranslation(): { getName(card: Card): string; getHashtag(stringId: string): string} {
    const corpus = processStringFile();
    return {
        getName: ((card: Card) => {
            const template = `${card.name}[\\d]*/Card${card.stars}★([^/]+)`;
        
            const regex1 = new RegExp(template,'igm');
        
            const regexResult = regex1.exec(corpus);
            
            if (regexResult ) {
                return regexResult[1];
            } else {
                return "NO_MATCH";
            }
        }),
        getHashtag: (stringId: string) => {

            const template = `${stringId}[^\\/]*(.+?)(?=<\\/color>)`;
            const regex1 = new RegExp(template,'igm');
            const regexResult = regex1.exec(corpus);
            if (regexResult ) {
                const fullMatch = regexResult[1]
                return fullMatch.substring(fullMatch.lastIndexOf("#"));
            } else {
                return "NO_MATCH";
            }
            return "";
        }
    };
}

