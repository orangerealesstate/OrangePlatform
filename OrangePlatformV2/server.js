const express = require("express");
const fs = require("fs");
const path = require("path");

require("./parser");
require("./bot");

const app = express();

app.use(express.json());

const PORT = 3000;


// =========================================================
// STATIC FILES
// =========================================================

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);

app.use(
    "/downloads",
    express.static(
        path.join(__dirname, "downloads")
    )
);


// =========================================================
// FILES
// =========================================================

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
const FAVORITES_FILE =
    path.join(
        __dirname,
        "favorites.json"
    );

const STATS_FILE =
    path.join(
        __dirname,
        "stats.json"
    );


// =========================================================
// STATS
// =========================================================

function getStats() {

    try {

        if (
            !fs.existsSync(
                STATS_FILE
            )
        ) {
return {
    users: {},
    appViews: 0,
    postViews: {},
    dailyStats: {}
};

        }


        return JSON.parse(

            fs.readFileSync(
                STATS_FILE,
                "utf8"
            )

        );

    }

    catch (err) {

        console.error(
            "Error reading stats:",
            err
        );


        return {

            users: {},

            appViews: 0,

            postViews: {}

        };

    }

}


function saveStats(stats) {

    fs.writeFileSync(

        STATS_FILE,

        JSON.stringify(
            stats,
            null,
            2
        ),

        "utf8"

    );

}
// =========================================================
// DAILY STATISTICS
// =========================================================

function getTbilisiDate() {

    return new Intl.DateTimeFormat(
        "en-CA",
        {
            timeZone: "Asia/Tbilisi",
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        }
    ).format(new Date());

}


function ensureDailyStats(stats) {

    if (!stats.dailyStats) {
        stats.dailyStats = {};
    }

    const today =
        getTbilisiDate();

    if (!stats.dailyStats[today]) {

        stats.dailyStats[today] = {
            newUsers: 0,
            appViews: 0,
            postViews: 0
        };

    }

    return stats.dailyStats[today];

}

// =========================================================
// FAVORITES
// =========================================================

function getFavorites() {

    try {

        if (
            !fs.existsSync(
                FAVORITES_FILE
            )
        ) {

            return {};

        }


        return JSON.parse(

            fs.readFileSync(
                FAVORITES_FILE,
                "utf8"
            )

        );

    }

    catch (err) {

        console.error(
            "Error reading favorites:",
            err
        );


        return {};

    }

}


function saveFavorites(data) {

    fs.writeFileSync(

        FAVORITES_FILE,

        JSON.stringify(
            data,
            null,
            2
        ),

        "utf8"

    );

}


// =========================================================
// POSTS
// =========================================================

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


// =========================================================
// READ POSTS
// =========================================================

function getPosts() {

    try {

        if (
            !fs.existsSync(
                POSTS_FILE
            )
        ) {

            return [];

        }


        const data =

            fs.readFileSync(
                POSTS_FILE,
                "utf8"
            );


        return JSON.parse(
            data
        );

    }

    catch (err) {

        console.error(
            "Error reading posts.json:",
            err
        );


        return [];

    }

}


// =========================================================
// 30 DAY POST FILTER
// =========================================================

const POST_MAX_AGE_DAYS = 30;


function parsePostDate(value) {

    if (!value) {

        return null;

    }


    // Date object
    if (
        value instanceof Date
    ) {

        return isNaN(
            value.getTime()
        )

            ? null

            : value;

    }


    // Unix timestamp
    if (
        typeof value === "number"
    ) {

        const ms =

            value < 100000000000

                ? value * 1000

                : value;


        const date =
            new Date(ms);


        return isNaN(
            date.getTime()
        )

            ? null

            : date;

    }


    const raw =
        String(value).trim();


    if (!raw) {

        return null;

    }


    // ISO / normal JS date

    let date =
        new Date(raw);


    if (
        !isNaN(
            date.getTime()
        )
    ) {

        return date;

    }


    // DD.MM.YYYY
    // DD.MM.YYYY HH:mm

    const match =

        raw.match(

            /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/

        );


    if (match) {

        const day =
            Number(
                match[1]
            );

        const month =
            Number(
                match[2]
            ) - 1;

        const year =
            Number(
                match[3]
            );

        const hour =
            Number(
                match[4] || 0
            );

        const minute =
            Number(
                match[5] || 0
            );


        date = new Date(

            year,

            month,

            day,

            hour,

            minute

        );


        if (

            date.getFullYear()
                === year &&

            date.getMonth()
                === month &&

            date.getDate()
                === day

        ) {

            return date;

        }

    }


    return null;

}


