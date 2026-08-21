console.log("🍊 ORANGE APP.JS — FIXED VERSION");


/* =========================================================
   TELEGRAM
========================================================= */

const telegramWebApp =
    window.Telegram?.WebApp || null;


if (telegramWebApp) {

    telegramWebApp.ready();

    telegramWebApp.expand();

    console.log(
        "🍊 Telegram WebApp detected"
    );

} else {

    console.log(
        "⚠️ Telegram WebApp NOT detected"
    );

}


const telegramUserId =
    telegramWebApp
        ?.initDataUnsafe
        ?.user
        ?.id
        ? String(
            telegramWebApp
                .initDataUnsafe
                .user
                .id
        )
        : null;


/* =========================================================
   GLOBAL STATE
========================================================= */

let allPosts = [];

let currentView =
    "catalog";

let mapInstance =
    null;

let mapLayer =
    null;

let favoritePostIds =
    new Set();

let favoritesOnly =
    false;

const currentCardImage =
    {};


/* =========================================================
   DISTRICT CENTERS
========================================================= */

const districtCenters = {

    saburtalo:
        [41.7260, 44.7470],

    vake:
        [41.7100, 44.7530],

    vera:
        [41.7085, 44.7830],

    mtatsminda:
        [41.7000, 44.7900],

    sololaki:
        [41.6955, 44.8010],

    chugureti:
        [41.7150, 44.8050],

    didube:
        [41.7250, 44.7800],

    nadzaladevi:
        [41.7350, 44.7950],

    gldani:
        [41.7950, 44.8200],

    "didi digomi":
        [41.7850, 44.7300],

    digomi:
        [41.7750, 44.7350],

    temka:
        [41.8000, 44.7900],

    isani:
        [41.6905, 44.8280],

    samgori:
        [41.6850, 44.8700],

    varketili:
        [41.6900, 44.8800],

    vazisubani:
        [41.6950, 44.8750],

    krtsanisi:
        [41.6785, 44.8240],

    ortachala:
        [41.6805, 44.8150],

    ponichala:
        [41.6500, 44.8400],

    avlabari:
        [41.6950, 44.8200],

    navtlughi:
        [41.6850, 44.8500],

    "tbilisi sea":
        [41.7600, 44.9000]

};


/* =========================================================
   LOAD POSTS
========================================================= */

async function loadPosts() {

    try {

        if (telegramUserId) {

            fetch(
                "/api/stats/app",
                {

                    method:
                        "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            userId:
                                telegramUserId
                        })

                }
            ).catch(
                error =>
                    console.log(
                        "Stats error:",
                        error
                    )
            );

        }


        const response =
            await fetch(
                "/api/posts?t=" +
                Date.now(),
                {
                    cache:
                        "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                "Failed to load posts"
            );

        }


        allPosts =
            await response.json();


        console.log(
            "🍊 Posts:",
            allPosts.length
        );


        await loadFavorites();


        renderPosts(
            getFilteredPosts()
        );


        hideLoader();


        if (
            currentView ===
            "map"
        ) {

            setTimeout(
                () => {

                    initMap();

                    renderMap(
                        getFilteredPosts()
                    );

                },
                100
            );

        }

    }

    catch (error) {

        console.error(
            "LOAD POSTS ERROR:",
            error
        );


        const posts =
            document.getElementById(
                "posts"
            );


        if (posts) {

            posts.innerHTML = `

                <h2
                    style="
                        text-align:center;
                        padding:40px;
                    "
                >
                    ❌ Ошибка загрузки объявлений
                </h2>

            `;

        }

    }

}


/* =========================================================
   LOADER
========================================================= */

function hideLoader() {

    const loader =
        document.getElementById(
            "loader"
        );


    if (!loader) {

        return;

    }


    loader.classList.add(
        "loader-hide"
    );


    setTimeout(
        () => {

            if (
                loader &&
                loader.parentNode
            ) {

                loader.remove();

            }

        },
        600
    );

}


/* =========================================================
   DISTRICT NORMALIZATION
========================================================= */

function normalizeDistrict(
    value
) {

    const text =
        String(
            value || ""
        )
            .toLowerCase()
            .trim();


    const aliases = {

        saburtalo: [
            "saburtalo",
            "сабуртало",
            "საბურთალო"
        ],

        vake: [
            "vake",
            "ваки",
            "ვაკე"
        ],

        vera: [
            "vera",
            "вера",
            "ვერა"
        ],

        mtatsminda: [
            "mtatsminda",
            "мтацминда",
            "მთაწმინდა"
        ],

        sololaki: [
            "sololaki",
            "сололаки",
            "სოლოლაკი"
        ],

        chugureti: [
            "chugureti",
            "чугурети",
            "ჩუღურეთი"
        ],

        didube: [
            "didube",
            "дидубе",
            "დიდუბე"
        ],

        nadzaladevi: [
            "nadzaladevi",
            "надзаладеви",
            "ნაძალადევი"
        ],

        gldani: [
            "gldani",
            "глдани",
            "გლდანი"
        ],

        "didi digomi": [
            "didi digomi",
            "დიდი დიღომი",
            "დიდი დიღმის",
            "большой дигоми"
        ],

        digomi: [
            "digomi",
            "дидигоми",
            "დიღომი",
            "дიღомი"
        ],

        temka: [
            "temka",
            "темка",
            "თემქა"
        ],

        isani: [
            "isani",
            "исани",
            "ისანი"
        ],

        samgori: [
            "samgori",
            "самгори",
            "სამგორი"
        ],

        varketili: [
            "varketili",
            "варкетили",
            "ვარკეთილი"
        ],

        vazisubani: [
            "vazisubani",
            "вазисубани",
            "ვაზისუბანი"
        ],

        krtsanisi: [
            "krtsanisi",
            "крцаниси",
            "კრწანისი"
        ],

        ortachala: [
            "ortachala",
            "орточала",
            "ორთაჭალა"
        ],

        ponichala: [
            "ponichala",
            "поничала",
            "ფონიჭალა"
        ],

        avlabari: [
            "avlabari",
            "авлабари",
            "ავლაბარი"
        ],

        navtlughi: [
            "navtlughi",
            "нафтлуги",
            "ნავთლუღი"
        ],

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


/* =========================================================
   FAVORITES
========================================================= */

async function loadFavorites() {

    if (!telegramUserId) {

        favoritePostIds =
            new Set();

        return;

    }


    try {

        const response =
            await fetch(
                `/api/favorites/${telegramUserId}?t=${Date.now()}`,
                {
                    cache:
                        "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                "Failed to load favorites"
            );

        }


        const favorites =
            await response.json();


        favoritePostIds =
            new Set(
                favorites.map(
                    id =>
                        String(id)
                )
            );


        console.log(
            "❤️ Favorites:",
            favoritePostIds.size
        );

    }

    catch (error) {

        console.error(
            "Favorites error:",
            error
        );

        favoritePostIds =
            new Set();

    }

}


/* =========================================================
   TOGGLE FAVORITE
========================================================= */

async function toggleFavorite(
    postId
) {

    if (!telegramUserId) {

        alert(
            "Telegram user not found"
        );

        return;

    }


    postId =
        String(postId);


    const isFavorite =
        favoritePostIds.has(
            postId
        );


    try {

        let response;


        if (isFavorite) {

            response =
                await fetch(
                    `/api/favorites/${telegramUserId}/${postId}`,
                    {
                        method:
                            "DELETE"
                    }
                );

        }

        else {

            response =
                await fetch(
                    "/api/favorites",
                    {

                        method:
                            "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({

                                userId:
                                    telegramUserId,

                                postId:
                                    postId

                            })

                    }
                );

        }


        if (!response.ok) {

            throw new Error(
                "Favorite request failed"
            );

        }


        if (isFavorite) {

            favoritePostIds.delete(
                postId
            );

        }

        else {

            favoritePostIds.add(
                postId
            );

        }


        const button =
            document.querySelector(
                `.favorite-btn[data-post-id="${postId}"]`
            );


        if (button) {

            button.textContent =
                favoritePostIds.has(
                    postId
                )
                    ? "❤️"
                    : "🤍";

        }

    }

    catch (error) {

        console.error(
            "Favorite error:",
            error
        );

    }

}


