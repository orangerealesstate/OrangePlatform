alert("NEW APP.JS");
let allPosts = [];
/* =========================
   LANGUAGE SYSTEM
   🇬🇪 ქართული
   🇷🇺 Русский
   🇬🇧 English
========================= */

const translations = {

    ru: {
        catalog: "Каталог",
        filter: "Фильтр",
        map: "Карта",
        allDistricts: "Все районы",
        rooms: "Комнаты",
        minPrice: "Цена от",
        maxPrice: "Цена до",
        find: "Найти",
        clear: "Очистить",

        district: "Район:",
        address: "Адрес:",
        roomsLabel: "Комнат:",
        area: "Площадь:",
        details: "Подробнее",
        telegram: "📲 Оригинал поста в Telegram",

        loading: "Загрузка...",
        notFound: "Объявления не найдены",
        error: "❌ Ошибка загрузки объявлений"
    },

    ka: {
        catalog: "კატალოგი",
        filter: "ფილტრი",
        map: "რუკა",
        allDistricts: "ყველა უბანი",
        rooms: "ოთახები",
        minPrice: "ფასი მინ.",
        maxPrice: "ფასი მაქს.",
        find: "ძებნა",
        clear: "გასუფთავება",

        district: "უბანი:",
        address: "მისამართი:",
        roomsLabel: "ოთახი:",
        area: "ფართობი:",
        details: "დეტალურად",
        telegram: "📲 ორიგინალი პოსტი Telegram-ში",

        loading: "იტვირთება...",
        notFound: "განცხადებები ვერ მოიძებნა",
        error: "❌ განცხადებების ჩატვირთვის შეცდომა"
    },

    en: {
        catalog: "Catalog",
        filter: "Filter",
        map: "Map",
        allDistricts: "All districts",
        rooms: "Rooms",
        minPrice: "Price from",
        maxPrice: "Price to",
        find: "Search",
        clear: "Clear",

        district: "District:",
        address: "Address:",
        roomsLabel: "Rooms:",
        area: "Area:",
        details: "Details",
        telegram: "📲 Original post on Telegram",

        loading: "Loading...",
        notFound: "No listings found",
        error: "❌ Error loading listings"
    }

};


/* =========================
   CURRENT LANGUAGE
========================= */

let currentLanguage =
    localStorage.getItem("orangeLanguage") || "ru";


/* =========================
   TRANSLATION FUNCTION
========================= */

function t(key) {

    return (
        translations[currentLanguage]?.[key] ||
        translations.ru[key] ||
        key
    );

}


/* =========================
   CHANGE LANGUAGE
========================= */

function setLanguage(lang) {

    if (!translations[lang]) {
        return;
    }

    currentLanguage = lang;

    localStorage.setItem(
        "orangeLanguage",
        lang
    );

    document.documentElement.lang = lang;


    /* ACTIVE FLAG */

    document
        .querySelectorAll(".language-btn")
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.lang === lang
            );

        });


    /* CHANGE HTML TEXTS */

    const elements =
        document.querySelectorAll("[data-i18n]");

    elements.forEach(element => {

        const key =
            element.dataset.i18n;

        if (translations[lang][key]) {

            element.textContent =
                translations[lang][key];

        }

    });


    /* CHANGE PLACEHOLDERS */

    document
        .querySelectorAll("[data-i18n-placeholder]")
        .forEach(element => {

            const key =
                element.dataset.i18nPlaceholder;

            if (translations[lang][key]) {

                element.placeholder =
                    translations[lang][key];

            }

        });


    /* RE-DRAW APARTMENT CARDS */

    if (typeof allPosts !== "undefined") {

        renderPosts(allPosts);

    }

}


