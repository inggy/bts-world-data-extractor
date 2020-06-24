import fs, { promises } from "fs";
import fetch from 'node-fetch';
import cheerio from 'cheerio';
import parse from "csv-parse/lib/sync";
import { Dictionary } from "./model/model";

//"http://forum.netmarble.com/btsworld/view/36/22";
const gemDrawUrl = "http://forum.netmarble.com/api/game/btsw/official/forum/btsworld/article/22?menuSeq=36&viewFlag=false&_=1567745684254";

// http://forum.netmarble.com/btsworld/view/36/23
const loyaltyBoxUrl = "http://forum.netmarble.com/api/game/btsw/official/forum/btsworld/article/23?menuSeq=36&viewFlag=false&_=1567747014594";

// http://forum.netmarble.com/btsworld/view/36/21
const goldDrawUrl = "http://forum.netmarble.com/api/game/btsw/official/forum/btsworld/article/21?menuSeq=36&viewFlag=false&_=1567747014594";

// https://forum.netmarble.com/btsworld/view/36/1093967
const memberDrawTicketUrl = "https://forum.netmarble.com/api/game/btsw/official/forum/btsworld/article/1093967?menuSeq=36&viewFlag=false&_=1571291201265";

// http://forum.netmarble.com/btsworld/view/51/1405665
const seasonChallengeUrl = "http://forum.netmarble.com/api/game/btsw/official/forum/btsworld/article/1405665?menuSeq=51&viewFlag=false&_=1588054799725";

const purple = [
    "card_5star_rm_003",
    "card_5star_jin_002",
    "card_5star_suga_003",
    "card_5star_jhope_004",
    "card_5star_jimin_004",
    "card_5star_v_003",
    "card_5star_jungkook_002",

    /* Fake Love */
    "card_5star_rm_009",
    "card_5star_jin_009",
    "card_5star_suga_009",
    "card_5star_jhope_009",
    "card_5star_jimin_009",
    "card_5star_v_009",
    "card_5star_jungkook_009",
     
    /* Dreamland */
    "card_5star_rm_007",
    "card_5star_suga_007",
    "card_5star_jin_007",
    "card_5star_jhope_007",
    "card_5star_jimin_007",
    "card_5star_v_007",
    "card_5star_jungkook_007",

    /* Boy of Summer */
    "card_5star_rm_011",
    "card_5star_jin_011",
    "card_5star_suga_011",
    "card_5star_jhope_011",
    "card_5star_jimin_011",
    "card_5star_v_011",
    "card_5star_jungkook_011",

    /* Dorm */
    "card_5star_rm_013",
    "card_5star_jin_013",
    "card_5star_suga_013",
    "card_5star_jhope_013",
    "card_5star_jimin_013",
    "card_5star_v_013",
    "card_5star_jungkook_013",

    /* Brave */
    "card_5star_rm_015",
    "card_5star_jin_015",
    "card_5star_suga_015",
    "card_5star_jhope_015",
    "card_5star_jimin_015",
    "card_5star_v_015",
    "card_5star_jungkook_015",

    /* Autumn Snap */
    "card_5star_rm_017",
    "card_5star_jin_017",
    "card_5star_suga_017",
    "card_5star_jhope_017",
    "card_5star_jimin_017",
    "card_5star_v_017",
    "card_5star_jungkook_017",

    /* Red carpet */
    "card_5star_rm_010",
    "card_5star_jin_010",
    "card_5star_suga_010",
    "card_5star_jhope_010",
    "card_5star_jimin_010",
    "card_5star_v_010",
    "card_5star_jungkook_010",

    /* Winter */
    "card_5star_rm_019",
    "card_5star_jin_019",
    "card_5star_suga_019",
    "card_5star_jhope_019",
    "card_5star_jimin_019",
    "card_5star_v_019",
    "card_5star_jungkook_019",

    /* Hope-full */
    "card_5star_rm_020",
    "card_5star_jin_020",
    "card_5star_suga_020",
    "card_5star_jhope_020",
    "card_5star_jimin_020",
    "card_5star_v_020",
    "card_5star_jungkook_020",

    /* Valentine */
    "card_5star_rm_022",
    "card_5star_jin_022",
    "card_5star_suga_022",
    "card_5star_jhope_022",
    "card_5star_jimin_022",
    "card_5star_v_022",
    "card_5star_jungkook_022",

    /* Spring is blooming */

    "card_5star_rm_024",
    "card_5star_jin_024",
    "card_5star_suga_024",
    "card_5star_jhope_024",
    "card_5star_jimin_024",
    "card_5star_v_024",
    "card_5star_jungkook_024",
];