// =========================================================
// ONLY POSTS FROM LAST 30 DAYS
// =========================================================

function getVisiblePosts() {

    const posts =
        getPosts();


    const now =
        Date.now();


    const maxAgeMs =

        POST_MAX_AGE_DAYS *

        24 *

        60 *

        60 *

        1000;


    return posts.filter(
        post => {


            const rawDate =

                post.date ??

                post.createdAt ??

                post.created_at ??

                post.publishedAt ??

                post.published_at;


            const postDate =

                parsePostDate(
                    rawDate
                );


            /*
             * თუ თარიღი საერთოდ არ აქვს
             * ან უცნობ ფორმატშია,
             * განცხადებას არ ვშლით.
             */

            if (!postDate) {

                return true;

            }


            const ageMs =

                now -

                postDate.getTime();


            /*
             * მომავლის თარიღიც დაშვებულია.
             */

            return (
                ageMs <=
                maxAgeMs
            );

        }

    );

}


// =========================================================
// DIRECT ACCESS TO posts.json
// =========================================================

app.get(
    "/posts.json",
    (req, res) => {

        res.sendFile(
            POSTS_FILE
        );

    }
);


// =========================================================
// API POSTS
// ONLY LAST 30 DAYS
// =========================================================

app.get(
    "/api/posts",
    (req, res) => {


        res.setHeader(
            "Cache-Control",
            "no-store, no-cache, must-revalidate, proxy-revalidate"
        );


        res.setHeader(
            "Pragma",
            "no-cache"
        );


        res.setHeader(
            "Expires",
            "0"
        );


        res.json(
            getVisiblePosts()
        );

    }
);


// =========================================================
// MATCH REQUEST — SEARCH APARTMENTS
// =========================================================

function normalizeMatchDistrict(value) {

    const text = String(value || "")
        .toLowerCase()
        .trim()
        .replace(/\s+/g, " ");

    const aliases = {

        // SABURTALO
        saburtalo: [
            "saburtalo",
            "сабуртало",
            "საბურთალო"
        ],

        // VAKE
        vake: [
            "vake",
            "ваки",
            "ვაკე"
        ],

        // VERA
        vera: [
            "vera",
            "вера",
            "ვერა"
        ],

        // MTATSMINDA
        mtatsminda: [
            "mtatsminda",
            "мтацминда",
            "მთაწმინდა"
        ],

        // SOLOLAKI
        sololaki: [
            "sololaki",
            "сололаки",
            "სოლოლაკი"
        ],

        // CHUGURETI
        chugureti: [
            "chugureti",
            "чугурети",
            "ჩუღურეთი"
        ],

        // DIDUBE
        didube: [
            "didube",
            "дидубе",
            "დიდუბე"
        ],

        // NADZALADEVI
        nadzaladevi: [
            "nadzaladevi",
            "надзаладеви",
            "ნაძალადევი"
        ],

        // GLDANI
        gldani: [
            "gldani",
            "глдани",
            "გლდანი"
        ],

        // DIDI DIGOMI
        "didi digomi": [
            "didi digomi",
            "დიდი დიღომი",
            "დიდი დიღმის",
            "большой дигоми"
        ],

        // DIGOMI
        digomi: [
            "digomi",
            "дидигоми",
            "დიღომი",
            "дიღомი"
        ],

        // TEMKA
        temka: [
            "temka",
            "темка",
            "თემქა"
        ],

        // ISANI
        isani: [
            "isani",
            "исани",
            "ისანი"
        ],

        // SAMGORI
        samgori: [
            "samgori",
            "самгори",
            "სამგორი"
        ],

        // VARKETILI
        varketili: [
            "varketili",
            "варкетили",
            "ვარკეთილი"
        ],

        // VAZISUBANI
        vazisubani: [
            "vazisubani",
            "вазисубани",
            "ვაზისუბანი"
        ],

        // KRTSANISI
        krtsanisi: [
            "krtsanisi",
            "крцаниси",
            "კრწანისი"
        ],

        // ORTACHALA
        ortachala: [
            "ortachala",
            "орточала",
            "ორთაჭალა"
        ],

        // PONICHALA
        ponichala: [
            "ponichala",
            "поничала",
            "ფონიჭალა"
        ],

        // AVLABARI
        avlabari: [
            "avlabari",
            "авлабари",
            "ავლაბარი"
        ],

        // NAVTLUGHI
        navtlughi: [
            "navtlughi",
            "нафтлуги",
            "ნავთლუღი"
        ],

        // TBILISI SEA
        "tbilisi sea": [
            "tbilisi sea",
            "тбилисское море",
            "თბილისის ზღვა"
        ]

    };


    for (
        const [
            district,
            names
        ]
        of Object.entries(
            aliases
        )
    ) {

        if (
            names.some(
                name =>
                    text.includes(
                        name
                    )
            )
        ) {

            return district;

        }

    }


    return text;
}


