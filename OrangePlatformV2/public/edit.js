const params = new URLSearchParams(window.location.search);
const id = params.get("id");

let post = {};

async function loadPost() {

    const response = await fetch("/api/post/" + id);

    post = await response.json();

    document.getElementById("district").value = post.district || "";
    document.getElementById("street").value = post.street || "";
    document.getElementById("rooms").value = post.rooms || "";
    document.getElementById("bedrooms").value = post.bedrooms || "";
    document.getElementById("area").value = post.area || "";
    document.getElementById("floor").value = post.floor || "";
    document.getElementById("price").value = post.price || "";
    document.getElementById("description").value = post.text || "";

}

loadPost();

document.getElementById("saveBtn").onclick = () => {

    alert("💾 Следующий этап — сохранение данных на сервер.");

};