const records = parse(fs.readFileSync(`./output/consumable_cards.csv`, 'utf-8'), {
    columns: false,
    delimiter: ","
});


const titleToIdMap: Dictionary<string> = {};
records.forEach((cols : any) => {
    const id: string = cols[0];
    const member: string = cols[1];
    const stars: number = parseInt(cols[2]);
    const title: string = cols[3];
    titleToIdMap[normalizeTitleString(member, title, stars)] = id;
});

function normalizeTitleString(member: string, title: string, stars: number) {
    return `${title}${member}${stars}`.toLocaleLowerCase().replace(/[^a-z0-9]/gi,'');
}

function fetchBlogContent(path: string): Promise<string> {
    return fetch(path)
        .then(res => res.json())
        .then(json => json.article.content);
}

function extractCardTitles(content: string, tableIndex: number, cardLevel: number): string[] {
    const $ = cheerio.load(content);
    const results: string[] = [];

    $("tbody tr", $("table").eq(tableIndex)).each((i, elem) => {
        const $cells = $("td", elem);
        if (i != 0) {
            results.push(getCardId($("td", elem).eq(0).text(), $("td", elem).eq(1).text(), cardLevel));
        }
    });

    return results.sort();
}



function getCardId(member: string, title: string, stars: number) {
    const id = normalizeTitleString(member, title, stars);
    if (titleToIdMap.hasOwnProperty(id)) {
        return titleToIdMap[id];
    } else {
        console.log("no match for", member, title, stars);
        return "NO_MATCH";
    }
}


const gemPromise = fetchBlogContent(gemDrawUrl).then(htmlContent => {
    return [
        ...extractCardTitles(htmlContent, 0, 5),
        ...extractCardTitles(htmlContent, 1, 4),
        ...extractCardTitles(htmlContent, 2, 3)
    ];
})


const loyaltyBoxPromise = fetchBlogContent(loyaltyBoxUrl).then(htmlContent => {
    return {
        blue: [...extractCardTitles(htmlContent, 1, 5), ...extractCardTitles(htmlContent, 2, 4)],
        yellow: [...extractCardTitles(htmlContent, 0, 5)], 
    }
});

const goldDrawPromise = fetchBlogContent(goldDrawUrl).then(htmlContent => {
    return [
        ...extractCardTitles(htmlContent, 0, 3),
        ...extractCardTitles(htmlContent, 1, 2),
        ...extractCardTitles(htmlContent, 2, 1)
    ];

});

const memberDrawTicketPromise = fetchBlogContent(memberDrawTicketUrl).then(htmlContent => {
    return [
        ...extractCardTitles(htmlContent, 0, 5),
        ...extractCardTitles(htmlContent, 1, 4),
        ...extractCardTitles(htmlContent, 2, 5),
        ...extractCardTitles(htmlContent, 3, 4),
        ...extractCardTitles(htmlContent, 4, 5),
        ...extractCardTitles(htmlContent, 5, 4),
        ...extractCardTitles(htmlContent, 6, 5),
        ...extractCardTitles(htmlContent, 7, 4),
        ...extractCardTitles(htmlContent, 8, 5),
        ...extractCardTitles(htmlContent, 9, 4),
        ...extractCardTitles(htmlContent, 10, 5),
        ...extractCardTitles(htmlContent, 11, 4),
        ...extractCardTitles(htmlContent, 12, 5),
        ...extractCardTitles(htmlContent, 13, 4),
    ];
})

const seasonChallengePromise = fetchBlogContent(seasonChallengeUrl).then(htmlContent => {
    return [
        ...extractCardTitles(htmlContent, 0, 5)
    ]
})

Promise.all([loyaltyBoxPromise, gemPromise, goldDrawPromise, memberDrawTicketPromise, seasonChallengePromise]).then(results => {
    const combinedResults:Dictionary<string[]> = {
        purple: purple.sort(),
        ...results[0],
        //seasonChallenge: results[4],
        gem: results[1],
        gold: results[2],
        memberDraw: results[3],
        
    };

    Object.keys(combinedResults).forEach(key => console.log(key, combinedResults[key].length));
    
    fs.writeFile(`./output/draws.json`, JSON.stringify(combinedResults, null, 4), function(err:any) {})
    
});