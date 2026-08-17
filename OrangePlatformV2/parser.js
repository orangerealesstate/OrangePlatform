const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

require("dotenv").config();

const apiId = Number(process.env.API_ID);
const apiHash = process.env.API_HASH;
const channel = process.env.CHANNEL;

const stringSession = new StringSession(
    process.env.STRING_SESSION || ""
);

const client = new TelegramClient(
    stringSession,
    apiId,
    apiHash,
    {
        connectionRetries: 5,
    }
);

const POSTS_FILE =
    path.join(__dirname, "posts.json");

const DOWNLOADS =
    path.join(__dirname, "downloads");


if (!fs.existsSync(DOWNLOADS)) {

    fs.mkdirSync(DOWNLOADS);

}


/* =========================================================
   GET VALUE
========================================================= */

function getValue(text, patterns) {

    if (!text) return "";

    for (const pattern of patterns) {

        const match =
            text.match(pattern);

        if (match) {

            return match[1].trim();

        }

    }

    return "";

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

    if (!value) return "-";

    let d = value

        .toLowerCase()

        .replace(/#/g, "")

        .replace(/📍/g, "")

        .trim();


    if (d.includes("сабур"))
        return "saburtalo";


    if (d.includes("вак"))
        return "vake";


    if (d.includes("вер"))
        return "vera";


    if (d.includes("исан"))
        return "isani";


    if (d.includes("дигом"))
        return "digomi";


    if (d.includes("крцан"))
        return "krtsanisi";


    if (d.includes("ортач"))
        return "ortachala";


    if (d.includes("мтац"))
        return "mtatsminda";


    if (d.includes("дидуб"))
        return "didube";


    if (d.includes("глдан"))
        return "gldani";


    return d;

}


/* =========================================================
   GEOCODE
========================================================= */
const geocodeCache = new Map();

async function geocodeAddress(address) {

    if (
        !address ||
        address === "-" ||
        address === "undefined" ||
        address === "null"
    ) {
        return {
            lat: null,
            lng: null
        };
    }

    let cleanAddress =
        String(address)
            .trim()
            .replace(/\s+/g, " ");

    if (
        !cleanAddress ||
        cleanAddress.length < 3
    ) {
        return {
            lat: null,
            lng: null
        };
    }

    if (
        geocodeCache.has(cleanAddress)
    ) {
        return geocodeCache.get(
            cleanAddress
        );
    }

    const queries = [
        cleanAddress +
        ", Tbilisi, Georgia"
    ];

    const normalized =
        cleanAddress
            .replace(
                /^ул\.?\s*/i,
                "улица "
            )
            .replace(
                /^пр\.?\s*/i,
                "проспект "
            )
            .replace(
                /^пер\.?\s*/i,
                "переулок "
            )
            .replace(
                /^наб\.?\s*/i,
                "набережная "
            );

    if (
        normalized !== cleanAddress
    ) {
        queries.push(
            normalized +
            ", Tbilisi, Georgia"
        );
    }

    const url =
        "https://nominatim.openstreetmap.org/search";

    for (
        let qIndex = 0;
        qIndex < queries.length;
        qIndex++
    ) {

        const query =
            queries[qIndex];

        try {

            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        1200
                    )
            );

            console.log(
                "📍 Geocoding:",
                query
            );

            const { data } =
                await axios.get(
                    url,
                    {
                        params: {

                            q: query,

                            format:
                                "json",

                            limit:
                                5,

                            countrycodes:
                                "ge",

                            addressdetails:
                                1,

                            viewbox:
                                "44.65,41.82,44.95,41.60",

                            bounded:
                                1
                        },

                        headers: {

                            "User-Agent":
                                "Orange Real Estate Tbilisi"
                        },

                        timeout:
                            10000
                    }
                );

            if (
                !data ||
                !data.length
            ) {

                console.log(
                    "❌ Not found:",
                    query
                );

                continue;
            }

            let selected = null;

            for (
                const item of data
            ) {

                const lat =
                    Number(item.lat);

                const lng =
                    Number(item.lon);

                if (
                    !Number.isFinite(lat) ||
                    !Number.isFinite(lng)
                ) {
                    continue;
                }

                if (
                    lat >= 41.60 &&
                    lat <= 41.82 &&
                    lng >= 44.65 &&
                    lng <= 44.95
                ) {

                    selected =
                        item;

                    break;
                }
            }

            if (!selected) {

                console.log(
                    "⚠️ Result outside Tbilisi:",
                    query
                );

                continue;
            }

            const result = {

    lat:
        Number(
            selected.lat
        ),

    lng:
        Number(
            selected.lon
        )
};


// მიღებული ქუჩის შემოწმება
const returnedAddress =
    String(
        selected.display_name || ""
    ).toLowerCase();

const requestedAddress =
    cleanAddress.toLowerCase();

const streetWords =
    requestedAddress
        .replace(
            /^улица\s+/i,
            ""
        )
        .replace(
            /^ул\.?\s+/i,
            ""
        )
        .replace(
            /^проспект\s+/i,
            ""
        )
        .replace(
            /^пр\.?\s+/i,
            ""
        )
        .split(",")[0]
        .trim();

if (
    streetWords &&
    !returnedAddress.includes(
        streetWords
    )
) {

    console.log(
        "⚠️ Street mismatch:",
        cleanAddress,
        "=>",
        selected.display_name
    );

    continue;
}


console.log(
    "✅ Coordinates found:",
    result
);

geocodeCache.set(
    cleanAddress,
    result
);

            return result;

        } catch (err) {

            const status =
                err.response?.status;

            console.log(
                `Geocode error ${qIndex + 1}/${queries.length}:`,
                status ||
                err.message
            );

            if (
                status === 429
            ) {

                const wait =
                    10000 *
                    (qIndex + 1);

                console.log(
                    `⏳ 429 - waiting ${wait / 1000}s...`
                );

                await new Promise(
                    resolve =>
                        setTimeout(
                            resolve,
                            wait
                        )
                );
            }
        }
    }

    const empty = {

        lat: null,
        lng: null
    };

    geocodeCache.set(
        cleanAddress,
        empty
    );

    console.log(
        "❌ Coordinates not found:",
        cleanAddress
    );

    return empty;
}

