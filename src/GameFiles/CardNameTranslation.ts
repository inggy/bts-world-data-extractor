import fs from 'fs';
import { Card } from '../model/model';
const HARDCODED: Record<string, string> = {
    "Hashtag_Another_Tuto": "#The_Everywhere_Card",
    "Hashtag_Another_330110": "#Emergency_Withdrawal_Detective_Combo",
    "Hashtag_Another_330218": "#SneakerOwner_and_ShelterEmployee",
    "Hashtag_Another_330302": "#Manggae_Bakery_HappinessDeliverer",
    "Hashtag_Another_330307": "#Looking_for_ManggaeShopOwners_Smile",
    "Hashtag_Another_330309": "#OwnerofHappiness_Resembles_Manggaetteok",
    "Hashtag_Another_330315": "#Define_Happiness_WithA_ManggaeRiceCake",
    "Hashtag_Another_330317": "#HotelManager_and_ManggaeBakeryOwner",
    "Hashtag_Another_330319": "#Extremely_Emotional_Piano_Playing",
    
    "Hashtag_Another_330321":"#HiAgain?_Manggae_Bakery",
    "Hashtag_RedCarpet_BTS": "#RedCarpet_BTS",
    "Hashtag_BasketballTeam_Hyung_Line": "#BasketballTeam_Hyung",
    "card_2star_jungkook_011": "Feeling Animated Jung Kook",
    "card_3star_jungkook_027": "Jung Kook's Empathy",

    "Hashtag_Another_330402": "#FishingSkillsScarierThanAGhostStory",
    "Hashtag_Another_330421": "#ThatDaysBGM",
    "Hashtag_HeartSkip_BTS": "#HeartSkip_BTS",
    "Hashtag_Sleepyhead_BTS": "#Sleepyhead_BTS",
    "Hashtag_Another_330506": "#KnockKnockIsThisTheMysteriousGarden?",
    "Hashtag_Another_330521": "#WinterBearAndPurpleFlowersSecret",
    "Hashtag_MissedYou_BTS": "#MissedYou_BTS",
    "Hashtag_Another_330602": "#Sanctuary_Owner_and_Ddoongis_Owner",
    "Hashtag_Another_330615": "#Apartment_Neighbors_Bundle_of_Memories",
    "Hashtag_Another_330619": "#Take_Care_of_Baekmani_Bokshils_Toys!",
    "Hashtag_Another_330621": "#Time_For_Memories_With_You",
    "Hashtag_Another_330719": "#Remember_Me_MysteriousGardenVisitor",
    "Hashtag_Another_330721": "#Create_a_Door_Inside_Your_Heart"
};

const validChar = ["’", "\n", "★", " "];
function isValidChar(char: String): boolean {
    if ((char >= "!" && char <= "~") || (validChar.indexOf(char.toString()) >= 0)) {
        return true;
    }
    return false; 
}

function processStringFile():string {
    let text: string = fs.readFileSync("./gd/mtf_string_string_en", 'utf-8');
        
    let outText = "";
    for (var i = 0; i < text.length; i++) {
        let char = text.charAt(i);
        if (isValidChar(char)) {
            outText+= char;
        }
    }
    
    outText = outText.replace(/\\n/g, "");
    outText = outText.replace(/\n/g, "");
    outText = outText.replace(/\d{2}[.]\d{2}[.]\d{2}/g, "");
    outText = outText.replace(/★\n/g, "★");
    outText = outText.replace(/’/g, "'");
    outText = outText.replace(/> \(\)/g, "");
    outText = outText.replace(/<\(  \)20/g, "");
    outText = outText.replace(/:\(  \)20/g, "");
    outText = outText.replace(/\(9 \)20/g, "");
    outText = outText.replace(/A \(\)/g, "");
    //outText = outText.replace(/_0170\//g, "_017/")

    outText = outText.replace(/card_1star/gmi, "/card_1star");
    outText = outText.replace(/card_2star/gmi, "/card_2star");
    outText = outText.replace(/card_3star/gmi, "/card_3star");
    outText = outText.replace(/card_4star/gmi, "/card_4star");
    outText = outText.replace(/card_5star/gmi, "/card_5star");
    outText = outText.replace(/[\s]+\//gm, "/");
    outText = outText.replace(/\/[\s]+/gm, "/");
    outText = outText.replace(/[/]+/gm, "/");
    
    fs.writeFileSync("./output/tmp/raw_strings.txt", outText, 'utf-8');

    return outText;
}

export function CardNameTranslation(): { getName(card: Card): string; getHashtag(stringId: string): string} {
    const corpus = processStringFile();
    return {
        getName: ((card: Card) => {
            if (HARDCODED[card.name]) {
                return HARDCODED[card.name];
            }
            const template = `${card.name}[\\d]*/Card${card.stars}★([^/]+)`;
        
            const regex1 = new RegExp(template,'igm');
        
            const regexResult = regex1.exec(corpus);
            
            if (regexResult ) {
                return regexResult[1];
            } else {

                const template2 = `${card.name}[\\d]*/Card0([^/]+)`;
                const regex2 = new RegExp(template2,'igm');
        
                const regexResult2 = regex2.exec(corpus);
                if (regexResult2) {
                    return regexResult2[1];
                }

                return "NO_MATCH";
            }
        }),
        getHashtag: (stringId: string) => {
            if (HARDCODED[stringId]) {
                return HARDCODED[stringId];
            }
            /*
             * Match stringId + 0 + (optionally one quote), then
             * /{part1}/{part2}/Hashtags(optionally one space)(#THE_TAG){Stop at possible beginnings of the next string id}
             */
            const template = `${stringId}0"?\\/(Styling|Card|Event Stage|Event)\\/Hashtags ?(#.+?)((Hashtag|Mobile|HashTag|Event|Shop|styling|Gachaitem|Gacha|Mission|Banner|Eventcard)_|#)`;
            const regex1 = new RegExp(template,'igm');
            const regexResult = regex1.exec(corpus);
            if (regexResult) {
                //console.log(regexResult[2]);
                return regexResult[2].trim();
            } else {
                console.log("no hash tag match for ", stringId);
                return stringId;
            }

        }
    };
}