/* =========================================================
   FILTERS
========================================================= */

/* =========================================================
   FILTERS — FIXED
========================================================= */

function normalizeSearchText(value) {

    return String(value || "")
        .toLowerCase()
        .trim()
        .replace(/[.,;:!?()[\]{}"'`]/g, " ")
        .replace(/\s+/g, " ");

}


/* =========================================================
   EXTRACT NUMBER
========================================================= */

function extractNumber(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return 0;

    }

    const match =
        String(value)
            .replace(",", ".")
            .match(/\d+(?:\.\d+)?/);

    return match
        ? Number(match[0])
        : 0;

}


/* =========================================================
   GET POST DISTRICT
========================================================= */

function getPostDistrict(post) {

    const directDistrict =
        String(
            post?.district || ""
        )
            .trim();


    const invalidDistricts = [

        "",
        "-",
        "—",
        "unknown",
        "undefined",
        "null",
        "none"

    ];


    if (
        !invalidDistricts.includes(
            directDistrict.toLowerCase()
        )
    ) {

        const normalized =
            normalizeDistrict(
                directDistrict
            );


        if (normalized) {

            return normalized;

        }

    }


    const text =
        String(
            post?.text || ""
        );


    return normalizeDistrict(
        text
    );

}


/* =========================================================
   GET POST ROOMS
========================================================= */

function getPostRooms(post) {

    const directRooms =
        extractNumber(
            post?.rooms
        );


    if (
        directRooms > 0
    ) {

        return directRooms;

    }


    const text =
        String(
            post?.text || ""
        );


    const patterns = [

        /(\d+)\s*(?:комнат|комната|комнаты|комн)/i,

        /(\d+)\s*(?:ოთახი|ოთახიანი)/i,

        /(\d+)\s*rooms?/i,

        /(\d+)\s*bedrooms?/i

    ];


    for (
        const pattern of patterns
    ) {

        const match =
            text.match(
                pattern
            );


        if (match) {

            const rooms =
                Number(
                    match[1]
                );


            if (
                rooms > 0
            ) {

                return rooms;

            }

        }

    }


    return 0;

}


/* =========================================================
   GET POST PRICE
========================================================= */

function getPostPrice(post) {

    const directPrice =
        extractNumber(
            post?.price
        );


    if (
        directPrice > 0
    ) {

        return directPrice;

    }


    const text =
        String(
            post?.text || ""
        );


    const patterns = [

        /(?:\$|usd|долл\.?|доллар(?:ов)?|ფასი|price)\s*([\d\s,.]+)/i,

        /([\d\s,.]+)\s*(?:\$|usd|долл\.?|доллар(?:ов)?)/i

    ];


    for (
        const pattern of patterns
    ) {

        const match =
            text.match(
                pattern
            );


        if (match) {

            const value =
                Number(
                    match[1]
                        .replace(/\s/g, "")
                        .replace(/,/g, "")
                );


            if (
                value > 0
            ) {

                return value;

            }

        }

    }


    return 0;

}


/* =========================================================
   GET POST SEARCHABLE TEXT
========================================================= */

function getPostSearchText(post) {

    return normalizeSearchText(

        [

            post?.text,

            post?.district,

            post?.street,

            post?.rooms,

            post?.area,

            post?.price,

            post?.address,

            post?.description

        ]

            .filter(
                value =>
                    value !== null &&
                    value !== undefined &&
                    String(value).trim() !== ""
            )

            .join(" ")

    );

}


/* =========================================================
   MAIN FILTER
========================================================= */

function getFilteredPosts() {

    const searchInput =
        document.getElementById(
            "search"
        );


    const districtInput =
        document.getElementById(
            "districtFilter"
        );


    const roomsInput =
        document.getElementById(
            "roomsFilter"
        );


    const minPriceInput =
        document.getElementById(
            "minPrice"
        );


    const maxPriceInput =
        document.getElementById(
            "maxPrice"
        );


    const search =
        normalizeSearchText(
            searchInput?.value
        );


    const districtValue =
        String(
            districtInput?.value || ""
        )
            .trim();


    const selectedDistrict =
        districtValue
            ? normalizeDistrict(
                districtValue
            )
            : "";


    const selectedRooms =
        String(
            roomsInput?.value || ""
        )
            .trim();


    const minPrice =
        extractNumber(
            minPriceInput?.value
        );


    const maxPriceRaw =
        extractNumber(
            maxPriceInput?.value
        );


    const maxPrice =
        maxPriceRaw > 0
            ? maxPriceRaw
            : Infinity;


    console.log(
        "🔎 FILTER:",
        {
            search,
            selectedDistrict,
            selectedRooms,
            minPrice,
            maxPrice
        }
    );


    return allPosts.filter(
        post => {

            /* =========================================
               SEARCH
            ========================================= */

            if (search) {

                const searchable =
                    getPostSearchText(
                        post
                    );


                const district =
                    getPostDistrict(
                        post
                    );


                const rooms =
                    getPostRooms(
                        post
                    );


                const searchableExtended =
                    normalizeSearchText(

                        searchable +
                        " " +
                        district +
                        " " +
                        rooms

                    );


                if (
                    !searchableExtended.includes(
                        search
                    )
                ) {

                    return false;

                }

            }


            /* =========================================
               DISTRICT
            ========================================= */

            if (
                selectedDistrict
            ) {

                const postDistrict =
                    getPostDistrict(
                        post
                    );


                console.log(
                    "📍 DISTRICT:",
                    {
                        post:
                            post.id,

                        selected:
                            selectedDistrict,

                        actual:
                            postDistrict
                    }
                );


                if (
                    postDistrict !==
                    selectedDistrict
                ) {

                    return false;

                }

            }


            /* =========================================
               ROOMS
            ========================================= */

            if (
                selectedRooms
            ) {

                const rooms =
                    getPostRooms(
                        post
                    );


                if (
                    selectedRooms ===
                    "5"
                ) {

                    if (
                        rooms < 5
                    ) {

                        return false;

                    }

                }

                else {

                    const requiredRooms =
                        extractNumber(
                            selectedRooms
                        );


                    if (
                        requiredRooms > 0 &&
                        rooms !==
                        requiredRooms
                    ) {

                        return false;

                    }

                }

            }


            /* =========================================
               PRICE
            ========================================= */

            const price =
                getPostPrice(
                    post
                );


            if (
                price < minPrice
            ) {

                return false;

            }


            if (
                price > maxPrice
            ) {

                return false;

            }


            /* =========================================
               FAVORITES
            ========================================= */

            if (
                favoritesOnly &&
                !favoritePostIds.has(
                    String(
                        post.id
                    )
                )
            ) {

                return false;

            }


            return true;

        }
    );

}

/* =========================================================
   FILTER POSTS
========================================================= */

function filterPosts() {

    const filtered =
        getFilteredPosts();


    renderPosts(
        filtered
    );


    if (
        currentView ===
        "map"
    ) {

        initMap();

        renderMap(
            filtered
        );

    }


    hideLoader();

}


/* =========================================================
   CLEAR FILTERS
========================================================= */

function clearFilters() {

    [
        "search",
        "districtFilter",
        "roomsFilter",
        "minPrice",
        "maxPrice"
    ]
        .forEach(
            id => {

                const element =
                    document.getElementById(
                        id
                    );


                if (element) {

                    element.value =
                        "";

                }

            }
        );


    favoritesOnly =
        false;


    renderPosts(
        getFilteredPosts()
    );


    if (
        currentView ===
        "map"
    ) {

        renderMap(
            getFilteredPosts()
        );

    }

}


/* =========================================================
   FILTER EVENTS
========================================================= */

function setupFilterEvents() {

    const ids = [

        "search",
        "districtFilter",
        "roomsFilter",
        "minPrice",
        "maxPrice"

    ];


    ids.forEach(
        id => {

            const element =
                document.getElementById(
                    id
                );


            if (!element) {

                return;

            }


            element.addEventListener(
                "input",
                filterPosts
            );


            element.addEventListener(
                "change",
                filterPosts
            );

        }
    );


    const clearButton =
        document.getElementById(
            "clearFiltersBtn"
        );


    if (clearButton) {

        clearButton.addEventListener(
            "click",
            clearFilters
        );

    }

}


/* =========================================================
   FAVORITES FILTER
========================================================= */

function setupFavoritesFilter() {

    const button =
        document.getElementById(
            "favoritesFilterBtn"
        );


    if (!button) {

        return;

    }


    button.addEventListener(
        "click",
        () => {

            favoritesOnly =
                !favoritesOnly;


            button.classList.toggle(
                "active",
                favoritesOnly
            );


            filterPosts();

        }
    );

}


/* =========================================================
   CATALOG
========================================================= */
function renderPosts(posts) {

    const container =
        document.getElementById("posts");

    if (!container) return;

    container.innerHTML = "";

    if (!posts.length) {

        container.innerHTML = `
            <h2 style="
                text-align:center;
                padding:40px;
            ">
                Объявления не найдены
            </h2>
        `;

        return;
    }

    posts.forEach(post => {

        const images =
            Array.isArray(post.images) &&
            post.images.length
                ? post.images
                : [
                    "https://via.placeholder.com/600x400?text=No+Photo"
                ];

        if (
            currentCardImage[post.id] === undefined
        ) {
            currentCardImage[post.id] = 0;
        }

        let imageIndex =
            currentCardImage[post.id] || 0;

        if (imageIndex >= images.length) {

            imageIndex = 0;

            currentCardImage[post.id] = 0;
        }

        const image =
            images[imageIndex];

        const imageSrc =
            image.startsWith("http")
                ? image
                : "/" + image;

        const district =
            post.district || "-";

        const price =
            post.price || "-";

        const rooms =
            post.rooms || "-";

        const bedrooms =
            post.bedrooms || "-";

        const bathrooms =
            post.bathrooms || "-";

        const area =
            post.area || "-";

        const floor =
            post.floor || "-";

        const date =
            post.date
                ? new Date(post.date).toLocaleDateString(
                    "ru-RU",
                    {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric"
                    }
                )
                : "";

        const card =
            document.createElement("div");

        card.className = "card";

        card.innerHTML = `

            <!-- PHOTO -->
            <div class="card-slider">

                <!-- FAVORITE -->
                <button
                    type="button"
                    class="favorite-btn"
                    data-post-id="${post.id}"
                >
                    ${
                        favoritePostIds.has(
                            String(post.id)
                        )
                            ? "❤️"
                            : "🤍"
                    }
                </button>

                <!-- PREVIOUS -->
                <button
                    type="button"
                    class="prev-btn"
                >
                    ◀
                </button>

                <!-- IMAGE -->
                <img
                    id="card-image-${post.id}"
                    src="${imageSrc}"
                    class="card-image"
                    alt=""
                    loading="lazy"
                    decoding="async"
                >

                <!-- NEXT -->
                <button
                    type="button"
                    class="next-btn"
                >
                    ▶
                </button>

                <!-- PHOTO COUNTER -->
                <div
                    id="card-counter-${post.id}"
                    class="photo-counter"
                >
                    ${imageIndex + 1}/${images.length}
                </div>

            </div>


            <!-- PRICE + DATE -->
            <div class="price-date-row">

                <div class="property-price">
                    ${price}$
                </div>

                <div class="property-date">
                    ${date}
                </div>

            </div>


            <!-- PROPERTY INFORMATION -->
            <div class="property-info">


                <!-- DISTRICT -->
                <div class="property-info-item district-item">

                    <span class="property-icon">
                        📍
                    </span>

                    <div class="property-text">
                        <strong>Район:</strong>
                        <span>${district}</span>
                    </div>

                </div>


                <!-- ROOMS -->
                <div class="property-info-item rooms-item">

                    <span class="property-icon">
                        🛋️
                    </span>

                    <div class="property-text">
                        <strong>Комнат:</strong>
                        <span>${rooms}</span>
                    </div>

                </div>


                <!-- BEDROOMS -->
                <div class="property-info-item bedroom-item">

                    <span class="property-icon">
                        🛏️
                    </span>

                    <div class="property-text">
                        <strong>Спальни:</strong>
                        <span>${bedrooms}</span>
                    </div>

                </div>


                <!-- BATHROOMS -->
                <div class="property-info-item bathroom-item">

                    <span class="property-icon">
                        🛁
                    </span>

                    <div class="property-text">
                        <strong>Ванные:</strong>
                        <span>${bathrooms}</span>
                    </div>

                </div>


                <!-- AREA -->
                <div class="property-info-item area-item">

                    <span class="property-icon">
                        📐
                    </span>

                    <div class="property-text">
                        <strong>Площадь:</strong>
                        <span>${area} м²</span>
                    </div>

                </div>


                <!-- FLOOR -->
                <div class="property-info-item floor-item">

                    <span class="property-icon">
                        🏢
                    </span>

                    <div class="property-text">
                        <strong>Этаж:</strong>
                        <span>${floor}</span>
                    </div>

                </div>

            </div>


            <!-- ACTIONS -->
            <div class="card-actions">


                <!-- TELEGRAM LARGE -->
                <button
                    type="button"
                    class="telegram-main-btn"
                >
                    <span class="telegram-main-icon">
                        ➤
                    </span>

                    Смотреть в Telegram
                </button>


                <!-- SHARE -->
                <button
                    type="button"
                    class="share-btn"
                    title="Поделиться"
                    aria-label="Поделиться"
                >
                    <svg
                        class="action-svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2.5"
                    >
                        <path
                            d="M14 3h7v7"
                        />
                        <path
                            d="M10 14L21 3"
                        />
                        <path
                            d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"
                        />
                    </svg>
                </button>


                <!-- LOCATION -->
                <button
                    type="button"
                    class="location-btn"
                    title="Открыть карту"
                    aria-label="Открыть карту"
                >
                    <svg
                        class="action-svg location-svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2.5"
                    >
                        <path
                            d="M12 21s7-6.2 7-12A7 7 0 0 0 5 9c0 5.8 7 12 7 12Z"
                        />
                        <circle
                            cx="12"
                            cy="9"
                            r="2.5"
                        />
                    </svg>
                </button>


                <!-- TELEGRAM ICON -->
                <button
                    type="button"
                    class="telegram-btn"
                    title="Telegram"
                    aria-label="Telegram"
                >
                    <svg
                        class="action-svg telegram-svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                    >
                        <path
                            d="M21.5 3.5 2.8 10.8c-.9.35-.9 1.6.02 1.93l4.7 1.7 1.75 5.1c.3.88 1.43 1.12 2.08.43l2.65-2.82 4.6 3.38c.76.56 1.85.15 2.05-.78l2.5-14.7c.17-1-.78-1.83-1.65-1.54Z"
                        />
                    </svg>
                </button>

            </div>

        `;


        container.appendChild(card);


        /* =========================
           LOCATION
        ========================= */

        card.querySelector(
            ".location-btn"
        )?.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                if (
                    post.lat &&
                    post.lng
                ) {

                    window.open(
                        `https://yandex.com/maps/?ll=${post.lng},${post.lat}&z=16&pt=${post.lng},${post.lat},pm2rdm`,
                        "_blank"
                    );

                }

            }
        );


        /* =========================
           TELEGRAM MAIN
        ========================= */

        card.querySelector(
            ".telegram-main-btn"
        )?.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                window.open(
                    "https://t.me/Orangerealestatetbilisi",
                    "_blank"
                );

            }
        );


        /* =========================
           TELEGRAM ICON
        ========================= */

        card.querySelector(
            ".telegram-btn"
        )?.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                window.open(
                    "https://t.me/Orangerealestatetbilisi",
                    "_blank"
                );

            }
        );


        /* =========================
           SHARE
        ========================= */

        card.querySelector(
            ".share-btn"
        )?.addEventListener(
            "click",
            async event => {

                event.stopPropagation();

                const shareUrl =
                    `${window.location.origin}/details.html?id=${post.id}`;

                try {

                    if (
                        navigator.share
                    ) {

                        await navigator.share({

                            title:
                                `${price}$ — ${district}`,

                            text:
                                `🏠 ${district}\n💰 ${price}$`,

                            url:
                                shareUrl

                        });

                    } else {

                        await navigator.clipboard.writeText(
                            shareUrl
                        );

                        alert(
                            "Ссылка скопирована"
                        );

                    }

                } catch (error) {

                    console.log(
                        "Share cancelled"
                    );

                }

            }
        );


        /* =========================
           FAVORITE
        ========================= */

        card.querySelector(
            ".favorite-btn"
        )?.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                toggleFavorite(
                    post.id
                );

            }
        );


        /* =========================
           PREVIOUS IMAGE
        ========================= */

        card.querySelector(
            ".prev-btn"
        )?.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                prevCardImage(
                    post.id
                );

            }
        );


        /* =========================
           NEXT IMAGE
        ========================= */

        card.querySelector(
            ".next-btn"
        )?.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                nextCardImage(
                    post.id
                );

            }
        );


        /* =========================
           OPEN GALLERY
        ========================= */

        card.querySelector(
            ".card-image"
        )?.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                openGallery(
                    post.id
                );

            }
        );

    });

}
/* =========================================================
   CARD IMAGE
========================================================= */

