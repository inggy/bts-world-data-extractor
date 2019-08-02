import { Dictionary, Stage, Mission, ObjectConverterDefinition, memberMapping, agencyItemMemberNameToCanonicalName } from "./model/model";
import { convertToObject } from "./GameFiles/GameCSVToObjectConverter";
import { writeDataToCSV } from "./GameFiles/CSVFileWriter";
import { buildGameDatabase } from "./database";
import { CardNameTranslation } from "./GameFiles/CardNameTranslation";

buildGameDatabase().then((gameDatabase) => {
    const {
        mainMissionDatabase,
        anotherMissionDatabase,
        mainStageDatabase,
        anotherStageDatabase,
        cardDatabase,
        rewardToItemDatabase,
        itemDatabase,
    } = gameDatabase;


    writeDataToCSV("consumable_main_stage.csv", Object.values(mainStageDatabase).filter(stage => stage.isMission).map((stage) => {
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

    writeDataToCSV("consumable_another_stages.csv", Object.values(anotherStageDatabase).filter(stage => stage.isMission).map((stage) => {
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

    writeDataToCSV("consumable_main_stage_reward.csv", Object.values(mainStageDatabase).filter(stage => stage.isMission).map((stage) => {
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
    }));

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

    writeDataToCSV("consumable_another_stage_reward.csv", Object.values(anotherStageDatabase).filter(stage => stage.isMission).map((stage) => {
        const missionDetails = anotherMissionDatabase[stage.missionDetailId];
        if (missionDetails.drop2 !== "0") {
            throw "Unexpected second reward exists in an another stage mission";
        }
        return [
            missionDetails.allowableMember,
            stage.chapterNumber,
            stage.stageNumber,
            stage.wings,
            missionDetails.exp,
            missionDetails.goldMin,
            missionDetails.goldMax,
            ...convertToCraftableCardId(missionDetails.drop1),
        ];
    }));

    const cardNameTranslation = CardNameTranslation();

    writeDataToCSV("consumable_cards.csv", Object.values(cardDatabase)
        .filter((card) => card.name.indexOf("_max") < 0)
        .map((card) => {
        return [
            card.id,
            card.member,
            card.stars,
            cardNameTranslation.getName(card),
            card.primaryStat,
            card.empathy,
            card.passion,
            card.stamina,
            card.wisdom
        ];
}));
});