/* =========================
   LOAD SAVED LANGUAGE
========================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        setLanguage(currentLanguage);

    }
);

async function loadPosts() {

    try {

        const response = await fetch("/api/posts");

        if (!response.ok) {
            throw new Error("Failed to load posts");
        }

        const posts = await response.json();

allPosts = Array.from(
    new Map(
        posts.map(post => [
            String(post.id),
            post
        ])
    ).values()
);

renderPosts(allPosts);

    } catch (err) {

        console.error(err);

        document.getElementById("posts").innerHTML = `
            <h2 style="text-align:center;padding:40px;">
                ❌ Ошибка загрузки объявлений
            </h2>
        `;

    function renderPosts(posts) {

    const container = document.getElementById("posts");

    container.innerHTML = "";

    if (!posts.length) {
        container.innerHTML = `
            <h2 style="text-align:center;padding:40px;">
                ${t("notFound")}
            </h2>
        `;
        return;
    }

    posts.forEach((post) => {

        const image =
            post.images && post.images.length
                ? "/" + post.images[0]
                : "https://via.placeholder.com/600x400?text=No+Photo";

        const district = post.district || "-";
        const street = post.street || "-";
        const rooms = post.rooms || "-";
        const area = post.area || "-";
        const price = post.price || "-";

        container.innerHTML += `

            <div class="card">

                <div class="card-photo-wrap">

                    <img
                        src="${image}"
                        class="card-image"
                        onclick="openGallery('${post.id}')"
                        loading="lazy"
                    >

                    <span class="card-photo-label">
                        🍊 Orange Real Estate
                    </span>

                </div>

                <div class="info">

                    <div class="card-price-row">

                        <div class="price">
                            ${price}$ 
                        </div>

                        <div class="card-id">
                            ID #${post.id}
                        </div>

                    </div>

                    <div class="card-location">
                        📍 ${district}
                    </div>

                    <div class="card-address">
                        ${street}
                    </div>

                    <div class="card-details-grid">

                        <div>
                            🛏 ${t("roomsLabel")}: <b>${rooms}</b>
                        </div>

                        <div>
                            📐 ${t("area")}: <b>${area} მ²</b>
                        </div>

                    </div>

                    <div class="card-actions">

                        <a
                            class="telegram-btn"
                            href="${post.telegramLink || '#'}"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            ✈ Telegram
                        </a>

                        <button
                            class="details-btn"
                            onclick="location.href='details.html?id=${post.id}'"
                        >
                            ${t("details")} →
                        </button>

                    </div>

                </div>

            </div>

        `;

    });


}
   // =========================
// METRO DETECTION
// =========================

function getMetroLine(post) {

    const text =
        post.text ||
        post.caption ||
        post.content ||
        post.message ||
        post.postText ||
        post.rawText ||
        "";

    const lines = String(text).split(/\r?\n/);

    return lines.find(line =>
        /МЕТРО|METRO|მეტრო/i.test(line)
    ) || "";
}
   
   function filterPosts() {

    const district =
        document.getElementById("districtFilter").value.toLowerCase();

    const rooms =
        document.getElementById("roomsFilter").value;

    const metro =
        document.getElementById("metroFilter").value;

    const minPrice =
        Number(document.getElementById("minPrice").value) || 0;

    const maxPrice =
        Number(document.getElementById("maxPrice").value) || 999999999;

    // მეტროს სახელების შესაბამისობა ქართულ და რუსულ პოსტებთან
    const metroAliases = {
        "დელისი": ["дэллиси", "делиси", "დელისი"],
        "ვაჟა-ფშაველა": ["важапшавела", "важа-пшавела", "ვაჟა-ფშაველა"],
        "სამედიცინო უნივერსიტეტი": ["медицинскийуниверситет", "სამედიცინო უნივერსიტეტი"],
        "ტექნიკური უნივერსიტეტი": ["техническийуниверситет", "ტექნიკური უნივერსიტეტი"],
        "ისანი": ["исани", "ისანი"],
        "ავლაბარი": ["авлабари", "ავლაბარი"],
        "რუსთაველი": ["руставели", "რუსთაველი"],
        "თავისუფლების მოედანი": ["площадьсвободы", "свободыплощадь", "თავისუფლების მოედანი"],
        "მარჯანიშვილი": ["марджанишвили", "მარჯანიშვილი"],
        "სადგურის მოედანი": ["вокзальнаяплощадь", "სადგურის მოედანი"],
        "დიდუბე": ["дидубе", "დიდუბე"],
        "ვარკეთილი": ["варкетили", "ვარკეთილი"],
        "სამგორი": ["самгори", "სამგორი"],
        "300 არაგველი": ["300арагвели", "300არაგველი"],
        "გოცირიძე": ["гоциридзе", "გოცირიძე"],
        "ახმეტელის თეატრი": ["ахметелитеатр", "ახმეტელის თეატრი"],
        "სახელმწიფო უნივერსიტეტი": ["государственныйуниверситет", "სახელმწიფო უნივერსიტეტი"]
    };

    const normalize = value =>
        String(value || "")
            .toLowerCase()
            .replace(/[#\s\-_.,]/g, "");

    const filtered = allPosts.filter(post => {

        const postDistrict =
            (post.district || "").toLowerCase();

        const postRooms =
            Number(post.rooms) || 0;

        const postPrice =
            Number(post.price) || 0;

        // უბანი
        if (
            district &&
            !postDistrict.includes(district)
        ) {
            return false;
        }

        // ოთახები
        if (rooms) {

            if (rooms === "5") {
                if (postRooms < 5) return false;
            } else {
                if (postRooms !== Number(rooms)) return false;
            }

        }

        // მეტრო
        if (metro) {

            const metroLine = normalize(getMetroLine(post));

            const aliases = metroAliases[metro] || [metro];

            const found = aliases.some(alias =>
                metroLine.includes(normalize(alias))
            );

            if (!found) return false;
        }

        // ფასი
        if (postPrice < minPrice) return false;

        if (postPrice > maxPrice) return false;

        return true;

    });

    renderPosts(filtered);

}

function openGallery(postId) {

    const post = allPosts.find(
        p => String(p.id) === String(postId)
    );

    if (!post || !post.images || post.images.length === 0) {
        return;
    }

    let current = 0;

    const viewer = document.createElement("div");

    viewer.id = "viewer";

    viewer.innerHTML = `

<div class="viewer">

<button id="closeViewer">✕</button>

<button id="prevPhoto">◀</button>

<img id="galleryImage" src="/${post.images[0]}">

<button id="nextPhoto">▶</button>

<div id="counter">
1 / ${post.images.length}
</div>

</div>

`;

    document.body.appendChild(viewer);

    const image = document.getElementById("galleryImage");
    const counter = document.getElementById("counter");

    document.getElementById("nextPhoto").onclick = () => {

        current++;

        if (current >= post.images.length)
            current = 0;

        image.src = "/" + post.images[current];

        counter.innerHTML =
            `${current + 1} / ${post.images.length}`;

    };

    document.getElementById("prevPhoto").onclick = () => {

        current--;

        if (current < 0)
            current = post.images.length - 1;

        image.src = "/" + post.images[current];

        counter.innerHTML =
            `${current + 1} / ${post.images.length}`;

    };

    document.getElementById("closeViewer").onclick = () => {

        viewer.remove();

    };

    viewer.onclick = (e) => {

        if (e.target === viewer) {

            viewer.remove();

        }

    };

}loadPosts();
// AUTO REFRESH — ყოველ 30 წამში
setInterval(async () => {

    try {

        const response =
            await fetch(
                "/api/posts?t=" + Date.now(),
                {
                    cache: "no-store"
                }
            );

        if (!response.ok) return;

        const posts =
            await response.json();

        // ერთი ID = ერთი განცხადება
        const uniquePosts =
            Array.from(
                new Map(
                    posts.map(post => [
                        String(post.id),
                        post
                    ])
                ).values()
            );

        const oldData =
            JSON.stringify(allPosts);

        const newData =
            JSON.stringify(uniquePosts);

        if (oldData !== newData) {

            allPosts =
                uniquePosts;

            renderPosts(
                allPosts
            );

            console.log(
                "🔄 New posts loaded:",
                allPosts.length
            );
        }

    } catch (error) {

        console.log(
            "Auto refresh error:",
            error
        );

    }

}, 30000);