function nextCardImage(
    postId
) {

    const post =
        allPosts.find(
            item =>
                String(item.id) ===
                String(postId)
        );


    if (
        !post ||
        !Array.isArray(post.images) ||
        post.images.length < 2
    ) {

        return;

    }


    currentCardImage[postId] =
        (
            (
                currentCardImage[postId] ||
                0
            ) + 1
        ) %
        post.images.length;


    updateCardImage(
        post
    );

}


function prevCardImage(
    postId
) {

    const post =
        allPosts.find(
            item =>
                String(item.id) ===
                String(postId)
        );


    if (
        !post ||
        !Array.isArray(post.images) ||
        post.images.length < 2
    ) {

        return;

    }


    currentCardImage[postId] =
        (
            (
                currentCardImage[postId] ||
                0
            ) -
            1 +
            post.images.length
        ) %
        post.images.length;


    updateCardImage(
        post
    );

}


/* =========================================================
   UPDATE CARD IMAGE
========================================================= */

function updateCardImage(
    post
) {

    const imageIndex =
        currentCardImage[
            post.id
        ] || 0;


    const image =
        post.images[
            imageIndex
        ];


    const imageElement =
        document.getElementById(
            `card-image-${post.id}`
        );


    const counter =
        document.getElementById(
            `card-counter-${post.id}`
        );


    if (
        imageElement &&
        image
    ) {

        imageElement.src =
            image.startsWith(
                "http"
            )
                ? image
                : "/" + image;

    }


    if (counter) {

        counter.textContent =
            `${imageIndex + 1} / ${post.images.length}`;

    }

}


