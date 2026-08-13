const params = new URLSearchParams(window.location.search);
const id = params.get("id");

const tg = window.Telegram?.WebApp;

if (tg) {
    tg.ready();
    tg.expand();
}

const ADMIN_IDS = [
    5172653731
];

const telegramUserId =
    tg?.initDataUnsafe?.user?.id || null;

let currentImages = [];
let currentIndex = 0;


/* =========================================================
   ADMIN CHECK
========================================================= */

function isAdmin() {

    const userId =
        Number(
            tg?.initDataUnsafe?.user?.id
        );

    return ADMIN_IDS.includes(
        userId
    );
}


/* =========================================================
   LOAD DETAILS
========================================================= */

async function loadDetails() {

    try {

        const res =
            await fetch(
                `/api/post/${id}?t=${Date.now()}`,
                {
                    cache: "no-store"
                }
            );


        if (!res.ok) {

            throw new Error(
                "Post not found"
            );

        }


        const post =
            await res.json();


        console.log(
            "TELEGRAM LINK:",
            post.telegramLink
        );


        console.log(
            "POST DATE:",
            post.date
        );


        /* =====================================================
           POST STATS
        ===================================================== */

        if (
            telegramUserId &&
            id
        ) {

            fetch(
                "/api/stats/post",
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        userId:
                            telegramUserId,

                        postId:
                            id

                    })

                }

            ).catch(
                err =>
                    console.log(
                        "Post stats error:",
                        err
                    )
            );

        }


        /* =====================================================
           TELEGRAM BUTTON
        ===================================================== */

        const telegramBtn =
            document.getElementById(
                "telegramBtn"
            );


        if (telegramBtn) {

            if (
                post.telegramLink
            ) {

                telegramBtn.onclick =
                    () => {

                        if (
                            tg?.openTelegramLink
                        ) {

                            tg.openTelegramLink(
                                post.telegramLink
                            );

                        }

                        else {

                            window.open(
                                post.telegramLink,
                                "_blank"
                            );

                        }

                    };

            }

            else {

                telegramBtn.style.display =
                    "none";

            }

        }


        /* =====================================================
           IMAGES
        ===================================================== */

        currentImages =
            Array.isArray(
                post.images
            )
                ? post.images
                : [];


        currentIndex = 0;


        let images = "";


        if (
            currentImages.length > 0
        ) {

            images = `

                <div class="image-wrapper">

                    <button
                        class="gallery-prev"
                        onclick="prevImage()"
                    >
                        ❮
                    </button>


                    <img
                        id="mainImage"
                        src="/${currentImages[0]}"
                        class="main-image"
                        onclick="
                            openImage(
                                '/' +
                                currentImages[currentIndex]
                            )
                        "
                    >


                    <button
                        class="gallery-next"
                        onclick="nextImage()"
                    >
                        ❯
                    </button>


                    <div class="photo-count">

                        📷

                        <span id="photoNumber">
                            1
                        </span>

                        /
                        ${currentImages.length}

                    </div>

                </div>

            `;

        }


        /* =====================================================
           DATE
        ===================================================== */

        let postDate = "-";


        if (post.date) {

            const timestamp =
                Number(post.date);


            if (
                Number.isFinite(
                    timestamp
                )
            ) {

                postDate =

                    new Date(
                        timestamp * 1000
                    ).toLocaleDateString(
                        "ru-RU"
                    );

            }

            else {

                const parsed =
                    new Date(
                        post.date
                    );


                if (
                    !isNaN(
                        parsed.getTime()
                    )
                ) {

                    postDate =
                        parsed.toLocaleDateString(
                            "ru-RU"
                        );

                }

            }

        }


        /* =====================================================
           ADMIN BUTTONS
        ===================================================== */

        const adminButtons =
            isAdmin()

                ? `

                    <div
                        class="admin-buttons"
                        style="
                            display:flex;
                            gap:10px;
                            margin-top:20px;
                        "
                    >

                        <button
                            id="editBtn"
                            class="edit-btn"
                            type="button"
                        >
                            ✏️ Редактировать
                        </button>


                        <button
                            id="deleteBtn"
                            class="delete-btn"
                            type="button"
                        >
                            🗑️ Удалить
                        </button>

                    </div>

                `

                : "";


        /* =====================================================
           CONTENT
        ===================================================== */

        document.getElementById(
            "content"
        ).innerHTML = `

            <div class="details-container">


                <header
                    class="details-header"
                >
                    🍊 Orange Real Estate
                </header>


                <div class="title-block">


                    <button
                        class="back-btn"
                        onclick="history.back()"
                    >
                        ← Назад
                    </button>


                    <h2>
                        🏠 Сдается
                        ${post.rooms || "-"}-комнатная
                        квартира в
                        ${post.district || "-"}
                    </h2>


                    <div class="price">
                        $${post.price || "-"}
                    </div>


                    <div
                        class="publish-date green-date"
                    >
                        🕐 ${postDate}
                    </div>


                </div>


                <div class="gallery">
                    ${images}
                </div>


                <div class="stats-grid">


                    <div class="stat-card">
                        <div class="icon">📍</div>
                        <div class="value">
                            ${post.district || "-"}
                        </div>
                        <div class="label">
                            Район
                        </div>
                    </div>


                    <div class="stat-card">
                        <div class="icon">📌</div>
                        <div class="value">
                            ${post.street || "-"}
                        </div>
                        <div class="label">
                            Улица
                        </div>
                    </div>


                    <div class="stat-card">
                        <div class="icon">🚪</div>
                        <div class="value">
                            ${post.rooms || "-"}
                        </div>
                        <div class="label">
                            Комнаты
                        </div>
                    </div>


                    <div class="stat-card">
                        <div class="icon">🛏</div>
                        <div class="value">
                            ${post.bedrooms || "-"}
                        </div>
                        <div class="label">
                            Спальни
                        </div>
                    </div>


                    <div class="stat-card">
                        <div class="icon">📐</div>
                        <div class="value">
                            ${post.area || "-"}
                        </div>
                        <div class="label">
                            м²
                        </div>
                    </div>


                    <div class="stat-card">
                        <div class="icon">🏢</div>
                        <div class="value">
                            ${post.floor || "-"}
                        </div>
                        <div class="label">
                            Этаж
                        </div>
                    </div>


                    <div class="stat-card">
                        <div class="icon">💰</div>
                        <div class="value">
                            $${post.price || "-"}
                        </div>
                        <div class="label">
                            Цена
                        </div>
                    </div>


                </div>


                ${adminButtons}


            </div>

        `;


        /* =====================================================
           SHARE
        ===================================================== */

        const shareBtn =
            document.getElementById(
                "shareBtn"
            );


        if (shareBtn) {

            shareBtn.onclick =
                () => sharePost(post);

        }


        /* =====================================================
           MAP
        ===================================================== */

        const mapBtn =
            document.getElementById(
                "mapBtn"
            );


        if (mapBtn) {

            mapBtn.onclick =
                () => {

                    const address =

                        `${post.street || ""}, ` +
                        `${post.district || ""}, ` +
                        `Tbilisi`;


                    window.open(

                        `https://yandex.com/maps/?text=${
                            encodeURIComponent(
                                address
                            )
                        }`,

                        "_blank"

                    );

                };

        }


        /* =====================================================
           AGENT
        ===================================================== */

        const agentBtn =
            document.getElementById(
                "agentBtn"
            );


        if (agentBtn) {

            agentBtn.onclick =
                () => {

                    if (
                        tg?.openTelegramLink
                    ) {

                        tg.openTelegramLink(
                            "https://t.me/Orangerealestatetbilisi"
                        );

                    }

                    else {

                        window.open(
                            "https://t.me/Orangerealestatetbilisi",
                            "_blank"
                        );

                    }

                };

        }


        /* =====================================================
           EDIT
        ===================================================== */

        const editBtn =
            document.getElementById(
                "editBtn"
            );


        if (editBtn) {

            editBtn.onclick =
                () => {

                    if (!isAdmin()) {

                        alert(
                            "🚫 У вас нет доступа."
                        );

                        return;

                    }


                    window.location.href =
                        `edit.html?id=${post.id}`;

                };

        }


        /* =====================================================
           DELETE
        ===================================================== */

        const deleteBtn =
            document.getElementById(
                "deleteBtn"
            );


        if (deleteBtn) {

            deleteBtn.onclick =
                async () => {

                    if (!isAdmin()) {

                        alert(
                            "🚫 У вас нет доступа."
                        );

                        return;

                    }


                    const confirmed =
                        confirm(
                            "🗑 Удалить объявление?"
                        );


                    if (!confirmed) {

                        return;

                    }


                    try {

                        const response =
                            await fetch(
                                "/api/post/delete",
                                {

                                    method:
                                        "POST",

                                    headers: {

                                        "Content-Type":
                                            "application/json"

                                    },

                                    body:
                                        JSON.stringify({

                                            id:
                                                post.id,

                                            userId:
                                                telegramUserId

                                        })

                                }
                            );


                        const result =
                            await response.json();


                        if (
                            result.success
                        ) {

                            alert(
                                "✅ Объявление удалено"
                            );


                            window.location.href =
                                "/";

                        }

                        else {

                            alert(
                                "❌ Ошибка удаления"
                            );

                        }

                    }

                    catch (err) {

                        console.error(
                            "Delete error:",
                            err
                        );


                        alert(
                            "❌ Ошибка удаления"
                        );

                    }

                };

        }


    }

    catch (err) {

        console.error(err);


        const content =
            document.getElementById(
                "content"
            );


        if (content) {

            content.innerHTML = `

                <h2
                    style="
                        text-align:center;
                        padding:40px;
                    "
                >
                    Ошибка загрузки квартиры
                </h2>

            `;

        }

    }

}


