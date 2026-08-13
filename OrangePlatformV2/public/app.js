console.log("🔥 ORANGE APP.JS LOADED - TEST");

let allPosts = [];

const telegramWebApp = window.Telegram?.WebApp;

if (telegramWebApp) {
    telegramWebApp.ready();
    telegramWebApp.expand();
}

const telegramUserId =
    telegramWebApp?.initDataUnsafe?.user?.id || null;

console.log("🔥 TELEGRAM USER ID:", telegramUserId);
console.log("🔥 TG INIT DATA:", telegramWebApp?.initData);
console.log("🔥 TG PLATFORM:", telegramWebApp?.platform);


/* =========================================================
   MAP
========================================================= */

let mapInstance = null;
let mapLayer = null;
let currentView = "catalog";


/* =========================================================
   DISTRICT CENTERS
========================================================= */

const districtCenters = {

    saburtalo: [41.7260, 44.7470],

    vake: [41.7100, 44.7530],

    vera: [41.7085, 44.7830],

    isani: [41.6905, 44.8280],

    "didi digomi": [41.7850, 44.7300],

    digomi: [41.7850, 44.7300],

    krtsanisi: [41.6785, 44.8240],

    ortachala: [41.6805, 44.8150]

};


/* =========================================================
   MAP MARKER DESIGN
========================================================= */

(function injectMapStyles() {

    const style = document.createElement("style");

    style.textContent = `

        .orange-map-icon {
            background: transparent !important;
            border: 0 !important;
        }

        .price-marker {

            background: #1f63e9 !important;

            color: #fff !important;

            border: 2px solid #fff !important;

            border-radius: 18px !important;

            box-shadow:
                0 2px 7px rgba(0,0,0,.25) !important;

            padding: 6px 10px !important;

            font-weight: 800 !important;

            font-size: 13px !important;

            line-height: 1.05 !important;

            white-space: nowrap !important;

            text-align: center !important;

        }


        .cluster-marker {

            background: #1f63e9 !important;

            color: #fff !important;

            border: 3px solid #fff !important;

            border-radius: 22px !important;

            box-shadow:
                0 2px 8px rgba(0,0,0,.25) !important;

            width: 70px !important;

            min-height: 44px !important;

            padding: 5px 8px !important;

            box-sizing: border-box !important;

            display: flex !important;

            align-items: center !important;

            justify-content: center !important;

            text-align: center !important;

            font-weight: 800 !important;

            font-size: 12px !important;

            line-height: 1.05 !important;

        }

    `;

    document.head.appendChild(style);

})();


/* =========================================================
   SHOW CATALOG
========================================================= */

function showCatalog() {

    currentView = "catalog";


    const posts =
        document.getElementById("posts");


    const map =
        document.getElementById("map");


    if (posts) {

        posts.style.display = "";

    }


    if (map) {

        map.style.display = "none";

    }


    const catalogButton =
        document.getElementById("catalogViewBtn");


    const mapButton =
        document.getElementById("mapViewBtn");


    if (catalogButton) {

        catalogButton.classList.add("active");

    }


    if (mapButton) {

        mapButton.classList.remove("active");

    }


    renderPosts(getFilteredPosts());

}


/* =========================================================
   SHOW MAP
========================================================= */

function showMap() {

    currentView = "map";


    const posts =
        document.getElementById("posts");


    const map =
        document.getElementById("map");


    if (posts) {

        posts.style.display = "none";

    }


    if (map) {

        map.style.display = "block";

    }


    const catalogButton =
        document.getElementById("catalogViewBtn");


    const mapButton =
        document.getElementById("mapViewBtn");


    if (catalogButton) {

        catalogButton.classList.remove("active");

    }


    if (mapButton) {

        mapButton.classList.add("active");

    }


    setTimeout(() => {

        initMap();

        renderMap(getFilteredPosts());

    }, 100);

}


/* =========================================================
   GET FILTERED POSTS
========================================================= */

