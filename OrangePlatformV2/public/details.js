const params = new URLSearchParams(window.location.search);
const id = params.get("id");

let currentImages = [];
let currentIndex = 0;

async function loadDetails() {

    try {

        const res = await fetch(`/api/post/${id}`);

        if (!res.ok) {
            throw new Error("Post not found");
        }

        const post = await res.json();
        console.log(post.date);

        currentImages = Array.isArray(post.images)
            ? post.images
            : [];

        currentIndex = 0;

        let images = "";

        if (currentImages.length > 0) {

            images = `
<div class="image-wrapper">

<div class="image-wrapper">

<button class="gallery-prev" onclick="prevImage()">❮</button>

<img
    id="mainImage"
    src="/${currentImages[0]}"
    class="main-image"
    onclick="openImage('/' + currentImages[currentIndex])"
>

<button class="gallery-next" onclick="nextImage()">❯</button>

<div class="photo-count">
📷 <span id="photoNumber">1</span> / ${currentImages.length}
</div>

</div>

<div class="photo-count">
📷 1 / ${currentImages.length}
</div>

</div>
`;

        }

        if (currentImages.length) {

     {

    images = `
<div class="image-wrapper">

    <img
        src="/${currentImages[0]}"
        class="main-image"
        onclick="openImage('/${currentImages[0]}')"
    >

    <div class="photo-count">
        📷 1 / ${currentImages.length}
    </div>

</div>
`;

}

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

<div class="publish-date">
🕒 ${new Date(post.date * 1000).toLocaleDateString("ru-RU")}
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

${
window.Telegram?.WebApp?.initDataUnsafe?.user?.id === 5172653731
? `
<div class="admin-buttons">
<button id="editBtn" class="edit-btn">✏️ Редактировать</button>
<button id="deleteBtn" class="delete-btn">🗑️ Удалить</button>
</div>
`
: ""
}

</div>


</div>
`;
const shareBtn = document.getElementById("shareBtn");
const mapBtn = document.getElementById("mapBtn");
const agentBtn = document.getElementById("agentBtn");

if (shareBtn) {
    shareBtn.onclick = () => sharePost(post);
}

if (mapBtn) {
    mapBtn.onclick = () => {
        window.open(
            `https://yandex.com/maps/?text=${encodeURIComponent(
                `${post.street || ""}, ${post.district || ""}, Tbilisi`
            )}`,
            "_blank"
        );
    };
}

if (agentBtn) {
    agentBtn.onclick = () => {
        window.open(
            "https://t.me/Orangerealestatetbilisi",
            "_blank"
        );
    };
}

if (agentBtn) {
    agentBtn.onclick = () => {
        window.open(
            "https://t.me/Orangerealestatetbilisi",
            "_blank"
        );
    };
}
const editBtn = document.getElementById("editBtn");
const deleteBtn = document.getElementById("deleteBtn");
console.log(deleteBtn);


if (deleteBtn) {
    deleteBtn.onclick = async () => {

        if (!confirm("🗑 Удалить объявление?")) return;

        const response = await fetch("/api/post/delete", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id: post.id
            })
        });

        const result = await response.json();

        if (result.success) {
            alert("✅ Объявление удалено");
            window.location.href = "/";
        } else {
            alert("❌ Ошибка удаления");
        }
    };
}
console.log(editBtn);

if (editBtn) {
editBtn.onclick = () => {
    const ADMIN_IDS = [
    5172653731, // Tornike

];

    const tg = window.Telegram?.WebApp;


    if (tg) {
    tg.ready();
    tg.expand();
}

console.log(window.Telegram);
console.log(tg);
console.log(tg?.initDataUnsafe);

const userId = tg?.initDataUnsafe?.user?.id;


if (!ADMIN_IDS.includes(userId)) {
    alert("🚫 У вас нет доступа.");
    return;
}

    alert(post.id);
    window.location.href = `edit.html?id=${post.id}`;

};
}
} catch (err) {

    document.getElementById("content").innerHTML =
        "<h2>Ошибка загрузки квартиры</h2>";

    console.error(err);

}

} 

;// ← აქ იხურება loadDetails()

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
const ADMIN_ID = 5172653731;

const isAdmin =
    Telegram.WebApp.initDataUnsafe?.user?.id === ADMIN_ID;


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
