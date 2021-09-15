import fs, { promises } from "fs";
import fetch from 'node-fetch';
import cheerio from 'cheerio';
import parse from "csv-parse/lib/sync";
import { Dictionary } from "./model/model";
import { additionalObtainableWays } from "./additionalObtainableWays";
//"http://forum.netmarble.com/btsworld/view/36/22";
const gemDrawUrl = "http://forum.netmarble.com/api/game/btsw/official/forum/btsworld/article/22?menuSeq=36&viewFlag=false&_=1567745684254";

// http://forum.netmarble.com/btsworld/view/36/23
const loyaltyBoxUrl = "http://forum.netmarble.com/api/game/btsw/official/forum/btsworld/article/23?menuSeq=36&viewFlag=false&_=1567747014594";

// http://forum.netmarble.com/btsworld/view/36/21
const goldDrawUrl = "http://forum.netmarble.com/api/game/btsw/official/forum/btsworld/article/21?menuSeq=36&viewFlag=false&_=1567747014594";

// https://forum.netmarble.com/btsworld/view/36/1093967
const memberDrawTicketUrl = "https://forum.netmarble.com/api/game/btsw/official/forum/btsworld/article/1093967?menuSeq=60&viewFlag=false&_=1603331531429";

// https://forum.netmarble.com/btsworld/view/36/1673726
const seasonChallengeUrl = "https://forum.netmarble.com/api/game/btsw/official/forum/btsworld/article/1673726?menuSeq=36&viewFlag=false&_=1631677131613";

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
    console.log('fetching ' + path)
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
            const member = $cells.eq(0).text();
            const cardTitle = $cells.eq(1).text().replace("▲", "").trim();
            results.push(getCardId(member, cardTitle, cardLevel));
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

function _addObtainableWay(cardMapping: Dictionary<string[]>, cardId: string, key: string) {
    if (!cardMapping[cardId]) cardMapping[cardId] = [];
    cardMapping[cardId].push(key);
}

Promise.all([loyaltyBoxPromise, gemPromise, goldDrawPromise, memberDrawTicketPromise, seasonChallengePromise]).then(results => {
    const combinedResults: Dictionary<string[]> = {};

    additionalObtainableWays.event.forEach(cardId => _addObtainableWay(combinedResults, cardId, "e"));
    additionalObtainableWays.purple.forEach(cardId => _addObtainableWay(combinedResults, cardId, "p"));
    results[0].blue.forEach(cardId => _addObtainableWay(combinedResults, cardId, "b"))
    results[0].yellow.forEach(cardId => _addObtainableWay(combinedResults, cardId, "y"));
    results[1].forEach(cardId => _addObtainableWay(combinedResults, cardId, "gem"));
    results[2].forEach(cardId => _addObtainableWay(combinedResults, cardId, "$"));
    //results[3].forEach(cardId => _addObtainableWay(combinedResults2, cardId, "MEMBER"));
    results[4].forEach(cardId => _addObtainableWay(combinedResults, cardId, "chuseok"));

    additionalObtainableWays.c0.forEach(cardId => _addObtainableWay(combinedResults, cardId, "c0"));
    additionalObtainableWays.c10.forEach(cardId => _addObtainableWay(combinedResults, cardId, "c10"));
    additionalObtainableWays.c15.forEach(cardId => _addObtainableWay(combinedResults, cardId, "c15"));
    additionalObtainableWays.c25.forEach(cardId => _addObtainableWay(combinedResults, cardId, "c25"));
    
    //additionalObtainableWays["25day"].forEach(cardId => _addObtainableWay(combinedResults, cardId, "s5"));

    fs.writeFile(`./output/draws_pretty.json`, JSON.stringify(combinedResults, null, 4), function(err:any) {})
    fs.writeFile(`./output/draws.txt`, JSON.stringify(combinedResults), function(err:any) {})
});