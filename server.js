const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, "public")));
app.use("/downloads", express.static(path.join(__dirname, "downloads")));

app.get("/api/posts", (req, res) => {
    const file = path.join(__dirname, "posts.json");

    if (!fs.existsSync(file)) {
        return res.json([]);
    }

    const posts = JSON.parse(fs.readFileSync(file, "utf8"));
    res.json(posts);
});

app.listen(PORT, () => {
    console.log(`Server running: http://localhost:${PORT}`);
});