function getMatchPetStatus(post) {

    const text = String(post.text || "");

    const match = text.match(
        /#Животные\s*:\s*([^\n]*)/i
    );

    const value = String(
        match?.[1] || ""
    )
        .trim()
        .toLowerCase();

    if (
        value.includes("❌") ||
        value.includes("нет") ||
        value.includes("no") ||
        value.includes("არა")
    ) {

        return "no";

    }

    return "unknown";
}


function getMatchLeaseMonths(post) {

    const text = String(post.text || "");

    const match = text.match(
        /Срок\s*ареньди\s*:\s*([^\n]+)/i
    );

    if (!match) {

        return null;

    }

    const numbers = (
        match[1].match(/\d+/g) || []
    ).map(Number);


    if (!numbers.length) {

        return null;

    }


    if (numbers.length === 1) {

        return {
            min: numbers[0],
            max: numbers[0]
        };

    }


    return {
        min: Math.min(...numbers),
        max: Math.max(...numbers)
    };
}


function getRequestMonths(value) {

    const numbers = (
        String(value || "")
            .match(/\d+/g) || []
    ).map(Number);


    if (!numbers.length) {

        return null;

    }


    return numbers[0];
}


app.post(
    "/api/match-request",
    (req, res) => {

        try {

            const {
                district,
                rooms,
                budget,
                pets,
                period,
                moveIn
            } = req.body || {};


            console.log(
                "🔎 MATCH REQUEST:",
                req.body
            );


            const requestedDistrict =
                normalizeMatchDistrict(
                    district
                );


            const requestedRooms =
                Number(
                    rooms
                );


            const requestedBudget =
                Number(
                    String(
                        budget || ""
                    ).replace(
                        /[^\d.]/g,
                        ""
                    )
                );


            const requestedMonths =
                getRequestMonths(
                    period
                );


            const clientHasPet =
                /да|yes|კი/i.test(
                    String(
                        pets || ""
                    )
                );


            const posts =
                getVisiblePosts();


            const matches =
                posts.filter(
                    post => {

                        // =================================================
                        // მხოლოდ ACTIVE განცხადებები
                        // =================================================

                        if (
                            String(
                                post.status || ""
                            )
                                .toLowerCase()
                            !== "active"
                        ) {

                            return false;

                        }


                        // =================================================
                        // რაიონი
                        // =================================================

                        if (
                            requestedDistrict
                        ) {

                            const postDistrict =
                                normalizeMatchDistrict(
                                    post.district
                                );


                            if (
                                postDistrict !==
                                requestedDistrict
                            ) {

                                return false;

                            }

                        }


                        // =================================================
                        // ოთახები
                        // =================================================

                        if (
                            Number.isFinite(
                                requestedRooms
                            ) &&
                            requestedRooms > 0
                        ) {

                            if (
                                Number(
                                    post.rooms
                                ) !==
                                requestedRooms
                            ) {

                                return false;

                            }

                        }


                        // =================================================
                        // ფასი
                        // =================================================

                        if (
                            Number.isFinite(
                                requestedBudget
                            ) &&
                            requestedBudget > 0
                        ) {

                            const postPrice =
                                Number(
                                    String(
                                        post.price || ""
                                    ).replace(
                                        /[^\d.]/g,
                                        ""
                                    )
                                );


                            if (
                                !Number.isFinite(
                                    postPrice
                                ) ||
                                postPrice >
                                requestedBudget
                            ) {

                                return false;

                            }

                        }


                        // =================================================
                        // შინაური ცხოველი
                        // =================================================

                        if (
                            clientHasPet
                        ) {

                            const petStatus =
                                getMatchPetStatus(
                                    post
                                );


                            if (
                                petStatus === "no"
                            ) {

                                return false;

                            }

                        }


                        // =================================================
                        // ქირაობის პერიოდი
                        // =================================================

                        if (
                            requestedMonths
                        ) {

                            const lease =
                                getMatchLeaseMonths(
                                    post
                                );


                            // თუ განცხადებაში პერიოდი
                            // საერთოდ არ წერია,
                            // ბინას არ გამოვრიცხავთ

                            if (
                                lease
                            ) {

                                if (
                                    requestedMonths <
                                    lease.min ||
                                    requestedMonths >
                                    lease.max
                                ) {

                                    return false;

                                }

                            }

                        }


                        return true;

                    }
                );


            // =================================================
            // მაქსიმუმ 10 შესაბამისი ბინა
            // =================================================

            const result =
                matches
                    .slice(0, 10)
                    .map(
                        post => ({

                            id:
                                post.id,

                            telegramLink:
                                post.telegramLink
                                || "",

                            images:
                                Array.isArray(
                                    post.images
                                )
                                    ? post.images
                                    : [],

                            price:
                                post.price
                                || "",

                            district:
                                post.district
                                || "",

                            street:
                                post.street
                                || "",

                            rooms:
                                post.rooms
                                || "",

                            bedrooms:
                                post.bedrooms
                                || "",

                            area:
                                post.area
                                || "",

                            floor:
                                post.floor
                                || "",

                            bathrooms:
                                post.bathrooms
                                || "",

                            text:
                                post.text
                                || ""

                        })
                    );


            console.log(
                `🏠 MATCHES FOUND: ${result.length}`
            );


            res.json({

                success: true,

                count:
                    result.length,

                posts:
                    result

            });

        }

        catch (err) {

            console.error(
                "❌ MATCH REQUEST ERROR:",
                err
            );


            res
                .status(500)
                .json({

                    success: false,

                    error:
                        "Match request failed"

                });

        }

    }
);




