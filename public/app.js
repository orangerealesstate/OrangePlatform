let allPosts = [];

async function loadPosts() {

    try {

        const response = await fetch(`/api/posts?t=${Date.now()}`, {
    cache: "no-store"
});

        allPosts = await response.json();

        renderPosts(allPosts);

    } catch (err) {

        document.getElementById("posts").innerHTML =
            "<h2>Ошибка загрузки объявлений</h2>";

        console.error(err);

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
            (post.images && post.images.length > 0)
                ? "/" + post.images[0]
                : "https://via.placeholder.com/600x400?text=No+Photo";

        let district = post.district || "-";

        if ((!district || district === "-") && post.text) {

            const match = post.text.match(/Район:\s*#?([^\n]+)/i);

            if (match) {
                district = match[1].replace("#", "").trim();
            }

        }

        container.innerHTML += `

<div class="card">

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

    </div>

</div>

`;

    });

}
        


    function filterPosts() {

    const search = document.getElementById("search").value.toLowerCase();

    const district = document.getElementById("districtFilter").value;

    const rooms = document.getElementById("roomsFilter").value;

    const minPrice =
        parseInt(document.getElementById("minPrice").value) || 0;

    const maxPrice =
        parseInt(document.getElementById("maxPrice").value) || 99999999;

    const filtered = allPosts.filter(post => {

        let postDistrict = post.district || "";

if (!postDistrict && post.text) {
    const match = post.text.match(/Район:\s*#?([^\n]+)/i);

    if (match) {
        postDistrict = match[1].replace("#", "").trim();
    }
}

        const postPrice = Number(post.price) || 0;

        const postRooms = String(post.rooms || "");

        const text =
            (post.text || "").toLowerCase();

        if (
            search &&
            !text.includes(search) &&
            !postDistrict.toLowerCase().includes(search)
        ) {
            return false;
        }

        if (
            district &&
            postDistrict !== district
        ) {
            return false;
        }

        if (
            rooms &&
            postRooms !== rooms &&
            !(rooms === "5" && Number(postRooms) >= 5)
        ) {
            return false;
        }

        if (
            postPrice < minPrice ||
            postPrice >maxPrice
        ) {
            return false;
        }

        return true;

    });

    
        document.getElementById("search").value.toLowerCase().trim();

    const district =
        document.getElementById("districtFilter").value.toLowerCase();

    const rooms =
        document.getElementById("roomsFilter").value;

    const minPrice =
        Number(document.getElementById("minPrice").value) || 0;

    const maxPrice =
        Number(document.getElementById("maxPrice").value) || 999999;

    const filtered = allPosts.filter(post => {

        const text =
    (post.text || "").toLowerCase();

        let postDistrict =
            (post.district || "").toLowerCase().trim();

        if (!postDistrict) {

            if (text.includes("сабуртало")) postDistrict = "сабуртало";
            else if (text.includes("saburtalo")) postDistrict = "сабуртало";

            else if (text.includes("ваке")) postDistrict = "ваке";
            else if (text.includes("vake")) postDistrict = "ваке";

            else if (text.includes("вера")) postDistrict = "вера";
            else if (text.includes("vera")) postDistrict = "вера";

            else if (text.includes("исани"))
    postDistrict = "исани";

            else if (text.includes("ортачала")) postDistrict = "ортачала";

            else if (text.includes("диди дигоми")) postDistrict = "диди дигоми";
        }

        const postRooms =
            Number(post.rooms) || 0;

        const postPrice =
            Number(post.price) || 0;

        if (search) {

            if (
                !text.includes(search) &&
                !postDistrict.includes(search)
            ) {
                return false;
            }

        }

        if (district) {

            if (!postDistrict.includes(district)) {
                return false;
            }

        }

        if (rooms) {

            if (postRooms != Number(rooms)) {
                return false;
            }

        }

        if (postPrice < minPrice) {
            return false;
        }

        if (postPrice > maxPrice) {
            return false;
        }

        return true;

    });

    renderPosts(filtered);
}
loadPosts();