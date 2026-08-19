const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");

const fs = require("fs");
const path = require("path");
const axios = require("axios");

require("dotenv").config();


/* =========================================================
   CONFIG
========================================================= */

const apiId =
    Number(process.env.API_ID);

const apiHash =
    process.env.API_HASH;

const channel =
    process.env.CHANNEL;

const stringSession =
    new StringSession(
        process.env.STRING_SESSION || ""
    );


const client =
    new TelegramClient(
        stringSession,
        apiId,
        apiHash,
        {
            connectionRetries: 5
        }
    );


/* =========================================================
   FILES
========================================================= */

const POSTS_FILE =
    path.join(
        __dirname,
        "posts.json"
    );

const DOWNLOADS =
    path.join(
        __dirname,
        "downloads"
    );


if (!fs.existsSync(DOWNLOADS)) {

    fs.mkdirSync(
        DOWNLOADS,
        {
            recursive: true
        }
    );

}


/* =========================================================
   PARSER SETTINGS
========================================================= */

/*
   რამდენი ბოლო Telegram პოსტი შევამოწმოთ.

   200 საკმარისია ახალი განცხადებების
   მუდმივი სინქრონიზაციისთვის.

   ძველი განცხადებები posts.json-ში
   არ იშლება.
*/

const SYNC_MESSAGES_LIMIT =
    Number(
        process.env.SYNC_MESSAGES_LIMIT || 200
    );


/*
   ძველი განცხადებების კოორდინატების
   აღდგენა.

   თუ true არის, parser შეამოწმებს
   ძველ ბინებსაც, რომლებსაც lat/lng
   არ აქვთ.
*/

const BACKFILL_MISSING_COORDS =
    process.env.BACKFILL_MISSING_COORDS !==
    "false";


/*
   ერთ გაშვებაზე მაქსიმუმ რამდენ ძველ
   განცხადებას მოვუძებნოთ კოორდინატა.

   ეს საჭიროა Nominatim-ზე ზედმეტი
   დატვირთვის თავიდან ასაცილებლად.
*/

const MAX_BACKFILL_PER_RUN =
    Number(
        process.env.MAX_BACKFILL_PER_RUN || 100
    );


/*
   წარუმატებელი geocoding-ის ხელახლა
   ცდა მხოლოდ 24 საათის შემდეგ.
*/

const GEO_RETRY_HOURS =
    24;


/* =========================================================
   HELPERS
========================================================= */

function getValue(
    text,
    patterns
) {

    if (!text)
        return "";

    for (
        const pattern of patterns
    ) {

        const match =
            text.match(pattern);

        if (match) {

            return String(
                match[1] || ""
            ).trim();

        }

    }

    return "";

}


/* =========================================================
   DATE → UNIX SECONDS
========================================================= */

function toUnixSeconds(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return 0;

    }


    if (
        value instanceof Date
    ) {

        return Math.floor(
            value.getTime() / 1000
        );

    }


    if (
        typeof value === "number"
    ) {

        /*
           თუ მილიწამებია
        */

        if (
            value > 100000000000
        ) {

            return Math.floor(
                value / 1000
            );

        }

        return Math.floor(value);

    }


    const date =
        new Date(value);

    if (
        !Number.isNaN(
            date.getTime()
        )
    ) {

        return Math.floor(
            date.getTime() / 1000
        );

    }


    return 0;

}


/* =========================================================
   SAVE POSTS
========================================================= */

function savePosts(posts) {

    fs.writeFileSync(

        POSTS_FILE,

        JSON.stringify(
            posts,
            null,
            2
        ),

        "utf8"

    );

}


/* =========================================================
   NORMALIZE DISTRICT
========================================================= */

function normalizeDistrict(value) {

    if (!value)
        return "-";


    let d =
        String(value)

            .toLowerCase()

            .replace(
                /#/g,
                ""
            )

            .replace(
                /📍/g,
                ""
            )

            .replace(
                /\s+/g,
                " "
            )

            .trim();


    if (
        d.includes("сабур") ||
        d.includes("saburt")
    ) {

        return "saburtalo";

    }


    if (
        d.includes("вак") ||
        d.includes("vake")
    ) {

        return "vake";

    }


    if (
        d.includes("вер") ||
        d.includes("vera")
    ) {

        return "vera";

    }


    if (
        d.includes("исан") ||
        d.includes("isani")
    ) {

        return "isani";

    }


    if (
        d.includes("дигом") ||
        d.includes("digomi")
    ) {

        return "digomi";

    }


    if (
        d.includes("крцан") ||
        d.includes("krtsan")
    ) {

        return "krtsanisi";

    }


    if (
        d.includes("ортач") ||
        d.includes("ortach")
    ) {

        return "ortachala";

    }


    if (
        d.includes("мтац") ||
        d.includes("mtats")
    ) {

        return "mtatsminda";

    }


    if (
        d.includes("дидуб") ||
        d.includes("didube")
    ) {

        return "didube";

    }


    if (
        d.includes("глдан") ||
        d.includes("gldani")
    ) {

        return "gldani";

    }


    if (
        d.includes("чугур") ||
        d.includes("chugur")
    ) {

        return "chugureti";

    }


    if (
        d.includes("надзал") ||
        d.includes("nadzal")
    ) {

        return "nadzaladevi";

    }


    if (
        d.includes("самгор") ||
        d.includes("samgor")
    ) {

        return "samgori";

    }


    if (
        d.includes("ვარკეთ") ||
        d.includes("varket")
    ) {

        return "varketili";

    }


    if (
        d.includes("ორთაჭ") ||
        d.includes("ortach")
    ) {

        return "ortachala";

    }


    return d;

}


