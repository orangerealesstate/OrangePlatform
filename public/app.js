let allPosts = [];
let visiblePosts = [];


// =========================
// LOAD POSTS
// =========================

async function loadPosts() {

    try {

        const response = await fetch(
            `/api/posts?t=${Date.now()}`,
            {
                cache: "no-store"
            }
        );


        if (!response.ok) {
            throw new Error("Server error");
        }


        const rawPosts = await response.json();


        console.log(
            "📦 RAW POSTS:",
            rawPosts.length
        );


        // ==========================================
        // REMOVE TELEGRAM ALBUM DUPLICATES
        // ==========================================

        const groups = new Map();


        rawPosts.forEach((post) => {

            const groupKey =
                post.groupId !== undefined &&
                post.groupId !== null &&
                String(post.groupId).trim()
                    ? String(post.groupId).trim()
                    : `single-${post.id}`;


            const existing =
                groups.get(groupKey);


            if (!existing) {

                groups.set(
                    groupKey,
                    post
                );

                return;
            }


            const existingText =
                String(
                    existing.text || ""
                ).trim();


            const currentText =
                String(
                    post.text || ""
                ).trim();


            /*
             * თუ ერთი groupId-ის რამდენიმე ჩანაწერია,
             * ვინახავთ იმ ჩანაწერს, რომელსაც
             * უფრო სრული ტექსტი აქვს.
             */

            if (
                currentText.length >
                existingText.length
            ) {

                groups.set(
                    groupKey,
                    post
                );

            }

            else if (
                currentText.length ===
                existingText.length
            ) {

                if (
                    (post.images?.length || 0) >
                    (existing.images?.length || 0)
                ) {

                    groups.set(
                        groupKey,
                        post
                    );
                }
            }

        });


        allPosts =
            Array.from(
                groups.values()
            );


        console.log(
            "✅ UNIQUE APARTMENTS:",
            allPosts.length
        );


        renderPosts(allPosts);


    } catch (err) {

        console.error(
            "❌ LOAD ERROR:",
            err
        );


        const container =
            document.getElementById(
                "posts"
            );


        if (container) {

            container.innerHTML = `
                <h2 style="
                    text-align:center;
                    padding:40px;
                ">
                    Ошибка загрузки объявлений
                </h2>
            `;
        }

    }

}



// =========================
// DISTRICT HELPER
// =========================

function getDistrict(post) {

    const text =
        String(
            post?.text || ""
        ).toLowerCase();


    const stored =
        String(
            post?.district || ""
        )
        .trim()
        .toLowerCase();


    const districts = [

        [
            "didi digomi",
            [
                "диди дигоми",
                "დიდი დიღომი",
                "didi digomi",
                "didi dighomi"
            ]
        ],

        [
            "saburtalo",
            [
                "сабуртало",
                "საბურთალო",
                "saburtalo"
            ]
        ],

        [
            "vake",
            [
                "ваке",
                "ვაკე",
                "vake"
            ]
        ],

        [
            "vera",
            [
                "вера",
                "ვერა",
                "vera"
            ]
        ],

        [
            "mtatsminda",
            [
                "мтацминда",
                "მთაწმინდა",
                "mtatsminda"
            ]
        ],

        [
            "krtsanisi",
            [
                "крцаниси",
                "კრწანისი",
                "krtsanisi"
            ]
        ],

        [
            "didube",
            [
                "дидубе",
                "დიდუბე",
                "didube"
            ]
        ],

        [
            "nadzaladevi",
            [
                "надзаладеви",
                "ნაძალადევი",
                "nadzaladevi"
            ]
        ],

        [
            "isani",
            [
                "исани",
                "ისანი",
                "isani"
            ]
        ],

        [
            "ortachala",
            [
                "ортачала",
                "ორთაჭალა",
                "ortachala"
            ]
        ],

        [
            "gldani",
            [
                "глдани",
                "გლდანი",
                "gldani"
            ]
        ],

        [
            "chughureti",
            [
                "чугурети",
                "ჩუღურეთი",
                "chughureti"
            ]
        ],

        [
            "sololaki",
            [
                "сололаки",
                "სოლოლაკი",
                "sololaki"
            ]
        ],

        [
            "avlabari",
            [
                "авлабари",
                "ავლაბარი",
                "avlabari"
            ]
        ],

        [
            "samgori",
            [
                "самгори",
                "სამგორი",
                "samgori"
            ]
        ],

        [
            "ponichala",
            [
                "поничала",
                "ფონიჭალა",
                "ponichala"
            ]
        ],

        [
            "dighomi",
            [
                "дигоми",
                "დიღომი",
                "dighomi"
            ]
        ]

    ];


    // =========================
    // CHECK STORED DISTRICT
    // =========================

    for (
        const [
            normalized,
            variants
        ]
        of districts
    ) {

        if (
            variants.some(
                value =>
                    stored.includes(value)
            )
        ) {

            return normalized;
        }

    }


    // =========================
    // CHECK TEXT
    // =========================

    for (
        const [
            normalized,
            variants
        ]
        of districts
    ) {

        if (
            variants.some(
                value =>
                    text.includes(value)
            )
        ) {

            return normalized;
        }

    }


    return "-";

}



