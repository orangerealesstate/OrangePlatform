alert("NEW APP.JS");
let allPosts = [];

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

    }
function renderPosts(posts) {

    const container = document.getElementById("posts");

    container.innerHTML = "";

    if (!posts.length) {

        container.innerHTML = `
            <h2 style="text-align:center;padding:40px;">
                Объявления не найдены
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

        container.innerHTML += `

<div class="card">

    <img
        src="${image}"
        class="card-image"
        onclick="openGallery('${post.id}')"
    >

    <div class="info">

        <div class="price">
            $${post.price || "-"}
        </div>

        <div class="details">

            📍 <b>Район:</b> ${district}<br><br>

            📌 <b>Адрес:</b> ${post.street || "-"}<br><br>

            🛏 <b>Комнат:</b> ${post.rooms || "-"}<br><br>

            📐 <b>Площадь:</b> ${post.area || "-"} м²

        </div>

        <button
            class="details-btn"
            onclick="location.href='details.html?id=${post.id}'">

            Подробнее

        </button>

        <a
            class="telegram-btn"
            href="${post.telegramLink || '#'}"
            target="_blank"
            rel="noopener noreferrer">

            📲 Оригинал поста в Telegram

        </a>

    </div>

</div>

`;

    });

}

}function filterPosts() {

    const search =
        document.getElementById("search").value.toLowerCase().trim();

    const district =
        document.getElementById("districtFilter").value.toLowerCase();

    const rooms =
        document.getElementById("roomsFilter").value;

    const minPrice =
        Number(document.getElementById("minPrice").value) || 0;

    const maxPrice =
        Number(document.getElementById("maxPrice").value) || 999999999;

    const filtered = allPosts.filter(post => {

        const text =
            (post.text || "").toLowerCase();

        const postDistrict =
            (post.district || "").toLowerCase();

        const postRooms =
            Number(post.rooms) || 0;

        const postPrice =
            Number(post.price) || 0;

        if (
            search &&
            !text.includes(search) &&
            !postDistrict.includes(search)
        ) {
            return false;
        }

        if (
            district &&
            !postDistrict.includes(district)
        ) {
            return false;
        }

        if (rooms) {

            if (rooms === "5") {

                if (postRooms < 5)
                    return false;

            } else {

                if (postRooms !== Number(rooms))
                    return false;

            }

        }

        if (postPrice < minPrice)
            return false;

        if (postPrice > maxPrice)
            return false;

        return true;

    });

    renderPosts(filtered);

}function openGallery(postId) {

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