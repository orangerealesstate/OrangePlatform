const express = require("express");
const fs = require("fs");
const path = require("path");
require("./parser");

const app = express();
const PORT = 3000;

// Static files
app.use(express.static(path.join(__dirname, "public")));
app.use(
  "/downloads",
  express.static(path.join(__dirname, "downloads"))
);

const POSTS_FILE = path.join(__dirname, "posts.json");

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

app.listen(PORT, () => {
    console.log(`✅ Server running: http://localhost:${PORT}`);
});