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
const STATS_FILE = path.join(__dirname, "stats.json");
function getStats() {
    try {
        if (!fs.existsSync(STATS_FILE)) {
            return {
                users: {},
                appViews: 0,
                postViews: {}
            };
        }

        return JSON.parse(
            fs.readFileSync(STATS_FILE, "utf8")
        );

    } catch (err) {
        console.error("Error reading stats:", err);

        return {
            users: {},
            appViews: 0,
            postViews: {}
        };
    }
}


function saveStats(stats) {
    fs.writeFileSync(
        STATS_FILE,
        JSON.stringify(stats, null, 2),
        "utf8"
    );
}

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
// =========================
// STATISTICS
// =========================

app.post("/api/stats/app", (req, res) => {

    try {

        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: "userId required"
            });
        }

        const stats = getStats();

        stats.appViews++;

        const id = String(userId);

        if (!stats.users[id]) {
            stats.users[id] = {
                views: 0,
                firstSeen: new Date().toISOString(),
                lastSeen: new Date().toISOString()
            };
        }

        stats.users[id].views++;
        stats.users[id].lastSeen = new Date().toISOString();

        saveStats(stats);

        res.json({
            success: true
        });

    } catch (err) {

        console.error("Stats app error:", err);

        res.status(500).json({
            success: false
        });
    }
});


app.post("/api/stats/post", (req, res) => {

    try {

        const { userId, postId } = req.body;

        if (!userId || !postId) {
            return res.status(400).json({
                success: false,
                error: "userId and postId required"
            });
        }

        const stats = getStats();

        const id = String(postId);

        if (!stats.postViews[id]) {
            stats.postViews[id] = 0;
        }

        stats.postViews[id]++;

        saveStats(stats);

        res.json({
            success: true
        });

    } catch (err) {

        console.error("Stats post error:", err);

        res.status(500).json({
            success: false
        });
    }
});
app.get("/api/stats", (req, res) => {

    try {

        const adminId = "5172653731";
        const userId = String(req.query.userId || "");

        if (userId !== adminId) {
            return res.status(403).json({
                success: false,
                error: "Access denied"
            });
        }

        const stats = getStats();

        const users = Object.keys(stats.users || {});

        const totalUsers = users.length;

        const totalAppViews = stats.appViews || 0;

        const postViews = stats.postViews || {};

        const totalPostViews = Object.values(postViews)
            .reduce((sum, value) => sum + Number(value || 0), 0);

        res.json({
            totalUsers,
            totalAppViews,
            totalPostViews,
            postViews
        });

    } catch (err) {

        console.error("Stats API error:", err);

        res.status(500).json({
            success: false
        });
    }
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