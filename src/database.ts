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
    Item,
    EventMission,
    CardRestriction,
    CardBonus,
    HashTagCard,
    MagicShopMission
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
        columnCount: 20,
        firstColumnName: "id"
    },
    {
        inputFileName: "eventstagemission",
        outputFileName: "event_stages.csv",
        columnCount: 47,
        firstColumnName: "index",
    },
    {
        inputFileName: "membercard",
        outputFileName: "cards_raw.csv",
        columnCount: 62,
        firstColumnName: "index",
    },
    {
        inputFileName: "hashtag",
        outputFileName: "event_hashtag.csv",
        columnCount: 6,
        firstColumnName: "index",
    },
    {
        inputFileName: "anotherstory_mission",
        outputFileName: "magic_shop.csv",
        columnCount: 64,
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
            
            function calculateCardRestrictions(record: Dictionary<any>, columnsNames: string[]): CardRestriction[] {
                const result: CardRestriction[] = [];
                columnsNames.forEach(columnName => {
                    const cardFilter = parseInt(record[columnName]);
                    let member = 'ALL';
                    let trait = 'ALL'
                    if (cardFilter > 0) {
                        if (cardFilter <= 8) {
                            member = memberMapping[cardFilter]
                        } else {
                            member = memberMapping[Math.floor(cardFilter / 100)];
                            trait = statMapping[cardFilter % 100];
                        }
                        result.push({
                            member,
                            trait
                        });
                    }
                })
                return result;
            }

            const missionConversionConfig: ObjectConverterDefinition = {
                id: (record =>  record['index']),
                empathy: (record =>  parseInt(record['concept_para1']) / 100),
                passion: (record =>  parseInt(record['concept_para2']) / 100),
                stamina: (record =>  parseInt(record['concept_para3']) / 100),
                wisdom: (record =>  parseInt(record['concept_para4']) / 100),
                targetScore1: (record =>  parseInt(record['mission_score1'])),
                targetScore2: (record =>  parseInt(record['mission_score2'])),
                targetScore3: (record =>  parseInt(record['mission_score3'])),
                cardRestrictions: (record => calculateCardRestrictions(record, memeberCardColumns)),
                cardBonuses: (record => []),
                exp: (record => parseInt(record['concept_accountexp'])),
                goldMin: (record => parseInt(record['reward_gold_min'])),
                goldMax: (record => parseInt(record['reward_gold_max'])),
                drop1: (record => record['droptabl_index_1']),
                drop2: (record => record['droptabl_index_2'])
            };

            const mainMissionDatabase: Dictionary<Mission> = convertToObject("main_mission_details.csv", missionConversionConfig);
            const anotherMissionDatabase: Dictionary<Mission> = convertToObject("another_mission_details.csv", missionConversionConfig);
            const eventMissionDatabase: Dictionary<EventMission> = convertToObject("event_stages.csv", {
                // Shared Attribute
                id: (record =>  record['index']),
                // Stage attributes      
                chapterNumber: (record =>  1),
                stageNumber: (record => parseInt(record['stageseq']) ),
                isMission: (record => record['stagetype'] === "2"),
                missionDetailId: (record => "0"),
                wings: (record => "0"),
                // Mission attributes
                empathy: (record =>  parseInt(record['missionpara1']) / 100),
                passion: (record =>  parseInt(record['missionpara2']) / 100),
                stamina: (record =>  parseInt(record['missionpara3']) / 100),
                wisdom: (record =>  parseInt(record['missionpara4']) / 100),
                targetScore1: (record =>  parseInt(record['clearscore1'])),
                targetScore2: (record =>  parseInt(record['clearscore2'])),
                targetScore3: (record =>  parseInt(record['clearscore3'])),
                numCards: (record =>  parseInt(record['cardslotcount'])),
                exp: (record => 0),
                goldMin: (record => 0),
                goldMax: (record => 0),
                drop1: (record => 0),
                drop2: (record => 0),
                cardRestrictions: (record => {
                    const result: CardRestriction[] = [];
                    for(let i = 0; i < parseInt(record['cardslotcount']); i++) {
                        result.push({
                            member: 'ALL',
                            trait: 'ALL'
                        })
                    }
                    return result;
                }),
                cardBonuses: (record => {
                    const result: CardBonus[] = [];
                    if (record['hashtaggroupid1'] !== "0") {
                        result.push({
                            hashtagId: record['hashtaggroupid1'],
                            multiplier: Math.floor(parseInt(record['hashtagbonuspara1']) / 100)
                        });
                    }
                    if (record['hashtaggroupid2'] !== "0") {
                        result.push({
                            hashtagId: record['hashtaggroupid2'],
                            multiplier: Math.floor(parseInt(record['hashtagbonuspara2']) / 100)
                        });
                    }
                    if (record['hashtaggroupid3'] !== "0") {
                        result.push({
                            hashtagId: record['hashtaggroupid3'],
                            multiplier: Math.floor(parseInt(record['hashtagbonuspara3']) / 100)
                        });
                    }
                    return result;
                })
            });

            const cardDatabase: Dictionary<Card> = convertToObject("cards_raw.csv", {
                id: (record =>  record['index']),
                name: (record =>  record['membercard_name'].toLowerCase()),
                member: (record =>  memberMapping[record['membercard_member']]),
                primaryStat: (record =>  statMapping[record['membercard_temper']]),
                stars: (record => parseInt(record['membercard_grade'])),
                empathy: (record => parseInt(record['membercard_active_basic'])),
                passion: (record => parseInt(record['membercard_manage_basic'])), 
                stamina: (record => parseInt(record['membercard_idea_basic'])),
                wisdom: (record => parseInt(record['membercard_design_basic'])),
                tier: (record => {
                    const star = parseInt(record['membercard_grade']);
                    if (star <= 2) return 0;
                    return 1;
                })
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

            const hashtagDatabase: Dictionary<HashTagCard> = convertToObject("event_hashtag.csv", {
                id: (record => record['index']),
                hashtagId: (record => record['groupid']),
                hashtagStringId: (record => record['hashtagtitle']),
                cardId: (record => record['typeinfoid'])
            });

            const magicShopCardColumns = ["card1","card2","card3","card4","card5","card6","card7"]
            const magicShopDatabase: Dictionary<MagicShopMission> = convertToObject("magic_shop.csv", {
                id: (record => record['index']),
                chapterNumber: (record => parseInt((<string> record['chapterno'].slice(-2)))),
                stageNumber: (record => parseInt(record['stageseq'])),
                isMission: (record => parseInt(record['stagetype']) === 2),
                empathy: (record =>  parseInt(record['para1']) / 100),
                passion: (record =>  parseInt(record['para2']) / 100),
                stamina: (record =>  parseInt(record['para3']) / 100),
                wisdom: (record =>  parseInt(record['para4']) / 100),
                targetScore: (record =>  parseInt(record['clearscoregoal'])), // clearscoregoal
                clearScoreRange1: (record => parseInt(record['clearscorerange_1'])), //clearscorerange_1
                clearScoreRange2: (record => parseInt(record['clearscorerange_2'])), //clearscorerange_2
                clearScoreRange3: (record => parseInt(record['clearscorerange_3'])), //clearscorerange_3
                cardRestrictions: (record => calculateCardRestrictions(record, magicShopCardColumns)),
                cardBonuses: (record => {
                    const result: CardBonus[] = [];
                    if (record['hashtaggroupid1'] !== "0") {
                        result.push({
                            hashtagId: record['hashtaggroupid1'],
                            multiplier: Math.floor(parseInt(record['hashtagaddpoint1']) / 100)
                        });
                    }
                    if (record['hashtaggroupid2'] !== "0") {
                        result.push({
                            hashtagId: record['hashtaggroupid2'],
                            multiplier: Math.floor(parseInt(record['hashtagaddpoint2']) / 100)
                        });
                    }
                    if (record['hashtaggroupid3'] !== "0") {
                        result.push({
                            hashtagId: record['hashtaggroupid3'],
                            multiplier: Math.floor(parseInt(record['hashtagaddpoint3']) / 100)
                        });
                    }
                    return result;
                })
            });

            resolve({
                mainMissionDatabase,
                anotherMissionDatabase,
                mainStageDatabase,
                anotherStageDatabase,
                eventMissionDatabase,
                hashtagDatabase,
                cardDatabase,
                rewardToItemDatabase,
                itemDatabase,
                magicShopDatabase,
            });
       
        });
    });
}