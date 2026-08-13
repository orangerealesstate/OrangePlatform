console.log("🍊 ORANGE APP.JS + MAP + CATALOG + GALLERY LOADED");


/* =========================================================
   TELEGRAM
========================================================= */

const telegramWebApp =
    window.Telegram?.WebApp;


if (telegramWebApp) {

    telegramWebApp.ready();

    telegramWebApp.expand();

}


const telegramUserId =
    telegramWebApp?.initDataUnsafe?.user?.id || null;


console.log(
    "Telegram user:",
    telegramUserId
);


/* =========================================================
   GLOBAL STATE
========================================================= */

let allPosts = [];

let currentView = "catalog";

let mapInstance = null;

let mapLayer = null;

const currentCardImage = {};


/* =========================================================
   DISTRICT CENTERS
========================================================= */

const districtCenters = {

    saburtalo: [41.7260, 44.7470],

    vake: [41.7100, 44.7530],

    vera: [41.7085, 44.7830],

    mtatsminda: [41.7000, 44.7900],

    sololaki: [41.6955, 44.8010],

    chugureti: [41.7150, 44.8050],

    didube: [41.7250, 44.7800],

    nadzaladevi: [41.7350, 44.7950],

    gldani: [41.7950, 44.8200],

    "didi digomi": [41.7850, 44.7300],

    digomi: [41.7750, 44.7350],

    temka: [41.8000, 44.7900],

    isani: [41.6905, 44.8280],

    samgori: [41.6850, 44.8700],

    varketili: [41.6900, 44.8800],

    vazisubani: [41.6950, 44.8750],

    krtsanisi: [41.6785, 44.8240],

    ortachala: [41.6805, 44.8150],

    ponichala: [41.6500, 44.8400],

    avlabari: [41.6950, 44.8200],

    navtlughi: [41.6850, 44.8500],

    "tbilisi sea": [41.7600, 44.9000]

};


/* =========================================================
   LOAD POSTS
========================================================= */