// =========================================================
// FAVORITES
// =========================================================

app.get(
    "/api/favorites/:userId",
    (req, res) => {


        const favorites =
            getFavorites();


        const userId =
            String(
                req.params.userId
            );


        res.json(

            favorites[userId]
                || []

        );

    }
);


app.post(
    "/api/favorites",
    (req, res) => {

console.log(
            "❤️ FAVORITE REQUEST:",
            req.body
        );
        const favorites =
            getFavorites();


        const userId =
            String(
                req.body.userId
            );


        const postId =
            String(
                req.body.postId
            );


        if (
            !favorites[userId]
        ) {

            favorites[userId] = [];

        }


        if (
            !favorites[userId]
                .includes(postId)
        ) {

            favorites[userId]
                .push(postId);

        }


        fs.writeFileSync(

            FAVORITES_FILE,

            JSON.stringify(
                favorites,
                null,
                2
            ),

            "utf8"

        );


        res.json({

            success: true,

            favorites:
                favorites[userId]

        });

    }
);


app.delete(
    "/api/favorites/:userId/:postId",
    (req, res) => {


        const favorites =
            getFavorites();


        const userId =
            String(
                req.params.userId
            );


        const postId =
            String(
                req.params.postId
            );


        if (
            favorites[userId]
        ) {

            favorites[userId] =

                favorites[userId].filter(

                    id =>
                        String(id)
                        !== postId

                );

        }


        fs.writeFileSync(

            FAVORITES_FILE,

            JSON.stringify(
                favorites,
                null,
                2
            ),

            "utf8"

        );


        res.json({

            success: true,

            favorites:
                favorites[userId]
                || []

        });

    }
);


// =========================================================
// ONE POST
// ALSO HIDDEN AFTER 30 DAYS
// =========================================================

