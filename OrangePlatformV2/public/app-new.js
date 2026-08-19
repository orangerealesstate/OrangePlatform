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
   DISTRICT ALIASES
========================================================= */

const districtAliases = {

    saburtalo: [
        "saburtalo",
        "сабуртало",
        "საბურთალო"
    ],

    vake: [
        "vake",
        "ваки",
        "ваке",
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
        "дიღომი"
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


/* =========================================================
   NORMALIZE DISTRICT
========================================================= */

function normalizeDistrict(
    value
) {

    const text =
        String(
            value ||
            ""
        )
            .toLowerCase()
            .trim();

    if (!text) {
        return "";
    }


    for (
        const [
            district,
            names
        ]
        of Object.entries(
            districtAliases
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

function getFilteredPosts() {

    const search =
        (
            document.getElementById(
                "search"
            )?.value ||
            ""
        )
            .toLowerCase()
            .trim();


    const selectedDistrict =
        normalizeDistrict(
            document.getElementById(
                "districtFilter"
            )?.value ||
            ""
        );


    const selectedRooms =
        document.getElementById(
            "roomsFilter"
        )?.value ||
        "";


    const minPrice =
        Number(
            document.getElementById(
                "minPrice"
            )?.value
        ) || 0;


    const maxPrice =
        Number(
            document.getElementById(
                "maxPrice"
            )?.value
        ) || 999999999;


    return allPosts.filter(
        post => {

            if (search) {

                const searchable =
                    [
                        post.text,
                        post.district,
                        post.street,
                        post.rooms,
                        post.area,
                        post.price
                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();


                if (
                    !searchable.includes(
                        search
                    )
                ) {

                    return false;

                }

            }


            if (selectedDistrict) {

                const postDistrict =
                    normalizeDistrict(
                        post.district ||
                        post.text
                    );


                if (
                    postDistrict !==
                    selectedDistrict
                ) {

                    return false;

                }

            }


            if (selectedRooms) {

                const rooms =
                    Number(
                        post.rooms
                    ) || 0;


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

                else if (
                    rooms !==
                    Number(
                        selectedRooms
                    )
                ) {

                    return false;

                }

            }


            const price =
                Number(
                    post.price
                ) || 0;


            if (
                price < minPrice ||
                price > maxPrice
            ) {

                return false;

            }


            if (
                favoritesOnly &&
                !favoritePostIds.has(
                    String(post.id)
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


    const favoritesButton =
        document.getElementById(
            "favoritesFilterBtn"
        );


    if (favoritesButton) {

        favoritesButton.classList.remove(
            "active"
        );

    }


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

function renderPosts(
    posts
) {

    const container =
        document.getElementById(
            "posts"
        );


    if (!container) {

        return;

    }


    container.innerHTML =
        "";


    if (!posts.length) {

        container.innerHTML = `

            <h2
                style="
                    text-align:center;
                    padding:40px;
                "
            >
                Объявления не найдены
            </h2>

        `;

        return;

    }


    posts.forEach(
        post => {

            const images =
                Array.isArray(
                    post.images
                ) &&
                post.images.length
                    ? post.images
                    : [
                        "https://via.placeholder.com/600x400?text=No+Photo"
                    ];


            if (
                currentCardImage[
                    post.id
                ] === undefined
            ) {

                currentCardImage[
                    post.id
                ] = 0;

            }


            let imageIndex =
                currentCardImage[
                    post.id
                ] || 0;


            if (
                imageIndex >=
                images.length
            ) {

                imageIndex =
                    0;


                currentCardImage[
                    post.id
                ] = 0;

            }


            const image =
                images[
                    imageIndex
                ];


            const imageSrc =
                image.startsWith(
                    "http"
                )
                    ? image
                    : "/" + image;


            const district =
                post.district ||
                "-";


            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "card";


            card.innerHTML = `

                <div
                    class="card-slider"
                    style="
                        position:relative;
                    "
                >

                    <button
                        type="button"
                        class="favorite-btn"
                        data-post-id="${post.id}"
                        style="
                            position:absolute;
                            top:10px;
                            right:10px;
                            z-index:20;
                            width:42px;
                            height:42px;
                            border:0;
                            border-radius:50%;
                            background:white;
                            font-size:23px;
                        "
                    >
                        ${
                            favoritePostIds.has(
                                String(post.id)
                            )
                                ? "❤️"
                                : "🤍"
                        }
                    </button>


                    <img
                        src="${imageSrc}"
                        class="card-image"
                        data-post-id="${post.id}"
                        style="
                            width:100%;
                            height:220px;
                            object-fit:cover;
                            display:block;
                            cursor:pointer;
                        "
                    >


                    ${
                        images.length > 1
                            ? `

                        <button
                            type="button"
                            class="image-prev"
                            data-post-id="${post.id}"
                            style="
                                position:absolute;
                                left:10px;
                                top:50%;
                                transform:translateY(-50%);
                                width:38px;
                                height:38px;
                                border:0;
                                border-radius:50%;
                                background:rgba(0,0,0,.55);
                                color:white;
                                font-size:22px;
                                z-index:10;
                            "
                        >
                            ‹
                        </button>


                        <button
                            type="button"
                            class="image-next"
                            data-post-id="${post.id}"
                            style="
                                position:absolute;
                                right:10px;
                                top:50%;
                                transform:translateY(-50%);
                                width:38px;
                                height:38px;
                                border:0;
                                border-radius:50%;
                                background:rgba(0,0,0,.55);
                                color:white;
                                font-size:22px;
                                z-index:10;
                            "
                        >
                            ›
                        </button>

                    `
                            : ""
                    }

                </div>


                <div
                    class="card-content"
                >

                    <div
                        style="
                            font-size:22px;
                            font-weight:bold;
                            margin-bottom:8px;
                        "
                    >
                        ${
                            post.price
                                ? `$${post.price}`
                                : "-"
                        }
                    </div>


                    <div
                        style="
                            line-height:1.7;
                        "
                    >

                        📍
                        <b>Район:</b>
                        ${district}

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
                        ${post.area || "-"} м²

                    </div>


                    <button
                        type="button"
                        class="details-btn"
                        data-post-id="${post.id}"
                        style="
                            margin-top:12px;
                            width:100%;
                            border:0;
                            border-radius:8px;
                            padding:10px;
                            background:#1769ff;
                            color:white;
                            font-weight:bold;
                        "
                    >
                        Подробнее
                    </button>

                </div>

            `;


            container.appendChild(
                card
            );

        }
    );


    setupCardEvents();

}


/* =========================================================
   CARD EVENTS
========================================================= */

function setupCardEvents() {

    document
        .querySelectorAll(
            ".favorite-btn"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    event => {

                        event.preventDefault();

                        event.stopPropagation();


                        toggleFavorite(
                            button.dataset.postId
                        );

                    }
                );

            }
        );


    document
        .querySelectorAll(
            ".details-btn"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    event => {

                        event.preventDefault();

                        event.stopPropagation();


                        location.href =
                            "details.html?id=" +
                            encodeURIComponent(
                                button.dataset.postId
                            );

                    }
                );

            }
        );


    document
        .querySelectorAll(
            ".card-image"
        )
        .forEach(
            image => {

                image.addEventListener(
                    "click",
                    () => {

                        const post =
                            allPosts.find(
                                item =>
                                    String(
                                        item.id
                                    ) ===
                                    String(
                                        image.dataset.postId
                                    )
                            );


                        if (!post) {

                            return;

                        }


                        const images =
                            Array.isArray(
                                post.images
                            )
                                ? post.images
                                : [];


                        if (!images.length) {

                            return;

                        }


                        openImageViewer(
                            images,
                            currentCardImage[
                                post.id
                            ] || 0
                        );

                    }
                );

            }
        );


    document
        .querySelectorAll(
            ".image-prev"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    event => {

                        event.preventDefault();

                        event.stopPropagation();


                        changeCardImage(
                            button.dataset.postId,
                            -1
                        );

                    }
                );

            }
        );


    document
        .querySelectorAll(
            ".image-next"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    event => {

                        event.preventDefault();

                        event.stopPropagation();


                        changeCardImage(
                            button.dataset.postId,
                            1
                        );

                    }
                );

            }
        );

}


/* =========================================================
   CHANGE CARD IMAGE
========================================================= */

function changeCardImage(
    postId,
    direction
) {

    const post =
        allPosts.find(
            item =>
                String(
                    item.id
                ) ===
                String(
                    postId
                )
        );


    if (!post) {

        return;

    }


    const images =
        Array.isArray(
            post.images
        )
            ? post.images
            : [];


    if (
        images.length <= 1
    ) {

        return;

    }


    let index =
        currentCardImage[
            post.id
        ] || 0;


    index +=
        direction;


    if (
        index < 0
    ) {

        index =
            images.length - 1;

    }


    if (
        index >=
        images.length
    ) {

        index =
            0;

    }


    currentCardImage[
        post.id
    ] = index;


    const image =
        document.querySelector(
            `.card-image[data-post-id="${post.id}"]`
        );


    if (!image) {

        return;

    }


    const src =
        images[index];


    image.src =
        src.startsWith(
            "http"
        )
            ? src
            : "/" + src;

}


/* =========================================================
   IMAGE VIEWER
========================================================= */

let viewerImages =
    [];

let viewerIndex =
    0;


function openImageViewer(
    images,
    index
) {

    viewerImages =
        Array.isArray(
            images
        )
            ? images
            : [];


    viewerIndex =
        Number(index) || 0;


    if (!viewerImages.length) {

        return;

    }


    let viewer =
        document.getElementById(
            "viewer"
        );


    if (!viewer) {

        viewer =
            document.createElement(
                "div"
            );

        viewer.id =
            "viewer";

        viewer.style.cssText = `
            position:fixed;
            inset:0;
            z-index:99999;
            background:rgba(0,0,0,.92);
            display:flex;
            align-items:center;
            justify-content:center;
        `;


        viewer.innerHTML = `

            <button
                id="viewerClose"
                type="button"
                style="
                    position:absolute;
                    top:20px;
                    right:20px;
                    width:44px;
                    height:44px;
                    border:0;
                    border-radius:50%;
                    background:white;
                    font-size:26px;
                    z-index:5;
                "
            >
                ×
            </button>


            <button
                id="viewerPrev"
                type="button"
                style="
                    position:absolute;
                    left:15px;
                    top:50%;
                    transform:translateY(-50%);
                    width:48px;
                    height:48px;
                    border:0;
                    border-radius:50%;
                    background:white;
                    font-size:30px;
                    z-index:5;
                "
            >
                ‹
            </button>


            <img
                id="viewerImage"
                style="
                    max-width:94%;
                    max-height:88%;
                    object-fit:contain;
                    border-radius:8px;
                "
            >


            <button
                id="viewerNext"
                type="button"
                style="
                    position:absolute;
                    right:15px;
                    top:50%;
                    transform:translateY(-50%);
                    width:48px;
                    height:48px;
                    border:0;
                    border-radius:50%;
                    background:white;
                    font-size:30px;
                    z-index:5;
                "
            >
                ›
            </button>

        `;


        document.body.appendChild(
            viewer
        );


        document
            .getElementById(
                "viewerClose"
            )
            .onclick =
                closeImageViewer;


        document
            .getElementById(
                "viewerPrev"
            )
            .onclick =
                () =>
                    changeViewerImage(
                        -1
                    );


        document
            .getElementById(
                "viewerNext"
            )
            .onclick =
                () =>
                    changeViewerImage(
                        1
                    );

    }


    viewer.style.display =
        "flex";


    updateViewerImage();

}


function updateViewerImage() {

    const image =
        document.getElementById(
            "viewerImage"
        );


    if (
        !image ||
        !viewerImages.length
    ) {

        return;

    }


    const src =
        viewerImages[
            viewerIndex
        ];


    image.src =
        src.startsWith(
            "http"
        )
            ? src
            : "/" + src;

}


function changeViewerImage(
    direction
) {

    if (
        !viewerImages.length
    ) {

        return;

    }


    viewerIndex +=
        direction;


    if (
        viewerIndex < 0
    ) {

        viewerIndex =
            viewerImages.length - 1;

    }


    if (
        viewerIndex >=
        viewerImages.length
    ) {

        viewerIndex =
            0;

    }


    updateViewerImage();

}


function closeImageViewer() {

    const viewer =
        document.getElementById(
            "viewer"
        );


    if (viewer) {

        viewer.style.display =
            "none";

    }

}


/* =========================================================
   MAP VIEW
========================================================= */

function showCatalog() {

    currentView =
        "catalog";


    const map =
        document.getElementById(
            "map"
        );


    const posts =
        document.getElementById(
            "posts"
        );


    if (map) {

        map.style.display =
            "none";

    }


    if (posts) {

        posts.style.display =
            "grid";

    }


    const catalogButton =
        document.getElementById(
            "catalogViewBtn"
        );


    const mapButton =
        document.getElementById(
            "mapViewBtn"
        );


    if (catalogButton) {

        catalogButton.classList.add(
            "active"
        );

    }


    if (mapButton) {

        mapButton.classList.remove(
            "active"
        );

    }

}


function showMap() {

    currentView =
        "map";


    const map =
        document.getElementById(
            "map"
        );


    const posts =
        document.getElementById(
            "posts"
        );


    if (posts) {

        posts.style.display =
            "none";

    }


    if (map) {

        map.style.display =
            "block";

    }


    const catalogButton =
        document.getElementById(
            "catalogViewBtn"
        );


    const mapButton =
        document.getElementById(
            "mapViewBtn"
        );


    if (catalogButton) {

        catalogButton.classList.remove(
            "active"
        );

    }


    if (mapButton) {

        mapButton.classList.add(
            "active"
        );

    }


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
   MAP INITIALIZATION
========================================================= */

function initMap() {

    if (
        typeof L ===
        "undefined"
    ) {

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


        mapLayerNormal.addTo(
            mapInstance
        );


        mapLayer =
            L.layerGroup()
                .addTo(
                    mapInstance
                );


        L.control.layers(
            {

                "🗺️ Карта":
                    mapLayerNormal,

                "🛰️ Спутник":
                    mapLayerSatellite

            },
            null,
            {

                position:
                    "topright",

                collapsed:
                    false

            }
        ).addTo(
            mapInstance
        );

    }


    mapInstance.invalidateSize();

}


/* =========================================================
   ADDRESS TEXT
========================================================= */

function getPostAddress(
    post
) {

    const parts = [

        post.street,

        post.address,

        post.locationName,

        post.building,

        post.houseNumber

    ];


    return parts
        .filter(
            value =>
                value !==
                undefined &&
                value !==
                null &&
                String(
                    value
                ).trim()
        )
        .map(
            value =>
                String(
                    value
                ).trim()
        )
        .join(
            ", "
        );

}


/* =========================================================
   GEOCODING CACHE
========================================================= */

const geocodeCache =
    new Map();


/* =========================================================
   GEOCODING
========================================================= */

async function geocodeAddress(
    address
) {

    const cleanAddress =
        String(
            address ||
            ""
        )
            .trim();


    if (!cleanAddress) {

        return null;

    }


    const cacheKey =
        cleanAddress
            .toLowerCase();


    if (
        geocodeCache.has(
            cacheKey
        )
    ) {

        return geocodeCache.get(
            cacheKey
        );

    }


    try {

        const response =
            await fetch(
                "https://nominatim.openstreetmap.org/search?" +
                new URLSearchParams({

                    q:
                        cleanAddress +
                        ", Tbilisi, Georgia",

                    format:
                        "json",

                    limit:
                        "1",

                    addressdetails:
                        "1"

                }),
                {
                    headers: {

                        Accept:
                            "application/json"

                    }
                }
            );


        if (!response.ok) {

            return null;

        }


        const results =
            await response.json();


        if (
            !Array.isArray(
                results
            ) ||
            !results.length
        ) {

            geocodeCache.set(
                cacheKey,
                null
            );

            return null;

        }


        const lat =
            Number(
                results[0].lat
            );


        const lng =
            Number(
                results[0].lon
            );


        if (
            !Number.isFinite(
                lat
            ) ||
            !Number.isFinite(
                lng
            )
        ) {

            return null;

        }


        const coordinates =
            [
                lat,
                lng
            ];


        geocodeCache.set(
            cacheKey,
            coordinates
        );


        return coordinates;

    }

    catch (error) {

        console.error(
            "Geocoding error:",
            error
        );

        return null;

    }

}


/* =========================================================
   POST COORDINATES
========================================================= */

async function getPostCoordinates(
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
        Number.isFinite(
            lat
        ) &&
        Number.isFinite(
            lng
        ) &&
        lat >= 41.60 &&
        lat <= 41.84 &&
        lng >= 44.62 &&
        lng <= 44.98;


    if (valid) {

        return [
            lat,
            lng
        ];

    }


    const address =
        getPostAddress(
            post
        );


    if (!address) {

        return null;

    }


    return await geocodeAddress(
        address
    );

}


/* =========================================================
   MAP MARKER
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

async function renderMap(
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
        !Array.isArray(
            posts
        ) ||
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
       თითოეული განცხადება
       ცალკე მუშავდება.
    */

    for (
        const post of posts
    ) {

        try {

            const coordinates =
                await getPostCoordinates(
                    post
                );


            /*
               თუ ზუსტი კოორდინატი
               ვერ მოიძებნა —
               არ ვსვამთ ბინას
               შემთხვევით ადგილას.
            */

            if (
                !Array.isArray(
                    coordinates
                ) ||
                coordinates.length !==
                    2
            ) {

                console.warn(
                    "⚠️ COORDINATES NOT FOUND:",
                    post.id,
                    getPostAddress(
                        post
                    )
                );

                continue;

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

                continue;

            }


            /*
               თბილისის ფარგლებში
               უნდა იყოს.
            */

            if (
                lat < 41.60 ||
                lat > 41.84 ||
                lng < 44.62 ||
                lng > 44.98
            ) {

                console.warn(
                    "⚠️ OUTSIDE TBILISI:",
                    post.id,
                    lat,
                    lng
                );

                continue;

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
               =================================================
               PHOTOS
               =================================================
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
                            scroll-snap-type:x mandatory;
                            -webkit-overflow-scrolling:touch;
                        "
                    >

                        ${images.map(
                            (
                                img,
                                index
                            ) => `

                            <img
                                src="${
                                    String(
                                        img
                                    ).startsWith(
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
                                    scroll-snap-align:start;
                                "
                            >

                        `
                        ).join("")}

                    </div>

                `;

            }


            /*
               =================================================
               POPUP
               =================================================
            */

            marker.bindPopup(`

                <div
                    class="map-popup"
                    style="
                        width:240px;
                        max-width:240px;
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
                                flex-shrink:0;
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
                        ${post.street || post.address || "-"}

                        <br>

                        🛏
                        <b>Комнат:</b>
                        ${post.rooms || "-"}

                        <br>

                        📐
                        <b>Площадь:</b>
                        ${post.area || "-"} м²

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

        catch (error) {

            console.error(
                "❌ MAP POST ERROR:",
                post.id,
                error
            );

        }

    }


    /*
       =================================================
       MAP POSITION
       =================================================
    */

    if (
        bounds.length ===
        1
    ) {

        mapInstance.setView(
            bounds[0],
            15
        );

    }

    else if (
        bounds.length >
        1
    ) {

        mapInstance.fitBounds(
            L.latLngBounds(
                bounds
            ),
            {

                padding:
                    [50, 50],

                maxZoom:
                    14

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
   MAP GALLERY
========================================================= */

function openMapGallery(
    images,
    startIndex = 0
) {

    if (
        !Array.isArray(
            images
        ) ||
        !images.length
    ) {

        return;

    }


    let currentIndex =
        Number(
            startIndex
        ) || 0;


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
        color:black;
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
        color:black;
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
        color:black;
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

        const src =
            images[
                currentIndex
            ];


        image.src =
            String(
                src
            ).startsWith(
                "http"
            )
                ? src
                : "/" + src;


        counter.textContent =
            `${currentIndex + 1} / ${images.length}`;

    }


    close.onclick =
        () => {

            viewer.remove();

        };


    prev.onclick =
        event => {

            event.preventDefault();

            event.stopPropagation();


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
        event => {

            event.preventDefault();

            event.stopPropagation();


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
   MAP CONTROLS
========================================================= */

function addMapControls() {

    const map =
        document.getElementById(
            "map"
        );


    if (!map) {

        return;

    }


    const oldControls =
        document.getElementById(
            "mapControls"
        );


    if (oldControls) {

        oldControls.remove();

    }


    const controls =
        document.createElement(
            "div"
        );


    controls.id =
        "mapControls";


    controls.style.cssText = `
        position:absolute;
        left:12px;
        bottom:12px;
        z-index:1000;
        display:flex;
        gap:8px;
    `;


    const catalogButton =
        document.createElement(
            "button"
        );


    catalogButton.type =
        "button";


    catalogButton.textContent =
        "🏠 Каталог";


    catalogButton.style.cssText = `
        border:0;
        border-radius:12px;
        padding:11px 15px;
        background:#ff7a00;
        color:white;
        font-size:14px;
        font-weight:700;
        box-shadow:
            0 3px 12px
            rgba(0,0,0,.25);
        cursor:pointer;
    `;


    catalogButton.onclick =
        event => {

            event.preventDefault();

            event.stopPropagation();

            showCatalog();

        };


    const filterButton =
        document.createElement(
            "button"
        );


    filterButton.type =
        "button";


    filterButton.textContent =
        "⚱ Фильтры";


    filterButton.style.cssText = `
        border:0;
        border-radius:12px;
        padding:11px 15px;
        background:#22a447;
        color:white;
        font-size:14px;
        font-weight:700;
        box-shadow:
            0 3px 12px
            rgba(0,0,0,.25);
        cursor:pointer;
    `;


    filterButton.onclick =
        event => {

            event.preventDefault();

            event.stopPropagation();


            const filters =
                document.querySelector(
                    ".search-panel"
                );


            if (!filters) {

                return;

            }


            const current =
                getComputedStyle(
                    filters
                ).display;


            filters.style.display =
                current === "none"
                    ? "flex"
                    : "none";

        };


    controls.appendChild(
        catalogButton
    );


    controls.appendChild(
        filterButton
    );


    map.appendChild(
        controls
    );

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
            )
            .catch(
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
                async () => {

                    initMap();

                    await renderMap(
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

                    await renderMap(
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
   DOM START
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


        loadPosts();

    }
);


/* =========================================================
   KEYBOARD / VIEWER
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        const viewer =
            document.getElementById(
                "viewer"
            );


        if (
            viewer &&
            viewer.style.display !==
                "none"
        ) {

            if (
                event.key ===
                "Escape"
            ) {

                closeImageViewer();

            }


            if (
                event.key ===
                "ArrowLeft"
            ) {

                changeViewerImage(
                    -1
                );

            }


            if (
                event.key ===
                "ArrowRight"
            ) {

                changeViewerImage(
                    1
                );

            }

        }

    }
);


/* =========================================================
   MOBILE MAP RESIZE
========================================================= */

window.addEventListener(
    "resize",
    () => {

        if (
            mapInstance
        ) {

            setTimeout(
                () => {

                    mapInstance.invalidateSize();

                },
                150
            );

        }

    }
);


/* =========================================================
   TELEGRAM VIEWPORT
========================================================= */

if (
    telegramWebApp
) {

    try {

        telegramWebApp.onEvent(
            "viewportChanged",
            () => {

                if (
                    mapInstance
                ) {

                    setTimeout(
                        () => {

                            mapInstance.invalidateSize();

                        },
                        150
                    );

                }

            }
        );

    }

    catch (error) {

        console.log(
            "Telegram viewport event error:",
            error
        );

    }

}


/* =========================================================
   BACK BUTTON
========================================================= */

if (
    telegramWebApp &&
    telegramWebApp.BackButton
) {

    try {

        telegramWebApp.BackButton.hide();

    }

    catch (error) {

        console.log(
            "BackButton error:",
            error
        );

    }

}


/* =========================================================
   TELEGRAM MAIN BUTTON
========================================================= */

if (
    telegramWebApp &&
    telegramWebApp.MainButton
) {

    try {

        telegramWebApp.MainButton.hide();

    }

    catch (error) {

        console.log(
            "MainButton error:",
            error
        );

    }

}


/* =========================================================
   PREVENT DOUBLE TAP
========================================================= */

let lastTouchTime =
    0;


document.addEventListener(
    "touchend",
    event => {

        const now =
            Date.now();


        if (
            now -
            lastTouchTime <
            300
        ) {

            event.preventDefault();

        }


        lastTouchTime =
            now;

    },
    {
        passive:false
    }
);


/* =========================================================
   MAP OPEN EVENT
========================================================= */

window.openMap =
    function () {

        showMap();

    };


/* =========================================================
   CATALOG OPEN EVENT
========================================================= */

window.openCatalog =
    function () {

        showCatalog();

    };


/* =========================================================
   FAVORITE GLOBAL EVENT
========================================================= */

window.toggleFavorite =
    toggleFavorite;


/* =========================================================
   IMAGE VIEWER GLOBAL EVENTS
========================================================= */

window.openImageViewer =
    openImageViewer;


window.closeImageViewer =
    closeImageViewer;


window.changeViewerImage =
    changeViewerImage;


/* =========================================================
   MAP GALLERY GLOBAL EVENT
========================================================= */

window.openMapGallery =
    openMapGallery;


/* =========================================================
   MAP REFRESH
========================================================= */

window.refreshMap =
    async function () {

        if (
            currentView !==
            "map"
        ) {

            return;

        }


        initMap();


        await renderMap(
            getFilteredPosts()
        );

    };


/* =========================================================
   FORCE MAP INVALIDATE
========================================================= */

window.invalidateMap =
    function () {

        if (
            mapInstance
        ) {

            setTimeout(
                () => {

                    mapInstance.invalidateSize();

                },
                100
            );

        }

    };


/* =========================================================
   DEBUG
========================================================= */

window.orangeDebug =
    {

        getPosts:
            () =>
                allPosts,

        getFavorites:
            () =>
                favoritePostIds,

        getMap:
            () =>
                mapInstance,

        getCurrentView:
            () =>
                currentView,

        getCoordinates:
            post =>
                getPostCoordinates(
                    post
                ),

        getAddress:
            post =>
                getPostAddress(
                    post
                )

    };


console.log(
    "🍊 Orange Platform JS loaded successfully"
);
/* =========================================================
   RENDER MAP — CONTINUATION
========================================================= */

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




/* =========================================================
   CATALOG / MAP BUTTONS
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


        loadPosts();

    }
);