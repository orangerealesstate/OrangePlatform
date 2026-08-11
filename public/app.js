// ============================================================
// ORANGE REAL ESTATE
// MAIN PAGE APP.JS
// ============================================================

let allPosts = [];
let visiblePosts = [];

let currentImages = [];
let currentIndex = 0;

let loadingRequest = null;


// ============================================================
// START
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

    console.log("🟠 Orange Platform started");

    setupFilters();

    loadPosts();

});


// ============================================================
// LOAD POSTS
// ============================================================

async function loadPosts() {

    // Cancel previous request if one is still running
    if (loadingRequest) {
        try {
            loadingRequest.abort();
        } catch (e) {}
    }

    const controller = new AbortController();
    loadingRequest = controller;

    try {

        console.log("📥 Loading fresh posts...");

        const cacheBuster = Date.now();

        const response = await fetch(
            "/api/posts?t=" + cacheBuster,
            {
                method: "GET",
                cache: "no-store",
                signal: controller.signal,

                headers: {
                    "Cache-Control": "no-cache, no-store, must-revalidate",
                    "Pragma": "no-cache",
                    "Expires": "0"
                }
            }
        );

        if (!response.ok) {
            throw new Error(
                "Server error: " + response.status
            );
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error(
                "API did not return an array"
            );
        }

        console.log(
            "📦 API returned:",
            data.length,
            "posts"
        );

        // ====================================================
        // REMOVE DUPLICATES
        // ====================================================

        const uniqueMap = new Map();

        data.forEach(post => {

            if (!post) return;

            const id = String(
                post.id ??
                post.telegramId ??
                ""
            );

            if (!id) return;

            uniqueMap.set(id, post);

        });

        const uniquePosts = Array.from(
            uniqueMap.values()
        );


        // ====================================================
        // SORT NEWEST FIRST
        // ====================================================

        uniquePosts.sort((a, b) => {

            const dateA = Number(a?.date || 0);
            const dateB = Number(b?.date || 0);

            if (dateA !== dateB) {
                return dateB - dateA;
            }

            const idA = Number(a?.id || 0);
            const idB = Number(b?.id || 0);

            return idB - idA;

        });


        // ====================================================
        // SAVE
        // ====================================================

        allPosts = uniquePosts;

        visiblePosts = [...allPosts];


        console.log(
            "✅ Posts loaded:",
            allPosts.length
        );


        if (allPosts.length > 0) {

            console.log(
                "🆕 NEWEST ID:",
                allPosts[0].id
            );

            console.log(
                "🆕 NEWEST DATE:",
                allPosts[0].date
            );

            console.log(
                "🆕 NEWEST ADDRESS:",
                allPosts[0].street ||
                allPosts[0].address ||
                "-"
            );

        }


        // ====================================================
        // RENDER
        // ====================================================

        renderPosts(allPosts);


    } catch (error) {

        if (error?.name === "AbortError") {

            console.log(
                "ℹ️ Previous posts request cancelled"
            );

            return;

        }


        console.error(
            "❌ LOAD POSTS ERROR:",
            error
        );


        const container =
            document.getElementById("posts");


        if (container) {

            container.innerHTML = `

                <div style="
                    width:100%;
                    text-align:center;
                    padding:50px 20px;
                ">

                    <h2>
                        Ошибка загрузки объявлений
                    </h2>

                    <p>
                        ${escapeHtml(
                            error?.message || "Unknown error"
                        )}
                    </p>

                    <button
                        type="button"
                        onclick="loadPosts()"
                        style="
                            margin-top:20px;
                            padding:12px 20px;
                            border:none;
                            border-radius:10px;
                            cursor:pointer;
                        "
                    >
                        🔄 Повторить
                    </button>

                </div>

            `;

        }

    } finally {

        if (loadingRequest === controller) {
            loadingRequest = null;
        }

    }

}


// ============================================================
// REFRESH WHEN MINI APP BECOMES VISIBLE
// ============================================================

document.addEventListener(
    "visibilitychange",
    () => {

        if (
            document.visibilityState === "visible"
        ) {

            console.log(
                "👀 Mini App visible → refreshing"
            );

            loadPosts();

        }

    }
);


// ============================================================
// PAGE SHOW
// ============================================================

window.addEventListener(
    "pageshow",
    () => {

        console.log(
            "🔄 Page show → refreshing posts"
        );

        loadPosts();

    }
);