app.get(
    "/api/post/:id",
    (req, res) => {


        const posts =
            getVisiblePosts();


        const post =
            posts.find(

                p =>
                    String(p.id)
                    ===
                    String(
                        req.params.id
                    )

            );


        if (!post) {

            return res
                .status(404)
                .json({

                    error:
                        "Apartment not found"

                });

        }


        res.json(
            post
        );

    }
);


// =========================================================
// STATISTICS
// =========================================================

app.post(
    "/api/stats/app",
    (req, res) => {

        try {

            const {
                userId
            } = req.body;


            if (!userId) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        error:
                            "userId required"

                    });

            }


            const stats =
                getStats();


            stats.appViews++;
            const daily =
    ensureDailyStats(stats);

daily.appViews++;


            const id =
                String(
                    userId
                );


            if (
                !stats.users[id]
            ) {

                stats.users[id] = {

                    views: 0,

                    firstSeen:
                        new Date()
                            .toISOString(),

                    lastSeen:
                        new Date()
                            .toISOString()

                };
daily.newUsers++;
            }


            stats.users[id]
                .views++;


            stats.users[id]
                .lastSeen =

                new Date()
                    .toISOString();


            saveStats(
                stats
            );


            res.json({

                success: true

            });

        }

        catch (err) {

            console.error(
                "Stats app error:",
                err
            );


            res
                .status(500)
                .json({

                    success: false

                });

        }

    }
);


// =========================================================
// POST VIEW STATISTICS
// =========================================================

app.post(
    "/api/stats/post",
    (req, res) => {

        try {

            const {
                userId,
                postId
            } = req.body;


            if (
                !userId ||
                !postId
            ) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        error:
                            "userId and postId required"

                    });

            }


            const stats =
                getStats();


            const id =
                String(
                    postId
                );


            if (
                !stats.postViews[id]
            ) {

                stats.postViews[id] = 0;

            }


            stats.postViews[id]++;
            const daily =
    ensureDailyStats(stats);

daily.postViews++;


            saveStats(
                stats
            );


            res.json({

                success: true

            });

        }

        catch (err) {

            console.error(
                "Stats post error:",
                err
            );


            res
                .status(500)
                .json({

                    success: false

                });

        }

    }
);


// =========================================================
// ADMIN STATISTICS
// =========================================================

app.get(
    "/api/stats",
    (req, res) => {

        try {

            const adminId =
                "5172653731";


            const userId =
                String(
                    req.query.userId
                    || ""
                );


            if (
                userId !== adminId
            ) {

                return res
                    .status(403)
                    .json({

                        success: false,

                        error:
                            "Access denied"

                    });

            }


            const stats =
                getStats();


            const users =
                Object.keys(
                    stats.users
                    || {}
                );


            const totalUsers =
                users.length;


            const totalAppViews =
                stats.appViews
                || 0;


            const postViews =
                stats.postViews
                || {};


            const totalPostViews =

                Object.values(
                    postViews
                )

                .reduce(

                    (
                        sum,
                        value
                    ) =>

                        sum +
                        Number(
                            value
                            || 0
                        ),

                    0

                );

res.json({
    totalUsers,
    totalAppViews,
    totalPostViews,
    postViews,
    dailyStats:
        stats.dailyStats || {}
});

        }

        catch (err) {

            console.error(
                "Stats API error:",
                err
            );


            res
                .status(500)
                .json({

                    success: false

                });

        }

    }
);

// =========================================================
// UPDATE POST
// =========================================================

app.post(
    "/api/post/update",
    (req, res) => {

        const adminId =
            "5172653731";

        const userId =
            String(
                req.body.userId || ""
            );

        if (
            userId !== adminId
        ) {

            return res
                .status(403)
                .json({
                    success: false,
                    error:
                        "Access denied"
                });

        }

        try {

            const posts =
                getPosts();

            const updated =
                req.body;

            const index =
                posts.findIndex(
                    p =>
                        String(p.id) ===
                        String(updated.id)
                );

            if (
                index === -1
            ) {

                return res
                    .status(404)
                    .json({
                        success: false,
                        error:
                            "Apartment not found"
                    });

            }

            const manualEdits =
                posts[index].manualEdits || {};

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
                    Object.prototype.hasOwnProperty.call(
                        updated,
                        field
                    )
                ) {

                    manualEdits[field] = true;

                }

            }

            posts[index] = {

                ...posts[index],

                district:
                    updated.district,

                street:
                    updated.street,

                rooms:
                    updated.rooms,

                bedrooms:
                    updated.bedrooms,

                area:
                    updated.area,

                floor:
                    updated.floor,

                price:
                    updated.price,

                text:
                    updated.text,

                manualEdits:
                    manualEdits

            };

            savePosts(
                posts
            );

            res.json({
                success: true
            });

        }

        catch (err) {

            console.error(
                "Update post error:",
                err
            );

            res
                .status(500)
                .json({
                    success: false
                });

        }

    }
);

