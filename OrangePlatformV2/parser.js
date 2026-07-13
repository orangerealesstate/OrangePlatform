const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const apiId = Number(process.env.API_ID);
const apiHash = process.env.API_HASH;
const channel = process.env.CHANNEL;
const stringSession = new StringSession(
    process.env.STRING_SESSION || ""
);

const client = new TelegramClient(
    stringSession,
    apiId,
    apiHash,
    {
        connectionRetries: 5,
    }
);

const POSTS_FILE = path.join(__dirname, "posts.json");
const DOWNLOADS = path.join(__dirname, "downloads");

if (!fs.existsSync(DOWNLOADS)) {
    fs.mkdirSync(DOWNLOADS);
}

function getValue(text, patterns) {

    if (!text) return "";

    for (const pattern of patterns) {

        const match = text.match(pattern);

        if (match) {
            return match[1].trim();
        }

    }

    return "";
}

function savePosts(posts) {

    fs.writeFileSync(
        POSTS_FILE,
        JSON.stringify(posts, null, 2),
        "utf8"
    );

}
function normalizeDistrict(value) {

    if (!value) return "-";

    let d = value
        .toLowerCase()
        .replace(/#/g, "")
        .replace(/📍/g, "")
        .trim();

    if (d.includes("сабур")) return "saburtalo";
    if (d.includes("вак")) return "vake";
    if (d.includes("вер")) return "vera";
    if (d.includes("исан")) return "isani";
    if (d.includes("дигом")) return "digomi";
    if (d.includes("крцан")) return "krtsanisi";
    if (d.includes("ортач")) return "ortachala";
    if (d.includes("мтац")) return "mtatsminda";
    if (d.includes("дидуб")) return "didube";
    if (d.includes("глдан")) return "gldani";

    return d;
}

async function downloadPhoto(message, fileName) {

    try {

        const buffer = await client.downloadMedia(message);
        console.log("Downloading:", fileName, buffer ? "OK" : "FAILED");

        if (!buffer) return null;

        const filePath = path.join(
            DOWNLOADS,
            fileName
        );

        fs.writeFileSync(filePath, buffer);

        return "downloads/" + fileName;

    } catch (err) {
    console.log("Photo download error:");
    console.log(err);
    return null;
}

}
async function start() {

    await client.connect();
    if (!client.connected) {
    await client.connect();
}

    console.log("✅ Bot connected");
console.log("CHANNEL:", channel);

    const messages = await client.getMessages(channel, {
        limit: 500
    });
    console.log("Messages count:", messages.length);
console.log(messages.map(m => m.id));

for (const m of messages) {
    console.log("ID:", m.id, "TEXT:", !!m.message, "PHOTO:", !!m.photo);
}
console.log(messages);

    const posts = [];
    const albums = {};

    for (const msg of messages.reverse()) {

        const text = msg.message || "";

        if (!msg.photo && !text) continue;

        const albumId = msg.groupedId
            ? String(msg.groupedId)
            : String(msg.id);

        if (!albums[albumId]) {

            albums[albumId] = {
                id: msg.id,
                groupId: albumId,
                date: msg.date,
                text: text,
                images: [],
                price: "",
                district: "",
                street: "",
                rooms: "",
                bedrooms: "",
                area: "",
                floor: ""
            };

        }

        const post = albums[albumId];

        if (text.length > post.text.length) {
            post.text = text;
        }
          post.price = post.price || getValue(text, [
    /#Цена[_ ]?(\d+)/i,
    /#Цена[:_ ]*(\d+)/i,
    /Цена[:_ ]*(\d+)/i,
    /\$\s*(\d+)/i,
    /(\d+)\s*\$/i
]);

    post.district = post.district || getValue(text, [
    /📍\s*Район:\s*#?([^\n]+)/i,
    /Район:\s*#?([^\n]+)/i,
    /Район\s*#([^\s#]+)/i,
    /квартира\s+в\s+([^\s📍\n]+)/i ]);
    post.street = post.street || getValue(text, [
    /Адрес:\s*([^\n]+)/i,
    /📍\s*Адрес:\s*([^\n]+)/i,
    /Улица:\s*([^\n]+)/i
]);

if (post.street) {
    post.street = post.street
        .replace(/^он\s+/i, "")
        .replace(/^ул\.?\s*/i, "")
        .replace(/^улица\s*/i, "")
        .trim();
}

post.agent = getValue(text, [
    /Агент:\s*([^\n]+)/i,
    /Риелтор:\s*([^\n]+)/i,
    /Контакт:\s*([^\n]+)/i,
    /@([A-Za-z0-9_]+)/i
])

        post.rooms = post.rooms || getValue(text, [
            /Количество\s*#?Комнат[: ]*(\d+)/i,
            /Количество\s*комнат[: ]*(\d+)/i,
            /Комнат[: ]*(\d+)/i
        ]);

        post.bedrooms = post.bedrooms || getValue(text, [
            /Количество\s*#?Спален[: ]*(\d+)/i,
            /Количество\s*спален[: ]*(\d+)/i,
            /Спален[: ]*(\d+)/i
        ]);

        post.area = post.area || getValue(text, [
            /Общая\s*площадь[: ]*([\d.,]+)/i,
            /Площадь[: ]*([\d.,]+)/i
        ]);

        post.floor = post.floor || getValue(text, [
            /Этаж[: ]*([^\n]+)/i
        ]);

        if (msg.photo) {

            const fileName = `${msg.id}.jpg`;
            const image = await downloadPhoto(msg, fileName);

            if (image && !post.images.includes(image)) {
                post.images.push(image);
            }

        }

    }
        for (const key of Object.keys(albums)) {

        const post = albums[key];

        post.price = post.price || "-";
        post.district = post.district || "-";
        post.street = post.street || "-";
        post.rooms = post.rooms || "-";
        post.bedrooms = post.bedrooms || "-";
        post.area = post.area || "-";
        post.floor = post.floor || "-";

        posts.push(post);

    }

    posts.sort((a, b) => b.id - a.id);

    savePosts(posts);

    console.log(`✅ Saved ${posts.length} posts`);


}


async function runParser() {
    try {
        await start();
    } catch (err) {
        console.error(err);
    }
}

runParser();

// ყოველ 2 წუთში გადაამოწმოს Telegram
setInterval(runParser, 2 * 60 * 1000);