// ============================================================
// FILTER SETUP
// ============================================================

function setupFilters() {

    const search =
        document.getElementById("search");

    const district =
        document.getElementById(
            "districtFilter"
        );

    const rooms =
        document.getElementById(
            "roomsFilter"
        );

    const minPrice =
        document.getElementById(
            "minPrice"
        );

    const maxPrice =
        document.getElementById(
            "maxPrice"
        );


    if (search) {
        search.addEventListener(
            "input",
            filterPosts
        );
    }


    if (district) {
        district.addEventListener(
            "change",
            filterPosts
        );
    }


    if (rooms) {
        rooms.addEventListener(
            "change",
            filterPosts
        );
    }


    if (minPrice) {
        minPrice.addEventListener(
            "input",
            filterPosts
        );
    }


    if (maxPrice) {
        maxPrice.addEventListener(
            "input",
            filterPosts
        );
    }

}


// ============================================================
// NORMALIZE DISTRICT
// ============================================================

function normalizeDistrict(value) {

    let district =
        String(value || "")
            .toLowerCase()
            .trim();


    district = district

        .replace(/საბურთალო/g, "saburtalo")
        .replace(/сабуртало/g, "saburtalo")

        .replace(/ვაკე/g, "vake")
        .replace(/ваке/g, "vake")

        .replace(/ვერა/g, "vera")
        .replace(/вера/g, "vera")

        .replace(/ისანი/g, "isani")
        .replace(/исани/g, "isani")

        .replace(/ორთაჭალა/g, "ortachala")
        .replace(/ортачала/g, "ortachala")

        .replace(
            /დიდი დიღომი/g,
            "didi digomi"
        )

        .replace(
            /диди дигоми/g,
            "didi digomi"
        )

        .replace(
            /მთაწმინდა/g,
            "mtatsminda"
        )

        .replace(
            /мтацминда/g,
            "mtatsminda"
        )

        .replace(
            /კრწანისი/g,
            "krtsanisi"
        )

        .replace(
            /крцаниси/g,
            "krtsanisi"
        )

        .replace(
            /დიდუბე/g,
            "didube"
        )

        .replace(
            /дидубе/g,
            "didube"
        )

        .replace(
            /ნაძალადევი/g,
            "nadzaladevi"
        )

        .replace(
            /надзаладеви/g,
            "nadzaladevi"
        )

        .replace(
            /ავლაბარი/g,
            "avlabari"
        )

        .replace(
            /авлабари/g,
            "avlabari"
        );


    return district;

}


// ============================================================
// GET DISTRICT
// ============================================================

function getPostDistrict(post) {

    if (post?.district) {

        const normalized =
            normalizeDistrict(
                post.district
            );

        if (
            normalized &&
            normalized !== "-"
        ) {

            return normalized;

        }

    }


    const text =
        String(post?.text || "")
            .toLowerCase();


    const districts = [

        ["saburtalo", "saburtalo"],
        ["сабуртало", "saburtalo"],
        ["საბურთალო", "saburtalo"],

        ["vake", "vake"],
        ["ваке", "vake"],
        ["ვაკე", "vake"],

        ["vera", "vera"],
        ["вера", "vera"],
        ["ვერა", "vera"],

        ["isani", "isani"],
        ["исани", "isani"],
        ["ისანი", "isani"],

        ["ortachala", "ortachala"],
        ["ортачала", "ortachala"],
        ["ორთაჭალა", "ortachala"],

        ["didi digomi", "didi digomi"],
        ["диди дигоми", "didi digomi"],
        ["დიდი დიღომი", "didi digomi"],

        ["mtatsminda", "mtatsminda"],
        ["мтацминда", "mtatsminda"],
        ["მთაწმინდა", "mtatsminda"],

        ["krtsanisi", "krtsanisi"],
        ["крцаниси", "krtsanisi"],
        ["კრწანისი", "krtsanisi"],

        ["didube", "didube"],
        ["дидубе", "didube"],
        ["დიდუბე", "didube"],

        ["nadzaladevi", "nadzaladevi"],
        ["надзаладеви", "nadzaladevi"],
        ["ნაძალადევი", "nadzaladevi"],

        ["avlabari", "avlabari"],
        ["авлабари", "avlabari"],
        ["ავლაბარი", "avlabari"]

    ];


    for (
        const [keyword, district]
        of districts
    ) {

        if (
            text.includes(keyword)
        ) {

            return district;

        }

    }


    return "";

}


