const params = new URLSearchParams(window.location.search);
const id = params.get("id");
let currentImages = [];
let currentIndex = 0;
async function loadDetails() {

    try {

        const res = await fetch(`/api/post/${id}`);
        const post = await res.json();
        let cleanText = (post.text || "")
    .replace(/\*+/g, "")                 // ვშლით ****
    .replace(/#[^\s]+/g, "")             // ვშლით ყველა ჰეშთეგს
    .replace(/\n{3,}/g, "\n\n")          // ზედმეტ ცარიელ ხაზებს
    .trim();
currentImages = post.images || [];
currentIndex = 0;
        let images = "";

        if (post.images && post.images.length) {
            currentImages = post.images;

            images = post.images.map(img => `
                <img
                    src="/${img}"
                    class="gallery-image"
                    onclick="openImage('/${img}')"
                >
            `).join("");

        }

        document.getElementById("content").innerHTML = `

<div class="details-container">

<header class="details-header">
🍊 Orange Real Estate
</header>

<div class="title-block">

<h2>🏠 Apartment</h2>

<div class="price">
$${post.price || "-"}
</div>

</div>

<div class="gallery">

${images}

</div>

<div class="stats-grid">

<div class="stat-card">
<div class="icon">📍</div>
<div class="value">${post.district || "-"}</div>
<div class="label">Район</div>
</div>

<div class="stat-card">
<div class="icon">📌</div>
<div class="value">${post.street || "-"}</div>
<div class="label">Улица</div>
</div>

<div class="stat-card">
<div class="icon">🚪</div>
<div class="value">${post.rooms || "-"}</div>
<div class="label">Комнаты</div>
</div>
<div class="stat-card">
<div class="icon">🛏</div>
<div class="value">${post.bedrooms || "-"}</div>
<div class="label">Спальни</div>
</div>

<div class="stat-card">
<div class="icon">📐</div>
<div class="value">${post.area || "-"}</div>
<div class="label">м²</div>
</div>

<div class="stat-card">
<div class="icon">🏢</div>
<div class="value">${post.floor || "-"}</div>
<div class="label">Этаж</div>
</div>

<div class="stat-card">
<div class="icon">💰</div>
<div class="value">$${post.price || "-"}</div>
<div class="label">Цена</div>
</div>

</div>

<div class="buttons">

<a href="https://maps.google.com/?q=${encodeURIComponent(post.street || post.district || "Tbilisi")}"
target="_blank"
class="map-btn">
🗺 Открыть карту
</a>

<a href="https://t.me/tornikeorange1"
target="_blank"
class="call-btn">
📞 Позвонить
</a>

</div>

<div class="description" style="display:none;">

<h3>Описание</h3>

<div style="white-space:pre-wrap;">
${cleanText}
</div>

</div>

</div>
</div>

<div id="viewer" class="viewer">

<span class="close" onclick="closeImage()">×</span>

<img id="viewerImage">

</div>

`;

    } catch (err) {

        document.getElementById("content").innerHTML =
            "<h2>Ошибка загрузки квартиры</h2>";

        console.error(err);

    }

}

function openImage(src) {

    const viewer = document.getElementById("viewer");
    const image = document.getElementById("viewerImage");

    currentIndex = currentImages.findIndex(img => "/" + img === src);

    image.src = src;
    viewer.style.display = "flex";
}

function closeImage() {

    document.getElementById("viewer").style.display = "none";

}

document.addEventListener("keydown", e => {

    if (e.key === "Escape") closeImage();

});

document.addEventListener("click", e => {

    const viewer = document.getElementById("viewer");

    if (e.target === viewer) closeImage();

});

loadDetails();
function openImage(src) {

    currentIndex = currentImages.findIndex(img => "/" + img === src);

    if (currentIndex === -1) currentIndex = 0;

    document.getElementById("viewer").style.display = "flex";
    document.getElementById("viewerImage").src = src;
}

function closeImage() {
    document.getElementById("viewer").style.display = "none";
}

function nextImage() {
    currentIndex++;

    if (currentIndex >= currentImages.length) {
        currentIndex = 0;
    }

    document.getElementById("viewerImage").src =
        "/" + currentImages[currentIndex];
}

function prevImage() {
    currentIndex--;

    if (currentIndex < 0) {
        currentIndex = currentImages.length - 1;
    }

    document.getElementById("viewerImage").src =
        "/" + currentImages[currentIndex];
}
function openImage(src) {
    document.getElementById("viewer").style.display = "flex";
    document.getElementById("viewerImage").src = src;
}

function closeImage() {
    document.getElementById("viewer").style.display = "none";
}

function prevImage() {
    if (currentImages.length === 0) return;

    currentIndex--;
    if (currentIndex < 0) {
        currentIndex = currentImages.length - 1;
    }

    document.getElementById("viewerImage").src =
        "/" + currentImages[currentIndex];
}

function nextImage() {
    if (currentImages.length === 0) return;

    currentIndex++;
    if (currentIndex >= currentImages.length) {
        currentIndex = 0;
    }

    document.getElementById("viewerImage").src =
        "/" + currentImages[currentIndex];
}