/* =========================================================
   SHARE
========================================================= */

function sharePost(post) {

    if (
        !post.telegramLink
    ) {

        alert(
            "Telegram-пост для этого объявления не найден"
        );

        return;

    }


    const shareUrl =

        "https://t.me/share/url?url=" +

        encodeURIComponent(
            post.telegramLink
        );


    if (
        tg?.openTelegramLink
    ) {

        tg.openTelegramLink(
            shareUrl
        );

    }

    else {

        window.open(
            shareUrl,
            "_blank"
        );

    }

}


/* =========================================================
   OPEN IMAGE
========================================================= */

function openImage(src) {

    currentIndex =

        currentImages.findIndex(

            img =>
                "/" + img === src

        );


    if (
        currentIndex === -1
    ) {

        currentIndex = 0;

    }


    const viewer =
        document.getElementById(
            "viewer"
        );


    const viewerImage =
        document.getElementById(
            "viewerImage"
        );


    if (
        viewer &&
        viewerImage
    ) {

        viewer.style.display =
            "flex";


        viewerImage.src =
            src;

    }

}


/* =========================================================
   CLOSE IMAGE
========================================================= */

function closeImage() {

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
   PREVIOUS IMAGE
========================================================= */

function prevImage() {

    if (
        currentImages.length <= 1
    ) {

        return;

    }


    currentIndex--;


    if (
        currentIndex < 0
    ) {

        currentIndex =
            currentImages.length - 1;

    }


    updateGallery();

}


/* =========================================================
   NEXT IMAGE
========================================================= */

function nextImage() {

    if (
        currentImages.length <= 1
    ) {

        return;

    }


    currentIndex++;


    if (
        currentIndex >=
        currentImages.length
    ) {

        currentIndex = 0;

    }


    updateGallery();

}


/* =========================================================
   UPDATE GALLERY
========================================================= */

function updateGallery() {

    const mainImage =
        document.getElementById(
            "mainImage"
        );


    const photoNumber =
        document.getElementById(
            "photoNumber"
        );


    const viewerImage =
        document.getElementById(
            "viewerImage"
        );


    if (mainImage) {

        mainImage.src =

            "/" +
            currentImages[
                currentIndex
            ];

    }


    if (photoNumber) {

        photoNumber.textContent =
            currentIndex + 1;

    }


    if (viewerImage) {

        viewerImage.src =

            "/" +
            currentImages[
                currentIndex
            ];

    }

}


/* =========================================================
   KEYBOARD
========================================================= */

document.addEventListener(
    "keydown",
    (e) => {

        if (
            e.key === "Escape"
        ) {

            closeImage();

        }


        if (
            e.key === "ArrowLeft"
        ) {

            prevImage();

        }


        if (
            e.key === "ArrowRight"
        ) {

            nextImage();

        }

    }
);


/* =========================================================
   CLOSE VIEWER
========================================================= */

document.addEventListener(
    "click",
    (e) => {

        const viewer =
            document.getElementById(
                "viewer"
            );


        if (
            viewer &&
            e.target === viewer
        ) {

            closeImage();

        }

    }
);


/* =========================================================
   START
========================================================= */

loadDetails();