// ============================================================
// DISPLAY DISTRICT
// ============================================================

function getDisplayDistrict(post) {

    const district =
        getPostDistrict(post);


    const names = {

        "saburtalo": "Saburtalo",
        "vake": "Vake",
        "vera": "Vera",
        "isani": "Isani",
        "ortachala": "Ortachala",
        "didi digomi": "Didi Digomi",
        "mtatsminda": "Mtatsminda",
        "krtsanisi": "Krtsanisi",
        "didube": "Didube",
        "nadzaladevi": "Nadzaladevi",
        "avlabari": "Avlabari"

    };


    return (
        names[district] ||
        post?.district ||
        "-"
    );

}


// ============================================================
// GET ROOMS
// ============================================================

function getPostRooms(post) {

    const databaseRooms =
        Number(post?.rooms);


    if (
        Number.isFinite(databaseRooms) &&
        databaseRooms > 0
    ) {

        return databaseRooms;

    }


    const text =
        String(post?.text || "");


    const patterns = [

        /количество\s*#?\s*комнат\s*[:\-]?\s*(\d+)/i,

        /#комнат\s*[:\-]?\s*(\d+)/i,

        /комнат\s*[:\-]?\s*(\d+)/i,

        /комнаты\s*[:\-]?\s*(\d+)/i,

        /rooms\s*[:\-]?\s*(\d+)/i,

        /ოთახი\s*[:\-]?\s*(\d+)/i,

        /ოთახები\s*[:\-]?\s*(\d+)/i

    ];


    for (
        const pattern of patterns
    ) {

        const match =
            text.match(pattern);


        if (match) {

            const rooms =
                Number(match[1]);


            if (
                Number.isFinite(rooms)
            ) {

                return rooms;

            }

        }

    }


    return 0;

}


// ============================================================
// GET PRICE
// ============================================================

function getPostPrice(post) {

    if (
        post &&
        post.price !== undefined &&
        post.price !== null
    ) {

        const price =
            Number(
                String(post.price)
                    .replace(/[^\d.]/g, "")
            );


        if (
            Number.isFinite(price)
        ) {

            return price;

        }

    }


    const text =
        String(post?.text || "");


    const patterns = [

        /#цена[_\s]*([\d,.]+)/i,

        /цена\s*[:\-]?\s*([\d,.]+)/i,

        /(?:\$|usd)\s*([\d,.]+)/i,

        /price\s*[:\-]?\s*([\d,.]+)/i

    ];


    for (
        const pattern of patterns
    ) {

        const match =
            text.match(pattern);


        if (match) {

            const price =
                Number(
                    match[1]
                        .replace(/,/g, "")
                );


            if (
                Number.isFinite(price)
            ) {

                return price;

            }

        }

    }


    return 0;

}


// ============================================================
// IMAGE URL
// ============================================================

function getImageUrl(post) {

    if (
        !post ||
        !Array.isArray(post.images) ||
        !post.images.length
    ) {

        return "https://via.placeholder.com/600x400?text=No+Photo";

    }


    let image =
        String(
            post.images[0] || ""
        ).trim();


    if (!image) {

        return "https://via.placeholder.com/600x400?text=No+Photo";

    }


    if (
        image.startsWith("http://") ||
        image.startsWith("https://")
    ) {

        return image;

    }


    image =
        image
            .replace(/\\/g, "/")
            .replace(/^\/+/, "");


    return (
        "/" +
        image +
        "?v=" +
        encodeURIComponent(
            String(
                post.id ||
                Date.now()
            )
        )
    );

}


// ============================================================
// FILTER
// ============================================================

