async function loadPosts() {

    const response = await fetch("/api/posts");
    const posts = await response.json();

    const container = document.getElementById("posts");

    container.innerHTML = "";

    posts.forEach(post => {

        const image = post.images.length
            ? post.images[0]
            : "https://via.placeholder.com/600x400?text=Orange+Real+Estate";

        container.innerHTML += `
            <div class="card">

                <img src="${image}" alt="">

                <div class="info">

                    <div class="price">$${post.price || "-"}</div>

                    <div class="details">
                        🛏 ${post.rooms || "-"} ოთახი<br>
                        📐 ${post.area || "-"} მ²<br>
                        📍 ${post.district || "-"}
                    </div>

                    <div class="text">
                        ${post.text}
                    </div>

                </div>

            </div>
        `;

    });

}

loadPosts();