const container = document.getElementById("post");

const params = new URLSearchParams(window.location.search);
const id = params.get("id");

async function loadPost() {

    try {

        const response = await fetch(`/api/post/${id}`);


if (!response.ok) {
    throw new Error("Apartment not found");
}

const post = await response.json();

        if (!post) {

            container.innerHTML = `
            <div style="
                padding:40px;
                text-align:center;
                font-size:22px;
                color:#666;
            ">
                ❌ Квартира не найдена
            </div>
            `;

            return;
        }

        const district = post.district || "Сабуртало";

        let images = "";

        if (post.images && post.images.length) {

            images = `
            <div style="
                display:grid;
                grid-template-columns:repeat(auto-fit,minmax(260px,1fr));
                gap:15px;
                margin-bottom:25px;
            ">
            `;

            post.images.forEach((image, index) => {

                images += `
                <img
                    src="${image}"
                    style="
                        width:100%;
                        height:240px;
                        object-fit:cover;
                        border-radius:18px;
                        cursor:pointer;
                        box-shadow:0 8px 20px rgba(0,0,0,.15);
                    "
                    onclick="openGallery(${index})"
                >
                `;

            });

            images += `</div>`;

        } else if (post.image) {

            images = `
            <img
                src="${post.image}"
                style="
                    width:100%;
                    border-radius:18px;
                    margin-bottom:25px;
                    box-shadow:0 8px 20px rgba(0,0,0,.15);
                ">
            `;

        }

        container.innerHTML = `

<div style="padding:20px;">
<div style="margin-bottom:15px;">
    <button
        onclick="history.back()"
        style="
            background:#ff6600;
            color:white;
            border:none;
            border-radius:12px;
            padding:10px 18px;
            font-size:16px;
            font-weight:bold;
            cursor:pointer;
        ">
        ← На главную
    </button>
</div>

<h1 style="
margin-bottom:10px;
color:#ff6600;
">
🏠 ${post.title || "Apartment"}
</h1>

<div style="
font-size:30px;
font-weight:bold;
margin-bottom:25px;
color:#222;
">
${post.price ? "$" + post.price : "-"}
</div>

${images}
<div style="
display:grid;
grid-template-columns:repeat(auto-fit,minmax(170px,1fr));
gap:15px;
margin:30px 0;
">

<div style="
background:white;
padding:20px;
border-radius:14px;
text-align:center;
box-shadow:0 5px 15px rgba(0,0,0,.08);
">
<div style="font-size:32px;">📍</div>
<div style="font-size:22px;font-weight:bold;">
${district}
</div>
<div style="color:#777;">Район</div>
</div>

<div style="
background:white;
padding:20px;
border-radius:14px;
text-align:center;
box-shadow:0 5px 15px rgba(0,0,0,.08);
">
<div style="font-size:32px;">📌</div>
<div style="font-size:20px;font-weight:bold;">
${post.street || "-"}
</div>
<div style="color:#777;">Адрес</div>
</div>

<div style="
background:white;
padding:20px;
border-radius:14px;
text-align:center;
box-shadow:0 5px 15px rgba(0,0,0,.08);
">
<div style="font-size:32px;">🛏</div>
<div style="font-size:22px;font-weight:bold;">
${post.rooms || "-"}
</div>
<div style="color:#777;">Комнаты</div>
</div>

<div style="
background:white;
padding:20px;
border-radius:14px;
text-align:center;
box-shadow:0 5px 15px rgba(0,0,0,.08);
">
<div style="font-size:32px;">🛌</div>
<div style="font-size:22px;font-weight:bold;">
${post.bedrooms || "-"}
</div>
<div style="color:#777;">Спальни</div>
</div>

<div style="
background:white;
padding:20px;
border-radius:14px;
text-align:center;
box-shadow:0 5px 15px rgba(0,0,0,.08);
">
<div style="font-size:32px;">🏢</div>
<div style="font-size:22px;font-weight:bold;">
${post.floor || "-"}
</div>
<div style="color:#777;">Этаж</div>
</div>

<div style="
background:white;
padding:20px;
border-radius:14px;
text-align:center;
box-shadow:0 5px 15px rgba(0,0,0,.08);
">
<div style="font-size:32px;">💰</div>
<div style="font-size:22px;font-weight:bold;">
${post.price ? "$" + post.price : "-"}
</div>
<div style="color:#777;">Цена</div>
</div>

</div>
<div style="margin-top:30px;text-align:center;">

<a
href="https://t.me/sandroorange"
target="_blank"
style="
display:inline-block;
background:#229ED9;
color:white;
padding:16px 35px;
border-radius:14px;
font-size:20px;
font-weight:bold;
text-decoration:none;
box-shadow:0 6px 18px rgba(0,0,0,.2);
">
💬 Написать в Telegram
</a>

</div>
`;


    } catch (error) {

    console.error(error);

    container.innerHTML = `
<pre style="
padding:20px;
color:red;
font-size:16px;
white-space:pre-wrap;
">
${error.stack}
</pre>
`;
}

}
let galleryImages = [];
let currentImage = 0;
let galleryViewer = null;