async function loadPosts() {

    try {

        /* APP STATISTICS */

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
                err =>
                    console.log(
                        "Stats error:",
                        err
                    )
            );

        }


        /* LOAD */

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
            "Posts:",
            allPosts.length
        );


        renderPosts(
            getFilteredPosts()
        );


        hideLoader();


        /* IF MAP IS ACTIVE */

        if (
            currentView === "map"
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


    if (!loader) return;


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
   GET FILTERED POSTS
========================================================= */

function normalizeDistrict(value) {

    const text = String(value || "")
        .toLowerCase()
        .trim();

    const aliases = {

        "saburtalo": [
            "saburtalo",
            "сабуртало",
            "საბურთალო"
        ],

        "vake": [
            "vake",
            "ваки",
            "ვაკე"
        ],

        "vera": [
            "vera",
            "вера",
            "ვერა"
        ],

        "mtatsminda": [
            "mtatsminda",
            "мтацминда",
            "მთაწმინდა"
        ],

        "sololaki": [
            "sololaki",
            "сололаки",
            "სოლოლაკი"
        ],

        "chugureti": [
            "chugureti",
            "чугурети",
            "ჩუღურეთი"
        ],

        "didube": [
            "didube",
            "дидубе",
            "დიდუბე"
        ],

        "nadzaladevi": [
            "nadzaladevi",
            "надзаладеви",
            "ნაძალადევი"
        ],

        "gldani": [
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

        "digomi": [
            "digomi",
            "дидигоми",
            "дიღომი",
            "დიღომი"
        ],

        "temka": [
            "temka",
            "темка",
            "თემქა"
        ],

        "isani": [
            "isani",
            "исани",
            "ისანი"
        ],

        "samgori": [
            "samgori",
            "самгори",
            "სამგორი"
        ],

        "varketili": [
            "varketili",
            "варкетили",
            "ვარკეთილი"
        ],

        "vazisubani": [
            "vazisubani",
            "вазисубани",
            "ვაზისუბანი"
        ],

        "krtsanisi": [
            "krtsanisi",
            "крцаниси",
            "კრწანისი"
        ],

        "ortachala": [
            "ortachala",
            "орточала",
            "ორთაჭალა"
        ],

        "ponichala": [
            "ponichala",
            "поничала",
            "ფონიჭალა"
        ],

        "avlabari": [
            "avlabari",
            "авлабари",
            "ავლაბარი"
        ],

        "navtlughi": [
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


    for (const [district, names] of Object.entries(aliases)) {

        if (names.some(name => text.includes(name))) {

            return district;

        }

    }


    return text;
}



function getFilteredPosts() {

    const districtEl =
        document.getElementById("districtFilter");

    const roomsEl =
        document.getElementById("roomsFilter");

    const minPriceEl =
        document.getElementById("minPrice");

    const maxPriceEl =
        document.getElementById("maxPrice");


    const selectedDistrict =
        normalizeDistrict(
            districtEl?.value || ""
        );


    const selectedRooms =
        roomsEl?.value || "";


    const minPrice =
        Number(minPriceEl?.value) || 0;


    const maxPrice =
        Number(maxPriceEl?.value) || 999999999;


    return allPosts.filter(post => {

        /* =========================
           DISTRICT
        ========================= */

        if (selectedDistrict) {

            const postDistrict =
                normalizeDistrict(
                    post.district
                );


            const postText =
                normalizeDistrict(
                    post.text
                );


            if (
                postDistrict !== selectedDistrict &&
                postText !== selectedDistrict
            ) {

                return false;

            }

        }


        /* =========================
           ROOMS
        ========================= */

        if (selectedRooms) {

            const postRooms =
                Number(post.rooms) || 0;


            if (
                selectedRooms === "5"
            ) {

                if (postRooms < 5) {

                    return false;

                }

            } else {

                if (
                    postRooms !==
                    Number(selectedRooms)
                ) {

                    return false;

                }

            }

        }


        /* =========================
           PRICE
        ========================= */

        const postPrice =
            Number(post.price) || 0;


        if (
            postPrice < minPrice
        ) {

            return false;

        }


        if (
            postPrice > maxPrice
        ) {

            return false;

        }


        return true;

    });

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
        currentView === "map"
    ) {

        initMap();

        renderMap(
            filtered
        );

    }


    hideLoader();

}


/* =========================================================
   RENDER CATALOG
========================================================= */

function renderPosts(posts) {

    const container =
        document.getElementById(
            "posts"
        );


    if (!container) {

        return;

    }


    container.innerHTML = "";


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

            /*
               IMPORTANT:
               ვპოულობთ ბინის რეალურ ინდექსს
               allPosts-ში ID-ით.
            */

            const postIndex =
                allPosts.findIndex(
                    item =>
                        String(item.id) ===
                        String(post.id)
                );


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

                imageIndex = 0;

                currentCardImage[
                    post.id
                ] = 0;

            }


            const image =
                images[
                    imageIndex
                ];


            const imageSrc =
                image.startsWith("http")
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
                        class="prev-btn"
                    >
                        ◀
                    </button>


                    <img
                        id="card-image-${post.id}"
                        src="${imageSrc}"
                        class="card-image"
                        alt=""
                    >


                    <button
                        type="button"
                        class="next-btn"
                    >
                        ▶
                    </button>


                    <div
                        class="card-photo-counter"
                        id="card-counter-${post.id}"
                        style="
                            position:absolute;
                            right:10px;
                            bottom:10px;
                            background:rgba(0,0,0,.65);
                            color:white;
                            padding:4px 8px;
                            border-radius:12px;
                            font-size:12px;
                            z-index:5;
                        "
                    >
                        ${imageIndex + 1}
                        /
                        ${images.length}
                    </div>


                </div>


                <div class="info">


                    <div class="price">
                        $${post.price || "-"}
                    </div>


                    <div class="details">

                        📍 <b>Район:</b>
                        ${district}

                        <br><br>

                        📌 <b>Адрес:</b>
                        ${post.street || "-"}

                        <br><br>

                        🛏 <b>Комнат:</b>
                        ${post.rooms || "-"}

                        <br><br>

                        📐 <b>Площадь:</b>
                        ${post.area || "-"} м²

                    </div>


                    <button
                        type="button"
                        class="details-btn"
                    >
                        Подробнее
                    </button>


                </div>

            `;


            container.appendChild(
                card
            );


            /* PREVIOUS */

            const prevBtn =
                card.querySelector(
                    ".prev-btn"
                );


            prevBtn.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    event.stopPropagation();


                    prevCardImage(
                        post.id
                    );

                }
            );


            /* NEXT */

            const nextBtn =
                card.querySelector(
                    ".next-btn"
                );


            nextBtn.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    event.stopPropagation();


                    nextCardImage(
                        post.id
                    );

                }
            );


            /* PHOTO */

            const imageElement =
                card.querySelector(
                    ".card-image"
                );


            imageElement.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    event.stopPropagation();


                    openGallery(
                        post.id
                    );

                }
            );


            /* DETAILS */

            const detailsBtn =
                card.querySelector(
                    ".details-btn"
                );


            detailsBtn.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    event.stopPropagation();


                    window.location.href =
                        `details.html?id=${post.id}`;

                }
            );

        }
    );

}


/* =========================================================
   NEXT CARD PHOTO
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
        !Array.isArray(
            post.images
        ) ||
        post.images.length < 2
    ) {

        return;

    }


    currentCardImage[
        postId
    ] =

        (
            (
                currentCardImage[
                    postId
                ] || 0
            ) + 1
        )
        %
        post.images.length;


    updateCardImage(
        post
    );

}


/* =========================================================
   PREVIOUS CARD PHOTO
========================================================= */

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
        !Array.isArray(
            post.images
        ) ||
        post.images.length < 2
    ) {

        return;

    }


    currentCardImage[
        postId
    ] =

        (
            (
                currentCardImage[
                    postId
                ] || 0
            ) -
            1 +
            post.images.length
        )
        %
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
            image.startsWith("http")
                ? image
                : "/" + image;

    }


    if (counter) {

        counter.textContent =

            `${imageIndex + 1} / ${post.images.length}`;

    }

}


/* =========================================================
   OPEN GALLERY
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
        !Array.isArray(
            post.images
        ) ||
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
        background:rgba(0,0,0,.92);
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
                top:25px;
                right:25px;
                z-index:10;
                width:45px;
                height:45px;
                border:0;
                border-radius:50%;
                font-size:25px;
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
                height:50px;
                border:0;
                border-radius:50%;
                font-size:24px;
            "
        >
            ◀
        </button>


        <img
            id="galleryImage"
            src="${
                post.images[
                    current
                ].startsWith("http")
                    ? post.images[
                        current
                    ]
                    : "/" +
                        post.images[
                            current
                        ]
            }"
            style="
                max-width:90%;
                max-height:85%;
                object-fit:contain;
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
                height:50px;
                border:0;
                border-radius:50%;
                font-size:24px;
            "
        >
            ▶
        </button>


        <div
            id="counter"
            style="
                position:absolute;
                bottom:25px;
                left:50%;
                transform:translateX(-50%);
                color:white;
                font-size:18px;
            "
        >
            ${current + 1}
            /
            ${post.images.length}
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
            "#counter"
        );


    /* NEXT */

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


            image.src =
                post.images[
                    current
                ].startsWith("http")

                    ? post.images[
                        current
                    ]

                    : "/" +
                        post.images[
                            current
                        ];


            counter.textContent =

                `${current + 1} / ${post.images.length}`;

        };


    /* PREVIOUS */

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


            image.src =
                post.images[
                    current
                ].startsWith("http")

                    ? post.images[
                        current
                    ]

                    : "/" +
                        post.images[
                            current
                        ];


            counter.textContent =

                `${current + 1} / ${post.images.length}`;

        };


    /* CLOSE */

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

}


/* =========================================================
   CATALOG VIEW
========================================================= */

function showCatalog() {

    currentView =
        "catalog";


    const posts =
        document.getElementById(
            "posts"
        );


    const map =
        document.getElementById(
            "map"
        );


    if (posts) {

        posts.style.display =
            "";

    }


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


    const posts =
        document.getElementById(
            "posts"
        );


    const map =
        document.getElementById(
            "map"
        );


    if (posts) {

        posts.style.display =
            "none";

    }


    if (map) {

        map.style.display =
            "block";

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
   INIT MAP
========================================================= */

function initMap() {

    if (!window.L) {

        console.error(
            "Leaflet is not loaded"
        );

        return;

    }


    const mapElement =
        document.getElementById(
            "map"
        );


    if (!mapElement) {

        console.error(
            "Map element #map not found"
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
                [41.7151, 44.8271],
                12
            );


        L.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {

                maxZoom: 19,

                attribution:
                    "&copy; OpenStreetMap contributors"

            }
        ).addTo(
            mapInstance
        );


        mapLayer =
            L.layerGroup()
                .addTo(
                    mapInstance
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


    if (valid) {

        return [
            lat,
            lng
        ];

    }


    const district =
        (
            post.district ||
            ""
        ).toLowerCase();


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


    const text =
        (
            post.text ||
            ""
        ).toLowerCase();


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


    return [
        41.7151,
        44.8271
    ];

}


/* =========================================================
   PRICE MARKER
========================================================= */

function createPriceMarker(
    lat,
    lng,
    text,
    className =
        "price-marker"
) {

    const isCluster =
        className ===
        "cluster-marker";


    return L.marker(
        [
            lat,
            lng
        ],
        {

            icon:

                L.divIcon({

                    className:
                        "orange-map-icon",

                    html: `

                        <div
                            class="${className}"
                        >
                            ${text}
                        </div>

                    `,

                    iconSize:
                        isCluster
                            ? [90, 50]
                            : [100, 40],

                    iconAnchor:
                        isCluster
                            ? [45, 25]
                            : [50, 20]

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


    if (!posts.length) {

        mapInstance.setView(
            tbilisiCenter,
            12
        );

        return;

    }


    const groups =
        new Map();


    posts.forEach(
        post => {

            const [
                lat,
                lng
            ] =
                getPostCoordinates(
                    post
                );


            const addressKey = String(
    post.street ||
    post.address ||
    post.text?.match(/Адрес:\s*(.+)/i)?.[1] ||
    post.id
)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const key = addressKey;


            if (
                !groups.has(
                    key
                )
            ) {

                groups.set(
                    key,
                    {

                        lat,
                        lng,

                        posts: []

                    }
                );

            }


            groups
                .get(key)
                .posts
                .push(
                    post
                );

        }
    );


    const bounds = [];


    groups.forEach(
        group => {

            const groupPosts =
                group.posts;


            bounds.push(
                [
                    group.lat,
                    group.lng
                ]
            );


            /* =================================================
               ONE APARTMENT
            ================================================= */

            if (
                groupPosts.length ===
                1
            ) {

                const post =
                    groupPosts[0];


                const price =
                    Number(
                        post.price
                    ) || 0;


                const marker =
                    createPriceMarker(

                        group.lat,

                        group.lng,

                        price
                            ? `$${price}`
                            : "Цена"

                    );
marker.on("click", () => {
    console.log("SINGLE MARKER CLICKED");
    console.log("MAP POST:", post);
});

                marker.bindPopup(`

                    <div
                        class="map-popup"
                        style="
                            min-width:180px;
                        "
                    >

                        <div
                            style="
                                font-size:20px;
                                font-weight:bold;
                                margin-bottom:6px;
                            "
                        >
                            ${
                                price
                                    ? `$${price}`
                                    : "Цена"
                            }
                        </div>


                        <div>

                            📍
                            ${post.district || "-"}

                            <br>

                            🛏
                            ${post.rooms || "-"}
                            комн.

                            <br>

                            📐
                            ${post.area || "-"}
                            м²

                        </div>


                        <button
                            type="button"
                            style="
                                margin-top:10px;
                                width:100%;
                                border:0;
                                border-radius:8px;
                                padding:9px;
                                background:#1f63e9;
                                color:white;
                                font-weight:bold;
                            "
                            onclick="
                                location.href='details.html?id=${post.id}'
                            "
                        >
                            Подробнее
                        </button>

                    </div>

                `);


                marker.addTo(
                    mapLayer
                );


                return;

            }


            /* =================================================
               CLUSTER
            ================================================= */

            const prices =
                groupPosts
                    .map(
                        post =>
                            Number(
                                post.price
                            )
                    )
                    .filter(
                        price =>
                            Number.isFinite(
                                price
                            ) &&
                            price > 0
                    );


            const minPrice =
                prices.length
                    ? Math.min(
                        ...prices
                    )
                    : 0;


            const markerText =

                minPrice

                    ? `

                        От ${minPrice}

                        <span
                            style="
                                font-size:11px;
                            "
                        >
                            (${groupPosts.length})
                        </span>

                    `

                    : `${groupPosts.length}`;


            const marker =
                createPriceMarker(

                    group.lat,

                    group.lng,

                    markerText,

                    "cluster-marker"

                );


            marker.on(
                "click",
                () => {
                    console.log("MARKER CLICKED");
console.log("MAP POST:", groupPosts[0]);
                    const list =

                        groupPosts
                            .slice(
                                0,
                                30
                            )
                            .map(
                                post => `
                                ${post.images?.[0] ? `
    <img
        src="${post.images[0]}"
        style="
            width:100%;
            height:120px;
            object-fit:cover;
            border-radius:8px;
            margin-bottom:8px;
        "
    >
` : ""}

                                    <div
                                        style="
                                            padding:8px 0;
                                            border-bottom:1px solid #eee;
                                        "
                                    >

                                        <b>
                                            $${post.price || "-"}
                                        </b>

                                        ·

                                        ${post.rooms || "-"}
                                        комн.


                                        <br>

${post.images?.[0] ? `
<img
    src="${post.images[0]}"
    style="
        width:100%;
        height:150px;
        object-fit:cover;
        border-radius:10px;
        margin-bottom:8px;
    "
>
` : ""}
                                        <button
                                            type="button"
                                            style="
                                                margin-top:5px;
                                                width:100%;
                                                border:0;
                                                border-radius:7px;
                                                padding:7px;
                                                background:#1f63e9;
                                                color:#fff;
                                            "
                                            onclick="
                                                location.href='details.html?id=${post.id}'
                                            "
                                        >
                                            Подробнее
                                        </button>

                                    </div>

                                `
                            )
                            .join("");


                    marker
                        .bindPopup(`

                            <div
                                class="map-popup"
                                style="
                                    max-height:300px;
                                    overflow:auto;
                                "
                            >

                                <div
                                    style="
                                        font-size:18px;
                                        font-weight:bold;
                                        margin-bottom:8px;
                                    "
                                >
                                    От
                                    $${minPrice || "-"}
                                    (${groupPosts.length})
                                </div>

                                ${list}

                            </div>

                        `)
                        .openPopup();

                }
            );


            marker.addTo(
                mapLayer
            );

        }
    );


    /* =====================================================
       MAP ZOOM
    ===================================================== */

    const tbilisiBounds =
        bounds.filter(
            ([lat, lng]) =>

                lat >= 41.60 &&
                lat <= 41.84 &&

                lng >= 44.62 &&
                lng <= 44.98

        );


    if (
        tbilisiBounds.length ===
        1
    ) {

        mapInstance.setView(
            tbilisiBounds[0],
            14
        );

    }

    else if (
        tbilisiBounds.length >
        1
    ) {

        mapInstance.fitBounds(

            L.latLngBounds(
                tbilisiBounds
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

    const catalogBtn =
        document.getElementById(
            "catalogViewBtn"
        );


    const mapBtn =
        document.getElementById(
            "mapViewBtn"
        );


    if (catalogBtn) {

        catalogBtn.onclick =
            event => {

                event.preventDefault();

                event.stopPropagation();

                showCatalog();

            };

    }


    if (mapBtn) {

        mapBtn.onclick =
            event => {

                event.preventDefault();

                event.stopPropagation();

                showMap();

            };

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
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        setupViewButtons();

        loadPosts();

    }
);