// =========================================================
// UPDATE POST STATUS
// =========================================================

app.post(
    "/api/post/status",
    (req, res) => {

        const adminId =
            "5172653731";

        const userId =
            String(
                req.body.userId || ""
            );

        if (
            userId !== adminId
        ) {

            return res
                .status(403)
                .json({
                    success: false,
                    error: "Access denied"
                });

        }

        try {

            const posts =
                getPosts();

            const postId =
                String(
                    req.body.id || ""
                );

            const status =
                req.body.status === "sdanо"
                    ? "sdanо"
                    : "";

            const index =
                posts.findIndex(
                    p =>
                        String(p.id) ===
                        postId
                );

            if (
                index === -1
            ) {

                return res
                    .status(404)
                    .json({
                        success: false,
                        error:
                            "Apartment not found"
                    });

            }

           const manualEdits =
    posts[index].manualEdits || {};

if (
    status === "sdanо"
) {
    manualEdits.status = true;
} else {
    delete manualEdits.status;
}

posts[index].status =
    status;

posts[index].manualEdits =
    manualEdits;

savePosts(
    posts
);

            console.log(
                "🏠 STATUS UPDATED:",
                postId,
                status
            );

            res.json({
                success: true,
                status: status
            });

        }
        catch (err) {

            console.error(
                "Status update error:",
                err
            );

            res
                .status(500)
                .json({
                    success: false,
                    error:
                        "Status update failed"
                });

        }

    }
);
// =========================================================
// DELETE POST
// =========================================================

app.post(
    "/api/post/delete",
    (req, res) => {

        const adminId =
            "5172653731";

        const userId =
            String(
                req.body.userId || ""
            );

        if (
            userId !== adminId
        ) {

            return res
                .status(403)
                .json({
                    success: false,
                    error:
                        "Access denied"
                });

        }

        try {

            const posts =
                getPosts();

            const postId =
                String(
                    req.body.id
                );


            // წავშალოთ განცხადება posts.json-იდან

            const filtered =
                posts.filter(
                    p =>
                        String(p.id)
                        !==
                        postId
                );


            savePosts(
                filtered
            );


            // =========================================
            // დავიმახსოვროთ წაშლილი Telegram ID
            // =========================================

            let deletedIds = [];


            if (
                fs.existsSync(
                    DELETED_POSTS_FILE
                )
            ) {

                try {

                    const parsed =
                        JSON.parse(
                            fs.readFileSync(
                                DELETED_POSTS_FILE,
                                "utf8"
                            )
                        );


                    if (
                        Array.isArray(
                            parsed
                        )
                    ) {

                        deletedIds =
                            parsed.map(
                                id =>
                                    String(id)
                            );

                    }

                }

                catch (readError) {

                    console.error(
                        "Deleted posts read error:",
                        readError
                    );

                }

            }


            if (
                !deletedIds.includes(
                    postId
                )
            ) {

                deletedIds.push(
                    postId
                );

            }


            fs.writeFileSync(

                DELETED_POSTS_FILE,

                JSON.stringify(
                    deletedIds,
                    null,
                    2
                ),

                "utf8"

            );


            console.log(
                "🗑️ POST DELETED:",
                postId
            );


            res.json({

                success: true

            });

        }

        catch (err) {

            console.error(
                "Delete post error:",
                err
            );


            res
                .status(500)
                .json({

                    success: false

                });

        }

    }
);

// =========================================================
// START SERVER
// =========================================================

app.listen(
    PORT,
    () => {

        console.log(
            `✅ Server running: http://localhost:${PORT}`
        );

    }
);