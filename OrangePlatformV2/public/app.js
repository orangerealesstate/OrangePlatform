console.log("🔥 ORANGE APP.JS LOADED");

let allPosts = [];

const telegramWebApp =
    window.Telegram?.WebApp;


if (telegramWebApp) {

    telegramWebApp.ready();

    telegramWebApp.expand();

}


const telegramUserId =
    telegramWebApp?.initDataUnsafe?.user?.id || null;


console.log(
    "🔥 TELEGRAM USER ID:",
    telegramUserId
);


/* =========================================================
   LOAD POSTS
========================================================= */

async function loadPosts() {

    try {

        /* =====================================================
           APP STATISTICS
        ===================================================== */

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

            ).catch(
                err =>
                    console.log(
                        "Stats error:",
                        err
                    )
            );

        }


        /* =====================================================
           LOAD POSTS
        ===================================================== */

        const response =
            await fetch(
                "/api/posts?t=" +
                Date.now(),
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


        console.log(
            "Posts received:",
            allPosts.length
        );


        renderPosts(
            allPosts
        );


        hideLoader();

    }

    catch (err) {

        console.error(
            err
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
   HIDE LOADER
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
        (post) => {


            /*
               ВАЖНО:
               Не используем index из filtered массива
               для управления фотографиями.
            */

            const postIndex =
                allPosts.findIndex(
                    p =>
                        String(p.id) ===
                        String(post.id)
                );


            const images =

                Array.isArray(
                    post.images
                ) && post.images.length

                    ? post.images

                    : [
                        "https://via.placeholder.com/600x400?text=No+Photo"
                    ];


            const district =
                post.district || "-";


            const currentImage =
                currentCardImage[
                    postIndex
                ] || 0;


            const image =
                images[currentImage] ||
                images[0];


            /* =================================================
               CARD
            ================================================= */

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "card";


            card.innerHTML = `

                <div
                    class="card-slider"
                    data-post-index="${postIndex}"
                >


                    <button
                        type="button"
                        class="prev-btn"
                        data-action="prev"
                        data-index="${postIndex}"
                    >
                        ◀
                    </button>


                    <img
                        id="card-image-${postIndex}"
                        src="${image.startsWith("http")
                            ? image
                            : "/" + image}"
                        class="card-image"
                        data-action="gallery"
                        data-index="${postIndex}"
                    >


                    <button
                        type="button"
                        class="next-btn"
                        data-action="next"
                        data-index="${postIndex}"
                    >
                        ▶
                    </button>


                    <div
                        class="card-photo-counter"
                        id="card-counter-${postIndex}"
                    >
                        ${currentImage + 1} / ${images.length}
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
                        data-action="details"
                        data-id="${post.id}"
                    >
                        Подробнее
                    </button>


                </div>

            `;


            container.appendChild(
                card
            );


            /* =================================================
               PREVIOUS PHOTO
            ================================================= */

            const prevBtn =
                card.querySelector(
                    '[data-action="prev"]'
                );


            prevBtn.addEventListener(
                "click",
                (event) => {

                    event.preventDefault();

                    event.stopPropagation();


                    prevCardImage(
                        postIndex
                    );

                }
            );


            /* =================================================
               NEXT PHOTO
            ================================================= */

            const nextBtn =
                card.querySelector(
                    '[data-action="next"]'
                );


            nextBtn.addEventListener(
                "click",
                (event) => {

                    event.preventDefault();

                    event.stopPropagation();


                    nextCardImage(
                        postIndex
                    );

                }
            );


            /* =================================================
               IMAGE CLICK
            ================================================= */

            const imageElement =
                card.querySelector(
                    '[data-action="gallery"]'
                );


            imageElement.addEventListener(
                "click",
                (event) => {

                    event.preventDefault();

                    event.stopPropagation();


                    openGallery(
                        postIndex
                    );

                }
            );


            /* =================================================
               DETAILS
            ================================================= */

            const detailsBtn =
                card.querySelector(
                    '[data-action="details"]'
                );


            detailsBtn.addEventListener(
                "click",
                (event) => {

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
   FILTER
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

        console.log(
            "Filter elements missing"
        );

        return;

    }


    const district =
        districtEl.value
            .toLowerCase()
            .trim();


    const rooms =
        roomsEl.value;


    const minPrice =
        Number(
            minPriceEl.value
        ) || 0;


    const maxPrice =
        Number(
            maxPriceEl.value
        ) || 999999999;


    const filtered =
        allPosts.filter(
            post => {


                const postText =
                    (
                        post.text || ""
                    )
                    .toLowerCase();


                const postDistrict =
                    (
                        post.district || ""
                    )
                    .toLowerCase();


                const postRooms =
                    Number(
                        post.rooms
                    ) || 0;


                const postPrice =
                    Number(
                        post.price
                    ) || 0;


                /* =============================================
                   DISTRICT
                ============================================= */

                if (

                    district &&

                    !postDistrict.includes(
                        district
                    ) &&

                    !postText.includes(
                        district
                    )

                ) {

                    return false;

                }


                /* =============================================
                   ROOMS
                ============================================= */

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


                /* =============================================
                   PRICE
                ============================================= */

                if (
                    postPrice <
                    minPrice
                ) {

                    return false;

                }


                if (
                    postPrice >
                    maxPrice
                ) {

                    return false;

                }


                return true;

            }
        );


    renderPosts(
        filtered
    );


    hideLoader();

}


/* =========================================================
   CARD PHOTO INDEX
========================================================= */

const currentCardImage = {};


/* =========================================================
   NEXT CARD PHOTO
========================================================= */

function nextCardImage(index) {

    const post =
        allPosts[index];


    if (
        !post ||
        !Array.isArray(
            post.images
        ) ||
        post.images.length < 2
    ) {

        return;

    }


    currentCardImage[index] =

        (
            (
                currentCardImage[index] ||
                0
            ) + 1
        )
        %
        post.images.length;


    updateCardImage(
        index
    );

}


/* =========================================================
   PREVIOUS CARD PHOTO
========================================================= */

function prevCardImage(index) {

    const post =
        allPosts[index];


    if (
        !post ||
        !Array.isArray(
            post.images
        ) ||
        post.images.length < 2
    ) {

        return;

    }


    currentCardImage[index] =

        (
            (
                currentCardImage[index] ||
                0
            ) -
            1 +
            post.images.length
        )
        %
        post.images.length;


    updateCardImage(
        index
    );

}


/* =========================================================
   UPDATE CARD IMAGE
========================================================= */

function updateCardImage(index) {

    const post =
        allPosts[index];


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


    const imageIndex =
        currentCardImage[index] || 0;


    const image =
        images[imageIndex];


    const imageElement =
        document.getElementById(
            `card-image-${index}`
        );


    const counter =
        document.getElementById(
            `card-counter-${index}`
        );


    if (imageElement) {

        imageElement.src =
            image.startsWith("http")
                ? image
                : "/" + image;

    }


    if (counter) {

        counter.textContent =

            `${imageIndex + 1} / ${images.length}`;

    }

}


/* =========================================================
   OPEN GALLERY
========================================================= */

function openGallery(index) {

    const post =
        allPosts[index];


    if (
        !post ||
        !post.images ||
        post.images.length === 0
    ) {

        return;

    }


    let current =
        currentCardImage[index] || 0;


    const viewer =
        document.createElement(
            "div"
        );


    viewer.id =
        "viewer";


    viewer.innerHTML = `

        <div class="viewer">


            <button
                id="closeViewer"
                type="button"
            >
                ✕
            </button>


            <button
                id="prevPhoto"
                type="button"
            >
                ◀
            </button>


            <img
                id="galleryImage"
                src="${
                    post.images[current].startsWith("http")
                        ? post.images[current]
                        : "/" + post.images[current]
                }"
            >


            <button
                id="nextPhoto"
                type="button"
            >
                ▶
            </button>


            <div id="counter">

                ${current + 1}
                /
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


    /* =====================================================
       NEXT
    ===================================================== */

    document.getElementById(
        "nextPhoto"
    ).addEventListener(
        "click",
        (event) => {

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


            counter.innerHTML =

                `${current + 1} / ${post.images.length}`;

        }
    );


    /* =====================================================
       PREVIOUS
    ===================================================== */

    document.getElementById(
        "prevPhoto"
    ).addEventListener(
        "click",
        (event) => {

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


            counter.innerHTML =

                `${current + 1} / ${post.images.length}`;

        }
    );


    /* =====================================================
       CLOSE
    ===================================================== */

    document.getElementById(
        "closeViewer"
    ).addEventListener(
        "click",
        (event) => {

            event.preventDefault();

            event.stopPropagation();


            viewer.remove();

        }
    );


    /* =====================================================
       BACKGROUND CLOSE
    ===================================================== */

    viewer.addEventListener(
        "click",
        (event) => {

            if (
                event.target ===
                viewer
            ) {

                viewer.remove();

            }

        }
    );

}


/* =========================================================
   FIRST LOAD
========================================================= */

loadPosts();


/* =========================================================
   AUTO REFRESH
   EVERY 30 SECONDS
========================================================= */

setInterval(
    async () => {

        try {

            const response =
                await fetch(
                    "/api/posts?t=" +
                    Date.now(),
                    {
                        cache: "no-store"
                    }
                );


            if (!response.ok) {

                return;

            }


            const posts =
                await response.json();


            /*
               მხოლოდ რაოდენობის ცვლილებაზე
               აღარ ვამოწმებთ — თუ პოსტი შეიცვალა
               (მაგ. ფოტო/ფასი), განვაახლოთ.
            */

            const oldIds =
                allPosts
                    .map(
                        p =>
                            String(p.id)
                    )
                    .join(",");


            const newIds =
                posts
                    .map(
                        p =>
                            String(p.id)
                    )
                    .join(",");


            const changed =
                oldIds !== newIds ||
                JSON.stringify(posts)
                    !==
                JSON.stringify(allPosts);


            if (changed) {

                allPosts =
                    posts;


                filterPosts();

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