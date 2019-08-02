import {
    GameDatabase,
    GameFileConversionConfig,
    Dictionary,
    Stage,
    ObjectConverterDefinition,
    memberMapping,
    Mission,
    statMapping,
    Card,
    RewardToItemMapping,
    Item
} from "./model/model";
import { convertGameDataFile } from "./GameFiles/GameFileCSVConverter";
import { convertToObject } from "./GameFiles/GameCSVToObjectConverter";

const fileConfigs: GameFileConversionConfig[] = [
    {
        inputFileName: "scenario_concept",
        outputFileName: "another_mission_details.csv",
        columnCount: 31,
        firstColumnName: "index"
    },
    {
        inputFileName: "scenario_mission",
        outputFileName: "another_stages.csv",
        columnCount: 27,
        firstColumnName: "index",
    },
    {
        inputFileName: "mainstream_concept",
        outputFileName: "main_mission_details.csv",
        columnCount: 32,
        firstColumnName: "index"
    },
    {
        inputFileName: "mainstream_mission",
        outputFileName: "main_stages.csv",
        columnCount: 22,
        firstColumnName: "index"
    },
    {
        inputFileName: "droplist",
        outputFileName: "droplist.csv",
        columnCount: 5,
        firstColumnName: "index"
    },
    {
        inputFileName: "itemdata",
        outputFileName: "itemdata.csv",
        columnCount: 19,
        firstColumnName: "id"
    },
    {
        inputFileName: "membercard",
        outputFileName: "cards_raw.csv",
        columnCount: 61,
        firstColumnName: "index",
    }
];

export function buildGameDatabase(): Promise<GameDatabase> {
    return new Promise((resolve, reject) => {
        Promise.all(fileConfigs.map((fileConfig) => { 
            return convertGameDataFile(fileConfig)
        }))
        .then(() => {
            const mainStageDatabase: Dictionary<Stage> = convertToObject("main_stages.csv", {
                id: (record =>  record['index']),
                chapterNumber: (record =>  parseInt((<string> record['mission_chapterno'].slice(-2))) ),
                stageNumber: (record => parseInt(record['mission_branch']) ),
                isMission: (record => parseInt(record['mission_concept']) !== 0),
                missionDetailId: (record => record['mission_concept']),
                wings: (record => record['mission_feather'])
            });

            const anotherStageDatabase: Dictionary<Stage> = convertToObject("another_stages.csv", {
                id: (record =>  record['index']),
                chapterNumber: (record =>  parseInt((<string> record['scenario_chapterno'].slice(-2))) ),
                stageNumber: (record => parseInt(record['scenario_branch']) ),
                isMission: (record => parseInt(record['scenario_concept']) !== 0),
                missionDetailId: (record => record['scenario_concept']),
                wings: (record => record['scenario_feather'])
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
                allowableMember: (record => memberMapping[record[memeberCardColumns[0]]]),
                exp: (record => parseInt(record['concept_accountexp'])),
                goldMin: (record => parseInt(record['reward_gold_min'])),
                goldMax: (record => parseInt(record['reward_gold_max'])),
                drop1: (record => record['droptabl_index_1']),
                drop2: (record => record['droptabl_index_2']),
            };

            const mainMissionDatabase: Dictionary<Mission> = convertToObject("main_mission_details.csv", missionConversionConfig);
            const anotherMissionDatabase: Dictionary<Mission> = convertToObject("another_mission_details.csv", missionConversionConfig);
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

            const rewardToItemDatabase: Dictionary<RewardToItemMapping> = convertToObject("droplist.csv", {
                id: (record =>  record['index']),
                rewardId: (record =>  record['box_id']),
                quantity: (record => parseInt(record['product_count'])),
                itemId: (record =>  record['product_id']),
            });

            const itemDatabase: Dictionary<Item> = convertToObject("itemdata.csv", {
                id: (record =>  record['id']),
                name: (record =>  record['name_id']),
            });

            resolve({
                mainMissionDatabase,
                anotherMissionDatabase,
                mainStageDatabase,
                anotherStageDatabase,
                cardDatabase,
                rewardToItemDatabase,
                itemDatabase,
            });
       
        });
    });
}