/* =========================================================
   GALLERY
========================================================= */

function openGallery(
    postId
) {

    const post =
        allPosts.find(
            item =>
                String(item.id) ===
                String(postId)
        );


    if (
        !post ||
        !Array.isArray(post.images) ||
        !post.images.length
    ) {

        return;

    }


    let current =
        currentCardImage[
            post.id
        ] || 0;


    const viewer =
        document.createElement(
            "div"
        );


    viewer.id =
        "viewer";


    viewer.style.cssText = `

        position:fixed;
        inset:0;
        background:rgba(0,0,0,.94);
        z-index:99999;

        display:flex;
        align-items:center;
        justify-content:center;

    `;


    viewer.innerHTML = `

        <button
            id="closeViewer"
            type="button"

            style="
                position:absolute;
                top:20px;
                right:20px;
                z-index:10;

                width:46px;
                height:46px;

                border:0;
                border-radius:50%;

                background:white;
                color:black;

                font-size:25px;
                font-weight:bold;

                cursor:pointer;
            "
        >
            ✕
        </button>


        <button
            id="prevPhoto"
            type="button"

            style="
                position:absolute;
                left:15px;
                top:50%;

                transform:translateY(-50%);

                z-index:10;

                width:50px;
                height:55px;

                border:0;
                border-radius:12px;

                background:rgba(255,255,255,.9);

                font-size:28px;
                cursor:pointer;
            "
        >
            ‹
        </button>


        <img
            id="galleryImage"

            style="
                max-width:90vw;
                max-height:85vh;
                object-fit:contain;
                border-radius:8px;
            "
        >


        <button
            id="nextPhoto"
            type="button"

            style="
                position:absolute;
                right:15px;
                top:50%;

                transform:translateY(-50%);

                z-index:10;

                width:50px;
                height:55px;

                border:0;
                border-radius:12px;

                background:rgba(255,255,255,.9);

                font-size:28px;
                cursor:pointer;
            "
        >
            ›
        </button>


        <div
            id="galleryCounter"

            style="
                position:absolute;
                bottom:25px;
                left:50%;

                transform:translateX(-50%);

                color:white;

                font-size:17px;
                font-weight:bold;
            "
        >
        </div>

    `;


    document.body.appendChild(
        viewer
    );


    const image =
        viewer.querySelector(
            "#galleryImage"
        );


    const counter =
        viewer.querySelector(
            "#galleryCounter"
        );


    function showImage() {

        const currentImage =
            post.images[
                current
            ];


        image.src =
            currentImage.startsWith(
                "http"
            )
                ? currentImage
                : "/" + currentImage;


        counter.textContent =
            `${current + 1} / ${post.images.length}`;

    }


    viewer.querySelector(
        "#nextPhoto"
    ).onclick =
        event => {

            event.preventDefault();

            event.stopPropagation();


            current++;


            if (
                current >=
                post.images.length
            ) {

                current = 0;

            }


            showImage();

        };


    viewer.querySelector(
        "#prevPhoto"
    ).onclick =
        event => {

            event.preventDefault();

            event.stopPropagation();


            current--;


            if (
                current < 0
            ) {

                current =
                    post.images.length - 1;

            }


            showImage();

        };


    viewer.querySelector(
        "#closeViewer"
    ).onclick =
        () => {

            viewer.remove();

        };


    viewer.onclick =
        event => {

            if (
                event.target ===
                viewer
            ) {

                viewer.remove();

            }

        };


    showImage();

}


