// ============================================================
// ORANGE REAL ESTATE
// MAIN PAGE APP.JS
// ============================================================


// ============================================================
// GLOBAL VARIABLES
// ============================================================

let allPosts = [];

let visiblePosts = [];


// ============================================================
// DOM READY
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

    try {

        console.log("📥 Loading posts...");

        const response = await fetch("/api/posts");

        if (!response.ok) {

            throw new Error(
                "HTTP " + response.status
            );

        }

        const data = await response.json();

        console.log(
            "📦 Posts received:",
            Array.isArray(data)
                ? data.length
                : "NOT ARRAY"
        );


        // ====================================================
        // NORMALIZE DATA
        // ====================================================

        if (Array.isArray(data)) {

            allPosts = data;

        }

        else if (
            data &&
            Array.isArray(data.posts)
        ) {

            allPosts = data.posts;

        }

        else {

            allPosts = [];

        }


        // ====================================================
        // IMPORTANT
        // ====================================================

        visiblePosts = [...allPosts];


        console.log(
            "🏠 TOTAL POSTS:",
            allPosts.length
        );


        console.log(
            "🖼 TOTAL IMAGES:",
            allPosts.reduce(
                (total, post) => {

                    return total +
                        (
                            Array.isArray(post.images)
                                ? post.images.length
                                : 0
                        );

                },
                0
            )
        );


        renderPosts(visiblePosts);

    }

    catch (error) {

        console.error(
            "❌ Error loading posts:",
            error
        );


        const container =
            document.getElementById("posts");


        if (container) {

            container.innerHTML = `

                <div style="
                    text-align:center;
                    padding:50px;
                ">

                    <h2>
                        Ошибка загрузки объявлений
                    </h2>

                    <p>
                        ${error.message}
                    </p>

                </div>

            `;

        }

    }

}


// ============================================================
// FILTER SETUP
// ============================================================

function setupFilters() {

    const search =
        document.getElementById("search");

    const district =
        document.getElementById("districtFilter");

    const rooms =
        document.getElementById("roomsFilter");

    const minPrice =
        document.getElementById("minPrice");

    const maxPrice =
        document.getElementById("maxPrice");


    // ========================================================
    // SEARCH
    // ========================================================

    if (search) {

        search.addEventListener(
            "input",
            filterPosts
        );

    }


    // ========================================================
    // DISTRICT
    // ========================================================

    if (district) {

        district.addEventListener(
            "change",
            filterPosts
        );

    }


    // ========================================================
    // ROOMS
    // ========================================================

    if (rooms) {

        rooms.addEventListener(
            "change",
            filterPosts
        );

    }


    // ========================================================
    // MIN PRICE
    // ========================================================

    if (minPrice) {

        minPrice.addEventListener(
            "input",
            filterPosts
        );

    }


    // ========================================================
    // MAX PRICE
    // ========================================================

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


    district =
        district
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
            );


    return district;

}


// ============================================================
// GET DISTRICT FROM TEXT
// ============================================================

function getPostDistrict(post) {

    // ========================================================
    // FIRST: DATABASE FIELD
    // ========================================================

    if (
        post &&
        post.district
    ) {

        const district =
            normalizeDistrict(
                post.district
            );


        if (district) {

            return district;

        }

    }


    // ========================================================
    // TEXT
    // ========================================================

    const text =
        String(
            post?.text || ""
        ).toLowerCase();


    // ========================================================
    // SABURTALO
    // ========================================================

    if (
        text.includes("сабуртало") ||
        text.includes("saburtalo") ||
        text.includes("საბურთალო")
    ) {

        return "saburtalo";

    }


    // ========================================================
    // VAKE
    // ========================================================

    if (
        text.includes("ваке") ||
        text.includes("vake") ||
        text.includes("ვაკე")
    ) {

        return "vake";

    }


    // ========================================================
    // VERA
    // ========================================================

    if (
        text.includes("вера") ||
        text.includes("vera") ||
        text.includes("ვერა")
    ) {

        return "vera";

    }


    // ========================================================
    // ISANI
    // ========================================================

    if (
        text.includes("исани") ||
        text.includes("isani") ||
        text.includes("ისანი")
    ) {

        return "isani";

    }


    // ========================================================
    // ORTACHALA
    // ========================================================

    if (
        text.includes("ортачала") ||
        text.includes("ortachala") ||
        text.includes("ორთაჭალა")
    ) {

        return "ortachala";

    }


    // ========================================================
    // DIDİ DIGOMI
    // ========================================================

    if (
        text.includes("диди дигоми") ||
        text.includes("didi digomi") ||
        text.includes("დიდი დიღომი")
    ) {

        return "didi digomi";

    }


    return "";

}


