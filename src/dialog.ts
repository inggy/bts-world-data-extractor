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

interface TempDialog {
    groupId: number;
    sequence: number;
    contextDialog: string[];
    dialogKey1?: string;
    dialogKey2?: string;
    dialogKey3?: string;
    affinity1: number;
    affinity2: number;
    affinity3: number;
}

function convertTempDialogToResultsRow(d: TempDialog, stringDb: Dictionary<string>) {

    const member = Object.values(memberMapping).find(memberName => {
        if (!d.dialogKey1) {
            return "NO DIALOG";
        }
        return d.dialogKey1.toLocaleLowerCase().indexOf(`_${memberName.toLocaleLowerCase()}_`) > -1
    });

    let contextDialogArray = d.contextDialog.map(strKey => stringDb[strKey]);
    contextDialogArray = contextDialogArray.filter((s, i) => i == contextDialogArray.indexOf(s));
    return [
        buildRowId(d.groupId, d.sequence),
        member,
        contextDialogArray,
        d.affinity1,
        d.dialogKey1,
        d.affinity2,
        d.dialogKey2,
        d.affinity3,
        d.dialogKey3,
        d.dialogKey1? stringDb[d.dialogKey1] : "",
        d.dialogKey2? stringDb[d.dialogKey2] : "",
        d.dialogKey3? stringDb[d.dialogKey3] : "",
    ];
}

function processConversation(conversation: MobileInteractionRow[]): TempDialog[] {
    const contextArray: string[] = [];
    const result: TempDialog[] = [];

    let curTempDialog: TempDialog | null = null;
    for (let i = 0; i < conversation.length; i++) {
        const curRow = conversation[i];

        if (contextArray.length === 0 || contextArray[contextArray.length - 1] === "0") {
            contextArray.push(curRow.dialogKey1);
        }
                
        if (/* this is a dialog choice row */ curRow.dialogType === 1) {
            
            if (curTempDialog && curTempDialog.affinity1 !== 0) {
                result.push(curTempDialog);
                curTempDialog = null;
            }

            if (!curTempDialog) {
                curTempDialog = {
                    groupId: curRow.interactionGroup,
                    sequence: curRow.sequence,
                    contextDialog: [...contextArray],
                    affinity1: 0,
                    affinity2: 0,
                    affinity3: 0,
                }
            }

            curTempDialog.dialogKey1 = curRow.dialogKey1;
            curTempDialog.dialogKey2 = curRow.dialogKey2;
            curTempDialog.dialogKey3 = curRow.dialogKey3;

            // Add previous row to context
            curTempDialog.contextDialog.push(conversation[i-1].dialogKey1)
        }

        if (curTempDialog) {
            curTempDialog.affinity1 = Math.max(curTempDialog.affinity1, curRow.affinity1);
            curTempDialog.affinity2 = Math.max(curTempDialog.affinity2, curRow.affinity2);
            curTempDialog.affinity3 = Math.max(curTempDialog.affinity3, curRow.affinity3);
        }
    }

    if (curTempDialog && curTempDialog.affinity1 !== 0) {
        result.push(curTempDialog);
    }

    return result;
}


function processDatabase(
    outFileName: string,
    db: Dictionary<MobileInteractionRow>,
    stringDb: Dictionary<string>): void {

    const interactionGrouped: Dictionary<MobileInteractionRow[]> = {};

    Object.values(db).forEach(interaction => {
        if (!interactionGrouped.hasOwnProperty(interaction.interactionGroup)) {
            interactionGrouped[interaction.interactionGroup] = [];
        }
        interactionGrouped[interaction.interactionGroup].push(interaction);
    });

    Object.values(interactionGrouped).forEach(rows => {
        rows.sort((a, b) => a.sequence - b.sequence);
    });

    const rows: any[] = [];
    Object.values(interactionGrouped).forEach(conversation => processConversation(conversation)
        .forEach(tempDialog => rows.push(convertTempDialogToResultsRow(tempDialog, stringDb))));

    writeDataToCSV(outFileName, rows);
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