/* =========================================================
   MAP GALLERY
========================================================= */

function openMapGallery(
    images,
    startIndex = 0
) {

    if (
        !Array.isArray(images) ||
        !images.length
    ) {

        return;

    }


    let currentIndex =
        Number(startIndex) || 0;


    const viewer =
        document.createElement(
            "div"
        );


    viewer.style.cssText = `

        position:fixed;
        inset:0;

        background:rgba(0,0,0,.94);

        z-index:999999;

        display:flex;
        align-items:center;
        justify-content:center;

    `;


    const image =
        document.createElement(
            "img"
        );


    image.style.cssText = `

        max-width:90vw;
        max-height:85vh;

        object-fit:contain;

        border-radius:8px;

    `;


    const close =
        document.createElement(
            "button"
        );


    close.innerHTML =
        "✕";


    close.style.cssText = `

        position:absolute;

        top:20px;
        right:20px;

        width:46px;
        height:46px;

        border:0;
        border-radius:50%;

        background:white;

        font-size:25px;
        font-weight:bold;

        cursor:pointer;

    `;


    const prev =
        document.createElement(
            "button"
        );


    prev.innerHTML =
        "‹";


    prev.style.cssText = `

        position:absolute;

        left:15px;
        top:50%;

        transform:translateY(-50%);

        width:50px;
        height:55px;

        border:0;
        border-radius:12px;

        background:white;

        font-size:35px;

        cursor:pointer;

    `;


    const next =
        document.createElement(
            "button"
        );


    next.innerHTML =
        "›";


    next.style.cssText = `

        position:absolute;

        right:15px;
        top:50%;

        transform:translateY(-50%);

        width:50px;
        height:55px;

        border:0;
        border-radius:12px;

        background:white;

        font-size:35px;

        cursor:pointer;

    `;


    const counter =
        document.createElement(
            "div"
        );


    counter.style.cssText = `

        position:absolute;

        bottom:25px;
        left:50%;

        transform:translateX(-50%);

        color:white;

        font-size:17px;
        font-weight:bold;

    `;


    function showImage() {

        const img =
            images[
                currentIndex
            ];


        image.src =
            img.startsWith(
                "http"
            )
                ? img
                : "/" + img;


        counter.textContent =
            `${currentIndex + 1} / ${images.length}`;

    }


    close.onclick =
        () => {

            viewer.remove();

        };


    prev.onclick =
        () => {

            currentIndex =
                (
                    currentIndex -
                    1 +
                    images.length
                ) %
                images.length;


            showImage();

        };


    next.onclick =
        () => {

            currentIndex =
                (
                    currentIndex +
                    1
                ) %
                images.length;


            showImage();

        };


    viewer.onclick =
        event => {

            if (
                event.target ===
                viewer
            ) {

                viewer.remove();

            }

        };


    viewer.appendChild(
        image
    );

    viewer.appendChild(
        close
    );

    viewer.appendChild(
        prev
    );

    viewer.appendChild(
        next
    );

    viewer.appendChild(
        counter
    );


    document.body.appendChild(
        viewer
    );


    showImage();

}


