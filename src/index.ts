import { agencyItemMemberNameToCanonicalName, CardRestriction, CardBonus, HashTagCard, Stage, Mission } from "./model/model";
import { writeDataToCSV } from "./GameFiles/CSVFileWriter";
import { buildGameDatabase } from "./database";
import { CardNameTranslation } from "./GameFiles/CardNameTranslation";
import groupBy from 'lodash/groupBy';
import flatMap from 'lodash/flatMap';
import uniq from 'lodash/uniq';

const _ = {
    groupBy,
    flatMap,
    uniq,
}

buildGameDatabase().then((gameDatabase) => {
    const {
        mainMissionDatabase,
        anotherMissionDatabase,
        mainStageDatabase,
        anotherStageDatabase,
        cardDatabase,
        rewardToItemDatabase,
        itemDatabase,
        eventMissionDatabase,
        hashtagDatabase,
        magicShopDatabase,
    } = gameDatabase;


    function encodeRestrictions(cardRestrictions: CardRestriction[]): string {
        return cardRestrictions.map(cr => {
            return `${cr.member},${cr.trait}`;
        }).join("|");
    }

    function encodeCardBonuses(cardBonuses: CardBonus[]): string {
        return cardBonuses.map(cb => {
            return `${cb.hashtagId},${cb.multiplier}`
        }).join("|");
    }

    writeDataToCSV("consumable_main_stage.csv", Object.values(mainStageDatabase).filter(stage => stage.isMission).map((stage) => {
        const missionDetails = mainMissionDatabase[stage.missionDetailId];
        return [
            stage.chapterNumber,
            stage.stageNumber,
            missionDetails.targetScore1,
            missionDetails.targetScore2,
            missionDetails.targetScore3,
            missionDetails.empathy,
            missionDetails.passion,
            missionDetails.stamina,
            missionDetails.wisdom,
            encodeRestrictions(missionDetails.cardRestrictions),
            encodeCardBonuses(missionDetails.cardBonuses)
        ];
    }), [
        "chapter",
        "mission",
        "targetScore1",
        "targetScore2",
        "targetScore3",
        "empathy",
        "passion",
        "stamina",
        "wisdom",
        "cardRestrictions",
        "cardBonuses"
    ],);

    writeDataToCSV("summer_19_event_stage.csv", Object.values(eventMissionDatabase).filter(stage => stage.isMission).map((mission) => {
        return [
            mission.chapterNumber,
            mission.stageNumber,
            mission.targetScore1,
            mission.targetScore2,
            mission.targetScore3,
            mission.empathy,
            mission.passion,
            mission.stamina,
            mission.wisdom,
            encodeRestrictions(mission.cardRestrictions),
            encodeCardBonuses(mission.cardBonuses),
        ];
    }), [
        "chapter",
        "mission",
        "targetScore1",
        "targetScore2",
        "targetScore3",
        "empathy",
        "passion",
        "stamina",
        "wisdom",
        "cardRestrictions",
        "cardBonuses",
    ]);
    
    const AS_COL_HEADERS = [
        "chapter",
        "mission",
        "targetScore1",
        "targetScore2",
        "targetScore3",
        "empathy",
        "passion",
        "stamina",
        "wisdom",
        "cardRestrictions",
        "cardBonuses"
    ];

    const AS_STAGE_COL_OUTPUT_MAPPER = (stage: Stage) => {
        const missionDetails = anotherMissionDatabase[stage.missionDetailId];
        return [
            stage.chapterNumber,
            stage.stageNumber,
            missionDetails.targetScore1,
            missionDetails.targetScore2,
            missionDetails.targetScore3,
            missionDetails.empathy,
            missionDetails.passion,
            missionDetails.stamina,
            missionDetails.wisdom,
            encodeRestrictions(missionDetails.cardRestrictions),
            encodeCardBonuses(missionDetails.cardBonuses),
        ];
    };

    writeDataToCSV("consumable_another_stages.csv", Object.values(anotherStageDatabase)
        .filter(stage => stage.isMission)
        .map(AS_STAGE_COL_OUTPUT_MAPPER), AS_COL_HEADERS);


    function convertRewardIdToFlowerCounts(rewardId: string): number[] {
        const countMax = [0, 0, 0];
        const countMin = [0, 0, 0];

        Object.values(rewardToItemDatabase)
            .filter((rewardToItemMap) => rewardToItemMap.rewardId === rewardId)
            .forEach((rewardToItemMap) => {
                switch(rewardToItemMap.itemId) {
                    case "101600001":
                        countMax[0] = Math.max(countMax[0], rewardToItemMap.quantity);
                        if (countMin[0] === 0) countMin[0] = countMax[0];
                        countMin[0] = Math.min(countMin[0], rewardToItemMap.quantity);
                        break;
                    case "101600002":
                        countMax[1] = Math.max(countMax[1], rewardToItemMap.quantity);
                        if (countMin[1] === 0) countMin[1] = countMax[1];
                        countMin[1] = Math.min(countMin[1], rewardToItemMap.quantity);
                        break;
                    case "101600003":
                        countMax[2] = Math.max(countMax[2], rewardToItemMap.quantity);
                        if (countMin[2] === 0) countMin[2] = countMax[2];
                        countMin[2] = Math.min(countMin[2], rewardToItemMap.quantity);
                        break;
                }
            })

        return [countMin[0], countMax[0], countMin[1], countMax[1], countMin[2], countMax[2]];
    }

    function convertToAgencyItem(rewardId: string): (string | number)[] {
        const rewardItems = Object.values(rewardToItemDatabase)
            .filter((rewardToItemMap) => rewardToItemMap.rewardId === rewardId)
            .map((rewardToItemMap) => itemDatabase[rewardToItemMap.itemId]);

        let member = "";
        let maxRecuperationLevel = 0;
        if (rewardItems.length >= 7) {
            member = "Random"
            maxRecuperationLevel = Math.floor(rewardItems.length / 7);
        } else {
            const regexAgencyItemName = new RegExp(`Agency_(.*)_Item(\\d)`);
            rewardItems.forEach((rewardItem) => {
                const regexResult = regexAgencyItemName.exec(rewardItem.name);
                if (!regexResult) {
                    throw "Unable to determine agency level for " + rewardItem.name;
                } else {
                    member = agencyItemMemberNameToCanonicalName[regexResult[1]];
                    maxRecuperationLevel = Math.max(maxRecuperationLevel, parseInt(regexResult[2]));
                }
            })
            
        }
        return [member, maxRecuperationLevel];
    }

    writeDataToCSV("consumable_main_stage_reward.csv", Object.values(mainStageDatabase)
        .filter(stage => stage.isMission).map((stage) => {
        const missionDetails = mainMissionDatabase[stage.missionDetailId];
        return [
            stage.chapterNumber,
            stage.stageNumber,
            stage.wings,
            missionDetails.exp,
            missionDetails.goldMin,
            missionDetails.goldMax,
            ...convertRewardIdToFlowerCounts(missionDetails.drop1),
            ...convertToAgencyItem(missionDetails.drop2),           
        ];
    }), [
        "chapter",
        "mission",
        "wings",
        "exp",
        "goldMin",
        "goldMax",
        "flower1Min",
        "flower1Max",
        "flower2Min",
        "flower2Max",
        "flower3Min",
        "flower3Max",
        "agencyItemMember",
        "agencyItemLevel"
    ]);

    function convertToCraftableCardId(rewardId: string): (string | number)[] {
        const rewardItems = Object.values(rewardToItemDatabase)
            .filter((rewardToItemMap) => rewardToItemMap.rewardId === rewardId)
            .map((rewardToItemMap) => itemDatabase[rewardToItemMap.itemId]);

        if (rewardItems.length !== 1) {
            throw "Expected 1 craftable card reward item but found for rewardId: " + rewardId;
        }

        const cardId = rewardItems[0].name.replace("Cardpiece", "card");;
        return [cardId];
    }

    const AS_REWARDS_COL_HEADERS = [
        "chapter",
        "mission",
        "wings",
        "exp",
        "goldMin",
        "goldMax",
        "member",
        "craftableCardId"
    ];

    const AS_REWARDS_COL_OUTPUT_MAPPER = (stage: Stage) => {
        const missionDetails = anotherMissionDatabase[stage.missionDetailId];
        if (missionDetails.drop2 !== "0") {
            throw "Unexpected second reward exists in an another stage mission";
        }
        return [
            stage.chapterNumber,
            stage.stageNumber,
            stage.wings,
            missionDetails.exp,
            missionDetails.goldMin,
            missionDetails.goldMax,
            missionDetails.cardRestrictions[0].member,
            ...convertToCraftableCardId(missionDetails.drop1),
        ];
    };

    writeDataToCSV("consumable_another_stage_reward.csv", Object.values(anotherStageDatabase)
        .filter(stage => stage.isMission)
        .map(AS_REWARDS_COL_OUTPUT_MAPPER), AS_REWARDS_COL_HEADERS);

    const cardNameTranslation = CardNameTranslation();

    writeDataToCSV("consumable_cards.csv", Object.values(cardDatabase)
        .filter((card) => card.name.indexOf("_max") < 0)
        .map((card) => {
        return [
            card.name,
            card.member,
            card.stars,
            cardNameTranslation.getName(card),
            card.primaryStat,
            card.tier,
            card.empathy,
            card.passion,
            card.stamina,
            card.wisdom,
        ];
    }), [
        "id",
        "member",
        "stars",
        "name",
        "primaryStat",
        "tier",
        "empathy",
        "passion",
        "stamina",
        "wisdom"
    ]);
    
    let eventHashTags: string[] = _.uniq(_.flatMap(Object.values(eventMissionDatabase), (eventMission) => {
        return eventMission.cardBonuses.map(cb => cb.hashtagId);
    }));

    eventHashTags = [
        ...eventHashTags,
        ..._.uniq(_.flatMap(Object.values(magicShopDatabase), (magicShopMission) => {
            return magicShopMission.cardBonuses.map(cb => cb.hashtagId);
        }))
    ]

    const eventHashTagRows = Object.values(hashtagDatabase)
                                    .filter(ht => {
                                        return eventHashTags.indexOf(ht.hashtagId) > -1;
                                    });

    
    writeDataToCSV("event_hashtags.csv", Object.entries(_.groupBy(eventHashTagRows,
            'hashtagId'))
            .map(([hashtagId, hashtagCards]) => {
        
                const hastagStringId = hashtagCards[0].hashtagStringId;
                return [
                    hashtagId,
                    cardNameTranslation.getHashtag(hastagStringId),
                    hashtagCards.map(hashtagCard => hashtagCard.cardId)
                                .sort()
                                .map(cardId => cardDatabase[cardId])
                                .filter(card => card.name.indexOf("_max") === -1)
                                .map(card => card.name)
                ];
    }), ["hashtagId", "hashtagName", "cards"]);

    writeDataToCSV("magic_shop.csv", Object.values(magicShopDatabase).filter(stage => stage.isMission).map((mission) => {
        return [
            mission.chapterNumber,
            mission.stageNumber,
            mission.targetScore,
            mission.clearScoreRange1,
            mission.clearScoreRange2,
            mission.clearScoreRange3,
            mission.empathy,
            mission.passion,
            mission.stamina,
            mission.wisdom,
            encodeRestrictions(mission.cardRestrictions),
            encodeCardBonuses(mission.cardBonuses),
        ];
    }), [
        "chapter",
        "mission",
        "targetScore",
        "clearScoreRange1",
        "clearScoreRange2",
        "clearScoreRange3",
        "empathy",
        "passion",
        "stamina",
        "wisdom",
        "cardRestrictions",
        "cardBonuses,"
    ]);
    

});
