let allPosts = [];

async function loadPosts() {

    try {

        const response = await fetch(`/api/posts?t=${Date.now()}`, {
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error("Server error");
        }

        allPosts = await response.json();

        renderPosts(allPosts);

    } catch (err) {

        console.error(err);

        document.getElementById("posts").innerHTML = `
            <h2 style="text-align:center;padding:40px;">
                Ошибка загрузки объявлений
            </h2>
        `;

    }

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

    posts.forEach((post, index) => {

        const image =
            post.images && post.images.length
                ? "/" + post.images[0]
                : "https://via.placeholder.com/600x400?text=No+Photo";

        let district = post.district || "-";

        if ((!district || district === "-") && post.text) {

            const match =
                post.text.match(/Район:\s*#?([^\n]+)/i);

            if (match) {
                district =
                    match[1]
                        .replace("#", "")
                        .trim();
            }

        }

        container.innerHTML += `

<div class="card">

${post.status === "rented"
? `<div class="rented-badge">🔴 СДАНО</div>`
: ""}

<img
    src="${image}"
    class="card-image"
    loading="lazy"
    onclick="event.stopPropagation();openGallery(${index})"
    onerror="this.src='https://via.placeholder.com/600x400?text=No+Photo';"
>

<div class="info">

<div class="price">

$${post.price || "-"}

</div>

<div class="details">

📍 <b>Район:</b> ${district}

<br><br>

📌 <b>Адрес:</b> ${post.street || "-"}

<br><br>

🛏 <b>Комнат:</b> ${post.rooms || "-"}

<br><br>

📐 <b>Площадь:</b> ${post.area || "-"} м²

</div>

<button
class="details-btn"
onclick="location.href='details.html?id=${post.id}'">

Подробнее

</button>

<a
class="telegram-btn"
href="${post.telegramLink}"
target="_blank"
onclick="event.stopPropagation()">

📲 Смотреть в Telegram

</a>

</div>

</div>

`;

    });

}
let allPosts = [];

async function loadPosts() {

    try {

        const response = await fetch(`/api/posts?t=${Date.now()}`, {
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error("Server error");
        }

        allPosts = await response.json();

        renderPosts(allPosts);

    } catch (err) {

        console.error(err);

        document.getElementById("posts").innerHTML = `
            <h2 style="text-align:center;padding:40px;">
                Ошибка загрузки объявлений
            </h2>
        `;

    }

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

    posts.forEach((post, index) => {

        const image =
            post.images && post.images.length
                ? "/" + post.images[0]
                : "https://via.placeholder.com/600x400?text=No+Photo";

        let district = post.district || "-";

        if ((!district || district === "-") && post.text) {

            const match =
                post.text.match(/Район:\s*#?([^\n]+)/i);

            if (match) {
                district =
                    match[1]
                        .replace("#", "")
                        .trim();
            }

        }

        container.innerHTML += `

<div class="card">

${post.status === "rented"
? `<div class="rented-badge">🔴 СДАНО</div>`
: ""}

<img
    src="${image}"
    class="card-image"
    loading="lazy"
    onclick="event.stopPropagation();openGallery('${post.id}')"
    onerror="this.src='https://via.placeholder.com/600x400?text=No+Photo';"
>

<div class="info">

<div class="price">

$${post.price || "-"}

</div>

<div class="details">

📍 <b>Район:</b> ${district}

<br><br>

📌 <b>Адрес:</b> ${post.street || "-"}

<br><br>

🛏 <b>Комнат:</b> ${post.rooms || "-"}

<br><br>

📐 <b>Площадь:</b> ${post.area || "-"} м²

</div>

<button
class="details-btn"
onclick="location.href='details.html?id=${post.id}'">

Подробнее

</button>

<a
class="telegram-btn"
href="${post.telegramLink}"
target="_blank"
onclick="event.stopPropagation()">

📲 Смотреть в Telegram

</a>

</div>

</div>

`;

    });

}
let currentImages = [];
let currentIndex = 0;

function openGallery(id){

    const post = allPosts.find(
        p => String(p.id) === String(id)
    );

    if(!post) return;

    currentImages = post.images || [];

    currentIndex = 0;

    if(!currentImages.length) return;

    document.getElementById("viewer").style.display = "block";

    updateGallery();
}

function updateGallery(){

    if(!currentImages.length) return;

    document.getElementById("viewerImage").src =
        "/" + currentImages[currentIndex];

    document.getElementById("counter").innerHTML =
        `${currentIndex + 1} / ${currentImages.length}`;

}

function nextPhoto(){

    if(currentIndex < currentImages.length - 1){

        currentIndex++;

        updateGallery();

    }

}

function prevPhoto(){

    if(currentIndex > 0){

        currentIndex--;

        updateGallery();

    }

}

function closeViewer(){

    document.getElementById("viewer").style.display = "none";

}

document.addEventListener("keydown",(e)=>{

    if(e.key==="Escape"){

        closeViewer();

    }

    if(e.key==="ArrowRight"){

        nextPhoto();

    }

    if(e.key==="ArrowLeft"){

        prevPhoto();

    }

});

loadPosts();