/* =========================================================
   VALIDATE TBILISI COORDINATES
========================================================= */

function isTbilisiCoordinates(
    lat,
    lng
) {

    const latitude =
        Number(lat);

    const longitude =
        Number(lng);


    if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
    ) {

        return false;

    }


    /*
       ფართო Tbilisi bounding box.

       სპეციალურად ცოტა ფართოა,
       რომ Didi Digomi / Tbilisi Sea
       და გარეუბნები არ ამოვარდეს.
    */

    return (

        latitude >= 41.55 &&
        latitude <= 41.90 &&

        longitude >= 44.50 &&
        longitude <= 45.05

    );

}


/* =========================================================
   COORDINATE OBJECT
========================================================= */

function makeCoords(
    lng,
    lat,
    source,
    accuracy = ""
) {

    const latitude =
        Number(lat);

    const longitude =
        Number(lng);


    if (
        !isTbilisiCoordinates(
            latitude,
            longitude
        )
    ) {

        return null;

    }


    return {

        lat: latitude,

        lng: longitude,

        geoSource:
            source || "unknown",

        geoAccuracy:
            accuracy || "unknown",

        geoUpdatedAt:
            new Date().toISOString()

    };

}
/* =========================================================
   YANDEX MAP LINK FINDER
========================================================= */

function extractYandexLinks(text) {

    if (!text)
        return [];

    const matches =
        String(text).match(
            /https?:\/\/(?:www\.)?yandex\.[^\/\s<>"')]+\/maps\/[^\s<>"')]+/gi
        );

    if (!matches)
        return [];

    return [
        ...new Set(
            matches.map(
                url =>
                    String(url)
                        .replace(
                            /[),.;]+$/,
                            ""
                        )
            )
        )
    ];
}


/* =========================================================
   PARSE COORDINATES FROM YANDEX URL
========================================================= */

function parseCoordinatesFromUrl(url) {

    if (!url)
        return null;

    const text =
        decodeURIComponent(
            String(url)
        );

    /*
       Yandex URL-ში კოორდინატების
       შესაძლო პარამეტრები.
    */

    const parameterNames = [
        "sll",
        "ll",
        "rll"
    ];

    for (
        const parameter of parameterNames
    ) {

        const regex =
            new RegExp(
                "(?:[?&]" +
                parameter +
                "=|\\b" +
                parameter +
                "=)" +
                "(-?\\d+(?:\\.\\d+)?)" +
                "(?:,|%2C)" +
                "(-?\\d+(?:\\.\\d+)?)",
                "i"
            );

        const match =
            text.match(regex);

        if (!match)
            continue;

        /*
           Yandex:
           longitude,latitude

           ამიტომ:
           match[1] = longitude
           match[2] = latitude
        */

        const coords =
            makeCoords(
                match[1],
                match[2],
                "yandex-url",
                parameter === "sll"
                    ? "exact-link"
                    : "map-center"
            );

        if (coords) {

            console.log(
                "🟢 YANDEX COORDINATES:",
                coords
            );

            return coords;
        }
    }


    /*
       ზოგიერთი Yandex URL იყენებს pt-ს.
    */

    const ptMatch =
        text.match(
            /(?:[?&]pt=)(-?\d+(?:\.\d+)?),(?:%20)?(-?\d+(?:\.\d+)?)/i
        );

    if (ptMatch) {

        const coords =
            makeCoords(
                ptMatch[1],
                ptMatch[2],
                "yandex-url",
                "placemark"
            );

        if (coords) {

            return coords;
        }
    }


    return null;
}


/* =========================================================
   RESOLVE YANDEX SHORT LINK
========================================================= */

async function resolveYandexLink(
    originalUrl
) {

    if (!originalUrl)
        return null;


    /*
       პირველი ცდა —
       პირდაპირ URL-ში კოორდინატის ძებნა.
    */

    const direct =
        parseCoordinatesFromUrl(
            originalUrl
        );

    if (direct) {

        return {
            ...direct,
            yandexMapUrl:
                originalUrl
        };

    }


    /*
       თუ მოკლე Yandex ლინკია,
       ვცდილობთ redirect-ის გავლას.
    */

    try {

        console.log(
            "🔗 Resolving Yandex link:",
            originalUrl
        );


        const response =
            await axios.get(
                originalUrl,
                {
                    maxRedirects: 5,

                    timeout: 10000,

                    responseType:
                        "text",

                    validateStatus:
                        () => true,

                    headers: {
                        "User-Agent":
                            "Orange Real Estate Tbilisi"
                    }
                }
            );


        const finalUrl =
            response
                ?.request
                ?.res
                ?.responseUrl ||

            response
                ?.request
                ?._redirectable
                ?._currentUrl ||

            "";


        if (finalUrl) {

            console.log(
                "🔗 Yandex final URL:",
                finalUrl
            );


            const fromFinal =
                parseCoordinatesFromUrl(
                    finalUrl
                );


            if (fromFinal) {

                return {
                    ...fromFinal,

                    yandexMapUrl:
                        originalUrl
                };

            }
        }


        /*
           ზოგჯერ კოორდინატა HTML-შია.
        */

        const html =
            String(
                response?.data || ""
            );


        const htmlMatch =
            html.match(
                /(?:sll|ll)[=%3D]+(-?\d+(?:\.\d+)?)[,%3B%2C]+(-?\d+(?:\.\d+)?)/i
            );


        if (htmlMatch) {

            const coords =
                makeCoords(
                    htmlMatch[1],
                    htmlMatch[2],
                    "yandex-html",
                    "resolved-link"
                );


            if (coords) {

                return {
                    ...coords,

                    yandexMapUrl:
                        originalUrl
                };

            }
        }

    }
    catch (error) {

        console.log(
            "⚠️ Yandex resolve error:",
            error.message
        );

    }


    return null;
}