function getFilteredPosts() {

    const districtEl =
        document.getElementById("districtFilter");


    const roomsEl =
        document.getElementById("roomsFilter");


    const minPriceEl =
        document.getElementById("minPrice");


    const maxPriceEl =
        document.getElementById("maxPrice");


    if (
        !districtEl ||
        !roomsEl ||
        !minPriceEl ||
        !maxPriceEl
    ) {

        return allPosts;

    }


    const district =
        districtEl.value.toLowerCase();


    const rooms =
        roomsEl.value;


    const minPrice =
        Number(minPriceEl.value) || 0;


    const maxPrice =
        Number(maxPriceEl.value) || 999999999;


    return allPosts.filter(post => {


        const text =
            (post.text || "").toLowerCase();


        const postDistrict =
            (post.district || "").toLowerCase();


        const postRooms =
            Number(post.rooms) || 0;


        const postPrice =
            Number(post.price) || 0;


        if (

            district &&

            !postDistrict.includes(district) &&

            !text.includes(district)

        ) {

            return false;

        }


        if (rooms) {


            if (rooms === "5") {

                if (postRooms < 5) {

                    return false;

                }

            }

            else {

                if (
                    postRooms !== Number(rooms)
                ) {

                    return false;

                }

            }

        }


        if (postPrice < minPrice) {

            return false;

        }


        if (postPrice > maxPrice) {

            return false;

        }


        return true;

    });

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

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        userId:
                            telegramUserId

                    })

                }

            ).catch(err => {

                console.log(
                    "Stats error:",
                    err
                );

            });

        }


        const response =

            await fetch(
                "/api/posts?t=" + Date.now(),
                {
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                "Failed to load posts"
            );

        }


        allPosts =
            await response.json();


        renderPosts(allPosts);


        const loader =
            document.getElementById(
                "loader"
            );


        if (loader) {

            setTimeout(() => {

                loader.classList.add(
                    "loader-hide"
                );


                setTimeout(() => {

                    loader.remove();

                }, 600);

            }, 300);

        }

    }

    catch (err) {

        console.error(err);


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
   RENDER POSTS
========================================================= */

function renderPosts(posts) {

    console.log(
        "FILTER WORKS"
    );

    console.log(
        "Posts received:",
        posts.length
    );


    const container =
        document.getElementById(
            "posts"
        );


    if (!container) {

        return;

    }


    container.innerHTML = "";


    if (
        currentView === "map"
    ) {

        setTimeout(() => {

            renderMap(posts);

        }, 0);

    }


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


    posts.forEach(post => {


        const postIndex =
            allPosts.indexOf(post);


        const images =

            post.images &&
            post.images.length

                ? post.images

                : [
                    "https://via.placeholder.com/600x400?text=No+Photo"
                ];


        const district =
            post.district || "-";


        container.innerHTML += `

            <div class="card">


                <div class="card-slider">


                    <button

                        class="prev-btn"

                        onclick="
                            event.stopPropagation();
                            prevCardImage(${postIndex})
                        "

                    >

                        ◀

                    </button>


                    <img

                        id="
                            card-image-${postIndex}
                        "

                        src="${images[0]}"

                        class="card-image"

                        onclick="
                            openGallery(${postIndex})
                        "

                    >


                    <button

                        class="next-btn"

                        onclick="
                            event.stopPropagation();
                            nextCardImage(${postIndex})
                        "

                    >

                        ▶

                    </button>


                </div>


                <div class="info">


                    <div class="price">

                        $${post.price || "-"}

                    </div>


                    <div class="details">


                        📍
                        <b>Район:</b>
                        ${district}

                        <br><br>


                        📌
                        <b>Адрес:</b>
                        ${post.street || "-"}

                        <br><br>


                        🛏
                        <b>Комнат:</b>
                        ${post.rooms || "-"}

                        <br><br>


                        📐
                        <b>Площадь:</b>
                        ${post.area || "-"} м²


                    </div>


                    <button

                        class="details-btn"

                        onclick="
                            location.href=
                            'details.html?id=${post.id}'
                        "

                    >

                        Подробнее

                    </button>


                </div>


            </div>

        `;

    });

}


/* =========================================================
   FILTER POSTS
========================================================= */

function filterPosts() {

    console.log(
        "filterPosts called"
    );


    const districtEl =
        document.getElementById(
            "districtFilter"
        );


    const roomsEl =
        document.getElementById(
            "roomsFilter"
        );


    const minPriceEl =
        document.getElementById(
            "minPrice"
        );


    const maxPriceEl =
        document.getElementById(
            "maxPrice"
        );


    if (
        !districtEl ||
        !roomsEl ||
        !minPriceEl ||
        !maxPriceEl
    ) {

        return;

    }


    const district =
        districtEl.value.toLowerCase();


    const rooms =
        roomsEl.value;


    const minPrice =
        Number(minPriceEl.value) || 0;


    const maxPrice =
        Number(maxPriceEl.value) || 999999999;


    const filtered =

        allPosts.filter(post => {


            const text =
                (post.text || "")
                    .toLowerCase();


            const postDistrict =
                (post.district || "")
                    .toLowerCase();


            const postRooms =
                Number(post.rooms) || 0;


            const postPrice =
                Number(post.price) || 0;


            if (

                district &&

                !postDistrict.includes(
                    district
                ) &&

                !text.includes(
                    district
                )

            ) {

                return false;

            }


            if (rooms) {


                if (
                    rooms === "5"
                ) {

                    if (
                        postRooms < 5
                    ) {

                        return false;

                    }

                }

                else {

                    if (
                        postRooms !==
                        Number(rooms)
                    ) {

                        return false;

                    }

                }

            }


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


    renderPosts(filtered);


    if (
        currentView === "map"
    ) {

        setTimeout(() => {

            initMap();

            renderMap(filtered);

        }, 50);

    }


    const loader =
        document.getElementById(
            "loader"
        );


    if (loader) {

        loader.classList.add(
            "loader-hide"
        );

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


    if (!mapInstance) {


        mapInstance =

            L.map(
                "map",
                {
                    zoomControl: true
                }
            ).setView(

                [
                    41.7151,
                    44.8271
                ],

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
                .addTo(mapInstance);

    }


    setTimeout(() => {

        mapInstance.invalidateSize();

    }, 100);

}


/* =========================================================
   GET POST COORDINATES
========================================================= */

function getPostCoordinates(post) {

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


    /*
       მხოლოდ თბილისთან ახლო
       რეალურ კოორდინატებს ვიყენებთ.
    */

    const isTbilisiCoordinate =

        Number.isFinite(lat) &&

        Number.isFinite(lng) &&

        lat >= 41.60 &&

        lat <= 41.84 &&

        lng >= 44.62 &&

        lng <= 44.98;


    if (
        isTbilisiCoordinate
    ) {

        return [
            lat,
            lng
        ];

    }


    /*
       თუ რეალური კოორდინატა
       არ გვაქვს, ვიყენებთ რაიონს.
    */

    const district =
        (post.district || "")
            .toLowerCase();


    for (
        const key of
        Object.keys(
            districtCenters
        )
    ) {


        if (
            district.includes(key)
        ) {

            return districtCenters[
                key
            ];

        }

    }


    /*
       district-ში ვერ ვიპოვეთ —
       ვეძებთ განცხადების ტექსტში.
    */

    const text =
        (post.text || "")
            .toLowerCase();


    for (
        const key of
        Object.keys(
            districtCenters
        )
    ) {


        if (
            text.includes(key)
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
   CREATE PRICE MARKER
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

                            ? [
                                70,
                                44
                            ]

                            : [
                                100,
                                34
                            ],


                    iconAnchor:

                        isCluster

                            ? [
                                35,
                                22
                            ]

                            : [
                                50,
                                17
                            ]

                })

        }

    );

}


/* =========================================================
   RENDER MAP
========================================================= */

function renderMap(posts) {

    if (
        !mapInstance ||
        !mapLayer
    ) {

        return;

    }


    mapLayer.clearLayers();


    const tbilisiCenter = [

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


    /*
       ახლო ბინებს ვაჯგუფებთ.
    */

    posts.forEach(post => {


        const [
            lat,
            lng
        ] =
            getPostCoordinates(
                post
            );


        /*
           დაახლოებით 100-200 მეტრის
           დაჯგუფება.
        */

        const key =

            `${lat.toFixed(3)},${lng.toFixed(3)}`;


        if (
            !groups.has(key)
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
            .push(post);

    });


    const bounds = [];


    groups.forEach(
        group => {


            const groupPosts =
                group.posts;


            bounds.push([

                group.lat,

                group.lng

            ]);


            /*
               ერთი ბინა.
            */

            if (
                groupPosts.length === 1
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


                marker.bindPopup(`

                    <div
                        class="map-popup"
                    >

                        <div
                            class="map-price"
                        >

                            ${
                                price

                                    ? `$${price}`

                                    : "Цена не указана"
                            }

                        </div>


                        <div
                            class="map-title"
                        >

                            📍
                            ${post.district || "-"}

                            <br>

                            🛏
                            ${post.rooms || "-"}
                            комн.

                            ·

                            ${post.area || "-"}
                            м²

                        </div>


                        <button

                            onclick="
                                location.href=
                                'details.html?id=${post.id}'
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


            /*
               რამდენიმე ბინა
               ერთ ადგილას.
            */

            const prices =

                groupPosts

                    .map(
                        p =>
                            Number(
                                p.price
                            )
                    )

                    .filter(
                        p =>

                            Number.isFinite(
                                p
                            ) &&

                            p > 0

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

                        <br>

                        <span
                            style="
                                font-size:11px
                            "
                        >

                            (${groupPosts.length})

                        </span>

                      `

                    :

                        `${groupPosts.length}`;


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


                    const list =

                        groupPosts

                            .slice(
                                0,
                                30
                            )

                            .map(
                                post => `

                                <div

                                    style="
                                        padding:7px 0;
                                        border-bottom:
                                            1px solid #eee;
                                    "

                                >

                                    <b>

                                        $${post.price || "-"}

                                    </b>

                                    ·

                                    ${post.rooms || "-"}
                                    комн.


                                    <br>


                                    <button

                                        style="
                                            margin-top:4px;
                                            width:100%;
                                            border:0;
                                            border-radius:7px;
                                            padding:6px;
                                            background:#1f63e9;
                                            color:#fff;
                                        "

                                        onclick="
                                            location.href=
                                            'details.html?id=${post.id}'
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
                            >

                                <div
                                    class="map-price"
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


    /*
       მხოლოდ თბილისის კოორდინატები
       მონაწილეობს Zoom-ში.
    */

    const tbilisiBounds =

        bounds.filter(
            ([lat, lng]) =>

                lat >= 41.60 &&

                lat <= 41.84 &&

                lng >= 44.62 &&

                lng <= 44.98

        );


    if (
        tbilisiBounds.length === 1
    ) {


        mapInstance.setView(

            tbilisiBounds[0],

            14

        );

    }


    else if (
        tbilisiBounds.length > 1
    ) {


        mapInstance.fitBounds(

            L.latLngBounds(
                tbilisiBounds
            ),

            {

                padding: [
                    40,
                    40
                ],

                maxZoom: 13

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
   GALLERY
========================================================= */

function openGallery(index) {


    const post =
        allPosts[index];


    if (
        !post.images ||
        post.images.length === 0
    ) {

        return;

    }


    let current = 0;


    const viewer =
        document.createElement(
            "div"
        );


    viewer.id =
        "viewer";


    viewer.innerHTML = `

        <div
            class="viewer"
        >


            <button
                id="closeViewer"
            >

                ✕

            </button>


            <button
                id="prevPhoto"
            >

                ◀

            </button>


            <img

                id="galleryImage"

                src="/${post.images[0]}"

            >


            <button
                id="nextPhoto"
            >

                ▶

            </button>


            <div
                id="counter"
            >

                1 /
                ${post.images.length}

            </div>


        </div>

    `;


    document.body.appendChild(
        viewer
    );


    const image =
        document.getElementById(
            "galleryImage"
        );


    const counter =
        document.getElementById(
            "counter"
        );


    document.getElementById(
        "nextPhoto"
    ).onclick = () => {


        current++;


        if (
            current >=
            post.images.length
        ) {

            current = 0;

        }


        image.src =
            "/" +
            post.images[current];


        counter.innerHTML =

            `${current + 1} / ${post.images.length}`;

    };


    document.getElementById(
        "prevPhoto"
    ).onclick = () => {


        current--;


        if (
            current < 0
        ) {

            current =
                post.images.length - 1;

        }


        image.src =
            "/" +
            post.images[current];


        counter.innerHTML =

            `${current + 1} / ${post.images.length}`;

    };


    document.getElementById(
        "closeViewer"
    ).onclick = () => {

        viewer.remove();

    };


    viewer.onclick =
        (e) => {


            if (
                e.target ===
                viewer
            ) {

                viewer.remove();

            }

        };

}


/* =========================================================
   CARD IMAGE SLIDER
========================================================= */

const currentCardImage = {};


function nextCardImage(index) {


    const post =
        allPosts[index];


    if (
        !post.images ||
        post.images.length < 2
    ) {

        return;

    }


    currentCardImage[index] =

        (

            (
                currentCardImage[index]
                || 0
            )

            + 1

        )

        %

        post.images.length;


    const image =
        document.getElementById(

            `card-image-${index}`

        );


    if (image) {

        image.src =

            "/" +

            post.images[
                currentCardImage[index]
            ];

    }

}


function prevCardImage(index) {


    const post =
        allPosts[index];


    if (
        !post.images ||
        post.images.length < 2
    ) {

        return;

    }


    currentCardImage[index] =

        (

            (
                currentCardImage[index]
                || 0
            )

            - 1

            + post.images.length

        )

        %

        post.images.length;


    const image =
        document.getElementById(

            `card-image-${index}`

        );


    if (image) {

        image.src =

            "/" +

            post.images[
                currentCardImage[index]
            ];

    }

}


/* =========================================================
   FIRST LOAD
========================================================= */

loadPosts();


/* =========================================================
   AUTO REFRESH
========================================================= */

setInterval(
    async () => {


        try {


            const res =

                await fetch(

                    "/api/posts?t=" +
                    Date.now(),

                    {
                        cache:
                            "no-store"
                    }

                );


            const posts =
                await res.json();


            if (
                posts.length !==
                allPosts.length
            ) {


                allPosts =
                    posts;


                const filtered =
                    getFilteredPosts();


                renderPosts(
                    filtered
                );


                if (
                    currentView ===
                    "map"
                ) {

                    renderMap(
                        filtered
                    );

                }

            }

        }

        catch (e) {

            console.log(
                "Auto refresh error:",
                e
            );

        }

    },

    30000

);