function openGallery(index) {

    galleryImages = Array.from(
        document.querySelectorAll("#post img")
    ).map(img => img.src);

    currentImage = index;

    if (!galleryViewer) {

        galleryViewer = document.createElement("div");
        galleryViewer.id = "galleryViewer";

        galleryViewer.style.cssText = `
            position:fixed;
            inset:0;
            background:rgba(0,0,0,.95);
            display:flex;
            justify-content:center;
            align-items:center;
            z-index:99999;
        `;

        galleryViewer.innerHTML = `
            <span id="closeGallery"
                style="
                    position:absolute;
                    top:20px;
                    right:30px;
                    color:#fff;
                    font-size:45px;
                    cursor:pointer;
                    user-select:none;
                ">&times;</span>

            <span id="prevImage"
                style="
                    position:absolute;
                    left:25px;
                    color:#fff;
                    font-size:55px;
                    cursor:pointer;
                    user-select:none;
                ">&#10094;</span>

            <img id="galleryImage"
                style="
                    max-width:95vw;
                    max-height:95vh;
                    object-fit:contain;
                    border-radius:12px;
                ">

            <span id="nextImage"
                style="
                    position:absolute;
                    right:25px;
                    color:#fff;
                    font-size:55px;
                    cursor:pointer;
                    user-select:none;
                ">&#10095;</span>

            <div id="galleryCounter"
                style="
                    position:absolute;
                    top:20px;
                    left:30px;
                    color:white;
                    font-size:18px;
                    background:rgba(0,0,0,.5);
                    padding:8px 14px;
                    border-radius:20px;
                ">
            </div>
        `;

        document.body.appendChild(galleryViewer);

        document.getElementById("closeGallery").onclick = closeGallery;
        document.getElementById("prevImage").onclick = previousImage;
        document.getElementById("nextImage").onclick = nextImage;

        galleryViewer.onclick = (e) => {
            if (e.target === galleryViewer) closeGallery();
        };

        document.addEventListener("keydown", galleryKeys);
    }

    updateGallery();
}

function updateGallery() {

    document.getElementById("galleryImage").src =
        galleryImages[currentImage];

    document.getElementById("galleryCounter").innerText =
        `${currentImage + 1} / ${galleryImages.length}`;
}

function nextImage() {

    currentImage =
        (currentImage + 1) % galleryImages.length;

    updateGallery();
}

function previousImage() {

    currentImage =
        (currentImage - 1 + galleryImages.length) %
        galleryImages.length;

    updateGallery();
}

function closeGallery() {

    if (galleryViewer) {
        galleryViewer.remove();
        galleryViewer = null;
    }

    document.removeEventListener("keydown", galleryKeys);
}

function galleryKeys(e) {

    if (e.key === "ArrowRight") nextImage();

    if (e.key === "ArrowLeft") previousImage();

    if (e.key === "Escape") closeGallery();
}

loadPost();


