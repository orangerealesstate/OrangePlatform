const params = new URLSearchParams(window.location.search);
const id = params.get("id");

let currentImages = [];
let currentIndex = 0;

async function loadDetails() {

    try {

        const res = await fetch(`/api/post/${id}`);
        const post = await res.json();

        currentImages = post.images || [];
        currentIndex = 0;

        const cleanText = (post.text || "")
            .replace(/\*+/g, "")
            .replace(/#[^\s]+/g, "")
            .replace(/\n{3,}/g, "\n\n")
            .trim();

        let images = "";

        if (currentImages.length) {

    images = `
        <img
            src="/${currentImages[0]}"
            class="main-image"
            onclick="openImage('/${currentImages[0]}')"
        >
    `;

}


        document.getElementById("content").innerHTML = `
<div class="details-container">

<header class="details-header">
🍊 Orange Real Estate
</header>

<div class="title-block">

<button class="back-btn" onclick="history.back()">
← Назад
</button>

<h2>🏠 Apartment</h2>

<div class="price">
$${post.price || "-"}
</div>

</div>

<div class="gallery">

${images}

<div style="padding:20px;">

    <button id="editBtn" class="edit-btn">
        ✏️ Редактировать
    </button>

</div>

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



</div>
`;
document.getElementById("shareBtn").onclick = () => sharePost(post);

document.getElementById("mapBtn").onclick = () => {
    window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            `${post.street || ""}, ${post.district || ""}, Tbilisi`
        )}`,
        "_blank"
    );
};

document.getElementById("agentBtn").onclick = () => {
    window.open(
        "https://t.me/Orangerealestatetbilisi",
        "_blank"
    );
};
document.getElementById("editBtn").onclick = () => {

    const tg = window.Telegram.WebApp;

    const userId = tg.initDataUnsafe?.user?.id;

    const ADMIN_IDS = [
    5172653731,   // Tornike
    5068084842    // მეორე აგენტი
];

if (!ADMIN_IDS.includes(userId)) {
    alert("🚫 У вас нет доступа.");
    return;
}

    window.location.href = `edit.html?id=${post.id}`;

};
} catch (err) {

    document.getElementById("content").innerHTML =
        "<h2>Ошибка загрузки квартиры</h2>";

    console.error(err);

}

} // ← აქ იხურება loadDetails()

// ==========================
// SHARE
// ==========================



function sharePost(post){

    const url = window.location.href;

    const text =
`🏠 Apartment

📍 ${post.district || "-"}

💰 $${post.price || "-"}

${url}`;

    if(navigator.share){

        navigator.share({

            title:"Orange Real Estate",

            text,

            url

        });

    }else{

        navigator.clipboard.writeText(url);

        alert("🔗 Link copied");

    }

}
loadDetails();

function openImage(src) {

    currentIndex = currentImages.findIndex(
        img => "/" + img === src
    );

    if (currentIndex === -1) {
        currentIndex = 0;
    }

    document.getElementById("viewer").style.display = "flex";
    document.getElementById("viewerImage").src = src;

}

function closeImage() {

    document.getElementById("viewer").style.display = "none";

}

function prevImage() {

    if (currentImages.length <= 1) return;

    currentIndex--;

    if (currentIndex < 0) {
        currentIndex = currentImages.length - 1;
    }

    document.getElementById("viewerImage").src =
        "/" + currentImages[currentIndex];

}

function nextImage() {

    if (currentImages.length <= 1) return;

    currentIndex++;

    if (currentIndex >= currentImages.length) {
        currentIndex = 0;
    }

    document.getElementById("viewerImage").src =
        "/" + currentImages[currentIndex];

}
document.addEventListener("keydown", (e) => {

    if (e.key === "Escape") {
        closeImage();
    }

    if (e.key === "ArrowLeft") {
        prevImage();
    }

    if (e.key === "ArrowRight") {
        nextImage();
    }

});

document.addEventListener("click", (e) => {

    const viewer = document.getElementById("viewer");

    if (e.target === viewer) {
        closeImage();
    }

});
