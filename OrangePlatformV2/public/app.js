let allPosts = [];

async function loadPosts() {

    try {

        const response = await fetch("/api/posts?t=" + Date.now(), {
    cache: "no-store"
});

        if (!response.ok) {
            throw new Error("Failed to load posts");
        }

        allPosts = await response.json();

        renderPosts(allPosts);
        const loader = document.getElementById("loader");

if (loader) {
    setTimeout(() => {
        loader.classList.add("loader-hide");

        setTimeout(() => {
            loader.remove();
        }, 600);
    }, 300);
}

    } catch (err) {

        console.error(err);

        document.getElementById("posts").innerHTML = `
            <h2 style="text-align:center;padding:40px;">
                ❌ Ошибка загрузки объявлений
            </h2>
        `;

    }

}function renderPosts(posts) {
    console.log("FILTER WORKS");
console.log("Posts received:", posts.length);
console.log(posts);
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

    posts.forEach((post, index) => {

        const images =
    post.images && post.images.length
        ? post.images
        : ["https://via.placeholder.com/600x400?text=No+Photo"];
const image = images[0];
        const district = post.district || "-";

        container.innerHTML += `
        <div class="card">

<div class="card-slider">

    <button class="prev-btn"
        onclick="event.stopPropagation(); prevCardImage(${index})">
        ◀
    </button>

    <img
        id="card-image-${index}"
        src="${images[0]}"
        class="card-image"
        onclick="openGallery(allPosts.indexOf(post))"
    >

    <button class="next-btn"
        onclick="event.stopPropagation(); nextCardImage(${index})">
        ▶
    </button>

</div>

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

    </div>

</div>

`;

    });

}function filterPosts() {
    console.log("filterPosts called");
console.log(document.getElementById("districtFilter").value);

    const search = "";
         
const districtEl = document.getElementById("districtFilter");
const roomsEl = document.getElementById("roomsFilter");
const minPriceEl = document.getElementById("minPrice");
const maxPriceEl = document.getElementById("maxPrice");

console.log(districtEl);
console.log(roomsEl);
console.log(minPriceEl);
console.log(maxPriceEl);

const district = districtEl.value.toLowerCase();
const rooms = roomsEl.value;
const minPrice = Number(minPriceEl.value) || 0;
const maxPrice = Number(maxPriceEl.value) || 999999999;
    
    const filtered = allPosts.filter(post => {

        const text =
            (post.text || "").toLowerCase();

        const postDistrict =
            (post.district || "").toLowerCase();
            console.log({
    postDistrict,
    district,
    original: post.district
});
        


        const postRooms =
            Number(post.rooms) || 0;

        const postPrice =
            Number(post.price) || 0;

        

        const postText = (post.text || "").toLowerCase();

if (
    district &&
    !postDistrict.includes(district) &&
    !postText.includes(district)
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
    const loader = document.getElementById("loader");

if (loader) {
    loader.classList.add("loader-hide");

    setTimeout(() => {
        loader.remove();
    }, 600);
}

}function openGallery(index) {

    const post = allPosts[index];

    if (!post.images || post.images.length === 0) {
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
const currentCardImage = {};

function nextCardImage(index) {
    const post = allPosts[index];
    if (!post.images || post.images.length < 2) return;

    currentCardImage[index] =
        ((currentCardImage[index] || 0) + 1) % post.images.length;

    document.getElementById(`card-image-${index}`).src =
        "/" + post.images[currentCardImage[index]];
}

function prevCardImage(index) {
    const post = allPosts[index];
    if (!post.images || post.images.length < 2) return;

    currentCardImage[index] =
        ((currentCardImage[index] || 0) - 1 + post.images.length) % post.images.length;

    document.getElementById(`card-image-${index}`).src =
        "/" + post.images[currentCardImage[index]];
}