/* =========================================================
   CATALOG / MAP VIEW
========================================================= */

function showCatalog() {

    currentView =
        "catalog";


    document.body.classList.remove(
        "map-mode"
    );


    const filters =
        document.querySelector(
            ".search-panel"
        );


    if (filters) {

        filters.style.display =
            "flex";

        filters.style.position =
            "";

        filters.style.top =
            "";

        filters.style.right =
            "";

        filters.style.zIndex =
            "";

        filters.style.width =
            "";

        filters.style.maxWidth =
            "";

        filters.style.padding =
            "";

        filters.style.margin =
            "";

        filters.style.background =
            "";

        filters.style.borderRadius =
            "";

        filters.style.boxShadow =
            "";

        filters.style.flexDirection =
            "";

        filters.style.gap =
            "";

    }


    const mapControls =
        document.getElementById(
            "mapControls"
        );


    if (mapControls) {

        mapControls.remove();

    }


    const viewSwitcher =
        document.querySelector(
            ".view-switcher"
        );


    if (viewSwitcher) {

        viewSwitcher.style.display =
            "flex";

    }


    const posts =
        document.getElementById(
            "posts"
        );


    if (posts) {

        posts.style.display =
            "";

    }


    const map =
        document.getElementById(
            "map"
        );


    if (map) {

        map.style.display =
            "none";

    }


    document
        .getElementById(
            "catalogViewBtn"
        )
        ?.classList.add(
            "active"
        );


    document
        .getElementById(
            "mapViewBtn"
        )
        ?.classList.remove(
            "active"
        );


    renderPosts(
        getFilteredPosts()
    );

}


/* =========================================================
   MAP VIEW
========================================================= */

function showMap() {

    currentView =
        "map";


    document.body.classList.add(
        "map-mode"
    );


    const posts =
        document.getElementById(
            "posts"
        );


    const map =
        document.getElementById(
            "map"
        );


    const filters =
        document.querySelector(
            ".search-panel"
        );


    const viewSwitcher =
        document.querySelector(
            ".view-switcher"
        );


    if (posts) {

        posts.style.display =
            "none";

    }


    if (map) {

        map.style.display =
            "block";

    }


    if (viewSwitcher) {

        viewSwitcher.style.display =
            "none";

    }


    if (filters) {

        filters.style.display =
            "none";

    }


    document
        .getElementById(
            "catalogViewBtn"
        )
        ?.classList.remove(
            "active"
        );


    document
        .getElementById(
            "mapViewBtn"
        )
        ?.classList.add(
            "active"
        );


    addMapControls();


    setTimeout(
        () => {

            initMap();

            renderMap(
                getFilteredPosts()
            );

        },
        100
    );

}


/* =========================================================
   MAP CONTROLS
========================================================= */
function addMapControls() {

    const map =
        document.getElementById("map");

    if (!map) {
        return;
    }

    const oldControls =
        document.getElementById("mapControls");

    if (oldControls) {
        oldControls.remove();
    }

    const controls =
        document.createElement("div");

    controls.id = "mapControls";

    controls.style.cssText = `
        position:absolute;
        left:12px;
        bottom:12px;
        z-index:1000;
        display:flex;
        gap:8px;
    `;


    /* =========================
       CATALOG BUTTON
    ========================= */

    const catalogButton =
        document.createElement("button");

    catalogButton.type = "button";

    catalogButton.innerHTML =
        "🏠 Каталог";

    catalogButton.style.cssText = `
        border:0;
        border-radius:12px;
        padding:11px 15px;
        background:#ff7a00;
        color:white;
        font-size:14px;
        font-weight:700;
        box-shadow:0 3px 12px rgba(0,0,0,.25);
        cursor:pointer;
    `;

    catalogButton.onclick =
        event => {

            event.preventDefault();
            event.stopPropagation();

            showCatalog();

        };


    /* =========================
       FILTER BUTTON
    ========================= */

    const filterButton =
        document.createElement("button");

    filterButton.type = "button";

    filterButton.innerHTML =
        "⚱ Фильтры";

    filterButton.style.cssText = `
        border:0;
        border-radius:12px;
        padding:11px 15px;
        background:#22a447;
        color:white;
        font-size:14px;
        font-weight:700;
        box-shadow:0 3px 12px rgba(0,0,0,.25);
        cursor:pointer;
    `;

    filterButton.onclick =
        event => {

            event.preventDefault();
            event.stopPropagation();

            openFilters();

        };
/* =========================================================
   SATELLITE / MAP BUTTON
========================================================= */

const satelliteButton =
    document.createElement("button");

satelliteButton.type =
    "button";

satelliteButton.id =
    "mapSatelliteButton";

satelliteButton.innerHTML =
    "🛰️";

satelliteButton.title =
    "Спутник";

satelliteButton.style.cssText = `
    border:0;
    border-radius:12px;
    width:46px;
    height:46px;
    padding:0;
    background:#ffffff;
    color:#333333;
    font-size:21px;
    box-shadow:0 3px 12px rgba(0,0,0,.20);
    cursor:pointer;
    display:flex;
    align-items:center;
    justify-content:center;
`;

satelliteButton.onclick =
    event => {

        event.preventDefault();
        event.stopPropagation();

        if (
            window.mapSatelliteMode
        ) {

            window.mapLayerSatellite.removeFrom(
                mapInstance
            );

            window.mapLayerNormal.addTo(
                mapInstance
            );

            window.mapSatelliteMode =
                false;

            satelliteButton.innerHTML =
                "🛰️";

            satelliteButton.title =
                "Спутник";

        }

        else {

            window.mapLayerNormal.removeFrom(
                mapInstance
            );

            window.mapLayerSatellite.addTo(
                mapInstance
            );

            window.mapSatelliteMode =
                true;

            satelliteButton.innerHTML =
                "🗺️";

            satelliteButton.title =
                "Карта";

        }

    };

    controls.appendChild(
        catalogButton
    );

    controls.appendChild(
        filterButton
    );
controls.appendChild(
    satelliteButton
);
    map.appendChild(
        controls
    );

}


/* =========================================================
   OPEN / CLOSE FILTERS
========================================================= */

function openFilters() {

    const filters =
        document.querySelector(
            ".search-panel"
        );

    if (!filters) {

        console.error(
            "❌ .search-panel not found"
        );

        return;

    }


    const hidden =
        getComputedStyle(
            filters
        ).display === "none";


    if (hidden) {

        filters.style.display =
            "flex";

    }

    else {

        filters.style.display =
            "none";

    }

}
/* =========================================================
   INIT MAP
========================================================= */

