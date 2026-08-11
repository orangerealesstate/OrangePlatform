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

        allPosts = await response.json();

        console.log(
            "✅ Loaded posts:",
            allPosts.length
        );

        renderPosts(allPosts);

    } catch (err) {

        console.error(err);

        document.getElementById("posts").innerHTML = `
            <h2 style="
                text-align:center;
                padding:40px;
            ">
                Ошибка загрузки объявлений
            </h2>
        `;
    }
}


// =========================
// RENDER POSTS
// =========================

function renderPosts(posts) {

    // ძალიან მნიშვნელოვანია:
    // ვინახავთ ზუსტად იმ ბინებს,
    // რომლებიც ამ მომენტში ჩანს
    visiblePosts = [...posts];

    const container =
        document.getElementById("posts");

    if (!container) {
        console.error("❌ #posts not found");
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


    posts.forEach((post, index) => {

        // =========================
        // IMAGE
        // =========================

        let image =
            "https://via.placeholder.com/600x400?text=No+Photo";


        if (
            Array.isArray(post.images) &&
            post.images.length
        ) {

            const imagePath =
                String(post.images[0])
                    .replace(/^\/+/, "");

            image =
                "/" +
                imagePath +
                "?v=" +
                encodeURIComponent(
                    String(post.id)
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

        let district =
            String(post.district || "")
                .trim();


        if (
            (!district || district === "-") &&
            post.text
        ) {

            const text =
                String(post.text)
                    .toLowerCase();


            if (
                text.includes("сабуртало") ||
                text.includes("saburtalo")
            ) {

                district = "Saburtalo";

            }

            else if (
                text.includes("ваке") ||
                text.includes("vake")
            ) {

                district = "Vake";

            }

            else if (
                text.includes("вера") ||
                text.includes("vera")
            ) {

                district = "Vera";

            }

            else if (
                text.includes("исани")
            ) {

                district = "Isani";

            }

            else if (
                text.includes("ортачала")
            ) {

                district = "Ortachala";

            }

            else if (
                text.includes("диди дигоми")
            ) {

                district = "Didi Digomi";
            }
        }


        if (!district) {
            district = "-";
        }


        // =========================
        // CARD
        // =========================

        const card =
            document.createElement("div");

        card.className = "card";


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
            card.querySelector(".card-image");


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
                        String(post.id)
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
            card.querySelector(".details-btn");


        if (detailsButton) {

            detailsButton.addEventListener(
                "click",
                function(event) {

                    event.stopPropagation();

                    location.href =
                        "details.html?id=" +
                        encodeURIComponent(
                            String(post.id)
                        );
                }
            );
        }


        // =========================
        // ADD CARD
        // =========================

        container.appendChild(card);

    });

}


// =========================
// FILTER
// =========================

function filterPosts() {

    const search =
        document.getElementById("search")
            ?.value
            .toLowerCase()
            .trim() || "";


    const district =
        document.getElementById("districtFilter")
            ?.value
            .toLowerCase()
            .trim() || "";


    const rooms =
        document.getElementById("roomsFilter")
            ?.value || "";


    const minPrice =
        Number(
            document.getElementById("minPrice")
                ?.value
        ) || 0;


    const maxPrice =
        Number(
            document.getElementById("maxPrice")
                ?.value
        ) || 99999999;


    const filtered =
        allPosts.filter(post => {

            // =========================
            // TEXT
            // =========================

            const text =
                String(post.text || "")
                    .toLowerCase();


            // =========================
            // DISTRICT
            // =========================

            let postDistrict =
                String(post.district || "")
                    .toLowerCase()
                    .trim();


            if (!postDistrict) {

                if (
                    text.includes("сабуртало") ||
                    text.includes("saburtalo")
                ) {

                    postDistrict =
                        "saburtalo";

                }

                else if (
                    text.includes("ваке") ||
                    text.includes("vake")
                ) {

                    postDistrict =
                        "vake";

                }

                else if (
                    text.includes("вера") ||
                    text.includes("vera")
                ) {

                    postDistrict =
                        "vera";

                }

                else if (
                    text.includes("исани")
                ) {

                    postDistrict =
                        "isani";

                }

                else if (
                    text.includes("ортачала")
                ) {

                    postDistrict =
                        "ortachala";

                }

                else if (
                    text.includes("დidi дигomi") ||
                    text.includes("диди дигоми")
                ) {

                    postDistrict =
                        "didi digomi";
                }
            }


            // =========================
            // NORMALIZE DISTRICT
            // =========================

            const normalizedDistrict =
                postDistrict
                    .replace("сабуртало", "saburtalo")
                    .replace("საბურთალო", "saburtalo")
                    .replace("ваке", "vake")
                    .replace("ვაკე", "vake")
                    .replace("вера", "vera")
                    .replace("ვერა", "vera");


            const selectedDistrict =
                district
                    .replace("сაბურთало", "saburtalo")
                    .replace("сабуртало", "saburtalo")
                    .replace("საბურთალო", "saburtalo")
                    .replace("ваке", "vake")
                    .replace("ვაკე", "vake")
                    .replace("вера", "vera")
                    .replace("ვერა", "vera");


            // =========================
            // ROOMS
            // =========================

            let postRooms =
                Number(post.rooms) || 0;


            if (!postRooms && text) {

                const roomMatch =
                    text.match(
                        /количество\s*комнат\s*:\s*(\d+)/i
                    );

                if (roomMatch) {

                    postRooms =
                        Number(roomMatch[1]);
                }
            }


            // =========================
            // PRICE
            // =========================

            const postPrice =
                Number(
                    String(post.price || "")
                        .replace(/[^\d.]/g, "")
                ) || 0;


            // =========================
            // SEARCH
            // =========================

            if (search) {

                if (
                    !text.includes(search) &&
                    !normalizedDistrict.includes(search)
                ) {

                    return false;
                }
            }


            // =========================
            // DISTRICT FILTER
            // =========================

            if (selectedDistrict) {

                if (
                    !normalizedDistrict.includes(
                        selectedDistrict
                    )
                ) {

                    return false;
                }
            }


            // =========================
            // ROOMS FILTER
            // =========================

            if (rooms) {

                const selectedRooms =
                    Number(rooms);


                if (selectedRooms === 5) {

                    if (postRooms < 5) {
                        return false;
                    }

                } else {

                    if (
                        postRooms !==
                        selectedRooms
                    ) {

                        return false;
                    }
                }
            }


            // =========================
            // PRICE FILTER
            // =========================

            if (postPrice < minPrice) {
                return false;
            }


            if (postPrice > maxPrice) {
                return false;
            }


            return true;

        });


    // მხოლოდ გაფილტრულ ბინებს ვაჩვენებთ
    renderPosts(filtered);
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


    const post =
        visiblePosts.find(
            p =>
                String(p.id) ===
                String(id)
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


    currentImages =
        Array.isArray(post.images)
            ? [...post.images]
            : [];


    currentIndex = 0;


    if (!currentImages.length) {

        console.warn(
            "No images for:",
            post.id
        );

        return;
    }


    const viewer =
        document.getElementById("viewer");


    if (!viewer) {

        console.error(
            "❌ #viewer not found"
        );

        return;
    }


    viewer.style.display = "block";

    updateGallery();
}


// =========================
// UPDATE GALLERY
// =========================

function updateGallery() {

    if (!currentImages.length) {
        return;
    }


    const imagePath =
        String(
            currentImages[currentIndex]
        )
        .replace(/^\/+/, "");


    document.getElementById(
        "viewerImage"
    ).src =
        "/" +
        imagePath +
        "?v=" +
        Date.now();


    document.getElementById(
        "counter"
    ).innerHTML =
        `${currentIndex + 1} / ${currentImages.length}`;
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

    if (currentIndex > 0) {

        currentIndex--;

        updateGallery();
    }
}


// =========================
// CLOSE
// =========================

function closeViewer() {

    const viewer =
        document.getElementById("viewer");

    if (viewer) {
        viewer.style.display = "none";
    }
}


// =========================
// KEYBOARD
// =========================

document.addEventListener(
    "keydown",
    (e) => {

        if (e.key === "Escape") {
            closeViewer();
        }

        if (e.key === "ArrowRight") {
            nextPhoto();
        }

        if (e.key === "ArrowLeft") {
            prevPhoto();
        }
    }
);


// =========================
// START
// =========================

loadPosts();