/* =========================================================
   GET YANDEX COORDINATES
========================================================= */

async function getYandexCoordinates(
    text
) {

    const links =
        extractYandexLinks(
            text
        );


    if (!links.length) {

        return null;

    }


    console.log(
        "🗺️ YANDEX LINKS FOUND:",
        links
    );


    for (
        const link of links
    ) {

        const result =
            await resolveYandexLink(
                link
            );


        if (result) {

            console.log(
                "✅ YANDEX LOCATION FOUND:",
                result
            );

            return result;

        }

    }


    console.log(
        "⚠️ Yandex link found, but coordinates were not extracted."
    );


    return null;
}


/* =========================================================
   EXTRACT HOUSE NUMBER
========================================================= */

function extractHouseNumber(
    address
) {

    if (!address)
        return "";


    const text =
        String(address);


    const match =
        text.match(
            /(?:№|N|#)?\s*(\d+[A-Za-zА-Яа-я]?(?:\/\d+[A-Za-zА-Яа-я]?)?)/
        );


    return match
        ? match[1]
        : "";
}


/* =========================================================
   NORMALIZE ADDRESS
========================================================= */

function normalizeAddressText(
    value
) {

    return String(
        value || ""
    )

        .toLowerCase()

        .replace(
            /ё/g,
            "е"
        )

        .replace(
            /улица|ул\.?|street|st\.?|road|rd\.?|avenue|ave\.?|проспект|пр-т|пр\.?/gi,
            " "
        )

        .replace(
            /[^\p{L}\p{N}]+/gu,
            " "
        )

        .replace(
            /\s+/g,
            " "
        )

        .trim();
}


/* =========================================================
   NOMINATIM RATE LIMIT
========================================================= */

let lastNominatimRequest = 0;


async function waitForNominatim() {

    const now =
        Date.now();


    const elapsed =
        now -
        lastNominatimRequest;


    /*
       მინიმუმ 1.6 წამი
       მოთხოვნებს შორის.
    */

    if (
        elapsed < 3000
    ) {

        await new Promise(
            resolve =>
                setTimeout(
                    resolve,
                    3000 - elapsed
                )
        );

    }


    lastNominatimRequest =
        Date.now();
}

/* =========================================================
   GEOCODE ADDRESS
   REAL ADDRESS → REAL COORDINATES
========================================================= */
const geocodeCache = new Map();
async function geocodeAddress(address) {

    if (!address || address === "-") {
        return null;
    }


    const cleanAddress =
        String(address)
            .replace(/\s+/g, " ")
            .trim();
            const cacheKey =
    cleanAddress.toLowerCase();

if (geocodeCache.has(cacheKey)) {

    console.log(
        "♻️ GEOCODE CACHE:",
        cleanAddress
    );

    return geocodeCache.get(cacheKey);
}


    if (cleanAddress.length < 4) {
        return null;
    }


    /*
       რუსული → ლათინური
       საჭიროა Yandex/Nominatim-ისთვის
    */

    const transliterateRussianToLatin = text => {

        const map = {
            "А":"A","Б":"B","В":"V","Г":"G","Д":"D",
            "Е":"E","Ё":"Yo","Ж":"Zh","З":"Z","И":"I",
            "Й":"Y","К":"K","Л":"L","М":"M","Н":"N",
            "О":"O","П":"P","Р":"R","С":"S","Т":"T",
            "У":"U","Ф":"F","Х":"Kh","Ц":"Ts","Ч":"Ch",
            "Ш":"Sh","Щ":"Shch","Ъ":"","Ы":"Y","Ь":"",
            "Э":"E","Ю":"Yu","Я":"Ya",

            "а":"a","б":"b","в":"v","г":"g","д":"d",
            "е":"e","ё":"yo","ж":"zh","з":"z","и":"i",
            "й":"y","к":"k","л":"l","м":"m","н":"n",
            "о":"o","п":"p","р":"r","с":"s","т":"t",
            "у":"u","ф":"f","х":"kh","ц":"ts","ч":"ch",
            "ш":"sh","щ":"shch","ъ":"","ы":"y","ь":"",
            "э":"e","ю":"yu","я":"ya"
        };

        return String(text)
            .split("")
            .map(char => map[char] ?? char)
            .join("");
    };


    /*
       სახლის ნომერი
    */

    const requestedHouse =
        extractHouseNumber(
            cleanAddress
        );


    /*
       ქუჩის/მისამართის სხვადასხვა ვარიანტი
    */

    const latinAddress =
        transliterateRussianToLatin(
            cleanAddress
        );

const normalizedAddress =
    cleanAddress
        .replace(
            /Жулии Шартава|Жули Шартава|Juli Shartava|Zhuli Shartava/gi,
            "Julius Shartava Street"
        )
        .replace(
            /Budapeshtis Street|Budapestis Street|Будапешти Street|Будапешტის Street/gi,
            "Budapest Street"
        );

const queries = [

    // 1. სრული მისამართი
    `${cleanAddress}, Tbilisi, Georgia`,

    // 2. რუსულიდან ლათინურად
    `${latinAddress}, Tbilisi, Georgia`,

    // 3. ნორმალიზებული მისამართი
    `${normalizedAddress}, Tbilisi, Georgia`,

    // 4. მხოლოდ ნორმალიზებული მისამართი
    normalizedAddress

];


    /*
       ერთი და იგივე query ორჯერ არ გავუშვათ
    */

    const uniqueQueries =
        [
            ...new Set(
                queries
            )
        ];


    console.log(
        "📍 GEOCODING:",
        cleanAddress
    );


    for (
        const query of
        uniqueQueries
    ) {

        try {

            /*
               ყველა მოთხოვნა გადის ერთ რიგში.
               429-ის თავიდან ასაცილებლად.
            */

            await waitForNominatim();


            const response =
                await axios.get(
                    "https://nominatim.openstreetmap.org/search",
                    {
                        params: {

                            q:
                                query,

                            format:
                                "json",

                            limit:
                                10,

                            countrycodes:
                                "ge",

                            addressdetails:
                                1,

                            "accept-language":
                                "en"

                        },

                        headers: {

                            "User-Agent":
                                "Orange Real Estate Tbilisi/1.0",

                            "Accept":
                                "application/json"

                        },

                        timeout:
                            15000
                    }
                );


            const data =
                Array.isArray(
                    response.data
                )
                    ? response.data
                    : [];


            if (!data.length) {

                console.log(
                    "❌ Nominatim not found:",
                    query
                );

                continue;

            }


            let best =
                null;

            let bestScore =
                -Infinity;


            /*
               ყველა შედეგის შეფასება
            */

            for (
                const item of
                data
            ) {

                const lat =
                    Number(
                        item.lat
                    );

                const lng =
                    Number(
                        item.lon
                    );


                /*
                   მხოლოდ თბილისი
                */

                if (
                    !isTbilisiCoordinates(
                        lat,
                        lng
                    )
                ) {

                    continue;

                }


                const returnedHouse =
                    String(
                        item.address
                            ?.house_number ||
                        ""
                    )
                    .trim();


                const type =
                    String(
                        item.type ||
                        item.addresstype ||
                        ""
                    )
                    .toLowerCase();


                const display =
                    String(
                        item.display_name ||
                        ""
                    );


                const normalizedRequested =
                    normalizeAddressText(
                        cleanAddress
                    );


                const normalizedReturned =
                    normalizeAddressText(
                        display
                    );


                let score =
                    0;


                /*
                   🔥 ზუსტი სახლის ნომერი
                   ყველაზე დიდი პრიორიტეტი
                */

                if (
                    requestedHouse &&
                    returnedHouse &&
                    returnedHouse
                        .toLowerCase() ===
                    requestedHouse
                        .toLowerCase()
                ) {

                    score += 200;

                }


                /*
                   სახლის ნომერი საერთოდ ემთხვევა
                */

                if (
                    requestedHouse &&
                    returnedHouse &&
                    returnedHouse
                        .toLowerCase()
                        .includes(
                            requestedHouse
                                .toLowerCase()
                        )
                ) {

                    score += 50;

                }


                /*
                   შენობა / სახლი
                */

                if (
                    type === "house"
                ) {

                    score += 50;

                }


                if (
                    type === "building"
                ) {

                    score += 40;

                }


                if (
                    type === "residential"
                ) {

                    score += 20;

                }


                /*
                   ქუჩის სიტყვების მსგავსება
                */

                const words =
                    normalizedRequested
                        .split(" ")
                        .filter(
                            word =>
                                word.length >= 4
                        );


                for (
                    const word of
                    words
                ) {

                    if (
                        normalizedReturned
                            .includes(
                                word
                            )
                    ) {

                        score += 5;

                    }

                }


                /*
                   თუ სახლის ნომერი გვაქვს,
                   მაგრამ შედეგი მხოლოდ ქუჩაა,
                   არ ავიღოთ.
                */

                if (
                    requestedHouse &&
                    !returnedHouse &&
                    (
                        type === "street" ||
                        type === "road"
                    )
                ) {

                    score -= 200;

                }


                /*
                   თბილისის მისამართს
                   დამატებითი ქულა
                */

                if (
                    normalizedReturned
                        .includes("tbilisi")
                ) {

                    score += 10;

                }


                if (
                    score >
                    bestScore
                ) {

                    bestScore =
                        score;

                    best =
                        item;

                }

            }


            /*
               ძალიან სუსტი შედეგი არ გამოვიყენოთ
            */

            if (
                !best ||
                bestScore < 10
            ) {

                console.log(
                    "⚠️ Nominatim result rejected:",
                    query,
                    "SCORE:",
                    bestScore
                );

                continue;

            }


            const exactHouse =
                Boolean(
                    requestedHouse &&
                    best.address
                        ?.house_number &&
                    String(
                        best.address
                            .house_number
                    )
                    .toLowerCase() ===
                    String(
                        requestedHouse
                    )
                    .toLowerCase()
                );


            const coords =
                makeCoords(
                    best.lon,
                    best.lat,
                    "nominatim",
                    exactHouse
                        ? "house-exact"
                        : "address"
                );


            if (
                coords
            ) {

                console.log(
                    "✅ REAL ADDRESS:",
                    cleanAddress
                );

                console.log(
                    "📍 COORDINATES:",
                    coords
                );

                console.log(
                    "🎯 SCORE:",
                    bestScore
                );

                console.log(
                    "🏠 EXACT HOUSE:",
                    exactHouse
                );


                const result = {
    ...coords,

    geoDisplayName:
        best.display_name
};

console.log(
    "✅ FINAL COORDINATES:",
    result
);

return result;

            }

        }
        catch (error) {

            const status =
                error
                    ?.response
                    ?.status;


            if (
                status === 429
            ) {

                console.log(
                    "⏳ Nominatim 429 — waiting before retry"
                );


                await new Promise(
                    resolve =>
                        setTimeout(
                            resolve,
                            5000
                        )
                );

                continue;

            }


            console.log(
                "❌ Nominatim error:",
                error.message
            );

        }

    }


    console.log(
        "❌ REAL COORDINATES NOT FOUND:",
        cleanAddress
    );


    return null;
}

/* =========================================================
   GET COORDINATES FOR POST
   YANDEX URL FIRST → ADDRESS GEOCODING SECOND
========================================================= */

async function getCoordinatesForPost(post) {

    /*
       1. უკვე არსებული სწორი კოორდინატა
    */

    if (
        isTbilisiCoordinates(
            post.lat,
            post.lng
        )
    ) {

        return {

            lat:
                Number(post.lat),

            lng:
                Number(post.lng),

            geoSource:
                post.geoSource ||
                "existing",

            geoAccuracy:
                post.geoAccuracy ||
                "existing"

        };

    }


    /* =====================================================
       2. YANDEX MAP LINK
    ===================================================== */

    const yandex =
        await getYandexCoordinates(
            post.text || ""
        );


    if (yandex) {

        console.log(
            "✅ YANDEX LOCATION FOUND:",
            yandex
        );

        return yandex;

    }


    /* =====================================================
       3. ADDRESS → NOMINATIM
    ===================================================== */

    if (
        post.street &&
        post.street !== "-"
    ) {

        const address =
            `${post.street}, ${post.district || ""}, Tbilisi, Georgia`;


        console.log(
            "📍 Finding location:",
            address
        );


        const result =
            await geocodeAddress(
                address
            );


        if (result) {

            console.log(
                "✅ ADDRESS LOCATION FOUND:",
                result
            );

            return result;

        }

    }


    /* =====================================================
       4. STREET ONLY
       თუ უბნის დამატებამ ვერ იპოვა,
       მარტო ქუჩითაც ვცადოთ.
    ===================================================== */

    if (
        post.street &&
        post.street !== "-"
    ) {

        const streetOnly =
            `${post.street}, Tbilisi, Georgia`;


        console.log(
            "📍 Finding street only:",
            streetOnly
        );


        const result =
            await geocodeAddress(
                streetOnly
            );


        if (result) {

            return result;

        }

    }


    /* =====================================================
       5. NOTHING FOUND
    ===================================================== */

    console.log(
        "❌ LOCATION NOT FOUND:",
        post.street ||
        post.text ||
        "-"
    );


    return null;

}
/* =========================================================
   DOWNLOAD TELEGRAM PHOTO
========================================================= */

async function downloadPhoto(
    message,
    fileName
) {

    try {

        const filePath =
            path.join(
                DOWNLOADS,
                fileName
            );


        /*
           თუ ფოტო უკვე ჩამოტვირთულია,
           თავიდან აღარ ვიწერთ.
        */

        if (
            fs.existsSync(
                filePath
            )
        ) {

            return (
                "downloads/" +
                fileName
            );

        }


        const buffer =
            await client.downloadMedia(
                message
            );


        if (!buffer) {

            return null;

        }


        fs.writeFileSync(
            filePath,
            buffer
        );


        console.log(
            "📸 Downloaded:",
            fileName
        );


        return (
            "downloads/" +
            fileName
        );

    }
    catch (error) {

        console.log(
            "❌ Photo download error:",
            error.message
        );


        return null;

    }

}


/* =========================================================
   CLEAN TEXT FOR FINGERPRINT
========================================================= */

function cleanFingerprint(
    value
) {

    return String(
        value || "-"
    )

        .toLowerCase()

        .replace(
            /ё/g,
            "е"
        )

        .replace(
            /[^\p{L}\p{N}]+/gu,
            " "
        )

        .replace(
            /\s+/g,
            " "
        )

        .trim();

}


/* =========================================================
   APARTMENT UNIQUE KEY
========================================================= */

function makeApartmentKey(
    post
) {

    const district =
        cleanFingerprint(
            post.district
        );


    const street =
        cleanFingerprint(
            post.street
        );


    const rooms =
        cleanFingerprint(
            post.rooms
        );


    const bedrooms =
        cleanFingerprint(
            post.bedrooms
        );


    const area =
        cleanFingerprint(
            post.area
        );


    const floor =
        cleanFingerprint(
            post.floor
        );


    /*
       თუ ქუჩა საერთოდ არ გვაქვს,
       ბინას ხელოვნურად არ ვაერთიანებთ
       სხვა განცხადებასთან.
    */

    if (
        !street ||
        street === "-"
    ) {

        return null;

    }


    return [

        district,
        street,
        rooms,
        bedrooms,
        area,
        floor

    ].join("|");

}


/* =========================================================
   LOAD EXISTING POSTS
========================================================= */

function loadPosts() {

    if (
        !fs.existsSync(
            POSTS_FILE
        )
    ) {

        return [];

    }


    try {

        const raw =
            fs.readFileSync(
                POSTS_FILE,
                "utf8"
            );


        const posts =
            JSON.parse(
                raw
            );


        if (
            !Array.isArray(
                posts
            )
        ) {

            return [];

        }


        return posts;

    }
    catch (error) {

        console.log(
            "❌ posts.json read error:",
            error.message
        );


        return [];

    }

}


/* =========================================================
   PROCESS TELEGRAM MESSAGE
========================================================= */

async function processMessage(
    msg,
    albums
) {

    const text =
        msg.message || "";


    /*
       არც ფოტო გვაქვს,
       არც ტექსტი → გამოტოვება.
    */

    if (
        !msg.photo &&
        !text
    ) {

        return;

    }


    /*
       Telegram album-ს ერთი
       groupedId აქვს.

       თუ album არ არის,
       message ID გამოიყენება.
    */

    const albumId =
        msg.groupedId

            ? String(
                msg.groupedId
            )

            : String(
                msg.id
            );


    /* =====================================================
       CREATE POST
    ===================================================== */

    if (
        !albums[albumId]
    ) {

        albums[albumId] = {

            id:
                msg.id,

            groupId:
                albumId,

            date:
                toUnixSeconds(
                    msg.date
                ),

            telegramLink:
                `https://t.me/kvartiri_tbilisi2023/${msg.id}`,

            text:
                text,

            images: [],

            price:
                "",

            district:
                "",

            street:
                "",

            rooms:
                "",

            bedrooms:
                "",

            area:
                "",

            floor:
                "",

            agent:
                "",

            lat:
                null,

            lng:
                null,

            geoSource:
                "",

            geoAccuracy:
                "",

            geoAttemptAt:
                "",

            geoUpdatedAt:
                "",

            yandexMapUrl:
                ""

        };

    }


    const post =
        albums[albumId];


    /* =====================================================
       KEEP LONGEST TEXT
    ===================================================== */

    if (
        text.length >
        String(
            post.text || ""
        ).length
    ) {

        post.text =
            text;

    }


    /* =====================================================
       PRICE
    ===================================================== */

    const detectedPrice =
        getValue(

            text,

            [

                /#Цена[_ ]?(\d+)/i,

                /#Цена[:_ ]*(\d+)/i,

                /Цена[:_ ]*(\d+)/i,

                /\$\s*(\d+)/i,

                /(\d+)\s*\$/i

            ]

        );


    if (
        detectedPrice
    ) {

        post.price =
            detectedPrice;

    }


    /* =====================================================
       DISTRICT
    ===================================================== */

    const detectedDistrict =
        getValue(

            text,

            [

                /📍?\s*Ра[йи]он:\s*#?([^📍\n]+)/i,

                /Ра[йи]он:\s*#?([^📍\n]+)/i,

                /Район\s*#([^\s#]+)/i,

                /квартира\s+в\s+([^\s📍\n]+)/i

            ]

        );


    if (
        detectedDistrict
    ) {

        post.district =
            normalizeDistrict(
                detectedDistrict
            );

    }
    else {

        post.district =
            normalizeDistrict(
                post.district
            );

    }


    /* =====================================================
       STREET / ADDRESS
    ===================================================== */

    const detectedStreet =
        getValue(

            text,

            [

                /📍\s*Адрес:\s*([^\n]+)/i,

                /Адрес:\s*([^\n]+)/i

            ]

        );


    if (
        detectedStreet
    ) {

        post.street =
            detectedStreet;

    }


    if (
        post.street
    ) {

        post.street =

            String(
                post.street
            )

                .replace(
                    /^ул\.?\s*/i,
                    ""
                )

                .replace(
                    /^улица\s*/i,
                    ""
                )

                .replace(
                    /^ица\s+/i,
                    ""
                )

                .replace(
                    /#метро/gi,
                    ""
                )

                .replace(
                    /https?:\/\/\S+/gi,
                    ""
                )

                .replace(
                    /#[^\s,]+/g,
                    ""
                )

                .replace(
                    /📍/g,
                    ""
                )

                .replace(
                    /\s+/g,
                    " "
                )

                .replace(
                    /^\s*[,.-]+\s*/,
                    ""
                )

                .replace(
                    /\s*[,.-]+\s*$/,
                    ""
                )

                .trim();

    }


    /* =====================================================
       YANDEX MAP URL
    ===================================================== */

    const yandexLinks =
        extractYandexLinks(
            post.text
        );


    if (
        yandexLinks.length
    ) {

        post.yandexMapUrl =
            yandexLinks[0];

    }


    /* =====================================================
       ROOMS
    ===================================================== */

    const detectedRooms =
        getValue(

            text,

            [

                /Количество\s*#?Комнат[: ]*(\d+)/i,

                /Количество\s*комнат[: ]*(\d+)/i,

                /Комнат[: ]*(\d+)/i

            ]

        );


    if (
        detectedRooms
    ) {

        post.rooms =
            detectedRooms;

    }


    /* =====================================================
       BEDROOMS
    ===================================================== */

    const detectedBedrooms =
        getValue(

            text,

            [

                /Количество\s*#?Спален[: ]*(\d+)/i,

                /Количество\s*спален[: ]*(\d+)/i,

                /Спален[: ]*(\d+)/i

            ]

        );


    if (
        detectedBedrooms
    ) {

        post.bedrooms =
            detectedBedrooms;

    }


    /* =====================================================
       AREA
    ===================================================== */

    const detectedArea =
        getValue(

            text,

            [

                /Общая\s*площадь[: ]*([\d.,]+)/i,

                /Площадь[: ]*([\d.,]+)/i

            ]

        );


    if (
        detectedArea
    ) {

        post.area =
            detectedArea;

    }


    /* =====================================================
       FLOOR
    ===================================================== */

    const detectedFloor =
        getValue(

            text,

            [

                /Этаж[: ]*([^\n]+)/i

            ]

        );


    if (
        detectedFloor
    ) {

        post.floor =
            detectedFloor;

    }


    /* =====================================================
       AGENT / CONTACT
    ===================================================== */

    const detectedAgent =
        getValue(

            text,

            [

                /Агент:\s*([^\n]+)/i,

                /Риелтор:\s*([^\n]+)/i,

                /Контакт:\s*([^\n]+)/i,

                /@([A-Za-z0-9_]+)/i

            ]

        );


    if (
        detectedAgent
    ) {

        post.agent =
            detectedAgent;

    }


    /* =====================================================
       PHOTO
    ===================================================== */

    if (
        msg.photo
    ) {

        const fileName =
            `${msg.id}.jpg`;


        const image =
            await downloadPhoto(
                msg,
                fileName
            );


        if (
            image &&
            !post.images.includes(
                image
            )
        ) {

            post.images.push(
                image
            );

        }

    }

}
/* =========================================================
   UPDATE POST COORDINATES
========================================================= */

async function updatePostCoordinates(
    post,
    force = false
) {

    /*
       თუ უკვე გვაქვს სწორი კოორდინატები,
       ხელახლა არ ვეძებთ.
    */

    if (
        !force &&
        isTbilisiCoordinates(
            post.lat,
            post.lng
        )
    ) {

        return false;

    }


    /*
       თუ ბოლო მცდელობა ახლახან იყო,
       თავიდან არ გავუშვათ geocoding.
    */

    if (
        !force &&
        post.geoAttemptAt
    ) {

        const lastAttempt =
            new Date(
                post.geoAttemptAt
            ).getTime();


        if (
            Number.isFinite(
                lastAttempt
            )
        ) {

            const hours =
                (
                    Date.now() -
                    lastAttempt
                ) / 3600000;


            if (
                hours <
                GEO_RETRY_HOURS
            ) {

                return false;

            }

        }

    }


    post.geoAttemptAt =
        new Date().toISOString();


    console.log(
        "🧭 Finding location:",
        post.street,
        post.district
    );


    const result =
        await getCoordinatesForPost(
            post
        );


    if (!result) {

        console.log(
            "❌ LOCATION NOT FOUND:",
            post.street,
            post.district
        );


        /*
           შემთხვევით კოორდინატას
           არასოდეს ვწერთ.
        */

        post.lat =
            null;

        post.lng =
            null;

        post.geoSource =
            "not-found";

        post.geoAccuracy =
            "none";


        return false;

    }


    post.lat =
        result.lat;

    post.lng =
        result.lng;

    post.geoSource =
        result.geoSource ||
        "unknown";

    post.geoAccuracy =
        result.geoAccuracy ||
        "unknown";

    post.geoUpdatedAt =
        result.geoUpdatedAt ||
        new Date().toISOString();


    if (
        result.geoDisplayName
    ) {

        post.geoDisplayName =
            result.geoDisplayName;

    }


    if (
        result.yandexMapUrl
    ) {

        post.yandexMapUrl =
            result.yandexMapUrl;

    }


    console.log(
        "📍 LOCATION SAVED:",
        post.street,
        "=>",
        post.lat,
        post.lng,
        "|",
        post.geoSource,
        "|",
        post.geoAccuracy
    );


    return true;

}


/* =========================================================
   UPDATE STATUS
========================================================= */

function updateStatus(
    post
) {

    const timestamp =
        toUnixSeconds(
            post.date
        );


    if (!timestamp) {

        post.status =
            "active";

        return;

    }


    const days =
        (
            Date.now() / 1000 -
            timestamp
        ) / 86400;


    post.status =
        days > 30
            ? "rented"
            : "active";

}


/* =========================================================
   MERGE TELEGRAM POSTS
========================================================= */

async function mergePosts(
    posts,
    albums
) {

    for (
        const key of
        Object.keys(albums)
    ) {

        const post =
            albums[key];


        /*
           ცარიელი ველები
           ნორმალიზდება.
        */

        post.price =
            post.price || "-";


        post.district =
            post.district || "-";


        post.street =
            post.street || "-";


        post.rooms =
            post.rooms || "-";


        post.bedrooms =
            post.bedrooms || "-";


        post.area =
            post.area || "-";


        post.floor =
            post.floor || "-";


        post.images =
            Array.isArray(
                post.images
            )
                ? post.images
                : [];


        post.date =
            toUnixSeconds(
                post.date
            );


        updateStatus(
            post
        );


        /* =================================================
           FIND BY TELEGRAM ID
        ================================================= */

        let existingIndex =
            posts.findIndex(

                oldPost =>
                    String(
                        oldPost.id
                    ) ===
                    String(
                        post.id
                    )

            );


        /* =================================================
           FIND SAME APARTMENT
        ================================================= */

        if (
            existingIndex === -1
        ) {

            const newKey =
                makeApartmentKey(
                    post
                );


            if (newKey) {

                existingIndex =
                    posts.findIndex(

                        oldPost =>

                            makeApartmentKey(
                                oldPost
                            ) ===
                            newKey

                    );

            }

        }


        /* =================================================
           UPDATE EXISTING
        ================================================= */

        if (
            existingIndex >= 0
        ) {

            const oldPost =
                posts[
                    existingIndex
                ];


            const merged = {

                ...oldPost,

                ...post

            };


            /*
               თუ ახალ შეტყობინებაში ფოტოები
               არ გვაქვს, ძველი ფოტოები
               შევინარჩუნოთ.
            */

            if (
                !post.images ||
                !post.images.length
            ) {

                merged.images =
                    oldPost.images ||
                    [];

            }


            /*
               თუ ახალი პოსტის კოორდინატა
               არ არსებობს, ძველი
               კოორდინატა არ უნდა დაიკარგოს.
            */

            if (
                !isTbilisiCoordinates(
                    post.lat,
                    post.lng
                )
            ) {

                merged.lat =
                    isTbilisiCoordinates(
                        oldPost.lat,
                        oldPost.lng
                    )
                        ? oldPost.lat
                        : null;


                merged.lng =
                    isTbilisiCoordinates(
                        oldPost.lat,
                        oldPost.lng
                    )
                        ? oldPost.lng
                        : null;


                merged.geoSource =
                    oldPost.geoSource ||
                    "unknown";


                merged.geoAccuracy =
                    oldPost.geoAccuracy ||
                    "unknown";


                merged.geoUpdatedAt =
                    oldPost.geoUpdatedAt ||
                    "";

            }


            posts[
                existingIndex
            ] = merged;


            console.log(
                "♻️ UPDATED:",
                merged.street,
                merged.district
            );

        }


        /* =================================================
           NEW APARTMENT
        ================================================= */

        else {

            posts.push(
                post
            );


            console.log(
                "🆕 NEW:",
                post.street,
                post.district
            );

        }

    }

}


/* =========================================================
   BACKFILL OLD POSTS
========================================================= */

async function backfillOldPosts(
    posts
) {

    if (
        !BACKFILL_MISSING_COORDS
    ) {

        console.log(
            "ℹ️ Old coordinate backfill disabled."
        );

        return;

    }


    let processed =
        0;


    console.log(
        "🔄 Checking old posts for missing coordinates..."
    );


    for (
        const post of
        posts
    ) {

        if (
            processed >=
            MAX_BACKFILL_PER_RUN
        ) {

            break;

        }


        /*
           უკვე სწორად განთავსებული
           ბინა აღარ გვჭირდება.
        */

        if (
            isTbilisiCoordinates(
                post.lat,
                post.lng
            )
        ) {

            continue;

        }


        /*
           ქუჩის გარეშე ძებნა არ ღირს.
        */

        if (
            !post.street ||
            post.street === "-"
        ) {

            continue;

        }


        processed++;


        await updatePostCoordinates(
            post
        );

    }


    console.log(
        "🔄 Old posts checked:",
        processed
    );

}


/* =========================================================
   LOAD TELEGRAM MESSAGES
========================================================= */

async function loadTelegramMessages() {

    const messages = [];


    console.log(
        "📥 Loading Telegram messages..."
    );


    for await (
        const msg of
        client.iterMessages(
            channel,
            {
                limit:
                    SYNC_MESSAGES_LIMIT
            }
        )
    ) {

        messages.push(
            msg
        );

    }


    /*
       ძველი → ახალი
    */

    messages.reverse();


    console.log(
        "📥 Telegram messages loaded:",
        messages.length
    );


    return messages;

}


/* =========================================================
   MAIN PARSER
========================================================= */

async function start() {

    console.log(
        "======================================"
    );

    console.log(
        "🍊 ORANGE REAL ESTATE PARSER"
    );

    console.log(
        "======================================"
    );


    /* =====================================================
       CONNECT TELEGRAM
    ===================================================== */

    await client.connect();


    if (
        !client.connected
    ) {

        await client.connect();

    }


    console.log(
        "✅ Telegram connected"
    );


    console.log(
        "CHANNEL:",
        channel
    );


    /* =====================================================
       LOAD EXISTING POSTS
    ===================================================== */

    let posts =
        loadPosts();


    console.log(
        "📦 Existing posts:",
        posts.length
    );


    /* =====================================================
       LOAD TELEGRAM
    ===================================================== */

    const messages =
        await loadTelegramMessages();


    const albums = {};


    /* =====================================================
       PROCESS MESSAGES
    ===================================================== */

    for (
        const msg of
        messages
    ) {

        try {

            console.log(
                "📨 Processing:",
                msg.id
            );


            await processMessage(
                msg,
                albums
            );

        }
        catch (error) {

            console.log(
                "❌ Message error:",
                msg.id,
                error.message
            );

        }

    }


    console.log(
        "📚 Albums:",
        Object.keys(
            albums
        ).length
    );


    /* =====================================================
       GET COORDINATES FOR NEW POSTS
    ===================================================== */

    for (
        const key of
        Object.keys(albums)
    ) {

        const post =
            albums[key];


        if (
            isTbilisiCoordinates(
                post.lat,
                post.lng
            )
        ) {

            continue;

        }


        await updatePostCoordinates(
            post
        );

    }


    /* =====================================================
       MERGE
    ===================================================== */

    await mergePosts(
        posts,
        albums
    );


    /* =====================================================
       BACKFILL OLD POSTS
    ===================================================== */

    await backfillOldPosts(
        posts
    );


    /* =====================================================
       FINAL STATUS
    ===================================================== */

    for (
        const post of
        posts
    ) {

        updateStatus(
            post
        );

    }


    /* =====================================================
       SORT
    ===================================================== */

    posts.sort(

        (a, b) =>

            Number(
                b.id
            ) -
            Number(
                a.id
            )

    );


    /* =====================================================
       COORDINATE STATISTICS
    ===================================================== */

    let withCoordinates =
        0;

    let withoutCoordinates =
        0;


    for (
        const post of
        posts
    ) {

        if (
            isTbilisiCoordinates(
                post.lat,
                post.lng
            )
        ) {

            withCoordinates++;


            console.log(

                "📍",

                post.street,

                "=>",

                post.lat,

                post.lng,

                "|",

                post.geoSource,

                "|",

                post.geoAccuracy

            );

        }
        else {

            withoutCoordinates++;

        }

    }


    /* =====================================================
       FINAL LOG
    ===================================================== */

    console.log(
        "======================================"
    );

    console.log(
        "📦 TOTAL POSTS:",
        posts.length
    );

    console.log(
        "📍 WITH COORDINATES:",
        withCoordinates
    );

    console.log(
        "❌ WITHOUT COORDINATES:",
        withoutCoordinates
    );

    console.log(
        "======================================"
    );


    /* =====================================================
       SAVE POSTS.JSON
    ===================================================== */

    savePosts(
        posts
    );


    console.log(
        `✅ SAVED ${posts.length} POSTS`
    );

}

/* =========================================================
   RUN PARSER
========================================================= */

async function runParser() {

    try {

        await start();

    }
    catch (error) {

        console.error(
            "🔥 PARSER ERROR:",
            error
        );

    }

}


runParser();


/* =========================================================
   AUTO SYNC — EVERY 2 MINUTES
========================================================= */

setInterval(

    runParser,

    2 * 60 * 1000

);