function filterPosts() {

    const search =
        String(
            document.getElementById(
                "search"
            )?.value || ""
        )
            .toLowerCase()
            .trim();


    const selectedDistrict =
        normalizeDistrict(
            document.getElementById(
                "districtFilter"
            )?.value || ""
        );


    const selectedRooms =
        String(
            document.getElementById(
                "roomsFilter"
            )?.value || ""
        ).trim();


    const minPrice =
        Number(
            document.getElementById(
                "minPrice"
            )?.value
        ) || 0;


    const maxPriceValue =
        document.getElementById(
            "maxPrice"
        )?.value;


    const maxPrice =
        maxPriceValue
            ? Number(maxPriceValue)
            : 99999999;


    const filtered =
        allPosts.filter(post => {

            const text =
                String(
                    post?.text || ""
                )
                    .toLowerCase();


            const district =
                getPostDistrict(post);


            const rooms =
                getPostRooms(post);


            const price =
                getPostPrice(post);


            const street =
                String(
                    post?.street ||
                    post?.address ||
                    ""
                )
                    .toLowerCase();


            // SEARCH

            if (search) {

                const searchable =
                    [

                        text,

                        district,

                        street,

                        String(
                            post?.id || ""
                        ),

                        String(
                            post?.price || ""
                        )

                    ]
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


            // DISTRICT

            if (selectedDistrict) {

                if (
                    district !==
                    selectedDistrict
                ) {

                    return false;

                }

            }


            // ROOMS

            if (selectedRooms) {

                const wantedRooms =
                    Number(
                        selectedRooms
                    );


                // 5 = 5+

                if (
                    wantedRooms === 5
                ) {

                    if (
                        rooms < 5
                    ) {

                        return false;

                    }

                } else {

                    if (
                        rooms !==
                        wantedRooms
                    ) {

                        return false;

                    }

                }

            }


            // PRICE

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


            return true;

        });


    console.log(
        "🔎 FILTER:",
        filtered.length,
        "/",
        allPosts.length
    );


    visiblePosts = filtered;


    renderPosts(filtered);

}


// ============================================================
// CLEAR FILTERS
// ============================================================

function clearFilters() {

    const ids = [

        "search",
        "districtFilter",
        "roomsFilter",
        "minPrice",
        "maxPrice"

    ];


    ids.forEach(id => {

        const element =
            document.getElementById(id);


        if (element) {

            element.value = "";

        }

    });


    visiblePosts =
        [...allPosts];


    renderPosts(
        visiblePosts
    );

}


// ============================================================
// RENDER POSTS
// ============================================================

function renderPosts(posts) {

    visiblePosts =
        Array.isArray(posts)
            ? [...posts]
            : [];


    const container =
        document.getElementById(
            "posts"
        );


    if (!container) {

        console.error(
            "❌ #posts not found"
        );

        return;

    }


    container.innerHTML = "";


    if (!visiblePosts.length) {

        container.innerHTML = `

            <div style="
                width:100%;
                text-align:center;
                padding:50px 20px;
            ">

                <h2>
                    Объявления не найдены
                </h2>

            </div>

        `;

        return;

    }


    console.log(
        "🖥 Rendering:",
        visiblePosts.length,
        "posts"
    );


    visiblePosts.forEach(post => {

        const id =
            String(
                post?.id ?? ""
            );


        if (!id) {
            return;
        }


        const image =
            getImageUrl(post);


        const district =
            getDisplayDistrict(post);


        const rooms =
            getPostRooms(post);


        const price =
            getPostPrice(post);


        const address =
            post?.street ||
            post?.address ||
            "-";


        const card =
            document.createElement(
                "div"
            );


        card.className = "card";


        // ====================================================
        // RENTED BADGE
        // ====================================================

        const rentedBadge =
            post?.status === "rented"
                ? `

                    <div class="rented-badge">
                        🔴 СДАНО
                    </div>

                `
                : "";


        // ====================================================
        // TELEGRAM BUTTON
        // ====================================================

        const telegramButton =
            post?.telegramLink
                ? `

                    <a
                        class="telegram-btn"
                        href="${escapeHtml(
                            post.telegramLink
                        )}"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        📲 Смотреть в Telegram
                    </a>

                `
                : "";


        // ====================================================
        // CARD
        // ====================================================

        card.innerHTML = `

            ${rentedBadge}

            <img
                src="${escapeHtml(image)}"
                class="card-image"
                data-post-id="${escapeHtml(id)}"
                alt="Apartment"
                loading="lazy"
            >

            <div class="info">

                <div class="price">
                    $${price || "-"}
                </div>

                <div class="details">

                    📍 <b>Район:</b>
                    ${escapeHtml(district)}

                    <br><br>

                    📌 <b>Адрес:</b>
                    ${escapeHtml(address)}

                    <br><br>

                    🛏 <b>Комнат:</b>
                    ${rooms || "-"}

                    <br><br>

                    📐 <b>Площадь:</b>
                    ${escapeHtml(
                        post?.area ?? "-"
                    )} м²

                </div>


                <button
                    class="details-btn"
                    type="button"
                >
                    Подробнее
                </button>


                ${telegramButton}

            </div>

        `;


        // ====================================================
        // IMAGE
        // ====================================================

        const imageElement =
            card.querySelector(
                ".card-image"
            );


        if (imageElement) {

            imageElement.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    openGallery(id);

                }
            );


            imageElement.addEventListener(
                "error",
                () => {

                    if (
                        imageElement.dataset.failed === "1"
                    ) {

                        return;

                    }


                    imageElement.dataset.failed =
                        "1";


                    imageElement.src =
                        "https://via.placeholder.com/600x400?text=No+Photo";

                }
            );

        }


        // ====================================================
        // DETAILS
        // ====================================================

        const detailsButton =
            card.querySelector(
                ".details-btn"
            );


        if (detailsButton) {

            detailsButton.addEventListener(
                "click",
                event => {

                    event.stopPropagation();


                    window.location.href =
                        "details.html?id=" +
                        encodeURIComponent(
                            id
                        );

                }
            );

        }


        container.appendChild(card);

    });

}