/* =========================================================
   DOWNLOAD PHOTO
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

            console.log(
                "Already exists:",
                fileName
            );


            return (
                "downloads/" +
                fileName
            );

        }


        const buffer =
            await client.downloadMedia(
                message
            );


        console.log(
            "Downloading:",
            fileName,
            buffer
                ? "OK"
                : "FAIL"
        );


        if (!buffer) {

            return null;

        }


        fs.writeFileSync(
            filePath,
            buffer
        );


        return (
            "downloads/" +
            fileName
        );

    }

    catch (err) {

        console.log(
            "Photo download error:"
        );


        console.log(err);


        return null;

    }

}


/* =========================================================
   DUPLICATE HELPERS
========================================================= */

function cleanFingerprint(value) {

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
   APARTMENT KEY
========================================================= */

function makeApartmentKey(post) {

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
       მისამართის გარეშე
       დუბლიკატად არ ვთვლით.
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
   START PARSER
========================================================= */

async function start() {

    await client.connect();


    if (!client.connected) {

        await client.connect();

    }


    console.log(
        "✅ Bot connected"
    );


    console.log(
        "CHANNEL:",
        channel
    );


    const now = new Date();

const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
);

const startOfTomorrow = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1
);

const messages =
    await client.getMessages(
        channel,
        {
            limit: 500,
            offsetDate: Math.floor(
                startOfTomorrow.getTime() / 1000
            )
        }
    );

const todayMessages = messages.filter(msg => {
    const messageDate = new Date(
        msg.date * 1000
    );

    return (
        messageDate >= startOfToday &&
        messageDate < startOfTomorrow
    );
});

console.log(
    "Today's messages:",
    todayMessages.length
);


    console.log(
        "Messages count:",
       todayMessages.length
    );


    /*
       ძველი posts.json
       ვინარჩუნებთ.
    */

    let posts = [];


    if (
        fs.existsSync(
            POSTS_FILE
        )
    ) {

        posts =
            JSON.parse(

                fs.readFileSync(
                    POSTS_FILE,
                    "utf8"
                )

            );

    }


    const albums = {};


    /*
       Telegram messages
    */

    for (
        const msg of
        todayMessages.reverse()
    ) {


        console.log(
            "Processing message:",
            msg.id
        );


        const text =
            msg.message || "";


        if (
            !msg.photo &&
            !text
        ) {

            continue;

        }


        /*
           Telegram album
        */

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
                    msg.date,

                telegramLink:
                    `https://t.me/kvartiri_tbilisi2023/${msg.id}`,

                text:
                    text,

                images: [],

                price: "",

                district: "",

                street: "",

                rooms: "",

                bedrooms: "",

                area: "",

                floor: "",

                lat: null,

                lng: null

            };

        }


        const post =
            albums[albumId];


        /*
           ყველაზე გრძელი ტექსტი
        */

        if (
            text.length >
            post.text.length
        ) {

            post.text =
                text;

        }


        /* =====================================================
           PRICE
        ===================================================== */

        post.price =
            post.price ||

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


        /* =====================================================
           DISTRICT
        ===================================================== */

        post.district =

            normalizeDistrict(

                post.district ||

                getValue(

                    text,

                    [

                        /📍?\s*Ра[йи]он:\s*#?([^📍\n]+)/i,

                        /Ра[йи]он:\s*#?([^📍\n]+)/i,

                        /Район\s*#([^\s#]+)/i,

                        /квартира\s+в\s+([^\s📍\n]+)/i

                    ]

                )

            );


        /* =====================================================
           STREET
        ===================================================== */

        post.street =

            post.street ||

            getValue(

                text,

                [

                    /📍\s*Адрес:\s*([^\n]+)/i,

                    /Адрес:\s*([^\n]+)/i

                ]

            );

