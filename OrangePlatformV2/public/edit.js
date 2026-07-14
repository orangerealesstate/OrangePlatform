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

document.getElementById("saveBtn").onclick = async () => {

    post.district = document.getElementById("district").value;
    post.street = document.getElementById("street").value;
    post.rooms = document.getElementById("rooms").value;
    post.bedrooms = document.getElementById("bedrooms").value;
    post.area = document.getElementById("area").value;
    post.floor = document.getElementById("floor").value;
    post.price = document.getElementById("price").value;
    post.text = document.getElementById("description").value;

    const response = await fetch("/api/post/update", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(post)
    });

    const result = await response.json();

    if (result.success) {
        alert("✅ Объявление сохранено");
        window.location.href = "details.html?id=" + post.id;
    } else {
        alert("❌ Ошибка сохранения");
    }

};