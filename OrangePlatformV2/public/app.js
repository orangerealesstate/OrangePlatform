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
            "filterDistrict"
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

        
const selectedDistricts =
    districtInput
        ? Array.from(
            districtInput.querySelectorAll(
                'input[type="checkbox"]:checked'
            )
        )
        .map(input =>
            normalizeDistrict(
                input.value
            )
        )
        .filter(
            district =>
                district &&
                district !== "all" &&
                district !== "ყველა რაიონი"
        )
        : [];
        const checkedDistrictInputs =
    districtInput
        ? Array.from(
            districtInput.querySelectorAll(
                'input[type="checkbox"]:checked'
            )
        )
        : [];
const allDistrictsSelected =
    document.getElementById("allDistricts")?.checked === true;


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

const listingIdInput =
    document.getElementById(
        "filterListingId"
    );

const listingIdSearch =
    normalizeSearchText(
        listingIdInput?.value
    );
    console.log(
        "🔎 FILTER:",
        {
            search,
            selectedDistricts,
            selectedRooms,
            minPrice,
            maxPrice
        }
    );


    return allPosts.filter(
        post => {
            if (
            listingIdSearch &&
            String(post.listingId || "")
                .toLowerCase() !== listingIdSearch
        ) {
            return false;
        }

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

const listingId =
    normalizeSearchText(
        post?.listingId || ""
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
const postDistrict = getPostDistrict(post);
if (allDistrictsSelected) {
    // ყველა რაიონი — ყველა განცხადება ჩანს
} else if (selectedDistricts.length === 0) {
    // არცერთი რაიონი — არცერთი განცხადება
    return false;
} else if (
    !selectedDistricts.includes(
        normalizeDistrict(postDistrict)
    )
) {
    return false;
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

    const filterIds = [
        "search",
        "filterListingId",
        "filterDistrict",
        "roomsFilter",
        "minPrice",
        "maxPrice"
    ];

    filterIds.forEach(id => {

        const element = document.getElementById(id);

        if (!element) return;

        if (
            element.type === "checkbox" ||
            element.type === "radio"
        ) {
            element.checked = false;
        } else {
            element.value = "";
        }

    });


    // ყველა რაიონის checkbox-ის გასუფთავება
    document
        .querySelectorAll(
            '.filter-window input[type="checkbox"]'
        )
        .forEach(input => {
            input.checked = false;
        });


    // "ყველა რაიონი" თავიდან ჩართული
    const allDistricts =
        document.getElementById("allDistricts");

    if (allDistricts) {
        allDistricts.checked = true;
    }


    // აუცილებლად გავანულოთ ID-ის ველი
    const listingIdInput =
        document.getElementById("filterListingId");

    if (listingIdInput) {
        listingIdInput.value = "";
        listingIdInput.dispatchEvent(
            new Event("input", { bubbles: true })
        );
        listingIdInput.dispatchEvent(
            new Event("change", { bubbles: true })
        );
    }


    // თავიდან ვაჩვენოთ ყველა განცხადება
    if (typeof renderPosts === "function") {
        renderPosts(allPosts);
    }

}
/* =========================================================
   FILTER EVENTS
========================================================= */

function setupFilterEvents() {
const ids = [

    "search",
    "filterDistrict",
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
                const listingId =
    post.listingId || "-";

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
const date = post.date
    ? new Date(Number(post.date) * 1000).toLocaleDateString(
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
            <div
    class="price-date-row"
    style="
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:10px;
    "
>

                <div class="property-price">
                    ${price}$
                </div>
                <div class="listing-id">
    ID #${listingId}
</div>
<div class="admin-price-actions"></div>
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
   ADMIN EDIT + DELETE
========================= */

card.addEventListener(
    "click",
    event => {

        const editButton =
            event.target.closest(
                ".admin-edit-btn"
            );

        if (editButton) {

            event.stopPropagation();

            editPost(post);

            return;
        }


        const deleteButton =
            event.target.closest(
                ".admin-delete-btn"
            );

        if (deleteButton) {

            event.stopPropagation();

            deletePost(post);

            return;
        }

    }
);
/* =========================
   ADMIN EDIT + DELETE
========================= */

if (telegramUserId === "5172653731") {
const actions =
    card.querySelector(".card-actions");

const adminPriceActions =
    card.querySelector(".admin-price-actions");

if (
    actions &&
    adminPriceActions
) {

        const editBtn =
            document.createElement("button");

        editBtn.type = "button";
        editBtn.className =
            "admin-edit-btn";

        editBtn.title =
            "Редактировать";

        editBtn.setAttribute(
            "aria-label",
            "Редактировать"
        );

        editBtn.innerHTML = `
            <svg
                viewBox="0 0 24 24"
                width="22"
                height="22"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                <path d="M12 20h9"/>
                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>
            </svg>
        `;

        editBtn.style.cssText = `
            width:37px;
            height:37px;
            border:none;
            border-radius:14px;
            background:#fff3e8;
            color:#ff6600;
            display:flex;
            align-items:center;
            justify-content:center;
            cursor:pointer;
            flex-shrink:0;
        `;


        const deleteBtn =
            document.createElement("button");

        deleteBtn.type = "button";
        deleteBtn.className =
            "admin-delete-btn";

        deleteBtn.title =
            "Удалить";

        deleteBtn.setAttribute(
            "aria-label",
            "Удалить"
        );

        deleteBtn.innerHTML = `
            <svg
                viewBox="0 0 24 24"
                width="22"
                height="22"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                <path d="M3 6h18"/>
                <path d="M8 6V4h8v2"/>
                <path d="M19 6l-1 14H6L5 6"/>
                <path d="M10 11v5"/>
                <path d="M14 11v5"/>
            </svg>
        `;

        deleteBtn.style.cssText = `
            width:37px;
            height:37px;
            border:none;
            border-radius:14px;
            background:#ffeaea;
            color:#e53935;
            display:flex;
            align-items:center;
            justify-content:center;
            cursor:pointer;
            flex-shrink:0;
        `;


        /* ღილაკების დამატება */
        adminPriceActions.style.cssText = `
    display:flex;
    align-items:center;
    justify-content:center;
    gap:5px;
    flex-shrink:0;
`;

        adminPriceActions.append(
    deleteBtn
);

        adminPriceActions.append(
    editBtn
);


        /* რედაქტირება */

        editBtn.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                editPost(post);

            }
        );


        /* წაშლა */

        deleteBtn.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                deletePost(post);

            }
        );

    }

}

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

            const lat = Number(post.lat);
            const lng = Number(post.lng);

            const yandexUrl =
                `https://yandex.com/maps/?ll=${lng},${lat}&z=17&pt=${lng},${lat},pm2rdm`;

            window.open(
                yandexUrl,
                "_blank"
            );

        } else {

            alert("Локация для этой квартиры не указана");

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

        const telegramUrl =
            `https://t.me/kvartiri_tbilisi2023/${post.id}`;

        window.open(
            telegramUrl,
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
   SHARE — TELEGRAM ORIGINAL LINK
========================= */

card.querySelector(
    ".share-btn"
)?.addEventListener(
    "click",
    event => {

        event.preventDefault();
        event.stopPropagation();

        const telegramPostUrl =
            `https://t.me/kvartiri_tbilisi2023/${post.id}`;

        const shareText =
    `🏠 ${district}\n💰 ${price}$\n🆔 ID: #${listingId}`;

        const telegramShareUrl =
            `https://t.me/share/url?url=${encodeURIComponent(
                telegramPostUrl
            )}&text=${encodeURIComponent(
                shareText
            )}`;

        if (
            telegramWebApp &&
            typeof telegramWebApp.openTelegramLink ===
            "function"
        ) {

            telegramWebApp.openTelegramLink(
                telegramShareUrl
            );

            return;
        }

        window.open(
            telegramShareUrl,
            "_blank"
        );

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

}/* =========================
   ADMIN EDIT POST
   SAME PAGE MODAL
========================= */

function editPost(post) {

    if (telegramUserId !== "5172653731") {
        return;
    }

    if (!post || !post.id) {
        alert("❌ Объявление не найдено");
        return;
    }


    /* =========================================
       REMOVE OLD MODAL
    ========================================= */

    const oldModal =
        document.getElementById(
            "adminEditModal"
        );

    if (oldModal) {
        oldModal.remove();
    }


    /* =========================================
       MODAL
    ========================================= */

    const modal =
        document.createElement("div");

    modal.id =
        "adminEditModal";

    modal.style.cssText = `
        position:fixed;
        inset:0;
        z-index:999999;

        background:rgba(0,0,0,.55);

        display:flex;
        align-items:center;
        justify-content:center;

        padding:15px;

        overflow-y:auto;
    `;


    /* =========================================
       WINDOW
    ========================================= */

    const windowBox =
        document.createElement("div");

    windowBox.style.cssText = `
        width:100%;
        max-width:520px;

        max-height:92vh;
        overflow-y:auto;

        background:#fff;

        border-radius:24px;

        padding:22px;

        box-shadow:
            0 20px 60px rgba(0,0,0,.35);
    `;


    /* =========================================
       HEADER
    ========================================= */

    windowBox.innerHTML = `

        <div style="
            display:flex;
            align-items:center;
            justify-content:space-between;
            margin-bottom:18px;
        ">

            <h2 style="
                margin:0;
                font-size:22px;
                color:#333;
            ">
                ✏️ Редактирование квартиры
            </h2>

            <button
                id="editCloseBtn"
                type="button"
                style="
                    width:38px;
                    height:38px;
                    border:0;
                    border-radius:50%;
                    background:#f1f1f1;
                    font-size:24px;
                    cursor:pointer;
                "
            >
                ×
            </button>

        </div>


        <div
            id="editForm"
            style="
                display:grid;
                grid-template-columns:1fr 1fr;
                gap:12px;
            "
        >

            <!-- РАЙОН -->

            <div style="
                display:flex;
                flex-direction:column;
                gap:6px;
            ">

                <label style="
                    font-size:13px;
                    font-weight:600;
                    color:#777;
                ">
                    📍 Район
                </label>

                <select
                    id="editDistrict"
                    style="
                        width:100%;
                        padding:12px;
                        border:1px solid #ddd;
                        border-radius:14px;
                        font-size:16px;
                        background:#fafafa;
                    "
                >

                    <option value="">
                        Не выбран
                    </option>

                    <option value="Ваке">
                        Ваке
                    </option>

                    <option value="Сабуртало">
                        Сабуртало
                    </option>

                    <option value="Вера">
                        Вера
                    </option>

                    <option value="Мтацминда">
                        Мтацминда
                    </option>

                    <option value="Чугурети">
                        Чугурети
                    </option>

                    <option value="Дидубе">
                        Дидубе
                    </option>

                    <option value="Исани">
                        Исани
                    </option>

                    <option value="Самгори">
                        Самгори
                    </option>

                    <option value="Крцаниси">
                        Крцаниси
                    </option>

                    <option value="Надзаладеви">
                        Надзаладеви
                    </option>

                    <option value="Глдани">
                        Глдани
                    </option>

                    <option value="Диди Дигоми">
                        Диди Дигоми
                    </option>

                    <option value="Ортачала">
                        Ортачала
                    </option>

                </select>

            </div>


            <!-- УЛИЦА -->

            <div style="
                display:flex;
                flex-direction:column;
                gap:6px;
            ">

                <label style="
                    font-size:13px;
                    font-weight:600;
                    color:#777;
                ">
                    📌 Улица
                </label>

                <input
                    id="editStreet"
                    type="text"
                    value="${escapeEditValue(post.street || "")}"
                    style="
                        width:100%;
                        padding:12px;
                        border:1px solid #ddd;
                        border-radius:14px;
                        font-size:16px;
                    "
                >

            </div>


            <!-- КОМНАТЫ -->

            <div style="
                display:flex;
                flex-direction:column;
                gap:6px;
            ">

                <label style="
                    font-size:13px;
                    font-weight:600;
                    color:#777;
                ">
                    🚪 Комнаты
                </label>

                <input
                    id="editRooms"
                    type="number"
                    value="${escapeEditValue(post.rooms || "")}"
                    style="
                        width:100%;
                        padding:12px;
                        border:1px solid #ddd;
                        border-radius:14px;
                        font-size:16px;
                    "
                >

            </div>


            <!-- СПАЛЬНИ -->

            <div style="
                display:flex;
                flex-direction:column;
                gap:6px;
            ">

                <label style="
                    font-size:13px;
                    font-weight:600;
                    color:#777;
                ">
                    🛏 Спальни
                </label>

                <input
                    id="editBedrooms"
                    type="number"
                    value="${escapeEditValue(post.bedrooms || "")}"
                    style="
                        width:100%;
                        padding:12px;
                        border:1px solid #ddd;
                        border-radius:14px;
                        font-size:16px;
                    "
                >

            </div>


            <!-- ВАННЫЕ -->

            <div style="
                display:flex;
                flex-direction:column;
                gap:6px;
            ">

                <label style="
                    font-size:13px;
                    font-weight:600;
                    color:#777;
                ">
                    🛁 Ванные
                </label>

                <input
                    id="editBathrooms"
                    type="number"
                    value="${escapeEditValue(post.bathrooms || "")}"
                    style="
                        width:100%;
                        padding:12px;
                        border:1px solid #ddd;
                        border-radius:14px;
                        font-size:16px;
                    "
                >

            </div>


            <!-- ПЛОЩАДЬ -->

            <div style="
                display:flex;
                flex-direction:column;
                gap:6px;
            ">

                <label style="
                    font-size:13px;
                    font-weight:600;
                    color:#777;
                ">
                    📐 Площадь, м²
                </label>

                <input
                    id="editArea"
                    type="text"
                    value="${escapeEditValue(post.area || "")}"
                    style="
                        width:100%;
                        padding:12px;
                        border:1px solid #ddd;
                        border-radius:14px;
                        font-size:16px;
                    "
                >

            </div>


            <!-- ЭТАЖ -->

            <div style="
                display:flex;
                flex-direction:column;
                gap:6px;
            ">

                <label style="
                    font-size:13px;
                    font-weight:600;
                    color:#777;
                ">
                    🏢 Этаж
                </label>

                <input
                    id="editFloor"
                    type="text"
                    value="${escapeEditValue(post.floor || "")}"
                    style="
                        width:100%;
                        padding:12px;
                        border:1px solid #ddd;
                        border-radius:14px;
                        font-size:16px;
                    "
                >

            </div>


            <!-- ЦЕНА -->

            <div style="
                grid-column:1 / -1;

                display:flex;
                flex-direction:column;
                gap:6px;
            ">

                <label style="
                    font-size:13px;
                    font-weight:600;
                    color:#777;
                ">
                    💰 Цена, $
                </label>

                <input
                    id="editPrice"
                    type="text"
                    value="${escapeEditValue(post.price || "")}"
                    style="
                        width:100%;
                        padding:12px;
                        border:1px solid #ddd;
                        border-radius:14px;
                        font-size:16px;
                    "
                >

            </div>


            <!-- ОПИСАНИЕ -->

            <div style="
                grid-column:1 / -1;

                display:flex;
                flex-direction:column;
                gap:6px;
            ">

                <label style="
                    font-size:13px;
                    font-weight:600;
                    color:#777;
                ">
                    📝 Описание
                </label>

                <textarea
                    id="editText"
                    style="
                        width:100%;
                        min-height:100px;

                        padding:12px;

                        border:1px solid #ddd;
                        border-radius:14px;

                        font-size:16px;

                        resize:vertical;
                    "
                >${escapeEditValue(post.text || "")}</textarea>

            </div>

        </div>


        <!-- STATUS -->

        <div
            id="editStatus"
            style="
                display:none;
                margin-top:12px;
                padding:10px;
                border-radius:12px;
                text-align:center;
                font-size:14px;
            "
        ></div>


        <!-- BUTTONS -->

        <div style="
            display:flex;
            gap:10px;
            margin-top:20px;
        ">

            <button
                id="editCancelBtn"
                type="button"
                style="
                    flex:1;

                    border:0;
                    border-radius:14px;

                    padding:14px;

                    background:#eee;

                    color:#333;

                    font-size:16px;
                    font-weight:700;

                    cursor:pointer;
                "
            >
                Отмена
            </button>


            <button
                id="editSaveBtn"
                type="button"
                style="
                    flex:1;

                    border:0;
                    border-radius:14px;

                    padding:14px;

                    background:#ff6600;

                    color:#fff;

                    font-size:16px;
                    font-weight:700;

                    cursor:pointer;
                "
            >
                💾 Сохранить
            </button>

        </div>

    `;


    modal.appendChild(
        windowBox
    );

    document.body.appendChild(
        modal
    );


    /* =========================================
       ESCAPE HTML
    ========================================= */

    function escapeEditValue(value) {

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    /* =========================================
       SELECT CURRENT DISTRICT
    ========================================= */

    const districtSelect =
        document.getElementById(
            "editDistrict"
        );


    districtSelect.value =
        post.district || "";


    /*
       თუ არსებული რაიონი სიაში არ არის,
       მაინც ვაჩვენოთ.
    */

    if (
        post.district &&
        districtSelect.value !==
        post.district
    ) {

        const customOption =
            document.createElement(
                "option"
            );

        customOption.value =
            post.district;

        customOption.textContent =
            post.district;

        districtSelect.appendChild(
            customOption
        );

        districtSelect.value =
            post.district;
    }


    /* =========================================
       CLOSE
    ========================================= */

    function closeEditModal() {

        modal.remove();

    }


    document
        .getElementById(
            "editCloseBtn"
        )
        .addEventListener(
            "click",
            closeEditModal
        );


    document
        .getElementById(
            "editCancelBtn"
        )
        .addEventListener(
            "click",
            closeEditModal
        );


    /* =========================================
       SAVE
    ========================================= */

    document
        .getElementById(
            "editSaveBtn"
        )
        .addEventListener(
            "click",
            async () => {


                const saveButton =
                    document.getElementById(
                        "editSaveBtn"
                    );


                const status =
                    document.getElementById(
                        "editStatus"
                    );


                const updatedPost = {

                    ...post,

                    id:
                        post.id,

                    userId:
                        telegramUserId,

                    district:
                        districtSelect.value.trim(),

                    street:
                        document
                            .getElementById(
                                "editStreet"
                            )
                            .value
                            .trim(),

                    rooms:
                        document
                            .getElementById(
                                "editRooms"
                            )
                            .value
                            .trim(),

                    bedrooms:
                        document
                            .getElementById(
                                "editBedrooms"
                            )
                            .value
                            .trim(),

                    bathrooms:
                        document
                            .getElementById(
                                "editBathrooms"
                            )
                            .value
                            .trim(),

                    area:
                        document
                            .getElementById(
                                "editArea"
                            )
                            .value
                            .trim(),

                    floor:
                        document
                            .getElementById(
                                "editFloor"
                            )
                            .value
                            .trim(),

                    price:
                        document
                            .getElementById(
                                "editPrice"
                            )
                            .value
                            .trim(),

                    text:
                        document
                            .getElementById(
                                "editText"
                            )
                            .value
                            .trim()
                };


                saveButton.disabled =
                    true;

                saveButton.textContent =
                    "⏳ Сохранение...";


                try {

                    const response =
                        await fetch(
                            "/api/post/update",
                            {

                                method:
                                    "POST",

                                headers: {

                                    "Content-Type":
                                        "application/json"

                                },

                                body:
                                    JSON.stringify(
                                        updatedPost
                                    )

                            }
                        );


                    const result =
                        await response.json();


                    if (
                        !response.ok ||
                        !result.success
                    ) {

                        throw new Error(
                            result.error ||
                            "Ошибка сохранения"
                        );

                    }


                    status.style.display =
                        "block";

                    status.style.background =
                        "#e9f8ed";

                    status.style.color =
                        "#218838";

                    status.textContent =
                        "✅ Изменения сохранены";


                    /*
                       ВАЖНО:
                       НЕ переходим на edit.html
                       НЕ переходим на details.html

                       Просто закрываем окно
                       и обновляем каталог.
                    */

                    await loadPosts();


                    setTimeout(
                        () => {

                            closeEditModal();

                        },
                        300
                    );


                } catch (error) {

                    console.error(
                        "EDIT POST ERROR:",
                        error
                    );


                    status.style.display =
                        "block";

                    status.style.background =
                        "#ffe9e9";

                    status.style.color =
                        "#c62828";

                    status.textContent =
                        "❌ " +
                        error.message;


                    saveButton.disabled =
                        false;

                    saveButton.textContent =
                        "💾 Сохранить";
                }

            }
        );


    /* =========================================
       CLICK OUTSIDE
    ========================================= */

    modal.addEventListener(
        "click",
        event => {

            if (
                event.target === modal
            ) {

                closeEditModal();

            }

        }
    );

}

/* =========================
   ADMIN DELETE POST
========================= */

async function deletePost(post) {

    if (telegramUserId !== "5172653731") {
        return;
    }

    const confirmed = confirm(
        `Удалить объявление №${post.id}?\n\nЭто действие нельзя отменить.`
    );

    if (!confirmed) return;

    try {

        const response = await fetch(
            "/api/post/delete",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    id: post.id,
                    userId: telegramUserId
                })
            }
        );

        const result =
            await response.json();

        if (!response.ok) {
            throw new Error(
                result.error ||
                "Ошибка удаления"
            );
        }

        alert(
            "🗑️ Объявление удалено"
        );

        await loadPosts();

    } catch (error) {

        console.error(
            "DELETE POST ERROR:",
            error
        );

        alert(
            "❌ Не удалось удалить объявление"
        );
    }
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

if (mapInstance && satelliteButton) {
    mapInstance.getContainer().appendChild(satelliteButton);
}
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
   MAP MARKER
   🔵 BLUE CIRCLE + PRICE
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
                                width:38px;
                                height:38px;

                                border-radius:50%;

                                background:#1769ff;

                                display:flex;
                                align-items:center;
                                justify-content:center;

                                box-shadow:
                                    0 2px 6px
                                    rgba(0,0,0,.30);

                                color:white;

                                font-size:12px;
                                font-weight:700;

                                white-space:nowrap;
                            "
                        >
                            ${displayPrice}
                        </div>

                    `,

                    iconSize:
                        [38, 38],

                    iconAnchor:
                        [19, 19]

                })

        }
    );

}

/* =========================================================
   MAP DETAILS MODAL
========================================================= */

function openMapDetails(postId) {

    const post = allPosts.find(
        item => String(item.id) === String(postId)
    );

    if (!post) {
        console.error("Post not found:", postId);
        return;
    }

    // თუ ძველი ფანჯარა არსებობს — წავშალოთ
    document.getElementById("mapDetailsModal")?.remove();

    const price =
        getPostPrice(post) ||
        post.price ||
        "-";

    const district =
        post.district ||
        "-";

    const address =
        post.address ||
        post.street ||
        post.location ||
        "-";

    const rooms =
        post.rooms ||
        "-";

    const bedrooms =
        post.bedrooms ||
        "-";

    const bathrooms =
        post.bathrooms ||
        "-";

    const area =
        post.area ||
        "-";

    const floor =
        post.floor ||
        "-";
const description = "";

    const images =
        Array.isArray(post.images)
            ? post.images.filter(Boolean)
            : [];
let imageHTML = "";

if (images.length > 0) {

    let firstImage = images[0];

    if (
        !firstImage.startsWith("http") &&
        !firstImage.startsWith("/")
    ) {
        firstImage = "/" + firstImage;
    }

    imageHTML = `
        <div
            class="orange-modal-photo"
            style="
                position:relative;
                width:100%;
            "
        >

            <img
                id="mapModalImage"
                src="${firstImage}"
                alt="Фото квартиры"
                style="
                    width:100%;
                    max-height:420px;
                    object-fit:cover;
                    border-radius:14px;
                    display:block;
                "
            >

            ${
                images.length > 1
                    ? `
                        <button
                            type="button"
                            id="mapModalPrev"
                            style="
                                position:absolute;
                                left:12px;
                                top:50%;
                                transform:translateY(-50%);
                                width:44px;
                                height:44px;
                                border:0;
                                border-radius:50%;
                                background:rgba(0,0,0,.55);
                                color:white;
                                font-size:28px;
                                cursor:pointer;
                            "
                        >‹</button>

                        <button
                            type="button"
                            id="mapModalNext"
                            style="
                                position:absolute;
                                right:12px;
                                top:50%;
                                transform:translateY(-50%);
                                width:44px;
                                height:44px;
                                border:0;
                                border-radius:50%;
                                background:rgba(0,0,0,.55);
                                color:white;
                                font-size:28px;
                                cursor:pointer;
                            "
                        >›</button>

                        <div
                            id="mapModalCounter"
                            style="
                                position:absolute;
                                bottom:10px;
                                left:50%;
                                transform:translateX(-50%);
                                background:rgba(0,0,0,.6);
                                color:white;
                                padding:5px 12px;
                                border-radius:20px;
                                font-size:14px;
                            "
                        >
                            1 / ${images.length}
                        </div>
                    `
                    : ""
            }

        </div>
    `;
}


    const modal =
        document.createElement("div");

    modal.id =
        "mapDetailsModal";

    modal.className =
        "orange-map-modal";


    modal.innerHTML = `

        <div
            class="orange-modal-overlay"
            onclick="closeMapDetails(event)"
        >

            <div
                class="orange-modal-window"
                onclick="event.stopPropagation()"
            >

                <!-- CLOSE -->

                <button
                    type="button"
                    class="orange-modal-close"
                    onclick="closeMapDetails()"
                >
                    ×
                </button>


                <!-- PHOTO -->

                ${imageHTML}
<!-- TITLE -->
<div class="orange-modal-title">
    🏠 Сдается ${rooms}-комнатная квартира в районе ${district}
</div>

                <!-- PRICE -->

                <div class="orange-modal-price">
                    💰 $${price}
                </div>


                <!-- INFORMATION -->

                <div class="orange-modal-info">


                    <div class="orange-info-item">
                        <span>📍</span>
                        <div>
                            <b>Район</b>
                            <strong>${district}</strong>
                        </div>
                    </div>


                    <div class="orange-info-item">
                        <span>🏠</span>
                        <div>
                            <b>Адрес</b>
                            <strong>${address}</strong>
                        </div>
                    </div>


                    <div class="orange-info-grid">


                        <div class="orange-info-card">
                            <span>🚪</span>
                            <b>${rooms}</b>
                            <small>Комнат</small>
                        </div>


                        <div class="orange-info-card">
                            <span>🛏️</span>
                            <b>${bedrooms}</b>
                            <small>Спальни</small>
                        </div>


                        <div class="orange-info-card">
                            <span>📐</span>
                            <b>${area}</b>
                            <small>м²</small>
                        </div>


                        <div class="orange-info-card">
                            <span>🏢</span>
                            <b>${floor}</b>
                            <small>Этаж</small>
                        </div>


                    </div>


                    ${
                        bathrooms !== "-"
                            ? `
                                <div class="orange-info-item">
                                    <span>🛁</span>
                                    <div>
                                        <b>Ванные</b>
                                        <strong>${bathrooms}</strong>
                                    </div>
                                </div>
                            `
                            : ""
                    }


                </div>


                ${
                    description
                        ? `
                            <div class="orange-modal-description">

                                <div class="orange-description-title">
                                    📝 Описание
                                </div>

                                <div class="orange-description-text">
                                    ${description}
                                </div>

                            </div>
                        `
                        : ""
                }


                <!-- BUTTONS -->

                <div class="orange-modal-buttons">


                    <!-- SHARE -->

                    <button
    type="button"
    class="orange-share-btn"
    data-share-post-id="${String(post.id)}"
>
    📤
    <span>Поделиться</span>
</button>


                    <!-- TELEGRAM -->

                    <button
                        type="button"
                        class="orange-telegram-btn"
                        onclick="writeToTelegram()"
                    >
                        ✈️
                        <span>Написать</span>
                    </button>


                </div>

            </div>

        </div>

    `;

document.body.appendChild(
    modal
);
/* =========================================================
   MAP PHOTO GALLERY
========================================================= */

if (images.length > 1) {

    let currentImageIndex = 0;

    const modalImage =
        modal.querySelector("#mapModalImage");

    const counter =
        modal.querySelector("#mapModalCounter");

    const prevButton =
        modal.querySelector("#mapModalPrev");

    const nextButton =
        modal.querySelector("#mapModalNext");


    function updateMapPhoto() {

        let imageUrl =
            images[currentImageIndex];

        if (
            !imageUrl.startsWith("http") &&
            !imageUrl.startsWith("/")
        ) {
            imageUrl = "/" + imageUrl;
        }

        modalImage.src = imageUrl;

        if (counter) {
            counter.textContent =
                `${currentImageIndex + 1} / ${images.length}`;
        }
    }


    if (prevButton) {

        prevButton.onclick = function (event) {

            event.preventDefault();
            event.stopPropagation();

            currentImageIndex--;

            if (currentImageIndex < 0) {
                currentImageIndex =
                    images.length - 1;
            }

            updateMapPhoto();
        };
    }


    if (nextButton) {

        nextButton.onclick = function (event) {

            event.preventDefault();
            event.stopPropagation();

            currentImageIndex++;

            if (
                currentImageIndex >=
                images.length
            ) {
                currentImageIndex = 0;
            }

            updateMapPhoto();
        };
    }

/* =========================================================
   FULLSCREEN PHOTO GALLERY
========================================================= */

if (modalImage) {

    modalImage.style.cursor = "zoom-in";

    modalImage.onclick = function (event) {

        event.preventDefault();
        event.stopPropagation();

        let fullIndex = currentImageIndex;

        const viewer =
            document.createElement("div");

        viewer.id = "orangeFullPhotoViewer";

        viewer.innerHTML = `
            <div
                style="
                    position:fixed;
                    inset:0;
                    background:rgba(0,0,0,0.94);
                    z-index:999999;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                "
            >

                <!-- CLOSE -->
                <button
                    id="orangeFullClose"
                    type="button"
                    style="
                        position:absolute;
                        top:20px;
                        right:25px;
                        width:48px;
                        height:48px;
                        border:0;
                        border-radius:50%;
                        background:rgba(255,255,255,0.85);
                        color:#222;
                        font-size:30px;
                        cursor:pointer;
                        z-index:3;
                    "
                >
                    ×
                </button>


                <!-- PREVIOUS -->
                <button
                    id="orangeFullPrev"
                    type="button"
                    style="
                        position:absolute;
                        left:20px;
                        top:50%;
                        transform:translateY(-50%);
                        width:52px;
                        height:52px;
                        border:0;
                        border-radius:50%;
                        background:rgba(255,255,255,0.85);
                        color:#222;
                        font-size:32px;
                        cursor:pointer;
                        z-index:3;
                    "
                >
                    ‹
                </button>


                <!-- PHOTO -->
                <img
                    id="orangeFullImage"
                    src=""
                    alt="Фото квартиры"
                    style="
                        max-width:90vw;
                        max-height:90vh;
                        object-fit:contain;
                        border-radius:8px;
                        display:block;
                    "
                >


                <!-- NEXT -->
                <button
                    id="orangeFullNext"
                    type="button"
                    style="
                        position:absolute;
                        right:20px;
                        top:50%;
                        transform:translateY(-50%);
                        width:52px;
                        height:52px;
                        border:0;
                        border-radius:50%;
                        background:rgba(255,255,255,0.85);
                        color:#222;
                        font-size:32px;
                        cursor:pointer;
                        z-index:3;
                    "
                >
                    ›
                </button>


                <!-- COUNTER -->
                <div
                    id="orangeFullCounter"
                    style="
                        position:absolute;
                        bottom:25px;
                        left:50%;
                        transform:translateX(-50%);
                        background:rgba(0,0,0,0.65);
                        color:white;
                        padding:7px 15px;
                        border-radius:20px;
                        font-size:16px;
                        z-index:3;
                    "
                >
                </div>

            </div>
        `;

        document.body.appendChild(viewer);

        const fullImage =
            viewer.querySelector(
                "#orangeFullImage"
            );

        const fullCounter =
            viewer.querySelector(
                "#orangeFullCounter"
            );

        function updateFullPhoto() {

            let url =
                images[fullIndex];

            if (
                !url.startsWith("http") &&
                !url.startsWith("/")
            ) {
                url = "/" + url;
            }

            fullImage.src = url;

            fullCounter.textContent =
                `${fullIndex + 1} / ${images.length}`;
        }


        /* PREVIOUS */

        viewer
            .querySelector("#orangeFullPrev")
            .onclick = function (e) {

                e.stopPropagation();

                fullIndex--;

                if (fullIndex < 0) {
                    fullIndex =
                        images.length - 1;
                }

                updateFullPhoto();
            };


        /* NEXT */

        viewer
            .querySelector("#orangeFullNext")
            .onclick = function (e) {

                e.stopPropagation();

                fullIndex++;

                if (
                    fullIndex >=
                    images.length
                ) {
                    fullIndex = 0;
                }

                updateFullPhoto();
            };


        /* CLOSE */

        viewer
            .querySelector("#orangeFullClose")
            .onclick = function (e) {

                e.stopPropagation();

                viewer.remove();
            };


        /* CLICK OUTSIDE */

        viewer.firstElementChild.onclick =
            function (e) {

                if (
                    e.target ===
                    viewer.firstElementChild
                ) {
                    viewer.remove();
                }
            };


        /* ESC */

        function closeWithEsc(e) {

            if (e.key === "Escape") {

                viewer.remove();

                document.removeEventListener(
                    "keydown",
                    closeWithEsc
                );
            }
        }

        document.addEventListener(
            "keydown",
            closeWithEsc
        );


        updateFullPhoto();
    };
}
}
/* =========================================================
   MAP SHARE BUTTON
========================================================= */

const shareButton =
    modal.querySelector(".orange-share-btn");
if (shareButton) {

    shareButton.addEventListener(
        "click",
        function (event) {

            event.preventDefault();
            event.stopImmediatePropagation();

            const telegramLink =
                `https://t.me/s/kvartiri_tbilisi2023/${String(post.id)}`;

            console.log(
                "OPEN TELEGRAM POST:",
                telegramLink
            );

            window.open(
                telegramLink,
                "_blank",
                "noopener,noreferrer"
            );

        }
    );

}

