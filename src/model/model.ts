export interface GameFileConversionConfig {
    inputFileName: string;
    outputFileName: string;
    columnCount: number;
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