// ============================================================
// GET ROOMS
// ============================================================

function getPostRooms(post) {

    // ========================================================
    // DATABASE
    // ========================================================

    let rooms =
        Number(post?.rooms);


    if (
        Number.isFinite(rooms) &&
        rooms > 0
    ) {

        return rooms;

    }


    // ========================================================
    // TEXT
    // ========================================================

    const text =
        String(
            post?.text || ""
        );


    const patterns = [

        /количество\s*комнат\s*[:\-]?\s*(\d+)/i,

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

            const value =
                Number(match[1]);


            if (
                Number.isFinite(value)
            ) {

                return value;

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


    // ========================================================
    // TRY TEXT
    // ========================================================

    const text =
        String(
            post?.text || ""
        );


    const priceMatch =
        text.match(
            /(?:\$|usd|цена|price)\s*([\d,.]+)/i
        );


    if (priceMatch) {

        const price =
            Number(
                priceMatch[1]
                    .replace(/,/g, "")
            );


        if (
            Number.isFinite(price)
        ) {

            return price;

        }

    }


    return 0;

}


// ============================================================
// FILTER POSTS
// ============================================================

function filterPosts() {

    // ========================================================
    // SEARCH
    // ========================================================

    const searchInput =
        document.getElementById("search");


    const search =
        searchInput
            ? String(
                searchInput.value || ""
              )
                .toLowerCase()
                .trim()
            : "";


    // ========================================================
    // DISTRICT
    // ========================================================

    const districtInput =
        document.getElementById(
            "districtFilter"
        );


    const selectedDistrict =
        districtInput
            ? normalizeDistrict(
                districtInput.value
              )
            : "";


    // ========================================================
    // ROOMS
    // ========================================================

    const roomsInput =
        document.getElementById(
            "roomsFilter"
        );


    const selectedRooms =
        roomsInput
            ? String(
                roomsInput.value || ""
              ).trim()
            : "";


    // ========================================================
    // MIN PRICE
    // ========================================================

    const minPriceInput =
        document.getElementById(
            "minPrice"
        );


    const minPrice =
        minPriceInput
            ? (
                Number(
                    minPriceInput.value
                ) || 0
              )
            : 0;


    // ========================================================
    // MAX PRICE
    // ========================================================

    const maxPriceInput =
        document.getElementById(
            "maxPrice"
        );


    const maxPrice =
        maxPriceInput &&
        maxPriceInput.value
            ? Number(
                maxPriceInput.value
              )
            : 99999999;


    // ========================================================
    // FILTER
    // ========================================================

    const filtered =
        allPosts.filter(post => {


            // ==================================================
            // TEXT
            // ==================================================

            const text =
                String(
                    post?.text || ""
                )
                    .toLowerCase();


            // ==================================================
            // DISTRICT
            // ==================================================

            const postDistrict =
                getPostDistrict(post);


            // ==================================================
            // ROOMS
            // ==================================================

            const postRooms =
                getPostRooms(post);


            // ==================================================
            // PRICE
            // ==================================================

            const postPrice =
                getPostPrice(post);


            // ==================================================
            // SEARCH
            // ==================================================

            if (search) {

                const searchableText =
                    (
                        text +
                        " " +
                        postDistrict +
                        " " +
                        String(
                            post?.street || ""
                        ).toLowerCase()
                    );


                if (
                    !searchableText.includes(
                        search
                    )
                ) {

                    return false;

                }

            }


            // ==================================================
            // DISTRICT FILTER
            // ==================================================

            if (selectedDistrict) {

                if (
                    postDistrict !==
                    selectedDistrict
                ) {

                    return false;

                }

            }


            // ==================================================
            // ROOMS FILTER
            // ==================================================

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
                        postRooms < 5
                    ) {

                        return false;

                    }

                }

                else {

                    if (
                        postRooms !==
                        wantedRooms
                    ) {

                        return false;

                    }

                }

            }


            // ==================================================
            // MIN PRICE
            // ==================================================

            if (
                postPrice < minPrice
            ) {

                return false;

            }


            // ==================================================
            // MAX PRICE
            // ==================================================

            if (
                postPrice > maxPrice
            ) {

                return false;

            }


            return true;

        });


    // ========================================================
    // SAVE VISIBLE POSTS
    // ========================================================

    visiblePosts =
        filtered;


    console.log(
        "🔎 FILTER:",
        filtered.length,
        "/",
        allPosts.length
    );


    // ========================================================
    // RENDER
    // ========================================================

    renderPosts(
        filtered
    );

}