function initMap() {

    if (!window.L) {

        console.error(
            "❌ Leaflet is not loaded"
        );

        return;

    }


    const mapElement =
        document.getElementById(
            "map"
        );


    if (!mapElement) {

        console.error(
            "❌ Map element #map not found"
        );

        return;

    }


    if (!mapInstance) {

        mapInstance =
            L.map(
                "map",
                {
                    zoomControl:
                        true
                }
            ).setView(
                [
                    41.7151,
                    44.8271
                ],
                13
            );


        const mapLayerNormal =
            L.tileLayer(
                "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
                {
                    maxZoom:
                        19,

                    attribution:
                        "&copy; OpenStreetMap contributors"
                }
            );


        const mapLayerSatellite =
            L.tileLayer(
                "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
                {
                    maxZoom:
                        19,

                    attribution:
                        "Tiles &copy; Esri"
                }
            );
window.mapLayerNormal =
    mapLayerNormal;

window.mapLayerSatellite =
    mapLayerSatellite;

window.mapSatelliteMode =
    false;

        mapLayerNormal.addTo(
            mapInstance
        );


        mapLayer =
            L.layerGroup()
                .addTo(
                    mapInstance
                );
const satelliteButton =
    document.createElement("button");

satelliteButton.type =
    "button";

satelliteButton.innerHTML =
    "🛰️";

satelliteButton.title =
    "Спутник";

satelliteButton.style.cssText = `
    width:48px;
    height:48px;
    border:0;
    border-radius:14px;
    background:white;
    box-shadow:0 3px 12px rgba(0,0,0,.25);
    font-size:23px;
    cursor:pointer;
    display:flex;
    align-items:center;
    justify-content:center;
    margin-left:8px;
`;

satelliteButton.onclick =
    function(event) {

        event.preventDefault();
        event.stopPropagation();

        if (
            window.mapSatelliteMode === false
        ) {

            mapLayerNormal.removeFrom(
                mapInstance
            );

            mapLayerSatellite.addTo(
                mapInstance
            );

            window.mapSatelliteMode =
                true;

            satelliteButton.innerHTML =
                "🗺️";

            satelliteButton.title =
                "Карта";

        } else {

            mapLayerSatellite.removeFrom(
                mapInstance
            );

            mapLayerNormal.addTo(
                mapInstance
            );

            window.mapSatelliteMode =
                false;

            satelliteButton.innerHTML =
                "🛰️";

            satelliteButton.title =
                "Спутник";
        }

        mapInstance.invalidateSize();
    };

controls.appendChild(
    satelliteButton
);
    }


    mapInstance.invalidateSize();

}


/* =========================================================
   POST COORDINATES
========================================================= */

function getPostCoordinates(
    post
) {

    const lat =
        Number(
            post.latitude ??
            post.lat ??
            post.location?.latitude ??
            post.location?.lat
        );


    const lng =
        Number(
            post.longitude ??
            post.lng ??
            post.lon ??
            post.location?.longitude ??
            post.location?.lng
        );


    const valid =
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&

        lat >= 41.60 &&
        lat <= 41.84 &&

        lng >= 44.62 &&
        lng <= 44.98;


    /*
       თუ განცხადებას აქვს
       რეალური კოორდინატები —
       პირდაპირ ვიყენებთ.
    */

    if (valid) {

        return [
            lat,
            lng
        ];

    }


    /*
       თუ რეალური კოორდინატები
       არ აქვს — რაიონის ცენტრი.
    */

    const district =
        String(
            post.district ||
            ""
        )
            .toLowerCase()
            .trim();


    for (
        const key of
        Object.keys(
            districtCenters
        )
    ) {

        if (
            district.includes(
                key
            )
        ) {

            return districtCenters[
                key
            ];

        }

    }


    /*
       დამატებით ვეძებთ რაიონს
       განცხადების ტექსტში.
    */

    const text =
        String(
            post.text ||
            ""
        )
            .toLowerCase();


    for (
        const key of
        Object.keys(
            districtCenters
        )
    ) {

        if (
            text.includes(
                key
            )
        ) {

            return districtCenters[
                key
            ];

        }

    }


    /*
       საბოლოო fallback —
       თბილისის ცენტრი.
    */

    return [
        41.7151,
        44.8271
    ];

}


/* =========================================================
   NEW MAP MARKER
   🔵 HOUSE ICON + PRICE
========================================================= */

function createPriceMarker(
    lat,
    lng,
    price
) {

    const displayPrice =
        price
            ? `$${price}`
            : "Цена";


    return L.marker(
        [
            lat,
            lng
        ],
        {

            icon:

                L.divIcon({

                    className:
                        "orange-price-marker",

                    html: `

                        <div
                            style="
                                display:flex;
                                align-items:center;
                                gap:6px;
                                white-space:nowrap;
                            "
                        >

                            <div
                                style="
                                    width:34px;
                                    height:34px;

                                    border-radius:50%;

                                    background:#1769ff;

                                    display:flex;
                                    align-items:center;
                                    justify-content:center;

                                    box-shadow:
                                        0 2px 7px
                                        rgba(0,0,0,.30);

                                    color:white;

                                    font-size:18px;
                                "
                            >
                                🏠
                            </div>


                            <div
                                style="
                                    background:white;

                                    border-radius:8px;

                                    padding:5px 8px;

                                    font-size:14px;

                                    font-weight:700;

                                    color:#111;

                                    box-shadow:
                                        0 2px 7px
                                        rgba(0,0,0,.25);
                                "
                            >
                                ${displayPrice}
                            </div>

                        </div>

                    `,

                    iconSize:
                        [120, 38],

                    iconAnchor:
                        [17, 19]

                })

        }
    );

}


/* =========================================================
   RENDER MAP
========================================================= */

