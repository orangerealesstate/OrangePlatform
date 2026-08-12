const express = require("express");
const fs = require("fs");
const path = require("path");
require("./parser");
require("./bot");
const app = express();
app.use(express.json());
const PORT = 3000;

// Static files
app.use(express.static(path.join(__dirname, "public")));
app.use(
  "/downloads",
  express.static(path.join(__dirname, "downloads"))
);

const POSTS_FILE = path.join(__dirname, "posts.json");
const FAVORITES_FILE = path.join(__dirname, "favorites.json");

function getFavorites() {
    try {
        if (!fs.existsSync(FAVORITES_FILE)) {
            return {};
        }

        return JSON.parse(
            fs.readFileSync(FAVORITES_FILE, "utf8")
        );
    } catch (err) {
        console.error("Error reading favorites:", err);
        return {};
    }
}

function saveFavorites(data) {
    fs.writeFileSync(
        FAVORITES_FILE,
        JSON.stringify(data, null, 2),
        "utf8"
    );
}

function savePosts(posts) {
    fs.writeFileSync(
        POSTS_FILE,
        JSON.stringify(posts, null, 2),
        "utf8"
    );
}
// Read posts
function getPosts() {
    try {
        if (!fs.existsSync(POSTS_FILE)) {
            return [];
        }

        const data = fs.readFileSync(POSTS_FILE, "utf8");
        return JSON.parse(data);

    } catch (err) {
        console.error("Error reading posts.json:", err);
        return [];
    }
}

// Direct access to posts.json
app.get("/posts.json", (req, res) => {
    res.sendFile(POSTS_FILE);
});

app.get("/api/posts", (req, res) => {

    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.json(getPosts());
});
// FAVORITES

app.get("/api/favorites/:userId", (req, res) => {
    const favorites = getFavorites();
    const userId = String(req.params.userId);

    res.json(favorites[userId] || []);
});

app.post("/api/favorites", (req, res) => {
    const favorites = getFavorites();

    const userId = String(req.body.userId);
    const postId = String(req.body.postId);

    if (!favorites[userId]) {
        favorites[userId] = [];
    }

    if (!favorites[userId].includes(postId)) {
        favorites[userId].push(postId);
    }

    fs.writeFileSync(
        FAVORITES_FILE,
        JSON.stringify(favorites, null, 2),
        "utf8"
    );

    res.json({
        success: true,
        favorites: favorites[userId]
    });
});

app.delete("/api/favorites/:userId/:postId", (req, res) => {
    const favorites = getFavorites();

    const userId = String(req.params.userId);
    const postId = String(req.params.postId);

    if (favorites[userId]) {
        favorites[userId] = favorites[userId].filter(
            id => String(id) !== postId
        );
    }

    fs.writeFileSync(
        FAVORITES_FILE,
        JSON.stringify(favorites, null, 2),
        "utf8"
    );

    res.json({
        success: true,
        favorites: favorites[userId] || []
    });
});
// One post
app.get("/api/post/:id", (req, res) => {

    const posts = getPosts();

    const post = posts.find(
        p => String(p.id) === String(req.params.id)
    );

    if (!post) {
        return res.status(404).json({
            error: "Apartment not found"
        });
    }

    res.json(post);

});
app.post("/api/post/update", (req, res) => {

    try {

        const posts = getPosts();

        const updated = req.body;

        const index = posts.findIndex(
            p => String(p.id) === String(updated.id)
        );

        if (index === -1) {
            return res.status(404).json({
                success: false,
                error: "Apartment not found"
            });
        }

        posts[index] = {
            ...posts[index],
            district: updated.district,
            street: updated.street,
            rooms: updated.rooms,
            bedrooms: updated.bedrooms,
            area: updated.area,
            floor: updated.floor,
            price: updated.price,
            text: updated.text
        };

        savePosts(posts);

        res.json({
            success: true
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false
        });

    }

});
app.post("/api/post/delete", (req, res) => {

    try {

        const posts = getPosts();

        const filtered = posts.filter(
            p => String(p.id) !== String(req.body.id)
        );

        savePosts(filtered);

        res.json({
            success: true
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false
        });

    }

});

app.listen(PORT, () => {
    console.log(`✅ Server running: http://localhost:${PORT}`);
});