// ============================================================
// GALLERY
// ============================================================

function openGallery(id) {

    console.log(
        "🖼 Opening gallery:",
        id
    );


    const post =
        visiblePosts.find(
            p =>
                String(p?.id) ===
                String(id)
        );


    if (!post) {

        console.error(
            "❌ Apartment not found:",
            id
        );

        return;

    }


    currentImages =
        Array.isArray(
            post.images
        )
            ? [...post.images]
            : [];


    currentIndex = 0;


    if (!currentImages.length) {

        console.warn(
            "⚠️ No images for:",
            post.id
        );

        return;

    }


    const viewer =
        document.getElementById(
            "viewer"
        );


    if (!viewer) {

        console.error(
            "❌ #viewer not found"
        );

        return;

    }


    viewer.style.display =
        "block";


    updateGallery();

}


// ============================================================
// UPDATE GALLERY
// ============================================================

function updateGallery() {

    if (
        !currentImages.length
    ) {

        return;

    }


    const viewerImage =
        document.getElementById(
            "viewerImage"
        );


    const counter =
        document.getElementById(
            "counter"
        );


    if (!viewerImage) {

        console.error(
            "❌ #viewerImage not found"
        );

        return;

    }


    const imagePath =
        String(
            currentImages[
                currentIndex
            ] || ""
        )
            .replace(/\\/g, "/")
            .replace(/^\/+/, "");


    viewerImage.src =
        "/" +
        imagePath +
        "?v=" +
        Date.now();


    if (counter) {

        counter.innerHTML =
            `${currentIndex + 1} / ${currentImages.length}`;

    }

}


// ============================================================
// NEXT PHOTO
// ============================================================

function nextPhoto() {

    if (
        currentIndex <
        currentImages.length - 1
    ) {

        currentIndex++;

        updateGallery();

    }

}


// ============================================================
// PREVIOUS PHOTO
// ============================================================

function prevPhoto() {

    if (
        currentIndex > 0
    ) {

        currentIndex--;

        updateGallery();

    }

}


// ============================================================
// CLOSE VIEWER
// ============================================================

function closeViewer() {

    const viewer =
        document.getElementById(
            "viewer"
        );


    if (viewer) {

        viewer.style.display =
            "none";

    }

}


// ============================================================
// KEYBOARD
// ============================================================

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape"
        ) {

            closeViewer();

        }


        if (
            event.key === "ArrowRight"
        ) {

            nextPhoto();

        }


        if (
            event.key === "ArrowLeft"
        ) {

            prevPhoto();

        }

    }
);


// ============================================================
// HTML ESCAPE
// ============================================================

function escapeHtml(value) {

    return String(
        value ?? ""
    )

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


// ============================================================
// GLOBAL ACCESS
// ============================================================

window.loadPosts =
    loadPosts;

window.filterPosts =
    filterPosts;

window.renderPosts =
    renderPosts;

window.clearFilters =
    clearFilters;

window.openGallery =
    openGallery;

window.nextPhoto =
    nextPhoto;

window.prevPhoto =
    prevPhoto;

window.closeViewer =
    closeViewer;
