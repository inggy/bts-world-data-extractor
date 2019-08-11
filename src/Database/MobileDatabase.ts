import { GameFileConversionConfig, MobileInteractionRow, Dictionary, MobileDatabase, ObjectConverterDefinition, ObjectConverterFilter } from "../model/model";
import { convertToObject } from "../GameFiles/GameCSVToObjectConverter";
import { convertGameDataFile } from '../GameFiles/GameFileCSVConverter';

const fileConfigs: GameFileConversionConfig[] = [
    {
        inputFileName: "mobile_sms",
        outputFileName: "mobile_sms.csv",
        columnCount: 24,
        firstColumnName: "groupid",
    },
    {
        inputFileName: "mobile_sns",
        outputFileName: "mobile_sns.csv",
        columnCount: 21,
        firstColumnName: "groupid",
    },
    {
        inputFileName: "mobile_call",
        outputFileName: "mobile_call.csv",
        columnCount: 21,
        firstColumnName: "groupid",
    }
];

export function buildMobileDatabase(): Promise<MobileDatabase> {
    return new Promise((resolve, reject) => {
        Promise.all(fileConfigs.map((fileConfig) => {
            return convertGameDataFile(fileConfig)
        }))
        .then(() => {
            const smsCSVToObjectConverter: ObjectConverterDefinition = {
                id: (record =>  `${record['groupid']}-${record['seq']}`),
                interactionGroup: (record => record['groupid']),
                sequence: (record => record['seq']),
                dialogType: (record => parseInt(record['dialoguetype'])),
                affinity1: (record => parseInt(record['selectionintimacy1'])),
                affinity2: (record => parseInt(record['selectionintimacy2'])),
                affinity3: (record => parseInt(record['selectionintimacy3'])),
                dialogKey1: (record => record['stringkey1']),
                dialogKey2: (record => record['stringkey2']),
                dialogKey3: (record => record['stringkey3']),
            }

            const smsToCSVFilter: ObjectConverterFilter = (record) => {
                // has non zero group id and string
                return (parseInt(record['groupid']) !== 0) && (record['stringkey1'] !== "_____");
            }

            const smsDatabase: Dictionary<MobileInteractionRow>  = convertToObject("mobile_sms.csv", smsCSVToObjectConverter, smsToCSVFilter);
            const socialDatabase: Dictionary<MobileInteractionRow>  = convertToObject("mobile_sns.csv", smsCSVToObjectConverter, smsToCSVFilter);
            const voiceDatabase: Dictionary<MobileInteractionRow>  = convertToObject("mobile_call.csv", smsCSVToObjectConverter, smsToCSVFilter);

            resolve({
                smsDatabase,
                socialDatabase,
                voiceDatabase,
            })

        });
    });
}