if (
    post.street
) {

    post.street =
        String(post.street)

            // ქუჩის დასაწყისის გასწორება
            .replace(
                /^ул\.?\s*/i,
                ""
            )

            .replace(
                /^улица\s*/i,
                ""
            )

            // დაზიანებული "ица" ფორმა
            .replace(
                /^ица\s+/i,
                ""
            )

            // ქართული/რუსული ზედმეტი ჰეშთეგები
            .replace(
                /#метро/gi,
                ""
            )

           .replace(
    /https?:\/\/\S+/gi,
    ""
)

            // ჰეშთეგების მოცილება
            .replace(
                /#[^\s,]+/g,
                ""
            )

            // ზედმეტი სიტყვების/ნიშნების გაწმენდა
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
           COORDINATES
        ===================================================== */

        let coords = {

            lat:
                post.lat ||
                null,

            lng:
                post.lng ||
                null

        };


        if (!coords.lat || !coords.lng) {

    const addresses = [

        `${post.street}, ${post.district}, Tbilisi, Georgia`,

        `${post.street}, Tbilisi, Georgia`

    ];

    for (const address of addresses) {

        console.log(
            "📍 Geocoding:",
            address
        );

        const result =
            await geocodeAddress(address);

        if (
            result.lat &&
            result.lng
        ) {

            coords = result;

            console.log(
                "✅ Coordinates found:",
                result
            );

            break;

        }

    }

}


        post.lat =
            coords.lat;


        post.lng =
            coords.lng;


        /* =====================================================
           AGENT
        ===================================================== */

        post.agent =

            getValue(

                text,

                [

                    /Агент:\s*([^\n]+)/i,

                    /Риелтор:\s*([^\n]+)/i,

                    /Контакт:\s*([^\n]+)/i,

                    /@([A-Za-z0-9_]+)/i

                ]

            );


        /* =====================================================
           ROOMS
        ===================================================== */

        post.rooms =

            post.rooms ||

            getValue(

                text,

                [

                    /Количество\s*#?Комнат[: ]*(\d+)/i,

                    /Количество\s*комнат[: ]*(\d+)/i,

                    /Комнат[: ]*(\d+)/i

                ]

            );


        /* =====================================================
           BEDROOMS
        ===================================================== */

        post.bedrooms =

            post.bedrooms ||

            getValue(

                text,

                [

                    /Количество\s*#?Спален[: ]*(\d+)/i,

                    /Количество\s*спален[: ]*(\d+)/i,

                    /Спален[: ]*(\d+)/i

                ]

            );


        /* =====================================================
           AREA
        ===================================================== */

        post.area =

            post.area ||

            getValue(

                text,

                [

                    /Общая\s*площадь[: ]*([\d.,]+)/i,

                    /Площадь[: ]*([\d.,]+)/i

                ]

            );


        /* =====================================================
           FLOOR
        ===================================================== */

        post.floor =

            post.floor ||

            getValue(

                text,

                [

                    /Этаж[: ]*([^\n]+)/i

                ]

            );


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
       SAVE / UPDATE / DUPLICATE CHECK
    ========================================================= */

    for (
        const key of
        Object.keys(albums)
    ) {


        const post =
            albums[key];


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


        /*
           Status
        */

        const days =

            (
                Date.now() / 1000 -
                post.date
            ) / 86400;


        post.status =

            days > 30

                ? "rented"

                : "active";


        /* =====================================================
           FIRST: EXACT TELEGRAM ID
        ===================================================== */

        let existingIndex =

            posts.findIndex(

                p =>
                    String(p.id) ===
                    String(post.id)

            );


        /* =====================================================
           SECOND: SAME APARTMENT
        ===================================================== */

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


        /* =====================================================
           UPDATE EXISTING
        ===================================================== */

        if (
            existingIndex >= 0
        ) {


            const oldPost =
                posts[
                    existingIndex
                ];


            /*
               ახალი Telegram პოსტი
               ანახლებს ძველს.
            */

            posts[
                existingIndex
            ] = {

                ...oldPost,

                ...post,


                /*
                   თუ ახალ პოსტს
                   კოორდინატა არ აქვს,
                   ძველი შევინარჩუნოთ.
                */

                lat:
                    post.lat ||
                    oldPost.lat ||
                    null,

                lng:
                    post.lng ||
                    oldPost.lng ||
                    null,


                /*
                   ახალი Telegram
                   message ხდება აქტიური.
                */

                id:
                    post.id,

                groupId:
                    post.groupId,

                date:
                    post.date,

                telegramLink:
                    post.telegramLink

            };


            console.log(
                "♻️ DUPLICATE APARTMENT UPDATED:",
                post.street,
                post.district,
                post.rooms,
                post.area,
                post.floor
            );


        }

        /* =====================================================
           NEW APARTMENT
        ===================================================== */

        else {


            posts.push(
                post
            );


            console.log(
                "🆕 NEW APARTMENT:",
                post.street,
                post.district
            );

        }

    }


    /* =========================================================
       SORT
    ========================================================= */

    posts.sort(

        (a, b) =>

            Number(b.id) -
            Number(a.id)

    );


    /* =========================================================
       DEBUG
    ========================================================= */

    for (
        const p of posts
    ) {

        console.log(

            p.street,

            "=>",

            p.lat,

            p.lng

        );

    }


    console.log(
        "Albums:",
        Object.keys(
            albums
        ).length
    );


    console.log(
        "Posts before save:",
        posts.length
    );


    /* =========================================================
       SAVE
    ========================================================= */

    savePosts(
        posts
    );


    console.log(
        `✅ Saved ${posts.length} posts`
    );

}


/* =========================================================
   RUN PARSER
========================================================= */

async function runParser() {

    try {

        await start();

    }

    catch (err) {

        console.error(
            err
        );

    }

}


runParser();


/* =========================================================
   EVERY 2 MINUTES
========================================================= */

setInterval(

    runParser,

    2 * 60 * 1000

);