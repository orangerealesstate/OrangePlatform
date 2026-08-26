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
    Number(
        process.env.API_ID
    );

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
const DELETED_POSTS_FILE =
    path.join(
        __dirname,
        "deleted_posts.json"
    );
const DOWNLOADS =
    path.join(
        __dirname,
        "downloads"
    );


if (
    !fs.existsSync(
        DOWNLOADS
    )
) {

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
   რამდენი ბოლო Telegram message შევამოწმოთ.

   IMPORTANT:
   ეს არის MESSAGE-ების რაოდენობა
   და არა განცხადებების.

   200 საკმარისია ყოველდღიური sync-ისთვის.
*/

const SYNC_MESSAGES_LIMIT =
    Number(
        process.env.SYNC_MESSAGES_LIMIT || 600
    );


/*
   ძველი განცხადებების კოორდინატების აღდგენა.
*/

const BACKFILL_MISSING_COORDS =
    process.env.BACKFILL_MISSING_COORDS !==
    "false";


/*
   ერთ გაშვებაზე რამდენ ძველ განცხადებას
   მოვუძებნოთ კოორდინატა.
*/

const MAX_BACKFILL_PER_RUN =
    Number(
        process.env.MAX_BACKFILL_PER_RUN || 100
    );


/*
   წარუმატებელი geocoding-ის ხელახლა ცდა.
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

    if (
        !text
    ) {

        return "";

    }


    for (
        const pattern of
        patterns
    ) {

        const match =
            text.match(
                pattern
            );


        if (
            match
        ) {

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

function toUnixSeconds(
    value
) {

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

        if (
            value > 100000000000
        ) {

            return Math.floor(
                value / 1000
            );

        }


        return Math.floor(
            value
        );

    }


    const date =
        new Date(
            value
        );


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
   🔒 PRESERVE ADMIN MANUAL EDITS
========================================================= */

function savePosts(
    posts
) {

    try {

        let latestPosts = [];

        if (
            fs.existsSync(
                POSTS_FILE
            )
        ) {

            try {

                const raw =
                    fs.readFileSync(
                        POSTS_FILE,
                        "utf8"
                    );

                const parsed =
                    JSON.parse(
                        raw
                    );

                if (
                    Array.isArray(
                        parsed
                    )
                ) {

                    latestPosts =
                        parsed;

                }

            }
            catch (
                readError
            ) {

                console.log(
                    "⚠️ Latest posts read error:",
                    readError.message
                );

            }

        }

        const latestById =
            new Map();

        for (
            const latestPost of
            latestPosts
        ) {

            latestById.set(
                String(
                    latestPost.id
                ),
                latestPost
            );

        }

        const editableFields = [

            "district",
            "street",
            "rooms",
            "bedrooms",
            "area",
            "floor",
            "price",
            "text"

        ];

        const safePosts =
            posts.map(
                post => {

                    const latest =
                        latestById.get(
                            String(
                                post.id
                            )
                        );

                    if (
                        !latest
                    ) {

                        return post;

                    }

                    const manualEdits =
                        latest.manualEdits
                        || {};

                    const merged = {

                        ...post

                    };

                    for (
                        const field of
                        editableFields
                    ) {

                        if (
                            manualEdits[field] === true
                        ) {

                            merged[field] =
                                latest[field];

                        }

                    }

                    merged.manualEdits = {

                        ...(post.manualEdits || {}),

                        ...manualEdits

                    };

                    return merged;

                }
            );

        fs.writeFileSync(

            POSTS_FILE,

            JSON.stringify(
                safePosts,
                null,
                2
            ),

            "utf8"

        );

        console.log(
            "💾 posts.json saved safely"
        );

    }

    catch (
        error
    ) {

        console.log(
            "❌ posts.json SAVE ERROR:",
            error.message
        );

    }

}


/* =========================================================
   NORMALIZE DISTRICT
========================================================= */

function normalizeDistrict(
    value
) {

    if (
        !value
    ) {

        return "-";

    }


    let d =
        String(
            value
        )

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
        d.includes("saburt") ||
        d.includes("საბურთ")
    ) {

        return "saburtalo";

    }


    if (
        d.includes("вак") ||
        d.includes("vake") ||
        d.includes("ვაკე")
    ) {

        return "vake";

    }


    if (
        d.includes("вер") ||
        d.includes("vera") ||
        d.includes("ვერა")
    ) {

        return "vera";

    }


    if (
        d.includes("исан") ||
        d.includes("isani") ||
        d.includes("ისან")
    ) {

        return "isani";

    }


    if (
        d.includes("дигом") ||
        d.includes("digomi") ||
        d.includes("დიდი დიღომ") ||
        d.includes("დიღომ")
    ) {

        return "digomi";

    }


    if (
        d.includes("крцан") ||
        d.includes("krtsan") ||
        d.includes("კრწან")
    ) {

        return "krtsanisi";

    }


    if (
        d.includes("ортач") ||
        d.includes("ortach") ||
        d.includes("ორთაჭ")
    ) {

        return "ortachala";

    }


    if (
        d.includes("мтац") ||
        d.includes("mtats") ||
        d.includes("მთაწმ")
    ) {

        return "mtatsminda";

    }


    if (
        d.includes("дидуб") ||
        d.includes("didube") ||
        d.includes("დიდუბ")
    ) {

        return "didube";

    }


    if (
        d.includes("глдан") ||
        d.includes("gldani") ||
        d.includes("გლდან")
    ) {

        return "gldani";

    }


    if (
        d.includes("чугур") ||
        d.includes("chugur") ||
        d.includes("ჩუღურ")
    ) {

        return "chugureti";

    }


    if (
        d.includes("надзал") ||
        d.includes("nadzal") ||
        d.includes("ნაძალ")
    ) {

        return "nadzaladevi";

    }


    if (
        d.includes("самгор") ||
        d.includes("samgor") ||
        d.includes("სამგორ")
    ) {

        return "samgori";

    }


    if (
        d.includes("ვარკეთ") ||
        d.includes("varket")
    ) {

        return "varketili";

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
        Number(
            lat
        );

    const longitude =
        Number(
            lng
        );


    if (
        !Number.isFinite(
            latitude
        ) ||
        !Number.isFinite(
            longitude
        )
    ) {

        return false;

    }


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
        Number(
            lat
        );

    const longitude =
        Number(
            lng
        );


    if (
        !isTbilisiCoordinates(
            latitude,
            longitude
        )
    ) {

        return null;

    }


    return {

        lat:
            latitude,

        lng:
            longitude,

        geoSource:
            source ||
            "unknown",

        geoAccuracy:
            accuracy ||
            "unknown",

        geoUpdatedAt:
            new Date().toISOString()

    };

}


/* =========================================================
   YANDEX MAP LINK FINDER
========================================================= */

function extractYandexLinks(
    text
) {

    if (
        !text
    ) {

        return [];

    }


    const matches =
        String(
            text
        ).match(

            /https?:\/\/(?:www\.)?yandex\.[^\/\s<>"')]+\/maps\/[^\s<>"')]+/gi

        );


    if (
        !matches
    ) {

        return [];

    }


    return [
        ...new Set(

            matches.map(

                url =>

                    String(
                        url
                    )
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

function parseCoordinatesFromUrl(
    url
) {

    if (
        !url
    ) {

        return null;

    }


    const text =
        decodeURIComponent(
            String(
                url
            )
        );


    const parameterNames = [

        "sll",

        "ll",

        "rll"

    ];


    for (
        const parameter of
        parameterNames
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
            text.match(
                regex
            );


        if (
            !match
        ) {

            continue;

        }


        /*
           Yandex:
           longitude,latitude
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


        if (
            coords
        ) {

            console.log(
                "🟢 YANDEX COORDINATES:",
                coords
            );


            return coords;

        }

    }


    const ptMatch =
        text.match(

            /(?:[?&]pt=)(-?\d+(?:\.\d+)?),(?:%20)?(-?\d+(?:\.\d+)?)/i

        );


    if (
        ptMatch
    ) {

        const coords =
            makeCoords(

                ptMatch[1],

                ptMatch[2],

                "yandex-url",

                "placemark"

            );


        if (
            coords
        ) {

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

    if (
        !originalUrl
    ) {

        return null;

    }


    /*
       პირველი ცდა —
       პირდაპირ URL-ში კოორდინატის ძებნა.
    */

    const direct =
        parseCoordinatesFromUrl(
            originalUrl
        );


    if (
        direct
    ) {

        return {

            ...direct,

            yandexMapUrl:
                originalUrl

        };

    }


    /*
       თუ მოკლე Yandex ლინკია,
       redirect-ის გავლას ვცდილობთ.
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

                    maxRedirects:
                        5,

                    timeout:
                        10000,

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


        if (
            finalUrl
        ) {

            console.log(
                "🔗 Yandex final URL:",
                finalUrl
            );


            const fromFinal =
                parseCoordinatesFromUrl(
                    finalUrl
                );


            if (
                fromFinal
            ) {

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


        if (
            htmlMatch
        ) {

            const coords =
                makeCoords(

                    htmlMatch[1],

                    htmlMatch[2],

                    "yandex-html",

                    "resolved-link"

                );


            if (
                coords
            ) {

                return {

                    ...coords,

                    yandexMapUrl:
                        originalUrl

                };

            }

        }

    }

    catch (
        error
    ) {

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


    if (
        !links.length
    ) {

        return null;

    }


    console.log(
        "🗺️ YANDEX LINKS FOUND:",
        links
    );


    for (
        const link of
        links
    ) {

        const result =
            await resolveYandexLink(
                link
            );


        if (
            result
        ) {

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

    if (
        !address
    ) {

        return "";

    }


    const text =
        String(
            address
        );


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

let lastNominatimRequest =
    0;


async function waitForNominatim() {

    const now =
        Date.now();


    const elapsed =
        now -
        lastNominatimRequest;


    if (
        elapsed < 3000
    ) {

        await new Promise(
            resolve =>

                setTimeout(

                    resolve,

                    3000 -
                    elapsed

                )

        );

    }


    lastNominatimRequest =
        Date.now();

}


/* =========================================================
   GEOCODE CACHE
========================================================= */

const geocodeCache =
    new Map();


/* =========================================================
   GEOCODE ADDRESS
========================================================= */

async function geocodeAddress(
    address
) {

    if (
        !address ||
        address === "-"
    ) {

        return null;

    }


    const cleanAddress =
        String(
            address
        )
            .replace(
                /\s+/g,
                " "
            )
            .trim();


    const cacheKey =
        cleanAddress.toLowerCase();


    if (
        geocodeCache.has(
            cacheKey
        )
    ) {

        console.log(
            "♻️ GEOCODE CACHE:",
            cleanAddress
        );


        return geocodeCache.get(
            cacheKey
        );

    }


    if (
        cleanAddress.length < 4
    ) {

        return null;

    }


    /*
       რუსული → ლათინური
    */

    const transliterateRussianToLatin =
        text => {

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


            return String(
                text
            )
                .split("")
                .map(
                    char =>
                        map[char] ?? char
                )
                .join("");

        };


    const requestedHouse =
        extractHouseNumber(
            cleanAddress
        );


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

        `${cleanAddress}, Tbilisi, Georgia`,

        `${latinAddress}, Tbilisi, Georgia`,

        `${normalizedAddress}, Tbilisi, Georgia`,

        normalizedAddress

    ];


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


            if (
                !data.length
            ) {

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
                   ზუსტი სახლის ნომერი
                */

                if (

                    requestedHouse &&

                    returnedHouse &&

                    returnedHouse
                        .toLowerCase() ===

                    requestedHouse
                        .toLowerCase()

                ) {

                    score +=
                        200;

                }


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

                    score +=
                        50;

                }


                if (
                    type === "house"
                ) {

                    score +=
                        50;

                }


                if (
                    type === "building"
                ) {

                    score +=
                        40;

                }


                if (
                    type === "residential"
                ) {

                    score +=
                        20;

                }


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

                        score +=
                            5;

                    }

                }


                if (

                    requestedHouse &&

                    !returnedHouse &&

                    (
                        type === "street" ||
                        type === "road"
                    )

                ) {

                    score -=
                        200;

                }


                if (
                    normalizedReturned
                        .includes(
                            "tbilisi"
                        )
                ) {

                    score +=
                        10;

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

                const result = {

                    ...coords,

                    geoDisplayName:
                        best.display_name

                };


                console.log(
                    "✅ FINAL COORDINATES:",
                    result
                );


                geocodeCache.set(
                    cacheKey,
                    result
                );


                return result;

            }

        }

        catch (
            error
        ) {

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


    geocodeCache.set(
        cacheKey,
        null
    );


    return null;

}


/* =========================================================
   GET COORDINATES FOR POST
========================================================= */

async function getCoordinatesForPost(
    post
) {

    if (
        isTbilisiCoordinates(
            post.lat,
            post.lng
        )
    ) {

        return {

            lat:
                Number(
                    post.lat
                ),

            lng:
                Number(
                    post.lng
                ),

            geoSource:
                post.geoSource ||
                "existing",

            geoAccuracy:
                post.geoAccuracy ||
                "existing"

        };

    }


    /*
       Yandex FIRST
    */

    const yandex =
        await getYandexCoordinates(
            post.text || ""
        );


    if (
        yandex
    ) {

        return yandex;

    }


    /*
       Address SECOND
    */

    if (
        post.street &&
        post.street !== "-"
    ) {

        const address =
            `${post.street}, ${post.district || ""}, Tbilisi, Georgia`;


        const result =
            await geocodeAddress(
                address
            );


        if (
            result
        ) {

            return result;

        }

    }

/*
   Street only

   მხოლოდ ქუჩის ცენტრს აღარ ვიყენებთ
   ბინის ზუსტ ლოკაციად.

   თუ სახლის ნომერი არ გვაქვს,
   არ ვაბრუნებთ არაზუსტ კოორდინატას.
*/

if (
    post.street &&
    post.street !== "-"
) {

    const houseNumber =
        extractHouseNumber(
            post.street
        );

    if (
        houseNumber
    ) {

        const exactAddress =
            `${post.street}, Tbilisi, Georgia`;

        const result =
            await geocodeAddress(
                exactAddress
            );

        if (
            result
        ) {

            return result;

        }

    }

}
}

/* =========================================================
   DOWNLOAD TELEGRAM PHOTO
   IMPORTANT:
   ეს ფუნქცია აღარ გამოიყენება
   processMessage()-ის შიგნით.
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


        if (
            !buffer
        ) {

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

    catch (
        error
    ) {

        console.log(
            "❌ Photo download error:",
            error.message
        );


        return null;

    }

}


/* =========================================================
   CLEAN FINGERPRINT
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
   LISTING ID
   უნიკალური 4-ნიშნა განცხადების ID
========================================================= */

function getNextListingId(posts) {

    let maxId = 1000;

    for (const post of posts) {

        const id = Number(
            String(post.listingId || "")
                .replace(/\D/g, "")
        );

        if (id > maxId) {
            maxId = id;
        }
    }

    return String(maxId + 1);
}


/* =========================================================
   ADD LISTING ID TO OLD POSTS
========================================================= */

function ensureListingIds(posts) {

    let maxId = 1000;

    /* =========================================
       FIND CURRENT MAX ID
    ========================================= */

    for (const post of posts) {

        const id =
            parseInt(
                post.listingId,
                10
            );

        if (
            Number.isInteger(id) &&
            id > maxId
        ) {

            maxId = id;

        }
    }


    /* =========================================
       ASSIGN UNIQUE IDS
    ========================================= */

    let changed = false;

    for (const post of posts) {

        if (!post.listingId) {

            maxId++;

            post.listingId =
                String(maxId);

            changed = true;

        }
    }


    /* =========================================
       SAVE
    ========================================= */

    if (changed) {

        savePosts(posts);

        console.log(
            "🏷️ Listing IDs added to old posts"
        );

    }


    return posts;
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

    catch (
        error
    ) {

        console.log(
            "❌ posts.json read error:",
            error.message
        );


        return [];

    }

}


/* =========================================================
   PROCESS TELEGRAM MESSAGE
   IMPORTANT:
   აქ ფოტო აღარ იტვირთება.
   
   ჯერ მხოლოდ ტექსტი/მონაცემები მუშავდება,
   რათა ახალი ბინა მაშინვე შევინახოთ.
========================================================= */

function processMessage(
    msg,
    albums
) {

    const text =
        msg.message || "";
        const telegramCodeMatch = text.match(
    /(?:🍊\s*)?Код\s*[:№#-]?\s*(\d+)/i
);

const telegramCode = telegramCodeMatch
    ? telegramCodeMatch[1]
    : "";


    /*
       ტექსტიც არ აქვს და ფოტოც არ აქვს
       → საერთოდ არ გვჭირდება.
    */

    if (
        !msg.photo &&
        !text
    ) {

        return null;

    }


    const albumId =
        msg.groupedId

            ? String(
                msg.groupedId
            )

            : String(
                msg.id
            );


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
                listingId:
    telegramCode,

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
        if (telegramCode) {
    post.listingId = telegramCode;
}


    /*
       თუ ამავე album-ში უფრო გრძელი ტექსტი
       მოვიდა, შევინარჩუნოთ.
    */

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


    /* =====================================================
       ADDRESS
    ===================================================== */
const detectedStreet =
    getValue(
        text,
        [

            /📍\s*Адрес:\s*([^\n]+)/i,

            /Адрес:\s*([^\n]+)/i,

            /📍\s*(?:ул\.?|улица|проспект|пр-т|пр\.?|avenue|street|st\.?)\s+([^\n]+)/i,

            /(?:ул\.?|улица|проспект|пр-т|пр\.?|avenue|street|st\.?)\s+([А-Яа-яЁёA-Za-zА-Яа-яЁё0-9\s.-]+?)(?=\s*(?:#|📍|Цена|Комнат|Площадь|Этаж|$))/i

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
       YANDEX URL
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
   BATHROOMS
===================================================== */

const detectedBathrooms =
    getValue(
        text,
        [
            /Количество\s*#?Ванных[: ]*(\d+)/i,
            /Количество\s*ванных\s*комнат[: ]*(\d+)/i,
            /Ванные[: ]*(\d+)/i,
            /Ванная[: ]*(\d+)/i,
            /Санузлы[: ]*(\d+)/i,
            /Санузел[: ]*(\d+)/i,
            /Bathroom[s]?[: ]*(\d+)/i,
            /WC[: ]*(\d+)/i
        ]
    );

if (
    detectedBathrooms
) {
    post.bathrooms =
        detectedBathrooms;
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
       AGENT
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


    /*
       აქ შეგნებულად აღარ არის:

       await downloadPhoto(...)

       რადგან ახალი პოსტი ჯერ უნდა
       მოხვდეს posts.json-ში.
    */


    return post;

}


/* =========================================================
   DOWNLOAD PHOTOS AFTER SAVE
========================================================= */

async function downloadPhotosForPost(
    post,
    messages
) {

    if (
        !post
    ) {

        return;

    }


    /*
       ამ post-ის album/message-ების მოძებნა.
    */

    const relatedMessages =
        messages.filter(

            msg => {

                const id =
                    msg.groupedId

                        ? String(
                            msg.groupedId
                        )

                        : String(
                            msg.id
                        );


                return (
                    id ===
                    String(
                        post.groupId
                    )
                );

            }

        );


    for (
        const msg of
        relatedMessages
    ) {

        if (
            !msg.photo
        ) {

            continue;

        }


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
   UPDATE POST STATUS
========================================================= */

function updateStatus(
    post
) {

    const timestamp =
        toUnixSeconds(
            post.date
        );


    if (
        !timestamp
    ) {

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
   MERGE ONE POST IMMEDIATELY
   IMPORTANT:
   ახალი განცხადება posts.json-ში
   ინახება დაუყოვნებლივ.
========================================================= */

function saveNewPostImmediately(
    posts,
    post
) {

    if (
        !post
    ) {

        return null;

    }
    /* =====================================================
   UNIQUE LISTING ID
===================================================== */

if (!post.listingId) {

    post.listingId =
        getNextListingId(posts);

    console.log(
        "🏷️ NEW LISTING ID:",
        post.listingId
    );
}
/*
   თუ განცხადება ადმინისტრატორმა წაშალა,
   Telegram-ის ავტომატურმა sync-მა
   აღარ უნდა დააბრუნოს.
*/

if (
    isPostDeleted(
        post.id
    )
) {

    console.log(
        "🗑️ SKIPPED DELETED TELEGRAM POST:",
        post.id
    );

    return null;

}

    /*
       ყველა ძირითადი ველი მაინც არსებობდეს.
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

    post.agent =
        post.agent || "";

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


    /*
       მთავარი უნიკალური იდენტიფიკატორი:
       Telegram message ID.
    */

    const existingIndex =
        posts.findIndex(

            oldPost =>

                String(
                    oldPost.id
                ) ===
                String(
                    post.id
                )

        );


    /* =====================================================
       NEW POST
    ===================================================== */

    if (
        existingIndex === -1
    ) {

        posts.push(
            post
        );


        console.log(
            "🆕 NEW TELEGRAM POST:",
            post.id,
            "|",
            post.street,
            "|",
            post.district
        );


        /*
           🔥 აქ ხდება დაუყოვნებლივი შენახვა.
        */

        savePosts(
            posts
        );


        console.log(
            "💾 SAVED IMMEDIATELY:",
            post.id
        );


        return post;

    }


    /* =====================================================
       EXISTING POST
    ===================================================== */

    const oldPost =
        posts[
            existingIndex
        ];

const manualEdits =
    oldPost.manualEdits || {};

const merged = {

    ...oldPost,

    ...post

};


const editableFields = [

    "district",
    "street",
    "rooms",
    "bedrooms",
    "area",
    "floor",
    "price",
    "text"

];


for (
    const field of
    editableFields
) {

    if (
        manualEdits[field] === true
    ) {

        merged[field] =
            oldPost[field];

    }

}


merged.manualEdits =
    manualEdits;

    /*
       თუ ახალი Telegram message-ის დროს
       ფოტო ჯერ არ გვაქვს,
       ძველი ფოტოები შევინარჩუნოთ.
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
       თუ ახალი პოსტის კოორდინატა არ გვაქვს,
       ძველი სწორი კოორდინატა შევინარჩუნოთ.
    */

    if (
        !isTbilisiCoordinates(
            post.lat,
            post.lng
        )
    ) {

        if (
            isTbilisiCoordinates(
                oldPost.lat,
                oldPost.lng
            )
        ) {

            merged.lat =
                oldPost.lat;

            merged.lng =
                oldPost.lng;

            merged.geoSource =
                oldPost.geoSource ||
                "existing";

            merged.geoAccuracy =
                oldPost.geoAccuracy ||
                "existing";

            merged.geoUpdatedAt =
                oldPost.geoUpdatedAt ||
                "";

        }

    }


    posts[
        existingIndex
    ] =
        merged;


    savePosts(
        posts
    );


    console.log(
        "♻️ UPDATED AND SAVED:",
        merged.id
    );


    return merged;

}
/* =========================================================
   DELETED POSTS
========================================================= */

function loadDeletedPostIds() {

    if (
        !fs.existsSync(
            DELETED_POSTS_FILE
        )
    ) {

        return [];

    }

    try {

        const raw =
            fs.readFileSync(
                DELETED_POSTS_FILE,
                "utf8"
            );

        const ids =
            JSON.parse(
                raw
            );

        return Array.isArray(ids)

            ? ids.map(
                id => String(id)
            )

            : [];

    }

    catch (error) {

        console.log(
            "⚠️ deleted_posts.json read error:",
            error.message
        );

        return [];

    }

}


function isPostDeleted(
    postId
) {

    return loadDeletedPostIds()
        .includes(
            String(postId)
        );

}

/* =========================================================
   SAVE ALBUM IMMEDIATELY
========================================================= */

function saveAlbumsImmediately(
    posts,
    albums
) {

    let savedCount =
        0;


    for (
        const albumId of
        Object.keys(
            albums
        )
    ) {

        const post =
            albums[
                albumId
            ];


        if (
            !post
        ) {

            continue;

        }


        const before =
            posts.find(
                oldPost =>
                    String(
                        oldPost.id
                    ) ===
                    String(
                        post.id
                    )
            );


        const wasNew =
            !before;


        saveNewPostImmediately(
            posts,
            post
        );


        if (
            wasNew
        ) {

            savedCount++;

        }

    }


    console.log(
        "💾 IMMEDIATE POSTS SAVED:",
        savedCount
    );


    return savedCount;

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
           უკვე სწორი კოორდინატა აქვს.
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


        /*
           ბოლო მცდელობა ახლახან თუ იყო,
           ამ გაშვებაზე არ გავიმეოროთ.
        */

        if (
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

                    continue;

                }

            }

        }


        processed++;


        post.geoAttemptAt =
            new Date().toISOString();


        try {

            console.log(
                "🧭 BACKFILL:",
                post.id,
                post.street
            );


            const result =
                await getCoordinatesForPost(
                    post
                );


            if (
                result
            ) {

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
                    "📍 BACKFILL SAVED:",
                    post.id,
                    post.lat,
                    post.lng
                );

            }


            /*
               თითოეული ბინის შემდეგ
               აუცილებლად ვინახავთ.
            */

            savePosts(
                posts
            );

        }

        catch (
            error
        ) {

            console.log(
                "⚠️ Backfill error:",
                post.id,
                error.message
            );


            /*
               შეცდომის შემთხვევაშიც
               პოსტი არ იკარგება.
            */

            savePosts(
                posts
            );

        }

    }


    console.log(
        "🔄 OLD POSTS CHECKED:",
        processed
    );

}


/* =========================================================
   UPDATE COORDINATES FOR NEW POSTS
========================================================= */

async function updateNewPostCoordinates(
    posts,
    postIds
) {

    for (
        const postId of
        postIds
    ) {

        const index =
            posts.findIndex(

                post =>

                    String(
                        post.id
                    ) ===
                    String(
                        postId
                    )

            );


        if (
            index === -1
        ) {

            continue;

        }


        const post =
            posts[
                index
            ];


        /*
           უკვე აქვს სწორი კოორდინატა.
        */

        if (
            isTbilisiCoordinates(
                post.lat,
                post.lng
            )
        ) {

            continue;

        }


        try {

            console.log(
                "🗺️ FINDING LOCATION FOR NEW POST:",
                post.id
            );


            const result =
                await getCoordinatesForPost(
                    post
                );


            if (
                result
            ) {

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
                    "📍 NEW POST LOCATION SAVED:",
                    post.id,
                    post.lat,
                    post.lng
                );

            }

            else {

                console.log(
                    "⚠️ LOCATION NOT FOUND FOR NEW POST:",
                    post.id
                );

            }


            /*
               კოორდინატის შემდეგაც ვინახავთ.
            */

            savePosts(
                posts
            );

        }

        catch (
            error
        ) {

            console.log(
                "⚠️ New post geocoding error:",
                post.id,
                error.message
            );


            /*
               მთავარი:
               geocoding-ის შეცდომა
               პოსტს არ შლის.
            */

            savePosts(
                posts
            );

        }

    }

}


/* =========================================================
   DOWNLOAD PHOTOS FOR NEW POSTS
========================================================= */

async function downloadNewPostPhotos(
    posts,
    albums,
    messages,
    postIds
) {

    for (
        const postId of
        postIds
    ) {

        const index =
            posts.findIndex(

                post =>

                    String(
                        post.id
                    ) ===
                    String(
                        postId
                    )

            );


        if (
            index === -1
        ) {

            continue;

        }


        const post =
            posts[
                index
            ];


        const album =
            Object.values(
                albums
            ).find(

                item =>

                    String(
                        item.id
                    ) ===
                    String(
                        postId
                    )

            );


        if (
            !album
        ) {

            continue;

        }


        const groupId =
            String(
                album.groupId
            );


        const relatedMessages =
            messages.filter(

                msg => {

                    const id =
                        msg.groupedId

                            ? String(
                                msg.groupedId
                            )

                            : String(
                                msg.id
                            );


                    return (
                        id ===
                        groupId
                    );

                }

            );


        for (
            const msg of
            relatedMessages
        ) {

            if (
                !msg.photo
            ) {

                continue;

            }


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


                /*
                   ფოტოს დამატებისთანავე
                   ვინახავთ.
                */

                savePosts(
                    posts
                );


                console.log(
                    "📸 IMAGE SAVED TO POST:",
                    post.id,
                    image
                );

            }

        }

    }

}


/* =========================================================
   FINAL NORMALIZATION
========================================================= */

function normalizeAllPosts(
    posts
) {

    for (
        const post of
        posts
    ) {

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

        updateStatus(
            post
        );

    }


    return posts;

}


/* =========================================================
   SORT POSTS
========================================================= */

function sortPosts(
    posts
) {

    posts.sort(

        (a, b) =>

            Number(
                b.id
            ) -

            Number(
                a.id
            )

    );


    return posts;

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
       Telegram აბრუნებს ახალიდან ძველისკენ.
       ძველიდან ახალისკენ ვაბრუნებთ.
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
        "📡 CHANNEL:",
        channel
    );


    /* =====================================================
       LOAD EXISTING POSTS
    ===================================================== */

    let posts =
        loadPosts();
        posts =
    ensureListingIds(posts);


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
       PROCESS TELEGRAM TEXT
       
       IMPORTANT:
       აქ ფოტო არ იტვირთება.
       მხოლოდ ტექსტი მუშავდება.
    ===================================================== */

    for (
        const msg of
        messages
    ) {

        try {

            const post =
                processMessage(
                    msg,
                    albums
                );


            if (
                post
            ) {

                console.log(
                    "📝 PARSED TELEGRAM:",
                    post.id,
                    "|",
                    post.street,
                    "|",
                    post.district
                );

            }

        }

        catch (
            error
        ) {

            console.log(
                "❌ Message processing error:",
                msg.id,
                error.message
            );

        }

    }


    console.log(
        "📚 Albums / Posts:",
        Object.keys(
            albums
        ).length
    );


    /* =====================================================
       🔥 SAVE IMMEDIATELY
       
       აქ ხდება ყველაზე მნიშვნელოვანი რამ:
       Telegram-იდან მიღებული ახალი ბინები
       ჯერ posts.json-ში ხვდება.
       
       ამის შემდეგ იწყება ფოტოები და კოორდინატები.
    ===================================================== */

    const beforeCount =
        posts.length;


    saveAlbumsImmediately(
        posts,
        albums
    );


    const afterCount =
        posts.length;


    console.log(
        "======================================"
    );


    console.log(
        "🔥 IMMEDIATE SYNC FINISHED"
    );


    console.log(
        "📦 BEFORE:",
        beforeCount
    );


    console.log(
        "📦 AFTER:",
        afterCount
    );


    console.log(
        "🆕 NEW POSTS:",
        afterCount -
        beforeCount
    );


    console.log(
        "======================================"
    );


    /*
       ამ მომენტიდან უკვე გარანტირებულად
       უნდა არსებობდეს ახალი ბინები posts.json-ში.
    */

    savePosts(
        posts
    );


    /* =====================================================
       NEW POST IDS
    ===================================================== */

    const newPostIds = [];


    for (
        const albumId of
        Object.keys(
            albums
        )
    ) {

        const album =
            albums[
                albumId
            ];


        if (
            !album
        ) {

            continue;

        }


        const existsBefore =
            false;


        /*
           რადგან saveAlbumsImmediately()
           უკვე მუშაობდა, ვამოწმებთ Telegram ID-ს.
        */

        const matching =
            posts.find(
                post =>

                    String(
                        post.id
                    ) ===
                    String(
                        album.id
                    )

            );


        if (
            matching
        ) {

            /*
               ახალი პოსტი თუ არის,
               მისი ID ამ სიაში გვჭირდება.
            */

            const wasRecentlyAdded =
                Number(
                    matching.date
                ) >=
                Number(
                    album.date
                );


            if (
                wasRecentlyAdded
            ) {

                if (
                    !newPostIds.includes(
                        matching.id
                    )
                ) {

                    newPostIds.push(
                        matching.id
                    );

                }

            }

        }

    }


    console.log(
        "🆕 POSTS TO PROCESS:",
        newPostIds.length
    );


    /* =====================================================
       PHOTOS
       
       ფოტოები ახლა იტვირთება.
       posts.json უკვე არსებობს.
    ===================================================== */

    try {

        await downloadNewPostPhotos(
            posts,
            albums,
            messages,
            newPostIds
        );

    }

    catch (
        error
    ) {

        console.log(
            "⚠️ Photo stage error:",
            error.message
        );


        /*
           ფოტოებზე პრობლემა არ უნდა
           წყვეტდეს parser-ს.
        */

        savePosts(
            posts
        );

    }


    /* =====================================================
       COORDINATES
       
       ახალი ბინების კოორდინატები
       ცალკე ეტაპზე იძებნება.
    ===================================================== */

    try {

        await updateNewPostCoordinates(
            posts,
            newPostIds
        );

    }

    catch (
        error
    ) {

        console.log(
            "⚠️ New coordinates stage error:",
            error.message
        );


        /*
           მთავარი პოსტი უკვე შენახულია.
        */

        savePosts(
            posts
        );

    }


    /* =====================================================
       NORMALIZE
    ===================================================== */

    normalizeAllPosts(
        posts
    );


    /* =====================================================
       SORT
    ===================================================== */

    sortPosts(
        posts
    );


    /* =====================================================
       SAVE
    ===================================================== */

    savePosts(
        posts
    );


    /* =====================================================
       OLD POSTS BACKFILL
       
       ძველი ბინები ცალკე მუშავდება.
       
       ეს ეტაპი ახალი ბინების დამატებას
       აღარ უშლის ხელს.
    ===================================================== */

    try {

        await backfillOldPosts(
            posts
        );

    }

    catch (
        error
    ) {

        console.log(
            "⚠️ Backfill stage error:",
            error.message
        );

    }


    /* =====================================================
       FINAL SAVE
    ===================================================== */

    normalizeAllPosts(
        posts
    );


    sortPosts(
        posts
    );


    savePosts(
        posts
    );


    /* =====================================================
       STATISTICS
    ===================================================== */

    let withCoordinates =
        0;


    let withoutCoordinates =
        0;


    let activePosts =
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

        }

        else {

            withoutCoordinates++;

        }


        if (
            post.status ===
            "active"
        ) {

            activePosts++;

        }

    }


    /* =====================================================
       FINAL LOG
    ===================================================== */

    console.log(
        "======================================"
    );


    console.log(
        "🍊 PARSER FINISHED"
    );


    console.log(
        "======================================"
    );


    console.log(
        "📦 TOTAL POSTS:",
        posts.length
    );


    console.log(
        "🆕 NEW POSTS THIS RUN:",
        newPostIds.length
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
        "🟢 ACTIVE:",
        activePosts
    );


    console.log(
        "======================================"
    );

}
/* =========================================================
   PARSER LOCK
   ერთდროულად ორი parser არ გაეშვას
========================================================= */

let parserRunning =
    false;

/* =========================================================
   RUN PARSER
========================================================= */

async function runParser() {

    if (
        parserRunning
    ) {

        console.log(
            "Parser is already running - skipping this cycle."
        );

        return;

    }


    parserRunning =
        true;


    console.log(
        "Starting parser..."
    );


    try {

        await start();

    }

    catch (
        error
    ) {

        console.error(
            "PARSER ERROR:",
            error
        );


        try {

            const emergencyPosts =
                loadPosts();


            if (
                Array.isArray(
                    emergencyPosts
                )
            ) {

                savePosts(
                    emergencyPosts
                );

            }

        }

        catch (
            saveError
        ) {

            console.error(
                "Emergency save error:",
                saveError.message
            );

        }

    }

    finally {

        parserRunning =
            false;


        console.log(
            "Parser cycle finished."
        );

    }

}


/* =========================================================
   FIRST RUN
========================================================= */

runParser();


/* =========================================================
   AUTO SYNC
   ყოველ 2 წუთში
========================================================= */

setInterval(
    () => {

        runParser();

    },

 30 * 1000
);