// ============================================================
// IMAGE URL
// ============================================================

function getImageUrl(post) {

    // ========================================================
    // NO IMAGES
    // ========================================================

    if (
        !post ||
        !Array.isArray(post.images) ||
        post.images.length === 0
    ) {

        return "https://via.placeholder.com/600x400?text=No+Photo";

    }


    // ========================================================
    // ONLY FIRST IMAGE
    // ========================================================

    let image =
        String(
            post.images[0] || ""
        ).trim();


    if (!image) {

        return "https://via.placeholder.com/600x400?text=No+Photo";

    }


    // ========================================================
    // ABSOLUTE URL
    // ========================================================

    if (
        image.startsWith("http://") ||
        image.startsWith("https://")
    ) {

        return image;

    }


    // ========================================================
    // REMOVE ./ OR /
    // ========================================================

    image =
        image
            .replace(/^\.?\//, "")
            .replace(/^\/+/, "");


    // ========================================================
    // downloads/...
    // ========================================================

    if (
        image.startsWith("downloads/")
    ) {

        return "/" + image;

    }


    // ========================================================
    // downloads\...
    // ========================================================

    if (
        image.startsWith("downloads\\")
    ) {

        image =
            image.replace(
                /\\/g,
                "/"
            );


        return "/" + image;

    }


    // ========================================================
    // OTHER PATH
    // ========================================================

    return "/" + image;

}


// ============================================================
// GET DISPLAY DISTRICT
// ============================================================

function getDisplayDistrict(post) {

    const district =
        getPostDistrict(post);


    const names = {

        "saburtalo":
            "Saburtalo",

        "vake":
            "Vake",

        "vera":
            "Vera",

        "isani":
            "Isani",

        "ortachala":
            "Ortachala",

        "didi digomi":
            "Didi Digomi"

    };


    return (
        names[district] ||
        post?.district ||
        "-"
    );

}


// ============================================================
// RENDER POSTS
// ============================================================

function renderPosts(posts) {

    // ========================================================
    // VERY IMPORTANT
    // ========================================================
    // აქ ვინახავთ ზუსტად იმ ბინებს,
    // რომლებიც ამ მომენტში ეკრანზე ჩანს.
    //
    // მაგრამ ფოტოებს ერთმანეთში აღარ ვურევთ.
    // თითო card იყენებს მხოლოდ თავის images[0]-ს.
    // ========================================================

    visiblePosts =
        Array.isArray(posts)
            ? posts
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


    // ========================================================
    // CLEAR
    // ========================================================

    container.innerHTML = "";


    // ========================================================
    // NO RESULTS
    // ========================================================

    if (
        !visiblePosts.length
    ) {

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


    // ========================================================
    // CREATE CARDS
    // ========================================================

    visiblePosts.forEach(
        post => {

            // ==================================================
            // FIRST PHOTO ONLY
            // ==================================================

            const image =
                getImageUrl(post);


            // ==================================================
            // DISTRICT
            // ==================================================

            const district =
                getDisplayDistrict(
                    post
                );


            // ==================================================
            // ROOMS
            // ==================================================

            const rooms =
                getPostRooms(
                    post
                );


            // ==================================================
            // PRICE
            // ==================================================

            const price =
                getPostPrice(
                    post
                );


            // ==================================================
            // ID
            // ==================================================

            const id =
                String(
                    post?.id ?? ""
                );


            // ==================================================
            // CARD
            // ==================================================

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "card";


            // ==================================================
            // RENTED
            // ==================================================

            const rentedBadge =
                post?.status === "rented"
                    ? `

                        <div class="rented-badge">
                            🔴 СДАНО
                        </div>

                      `
                    : "";


            // ==================================================
            // TELEGRAM
            // ==================================================

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


            // ==================================================
            // CARD HTML
            // ==================================================

            card.innerHTML = `

                ${rentedBadge}


                <!-- ==========================================
                     ONLY ONE PHOTO
                     ========================================== -->

                <img
                    src="${escapeHtml(image)}"
                    class="card-image"
                    loading="lazy"
                    alt="Apartment"
                >


                <div class="info">


                    <!-- ======================================
                         PRICE
                         ====================================== -->

                    <div class="price">

                        $${price || "-"}

                    </div>


                    <!-- ======================================
                         DETAILS
                         ====================================== -->

                    <div class="details">


                        📍 <b>Район:</b>
                        ${escapeHtml(
                            district
                        )}


                        <br><br>


                        📌 <b>Адрес:</b>
                        ${escapeHtml(
                            post?.street ||
                            post?.address ||
                            "-"
                        )}


                        <br><br>


                        🛏 <b>Комнат:</b>
                        ${rooms || "-"}


                        <br><br>


                        📐 <b>Площадь:</b>
                        ${escapeHtml(
                            post?.area ??
                            "-"
                        )} м²


                    </div>


                    <!-- ======================================
                         DETAILS BUTTON
                         ====================================== -->

                    <button
                        class="details-btn"
                        type="button"
                    >
                        Подробнее
                    </button>


                    ${telegramButton}


                </div>

            `;


            // ==================================================
            // DETAILS BUTTON EVENT
            // ==================================================

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


            // ==================================================
            // IMAGE ERROR
            // ==================================================

            const imageElement =
                card.querySelector(
                    ".card-image"
                );


            if (imageElement) {

                imageElement.addEventListener(
                    "error",
                    () => {

                        if (
                            imageElement.dataset.failed
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


            // ==================================================
            // ADD CARD
            // ==================================================

            container.appendChild(
                card
            );

        }
    );

}


// ============================================================
// ESCAPE HTML
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
// CLEAR FILTERS
// ============================================================

function clearFilters() {

    const search =
        document.getElementById(
            "search"
        );


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

        search.value = "";

    }


    if (district) {

        district.value = "";

    }


    if (rooms) {

        rooms.value = "";

    }


    if (minPrice) {

        minPrice.value = "";

    }


    if (maxPrice) {

        maxPrice.value = "";

    }


    visiblePosts =
        [...allPosts];


    renderPosts(
        visiblePosts
    );

}


// ============================================================
// OPTIONAL GLOBAL ACCESS
// ============================================================

window.loadPosts =
    loadPosts;


window.filterPosts =
    filterPosts;


window.renderPosts =
    renderPosts;


window.clearFilters =
    clearFilters;