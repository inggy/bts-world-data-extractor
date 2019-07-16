import { Dictionary, GameFileConversionConfig, Stage, Mission, ObjectConverterDefinition, memberMapping } from "./model/model";
import { convertGameDataFile } from "./GameFiles/GameFileCSVConverter";
import { convertToObject } from "./GameFiles/GameCSVToObjectConverter";
import { writeDataToCSV } from "./GameFiles/CSVFileWriter";

const fileConfig: GameFileConversionConfig[] = [
    {
        inputFileName: "scenario_concept",
        outputFileName: "another_mission_details.csv",
        columnCount: 31,
    },
    {
        inputFileName: "scenario_mission",
        outputFileName: "another_stages.csv",
        columnCount: 27,
    },
    {
        inputFileName: "mainstream_concept",
        outputFileName: "main_mission_details.csv",
        columnCount: 32,
    },
    {
        inputFileName: "mainstream_mission",
        outputFileName: "main_stages.csv",
        columnCount: 22,
    }
];

fileConfig.forEach((config) => {
    convertGameDataFile(config);
});

setTimeout(function() {
const mainStagesDatabase: Dictionary<Stage> = convertToObject("main_stages.csv", {
    id: (record =>  record['index']),
    chapterNumber: (record =>  parseInt((<string> record['mission_chapterno'].slice(-2))) ),
    stageNumber: (record => parseInt(record['mission_branch']) ),
    isMission: (record => parseInt(record['mission_concept']) !== 0),
    missionDetailId: (record => record['mission_concept'])
});

const anotherStagesDatabase: Dictionary<Stage> = convertToObject("another_stages.csv", {
    id: (record =>  record['index']),
    chapterNumber: (record =>  parseInt((<string> record['scenario_chapterno'].slice(-2))) ),
    stageNumber: (record => parseInt(record['scenario_branch']) ),
    isMission: (record => parseInt(record['scenario_concept']) !== 0),
    missionDetailId: (record => record['scenario_concept'])
});

const memeberCardColumns = ["concept_card1","concept_card2","concept_card3","concept_card4","concept_card5","concept_card6","concept_card7"];

const missionConversionConfig: ObjectConverterDefinition = {
    id: (record =>  record['index']),
    empathy: (record =>  parseInt(record['concept_para1']) / 100),
    passion: (record =>  parseInt(record['concept_para2']) / 100),
    stamina: (record =>  parseInt(record['concept_para3']) / 100),
    wisdom: (record =>  parseInt(record['concept_para4']) / 100),
    targetScore1: (record =>  parseInt(record['mission_score1'])),
    targetScore2: (record =>  parseInt(record['mission_score2'])),
    targetScore3: (record =>  parseInt(record['mission_score3'])),
    numCards: (record =>  {
        return memeberCardColumns
            .filter((columnName) => parseInt(record[columnName]) > 0)
            .length;
    }),
    allowableMember: (record => memberMapping[record[memeberCardColumns[0]]])
};

const mainMissionDatabase: Dictionary<Mission> = convertToObject("main_mission_details.csv", missionConversionConfig);
const anotherMissionDatabase: Dictionary<Mission> = convertToObject("another_mission_details.csv", missionConversionConfig);

writeDataToCSV("consumable_main_stage.csv", Object.values(mainStagesDatabase).filter(stage => stage.isMission).map((stage) => {
    const missionDetails = mainMissionDatabase[stage.missionDetailId];
    return [
        stage.chapterNumber,
        stage.stageNumber,
        missionDetails.targetScore1,
        missionDetails.targetScore2,
        missionDetails.targetScore3,
        missionDetails.numCards,
        missionDetails.empathy,
        missionDetails.passion,
        missionDetails.stamina,
        missionDetails.wisdom
    ];
}));

writeDataToCSV("consumable_another_stages.csv", Object.values(anotherStagesDatabase).filter(stage => stage.isMission).map((stage) => {
    const missionDetails = anotherMissionDatabase[stage.missionDetailId];
    return [
        missionDetails.allowableMember,
        stage.chapterNumber,
        stage.stageNumber,
        missionDetails.targetScore1,
        missionDetails.targetScore2,
        missionDetails.targetScore3,
        missionDetails.numCards,
        missionDetails.empathy,
        missionDetails.passion,
        missionDetails.stamina,
        missionDetails.wisdom
    ];
}));
}, 5000);
