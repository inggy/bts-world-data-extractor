import { GameFileConversionConfig, MobileInteractionRow, Dictionary, memberMapping } from "./model/model";
import fs from 'fs';
import { writeDataToCSV } from "./GameFiles/CSVFileWriter";
import { buildMobileDatabase } from "./Database/MobileDatabase";

const validChar = ["’", "\n", "★", " "];
function isValidDialogChar(char: String): boolean {
    if ((char >= "!" && char <= "~") || (validChar.indexOf(char.toString()) >= 0)) {
        return true;
    }
    return false; 
}

function processStringFile(): Dictionary<string> {
    let text: string = fs.readFileSync("./game_data/mtf_string_string_mobile_en", 'utf-8');
    let outText = "";
    for (var i = 0; i < text.length; i++) {
        let char = text.charAt(i);
        if (isValidDialogChar(char)) {
            outText+= char;
        }
    }

    outText = outText.replace(/\\n/g, "");
    outText = outText.replace(/\n/g, "");
    outText = outText.replace(/★\n/g, "★");
    outText = outText.replace(/’/g, "'");
    
    outText = outText.replace(/0SMS/g, "\nSMS");
    outText = outText.replace(/0SNS/g, "\nSNS");
    outText = outText.replace(/0Voice/g, "\nVoice");
    outText = outText.replace(/0Video/g, "\nVideo");
    outText = outText.replace(/(\d{2}_\d{2}_\d{2})000/g, (match, p1) => {
        return p1 + "|*|";
    });

    outText = outText.replace(/video_\S+,\d{3}/g, "|*|");
    fs.writeFileSync("./output/tmp/raw_mobile_strings.txt", outText, 'utf-8');

    const result: Dictionary<string> = {};
    outText.split("\n").forEach((line, i) => {
        if (i === 0) return;

        const parts = line.split("|*|");
        if (parts.length !== 2) {
            console.log(line);
            throw "Unexpected mobile string format";
        }

        result[parts[0].trim()] = parts[1].trim();
        
    })

    result["0"] = "";

    return result;
}

function buildRowId(group: number, sequence: number) {
    return `${group}-${sequence}`
}
function getChoicesRowOffset(db: Dictionary<MobileInteractionRow>, resultsRow: MobileInteractionRow): MobileInteractionRow | void {
    const resultsSequenceNum = resultsRow.sequence;
    let testSquenceNum = resultsSequenceNum;
    while (testSquenceNum-- > 0) {
        const rowId = buildRowId(resultsRow.interactionGroup, testSquenceNum);
        const testRow = db[rowId];
        if (testRow && testRow.dialogType === 1) {
            return testRow;
        }
    }
}

function getContextRows(db: Dictionary<MobileInteractionRow>, resultsRow: MobileInteractionRow, choicesSequenceNumber: number): MobileInteractionRow[] {
    const results = [];
    for (let i = 0; i < choicesSequenceNumber; i++) {
        const rowId = buildRowId(resultsRow.interactionGroup, i);
        const testRow = db[rowId];
        if (testRow) {
            results.push(testRow);
            if (testRow.dialogKey1 !== "0") {
                break;
            }
        }
    }


    for (let i = choicesSequenceNumber - 1; i > 0; i--) {
        const rowId = buildRowId(resultsRow.interactionGroup, i);
        const testRow = db[rowId];
        if (testRow) {
            results.push(testRow);
            if (testRow.dialogKey1 !== "0") {
                break;
            }
        }
    }

    return results;
}

function convertAllRowToDialog(rows: MobileInteractionRow[]): string[] {
    let result: string[] = [];
    rows.forEach(row => {
        if (row.dialogKey1 === "0") {
            result.push("MEDIA_FILE");
        } else {
            result.push(mobileStrings[row.dialogKey1]);
        }

        if (row.dialogKey2 !== "0") {
            result.push(mobileStrings[row.dialogKey2]);
        }

        if (row.dialogKey3 !== "0") {
            result.push(mobileStrings[row.dialogKey3]);
        }
    })
    result = result.filter((s, i) => i == result.indexOf(s));
    return result;
}

function processDatabase(
        outFileName: string,
        db: Dictionary<MobileInteractionRow>,
        stringDb: Dictionary<string>): void {
    writeDataToCSV(outFileName, Object.values(db)
    .filter(interaction => interaction.affinity1 > 0)
    .map(interactionResult => {
            const { affinity1, affinity2, affinity3 } = interactionResult;
            const choicesRow = getChoicesRowOffset(db, interactionResult);
            if (!choicesRow) {
                console.log(interactionResult);
                throw "No choices found";
            }

            const {
                dialogKey1,
                dialogKey2,
                dialogKey3,
            } = choicesRow;

            const dialogArray = convertAllRowToDialog(getContextRows(db, interactionResult, choicesRow.sequence));
            if (dialogArray.length === 0) {
                console.log(interactionResult);
                throw "No context found for result";
            }

            const member = Object.values(memberMapping).find(memberName => {
                return interactionResult.dialogKey1.toLocaleLowerCase().indexOf(`_${memberName.toLocaleLowerCase()}_`) > -1
            });

            if (!member) {
                console.log(interactionResult)
                throw "cannot identify member";
            }


        return [
            interactionResult.id,
            member,
            dialogArray,
            affinity1,
            dialogKey1,
            affinity2,
            dialogKey2,
            affinity3,
            dialogKey3,
            stringDb[dialogKey1],
            stringDb[dialogKey2],
            stringDb[dialogKey3],
        ];
    })
);
}

const mobileStrings = processStringFile();

buildMobileDatabase().then(mobileDatabase => {
    

    const {
        smsDatabase,
        socialDatabase,
        voiceDatabase,
    } = mobileDatabase;


    processDatabase("mobile_sms.csv", smsDatabase, mobileStrings);
    
    processDatabase("mobile_social.csv", socialDatabase, mobileStrings);

    processDatabase("mobile_voice.csv", voiceDatabase, mobileStrings);
});