// =========================
// NORMALIZE DISTRICT
// =========================

function normalizeDistrict(value) {

    return String(
        value || ""
    )
        .toLowerCase()
        .trim()
        .replace(/ё/g, "е")
        .replace(/\s+/g, " ");

}



// =========================
// RENDER POSTS
// =========================

function renderPosts(posts) {


    // ძალიან მნიშვნელოვანია:
    // ვინახავთ ზუსტად იმ ბინებს,
    // რომლებიც ამ მომენტში ჩანს

    visiblePosts =
        [...posts];


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



    posts.forEach(
        (post, index) => {


            // =========================
            // IMAGE
            // =========================

            let image =
                "https://via.placeholder.com/600x400?text=No+Photo";


            if (
                Array.isArray(
                    post.images
                ) &&
                post.images.length
            ) {

                const imagePath =
                    String(
                        post.images[0]
                    )
                    .replace(
                        /^\/+/,
                        ""
                    );


                image =
                    "/" +
                    imagePath +
                    "?v=" +
                    encodeURIComponent(
                        String(
                            post.id
                        )
                    );

            }



            console.log(
                "CARD:",
                post.id,
                "IMAGE:",
                post.images?.[0]
            );



            // =========================
            // DISTRICT
            // =========================

            const district =
                getDistrict(post);



            // =========================
            // CARD
            // =========================

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "card";


            card.innerHTML = `

                ${
                    post.status === "rented"
                        ? `
                            <div class="rented-badge">
                                🔴 СДАНО
                            </div>
                          `
                        : ""
                }


                <img
                    src="${image}"
                    class="card-image"
                    loading="lazy"
                    data-post-id="${post.id}"
                    alt="Apartment ${post.id}"
                >


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
                        class="details-btn"
                        type="button"
                    >
                        Подробнее
                    </button>


                    ${
                        post.telegramLink
                            ? `
                                <a
                                    class="telegram-btn"
                                    href="${post.telegramLink}"
                                    target="_blank"
                                    rel="noopener"
                                >
                                    📲 Смотреть в Telegram
                                </a>
                              `
                            : ""
                    }


                </div>

            `;



            // =========================
            // IMAGE CLICK
            // =========================

            const img =
                card.querySelector(
                    ".card-image"
                );


            if (img) {

                img.addEventListener(
                    "click",
                    function(event) {

                        event.stopPropagation();


                        console.log(
                            "🖼 CLICK IMAGE:",
                            post.id,
                            post.images?.[0]
                        );


                        openGallery(
                            String(
                                post.id
                            )
                        );

                    }
                );


                img.addEventListener(
                    "error",
                    function() {

                        console.error(
                            "❌ IMAGE ERROR:",
                            post.id,
                            post.images?.[0]
                        );


                        this.src =
                            "https://via.placeholder.com/600x400?text=No+Photo";

                    }
                );

            }



            // =========================
            // DETAILS BUTTON
            // =========================

            const detailsButton =
                card.querySelector(
                    ".details-btn"
                );


            if (detailsButton) {

                detailsButton.addEventListener(
                    "click",
                    function(event) {

                        event.stopPropagation();


                        location.href =
                            "details.html?id=" +
                            encodeURIComponent(
                                String(
                                    post.id
                                )
                            );

                    }
                );

            }



            // =========================
            // TELEGRAM BUTTON
            // =========================

            const telegramButton =
                card.querySelector(
                    ".telegram-btn"
                );


            if (telegramButton) {

                telegramButton.addEventListener(
                    "click",
                    function(event) {

                        event.stopPropagation();

                    }
                );

            }



            // =========================
            // ADD CARD
            // =========================

            container.appendChild(
                card
            );

        }
    );

}



// =========================
// FILTER
// =========================

