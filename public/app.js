let allPosts = [];
let visiblePosts = [];


// =========================
// LOAD POSTS
// =========================

async function loadPosts() {

    try {

        const response = await fetch(`/api/posts?t=${Date.now()}`, {
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error("Server error");
        }

        const data = await response.json();

        // ერთი და იგივე ID მხოლოდ ერთხელ
        const unique = new Map();

        data.forEach(post => {

            if (!post || !post.id) {
                return;
            }

            const id = String(post.id);

            if (!unique.has(id)) {
                unique.set(id, post);
            }

        });

        allPosts = Array.from(unique.values());

        console.log("📦 Всего объявлений:", data.length);
        console.log("✅ Уникальных объявлений:", allPosts.length);
        console.log(
            "🗑 Дубликатов:",
            data.length - allPosts.length
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

    // Очень важно:
    // сохраняем именно те квартиры,
    // которые сейчас показаны после фильтра
    visiblePosts = posts;

    const container = document.getElementById("posts");

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

        const image =
    post.images &&
    Array.isArray(post.images) &&
    post.images.length
        ? "/" + post.images[0] + "?post=" + post.id
        : "https://via.placeholder.com/600x400?text=No+Photo";


        // =========================
        // DISTRICT
        // =========================

        let district =
            post.district || "";


        if (post.text) {

            const text =
                post.text.toLowerCase();


            if (
                !district &&
                (
                    text.includes("сабуртало") ||
                    text.includes("saburtalo")
                )
            ) {
                district = "Saburtalo";
            }

            else if (
                !district &&
                (
                    text.includes("ваке") ||
                    text.includes("vake")
                )
            ) {
                district = "Vake";
            }

            else if (
                !district &&
                (
                    text.includes("вера") ||
                    text.includes("vera")
                )
            ) {
                district = "Vera";
            }

            else if (
                !district &&
                text.includes("исани")
            ) {
                district = "Isani";
            }

            else if (
                !district &&
                text.includes("ортачала")
            ) {
                district = "Ortachala";
            }

            else if (
                !district &&
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

        container.innerHTML += `

            <div class="card">

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

                    onclick="
                        event.stopPropagation();
                        openGallery('${post.id}')
                    "

                    onerror="
                        this.src='https://via.placeholder.com/600x400?text=No+Photo';
                    "
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

                        onclick="
                            location.href='details.html?id=${post.id}'
                        "
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
                                    onclick="
                                        event.stopPropagation()
                                    "
                                >
                                    📲 Смотреть в Telegram
                                </a>
                              `
                            : ""
                    }


                </div>

            </div>

        `;

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
                    postDistrict = "saburtalo";
                }

                else if (
                    text.includes("ваке") ||
                    text.includes("vake")
                ) {
                    postDistrict = "vake";
                }

                else if (
                    text.includes("вера") ||
                    text.includes("vera")
                ) {
                    postDistrict = "vera";
                }

                else if (
                    text.includes("исани")
                ) {
                    postDistrict = "isani";
                }

                else if (
                    text.includes("ортачала")
                ) {
                    postDistrict = "ortachala";
                }

                else if (
                    text.includes("диди дигоми")
                ) {
                    postDistrict = "didi digomi";
                }

            }


            // ქართული/რუსული/ინგლისური ვარიანტების
            // ნორმალიზაცია

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


            // თუ rooms ცარიელია,
            // ვცდილობთ ტექსტიდან ამოვიღოთ

            if (!postRooms && text) {

                const roomMatch =
                    text.match(
                        /количество комнат\s*:\s*(\d+)/i
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

                }

                else {

                    if (
                        postRooms !== selectedRooms
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


    // აქ უკვე მხოლოდ გაფილტრულ ბინებს
    // ვაჩვენებთ

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


    // ვეძებთ მხოლოდ იმ ბინას,
    // რომლის ID-საც დავაჭირეთ

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


    // მხოლოდ ამ ბინის ფოტოები

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


    const image =
        document.getElementById(
            "viewerImage"
        );


    const counter =
        document.getElementById(
            "counter"
        );


    if (!image) {
        return;
    }


    image.src =
        "/" +
        currentImages[currentIndex];


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