function renderMap(
    posts
) {

    if (
        !mapInstance ||
        !mapLayer
    ) {

        return;

    }


    mapLayer.clearLayers();


    const tbilisiCenter =
        [
            41.7151,
            44.8271
        ];


    if (
        !Array.isArray(posts) ||
        !posts.length
    ) {

        mapInstance.setView(
            tbilisiCenter,
            12
        );

        return;

    }


    const bounds =
        [];


    /*
       ერთი განცხადება =
       ერთი მარკერი.

       ID-ებით დაჯგუფება არ ხდება,
       რათა ერთი განცხადება
       მეორეს არ დაემალოს.
    */

    posts.forEach(
        post => {

            const coordinates =
                getPostCoordinates(
                    post
                );


            if (
                !Array.isArray(
                    coordinates
                ) ||
                coordinates.length !==
                    2
            ) {

                return;

            }


            const lat =
                Number(
                    coordinates[0]
                );


            const lng =
                Number(
                    coordinates[1]
                );


            if (
                !Number.isFinite(
                    lat
                ) ||
                !Number.isFinite(
                    lng
                )
            ) {

                return;

            }


            bounds.push(
                [
                    lat,
                    lng
                ]
            );


            const price =
                Number(
                    post.price
                ) || 0;


            const marker =
                createPriceMarker(
                    lat,
                    lng,
                    price
                );


            /*
               ფოტოები
            */

            const images =
                Array.isArray(
                    post.images
                )
                    ? post.images.filter(
                        Boolean
                    )
                    : [];


            let gallery =
                "";


            if (
                images.length
            ) {

                gallery = `

                    <div
                        style="
                            display:flex;

                            overflow-x:auto;

                            gap:8px;

                            width:100%;

                            margin-bottom:10px;

                            scroll-snap-type:
                                x mandatory;

                            -webkit-overflow-scrolling:
                                touch;
                        "
                    >

                        ${images.map(
                            (
                                img,
                                index
                            ) => `

                            <img

                                src="${
                                    img.startsWith(
                                        "http"
                                    )
                                        ? img
                                        : "/" + img
                                }"

                                onclick='
                                    openMapGallery(
                                        ${JSON.stringify(
                                            images
                                        )},
                                        ${index}
                                    )
                                '

                                style="
                                    width:230px;

                                    min-width:230px;

                                    height:170px;

                                    object-fit:cover;

                                    border-radius:8px;

                                    display:block;

                                    cursor:pointer;

                                    scroll-snap-align:
                                        start;
                                "
                            >

                        `
                        ).join("")}

                    </div>

                `;

            }


            /*
               Popup
            */

            marker.bindPopup(`

                <div
                    class="map-popup"

                    style="
                        width:240px;
                    "
                >

                    <div
                        style="
                            display:flex;
                            align-items:center;
                            gap:8px;

                            margin-bottom:10px;
                        "
                    >

                        <div
                            style="
                                width:38px;
                                height:38px;

                                border-radius:50%;

                                background:#1769ff;

                                display:flex;
                                align-items:center;
                                justify-content:center;

                                font-size:20px;
                            "
                        >
                            🏠
                        </div>


                        <div
                            style="
                                font-size:22px;
                                font-weight:bold;
                            "
                        >
                            ${
                                price
                                    ? `$${price}`
                                    : "Цена"
                            }
                        </div>

                    </div>


                    ${gallery}


                    <div
                        style="
                            font-size:14px;
                            line-height:1.6;
                        "
                    >

                        📍
                        <b>Район:</b>
                        ${post.district || "-"}

                        <br>

                        🏠
                        <b>Адрес:</b>
                        ${post.street || "-"}

                        <br>

                        🛏
                        <b>Комнат:</b>
                        ${post.rooms || "-"}

                        <br>

                        📐
                        <b>Площадь:</b>
                        ${post.area || "-"}
                        м²

                    </div>


                    <button
                        type="button"

                        onclick="
                            location.href =
                            'details.html?id=${encodeURIComponent(
                                post.id
                            )}'
                        "

                        style="
                            margin-top:10px;

                            width:100%;

                            border:0;

                            border-radius:8px;

                            padding:9px;

                            background:#1769ff;

                            color:white;

                            font-weight:bold;

                            cursor:pointer;
                        "
                    >
                        Подробнее
                    </button>

                </div>

            `);


            marker.addTo(
                mapLayer
            );

        }
    );


    /*
       MAP ZOOM
    */

    const validBounds =
        bounds.filter(
            ([lat, lng]) =>

                lat >= 41.60 &&
                lat <= 41.84 &&

                lng >= 44.62 &&
                lng <= 44.98

        );


    if (
        validBounds.length ===
        1
    ) {

        mapInstance.setView(
            validBounds[0],
            14
        );

    }

    else if (
        validBounds.length >
        1
    ) {

        mapInstance.fitBounds(

            L.latLngBounds(
                validBounds
            ),

            {

                padding:
                    [40, 40],

                maxZoom:
                    13

            }

        );

    }

    else {

        mapInstance.setView(
            tbilisiCenter,
            12
        );

    }

}
/* =========================================================
   VIEW BUTTONS
========================================================= */

function setupViewButtons() {

    const catalogButton =
        document.getElementById(
            "catalogViewBtn"
        );


    const mapButton =
        document.getElementById(
            "mapViewBtn"
        );


    if (catalogButton) {

        catalogButton.addEventListener(
            "click",
            event => {

                event.preventDefault();

                event.stopPropagation();

                showCatalog();

            }
        );

    }


    if (mapButton) {

        mapButton.addEventListener(
            "click",
            event => {

                event.preventDefault();

                event.stopPropagation();

                showMap();

            }
        );

    }

}


/* =========================================================
   AUTO REFRESH
========================================================= */

setInterval(
    async () => {

        try {

            const response =
                await fetch(
                    "/api/posts?t=" +
                    Date.now(),
                    {
                        cache:
                            "no-store"
                    }
                );


            if (!response.ok) {

                return;

            }


            const posts =
                await response.json();


            const oldData =
                JSON.stringify(
                    allPosts
                );


            const newData =
                JSON.stringify(
                    posts
                );


            if (
                oldData !==
                newData
            ) {

                allPosts =
                    posts;


                renderPosts(
                    getFilteredPosts()
                );


                if (
                    currentView ===
                    "map"
                ) {

                    initMap();

                    renderMap(
                        getFilteredPosts()
                    );

                }

            }

        }

        catch (error) {

            console.log(
                "Auto refresh error:",
                error
            );

        }

    },

    30000
);


/* =========================================================
   START APP
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        console.log(
            "🍊 Orange Platform starting..."
        );


        setupFilterEvents();

        setupFavoritesFilter();

        setupViewButtons();


        /*
           თუ HTML-ში თავიდან
           კატალოგია აქტიური
        */

        showCatalog();


        /*
           განცხადებების ჩატვირთვა
        */

        loadPosts();

    }
);


/* =========================================================
   KEYBOARD
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        const viewer =
            document.getElementById(
                "viewer"
            );


        if (!viewer) {

            return;

        }


        if (
            event.key ===
            "Escape"
        ) {

            viewer.remove();

        }

    }
);


/* =========================================================
   TELEGRAM MAIN BUTTON
========================================================= */

if (telegramWebApp) {

    try {

        telegramWebApp.MainButton.hide();

    }

    catch (error) {

        console.log(
            "Telegram MainButton error:",
            error
        );

    }

}


console.log(
    "🍊 ORANGE APP.JS READY"
);