function filterPosts() {


    const search =
        document.getElementById(
            "search"
        )
        ?.value
        .toLowerCase()
        .trim() || "";


    const selectedDistrict =
        normalizeDistrict(
            document.getElementById(
                "districtFilter"
            )
            ?.value || ""
        );


    const rooms =
        document.getElementById(
            "roomsFilter"
        )
        ?.value || "";


    const minPrice =
        Number(
            document.getElementById(
                "minPrice"
            )
            ?.value
        ) || 0;


    const maxPrice =
        Number(
            document.getElementById(
                "maxPrice"
            )
            ?.value
        ) || 99999999;



    const filtered =
        allPosts.filter(
            post => {


                const text =
                    String(
                        post.text || ""
                    )
                    .toLowerCase();


                const district =
                    normalizeDistrict(
                        getDistrict(
                            post
                        )
                    );


                const street =
                    String(
                        post.street || ""
                    )
                    .toLowerCase()
                    .trim();



                // =========================
                // SEARCH
                // =========================

                if (search) {

                    const searchable =
                        `${text} ${district} ${street}`
                        .toLowerCase();


                    if (
                        !searchable.includes(
                            search
                        )
                    ) {

                        return false;
                    }

                }



                // =========================
                // DISTRICT FILTER
                // =========================

                if (
                    selectedDistrict
                ) {

                    if (
                        district !==
                        selectedDistrict
                    ) {

                        return false;
                    }

                }



                // =========================
                // ROOMS
                // =========================

                const postRooms =
                    Number(
                        String(
                            post.rooms || ""
                        )
                        .replace(
                            /[^\d]/g,
                            ""
                        )
                    ) || 0;



                if (rooms) {

                    const selectedRooms =
                        Number(
                            rooms
                        );


                    // 5 = 5+
                    if (
                        selectedRooms ===
                        5
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
                            selectedRooms
                        ) {

                            return false;
                        }

                    }

                }



                // =========================
                // PRICE
                // =========================

                const postPrice =
                    Number(
                        String(
                            post.price || ""
                        )
                        .replace(
                            /[^\d.]/g,
                            ""
                        )
                    ) || 0;



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



    console.log(
        "🔎 FILTER:",
        filtered.length,
        "/",
        allPosts.length
    );


    renderPosts(
        filtered
    );

}



// =========================
// GALLERY
// =========================

let currentImages = [];
let currentIndex = 0;



function openGallery(id) {


    console.log(
        "🖼 Opening gallery for ID:",
        id
    );



    // აქ ვეძებთ მხოლოდ იმ ბინას,
    // რომელიც ამ მომენტში ჩანს

    const post =
        visiblePosts.find(
            p =>
                String(
                    p.id
                ) ===
                String(
                    id
                )
        );



    if (!post) {

        console.error(
            "❌ Apartment not found:",
            id
        );

        return;
    }



    console.log(
        "🏠 Apartment:",
        post.id,
        "Price:",
        post.price
    );



    // =========================
    // ONLY THIS APARTMENT IMAGES
    // =========================

    currentImages =
        Array.isArray(
            post.images
        )
            ? [...post.images]
            : [];



    currentIndex = 0;



    if (
        !currentImages.length
    ) {

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



// =========================
// UPDATE GALLERY
// =========================

function updateGallery() {


    if (
        !currentImages.length
    ) {

        return;
    }



    const imagePath =
        String(
            currentImages[
                currentIndex
            ]
        )
        .replace(
            /^\/+/,
            ""
        );



    const viewerImage =
        document.getElementById(
            "viewerImage"
        );


    if (!viewerImage) {

        console.error(
            "❌ #viewerImage not found"
        );

        return;
    }



    viewerImage.src =
        "/" +
        imagePath +
        "?v=" +
        Date.now();



    const counter =
        document.getElementById(
            "counter"
        );


    if (counter) {

        counter.innerHTML =
            `${currentIndex + 1} / ${currentImages.length}`;

    }

}



// =========================
// NEXT PHOTO
// =========================

function nextPhoto() {


    if (
        currentIndex <
        currentImages.length - 1
    ) {

        currentIndex++;


        updateGallery();

    }

}



// =========================
// PREVIOUS PHOTO
// =========================

function prevPhoto() {


    if (
        currentIndex > 0
    ) {

        currentIndex--;


        updateGallery();

    }

}



// =========================
// CLOSE VIEWER
// =========================

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



// =========================
// KEYBOARD
// =========================

document.addEventListener(
    "keydown",
    (e) => {


        if (
            e.key ===
            "Escape"
        ) {

            closeViewer();

        }


        if (
            e.key ===
            "ArrowRight"
        ) {

            nextPhoto();

        }


        if (
            e.key ===
            "ArrowLeft"
        ) {

            prevPhoto();

        }

    }
);



// =========================
// START
// =========================

loadPosts();