document.body.style.overflow =
    "hidden";


    setTimeout(
        () => {

            modal.classList.add(
                "show"
            );

        },
        10
    );
}
document.addEventListener("click", function (event) {

    const shareButton =
        event.target.closest(".orange-share-btn");

    if (!shareButton) return;

    event.preventDefault();
    event.stopPropagation();

    const postId =
        shareButton.dataset.sharePostId;

    if (!postId) {
        console.error("Share: post ID not found");
        return;
    }

    shareMapPost(String(postId));
});

/* =========================================================
   CLOSE MODAL
========================================================= */

function closeMapDetails(event) {

    if (
        event &&
        event.target &&
        !event.target.classList.contains(
            "orange-modal-overlay"
        )
    ) {
        return;
    }


    const modal =
        document.getElementById(
            "mapDetailsModal"
        );


    if (modal) {

        modal.classList.remove(
            "show"
        );

        setTimeout(
            () => {

                modal.remove();

                document.body.style.overflow = "";

            },
            200
        );

    } else {

        document.body.style.overflow = "";

    }
}


/* =========================================================
   SHARE
========================================================= */

async function shareMapPost(postId) {

    const shareUrl =
        window.location.origin +
        "/details.html?id=" +
        encodeURIComponent(postId);


    try {

        if (
            navigator.share
        ) {

            await navigator.share({

                title:
                    "Orange Real Estate",

                text:
                    "🏠 Квартира",

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


/* =========================================================
   TELEGRAM
========================================================= */

function writeToTelegram() {

    window.open(
        "https://t.me/Orangerealestatetbilisi",
        "_blank"
    );

}


/* =========================================================
   ESC
========================================================= */

document.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key === "Escape"
        ) {

            closeMapDetails();

        }

    }
);


/* =========================================================
   MODAL CSS
========================================================= */

if (
    !document.getElementById(
        "orangeMapModalStyle"
    )
) {

    const style =
        document.createElement(
            "style"
        );

    style.id =
        "orangeMapModalStyle";


    style.textContent = `

        .orange-map-modal {

            position:fixed;

            inset:0;

            z-index:999999;

            opacity:0;

            transition:
                opacity .2s ease;

        }


        .orange-map-modal.show {

            opacity:1;

        }


        .orange-modal-overlay {

            position:absolute;

            inset:0;

            background:
                rgba(0,0,0,.48);

            display:flex;

            align-items:flex-end;

            justify-content:center;

        }


        .orange-modal-window {

            position:relative;

            width:100%;

            max-width:620px;

            max-height:92vh;

            overflow-y:auto;

            background:white;

            border-radius:
                28px 28px 0 0;

            padding:
                16px 18px 24px;

            box-shadow:
                0 -10px 40px
                rgba(0,0,0,.25);

            transform:
                translateY(100%);

            transition:
                transform .25s ease;

        }


        .orange-map-modal.show
        .orange-modal-window {

            transform:
                translateY(0);

        }


        .orange-modal-close {

            position:absolute;

            top:12px;

            right:12px;

            z-index:10;

            width:40px;

            height:40px;

            border:0;

            border-radius:50%;

            background:
                rgba(0,0,0,.55);

            color:white;

            font-size:28px;

            line-height:40px;

            cursor:pointer;

        }


        .orange-modal-photo {

            width:100%;

            height:260px;

            overflow:hidden;

            border-radius:20px;

            background:#eee;

        }


        .orange-modal-photo img {

            width:100%;

            height:100%;

            object-fit:cover;

            display:block;

        }


        .orange-modal-price {

            font-size:30px;

            font-weight:900;

            margin:
                18px 4px;

        }


        .orange-modal-info {

            display:flex;

            flex-direction:column;

            gap:12px;

        }


        .orange-info-item {

            display:flex;

            gap:12px;

            align-items:flex-start;

            font-size:16px;

        }


        .orange-info-item > span {

            font-size:22px;

            width:28px;

            flex-shrink:0;

        }


        .orange-info-item div {

            display:flex;

            flex-direction:column;

            gap:2px;

        }


        .orange-info-item b {

            color:#888;

            font-size:13px;

        }


        .orange-info-item strong {

            color:#111;

            font-size:17px;

        }


        .orange-info-grid {

            display:grid;

            grid-template-columns:
                1fr 1fr;

            gap:10px;

            margin-top:4px;

        }


        .orange-info-card {

            display:flex;

            flex-direction:column;

            align-items:center;

            justify-content:center;

            min-height:90px;

            border:
                1px solid #eee;

            border-radius:16px;

            background:#fafafa;

        }


        .orange-info-card span {

            font-size:22px;

        }


        .orange-info-card b {

            font-size:21px;

            margin-top:3px;

        }


        .orange-info-card small {

            color:#999;

            font-size:13px;

        }


        .orange-modal-description {

            margin-top:18px;

            padding-top:16px;

            border-top:
                1px solid #eee;

        }


        .orange-description-title {

            font-size:18px;

            font-weight:800;

            margin-bottom:8px;

        }


        .orange-description-text {

            font-size:15px;

            line-height:1.5;

            white-space:pre-wrap;

        }


        .orange-modal-buttons {

            display:flex;

            gap:10px;

            margin-top:22px;

        }


        .orange-share-btn,
        .orange-telegram-btn {

            flex:1;

            min-height:56px;

            border:0;

            border-radius:17px;

            font-size:16px;

            font-weight:800;

            display:flex;

            align-items:center;

            justify-content:center;

            gap:8px;

            cursor:pointer;

        }


        .orange-share-btn {

            background:#f1f1f1;

            color:#111;

        }


        .orange-telegram-btn {

            background:#229ED9;

            color:white;

        }


        @media (max-width:480px) {

            .orange-modal-photo {

                height:220px;

            }

            .orange-modal-window {

                padding:
                    14px 14px 22px;

            }

        }

    `;


    document.head.appendChild(
        style
    );

}
/* =========================================================
   MAP SHARE — ORIGINAL TELEGRAM POST
========================================================= */

function shareMapPost(postId) {

    const telegramUrl =
        `https://t.me/kvartiri_tbilisi2023/${postId}`;

    const shareText =
        "🏠 Смотреть объявление";

    try {

        if (
            window.Telegram &&
            window.Telegram.WebApp &&
            window.Telegram.WebApp.openTelegramLink
        ) {

            const telegramShareUrl =
                `https://t.me/share/url?url=${encodeURIComponent(telegramUrl)}&text=${encodeURIComponent(shareText)}`;

            window.Telegram.WebApp.openTelegramLink(
                telegramShareUrl
            );

            return;
        }

        if (
            navigator.share
        ) {

            navigator.share({

                title:
                    "Orange Real Estate",

                text:
                    shareText,

                url:
                    telegramUrl

            }).catch(
                error => {

                    console.log(
                        "Share cancelled:",
                        error
                    );

                }
            );

            return;
        }

        window.open(
            `https://t.me/share/url?url=${encodeURIComponent(telegramUrl)}&text=${encodeURIComponent(shareText)}`,
            "_blank"
        );

    }

    catch (error) {

        console.error(
            "MAP SHARE ERROR:",
            error
        );

        window.open(
            `https://t.me/share/url?url=${encodeURIComponent(telegramUrl)}`,
            "_blank"
        );

    }

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
    openMapDetails('${String(post.id)}')
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

// აქ არის app.js-ის ბოლო არსებული კოდი

   // ბოლო ფუნქციის დახურვა


/* =========================================================
   MAP SHARE — TELEGRAM ORIGINAL POST
========================================================= */

document.addEventListener("click", function (event) {

    const shareButton =
        event.target.closest(".orange-share-btn");

    if (!shareButton) {
        return;
    }

    event.preventDefault();
    event.stopPropagation();

    const postId =
        shareButton.getAttribute("data-share-post-id");

    if (!postId) {
        console.error("Share: post ID not found");
        return;
    }

    const telegramPostUrl =
        `https://t.me/kvartiri_tbilisi2023/${postId}`;

    const shareUrl =
        `https://t.me/share/url?url=${encodeURIComponent(telegramPostUrl)}`;

    console.log(
        "SHARE BUTTON WORKING:",
        shareUrl
    );

    if (
        window.Telegram &&
        window.Telegram.WebApp &&
        typeof window.Telegram.WebApp.openTelegramLink === "function"
    ) {
        window.Telegram.WebApp.openTelegramLink(
            shareUrl
        );

        return;
    }

    window.open(
        shareUrl,
        "_blank"
    );

});