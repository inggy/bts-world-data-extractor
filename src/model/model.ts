export interface GameFileConversionConfig {
    inputFileName: string;
    outputFileName: string;
    columnCount: number;
    firstColumnName: string;
}

export interface Dictionary<T> {
    [key: string]: T;
}

export interface Indexable extends Dictionary<any> {
    id: string;
}

export type ObjectConverterDefinition = Dictionary<(record: Dictionary<any>) => number | string | boolean>;

export interface Stage extends Indexable {
    chapterNumber: number;
    stageNumber: number;
    isMission: boolean;
    missionDetailId: string;
}

export interface RewardToItemMapping extends Indexable {
    rewardId: string // box_id
    quantity: number // product_count
    itemId: string // product_id
}

export interface Item extends Indexable {
    name: string; // name_id
}

export interface Mission extends Indexable {
    empathy: number; // 3 concept_para1
    passion: number; // 5 concept_para2
    stamina: number; // 7 concept_para3
    wisdom: number; // 9 concept_para4
    numCards: number; // 11-17 concept_card[1-7]
    allowableMember: string; //11-17
    targetScore1: number; // 19 mission_score_1
    targetScore2: number; // 20 mission_score_2
    targetScore3: number; // 31 mission_score_3
    exp: number; // concept_accountexp,
    goldMin: number; // reward_gold_min
    goldMax: number; // reward_gold_max,
    drop1: string; // droptabl_index_1,
    drop2: string; // droptabl_index_2
}

export interface Card extends Indexable {
    name: string;
    member: string;
    primaryStat: string;
    stars: number;
    empathy: number;
    passion: number;
    stamina: number;
    wisdom: number;
}

export interface GameDatabase {
    mainMissionDatabase: Dictionary<Mission>,
    anotherMissionDatabase: Dictionary<Mission>,
    mainStageDatabase: Dictionary<Stage>,
    anotherStageDatabase: Dictionary<Stage>,
    cardDatabase: Dictionary<Card>,
    rewardToItemDatabase: Dictionary<RewardToItemMapping>,
    itemDatabase: Dictionary<Item>
}

export const memberMapping: Dictionary<string> = {
    "8": "ALL",
    "1": "Jin",
    "2": "Suga",
    "3": "J-Hope",
    "4": "RM",
    "5": "Jimin",
    "6": "V",
    "7": "Jungkook",
}

export const statMapping: Dictionary<string> = {
    "1": "empathy",
    "2": "passion",
    "3": "stamina",
    "4": "wisdom",
}

export const agencyItemMemberNameToCanonicalName: Dictionary<string> = {
    "Jin": "Jin",
    "Suga": "Suga",
    "Jhope": "J-Hope",
    "RM": "RM",
    "Jimin": "Jimin",
    "V": "V",
    "JungKook": "Jungkook"
}
