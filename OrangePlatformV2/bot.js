require("dotenv").config();

const { TelegramBot } = require("node-telegram-bot-api");

const token = process.env.BOT_TOKEN;

if (!token) {
    console.log("❌ BOT_TOKEN ვერ მოიძებნა .env ფაილში");
    process.exit(1);
}

const bot = new TelegramBot(token, {
    polling: true
});

const API_URL =
    "https://orangeplatform.onrender.com";

console.log("🤖 Bot started successfully");

bot.getMe().then(me => {
    console.log("Bot:", me);
});

bot.on("polling_error", console.error);
bot.on("error", console.error);


/* =====================================================
   START
===================================================== */

bot.onText(/\/start/, async (msg) => {

    try {

        await bot.sendMessage(
            msg.chat.id,

            "🍊 Добро пожаловать в Orange Real Estate!\n\nВыберите действие:",

            {
                reply_markup: {

                    inline_keyboard: [

                        [
                            {
                                text: "🆕 Новые объявления",
                                callback_data: "new_posts"
                            }
                        ],

                        [
                            {
                                text: "❤️ Избранное",
                                callback_data: "favorites"
                            }
                        ],

                        [
                            {
                                text: "📞 Связаться с нами",
                                callback_data: "contact"
                            }
                        ]

                    ]
                }
            }
        );

    } catch (error) {

        console.error(
            "Start error:",
            error
        );

    }

});


/* =====================================================
   LOAD FAVORITES
===================================================== */

async function loadFavorites(userId) {

    const response = await fetch(
        `${API_URL}/api/favorites/${encodeURIComponent(userId)}?t=${Date.now()}`
    );

    if (!response.ok) {

        throw new Error(
            `Favorites API error: ${response.status}`
        );

    }

    const favorites =
        await response.json();

    console.log(
        "❤️ FAVORITES:",
        {
            userId,
            favorites
        }
    );

    return Array.isArray(favorites)
        ? favorites
        : [];
}


/* =====================================================
   LOAD POST
===================================================== */

async function loadPost(postId) {

    const response = await fetch(
        `${API_URL}/api/post/${encodeURIComponent(postId)}?t=${Date.now()}`
    );

    if (!response.ok) {

        throw new Error(
            `Post ${postId} error: ${response.status}`
        );

    }

    const data =
        await response.json();

    return data.post || data;
}


/* =====================================================
   HTML SAFE TEXT
===================================================== */

function escapeHtml(value) {

    return String(value ?? "-")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =====================================================
   SHOW FAVORITES
===================================================== */

async function showFavorites(chatId, userId) {

    try {

        const favorites =
            await loadFavorites(userId);


        /* ---------------------------------------------
           EMPTY
        --------------------------------------------- */

        if (favorites.length === 0) {

            await bot.sendMessage(
                chatId,
                "❤️ Ваше избранное пока пусто."
            );

            return;

        }


        let message =
            "❤️ <b>Ваше избранное:</b>\n\n";


        /*
           აქ ვინახავთ Telegram-ის ორიგინალი
           პოსტების ღილაკებს
        */

        const buttons = [];


        /* ---------------------------------------------
           LOAD EACH FAVORITE
        --------------------------------------------- */

        for (
            let index = 0;
            index < favorites.length;
            index++
        ) {

            const postId =
                String(favorites[index]);


            try {

                const post =
                    await loadPost(postId);


                const district =
                    post?.district ||
                    post?.area ||
                    "-";


                const rooms =
                    post?.rooms ||
                    post?.roomCount ||
                    "-";


                const price =
                    post?.price !== undefined &&
                    post?.price !== null &&
                    post?.price !== ""
                        ? `${post.price} $`
                        : "-";


                const address =
                    post?.address ||
                    post?.street ||
                    post?.location ||
                    "-";


                /* -------------------------------------
                   FAVORITE TEXT
                ------------------------------------- */

                message +=
                    `<b>${index + 1}. 🏠 Объявление #${escapeHtml(postId)}</b>\n` +
                    `📍 Район: ${escapeHtml(district)}\n` +
                    `🏢 Адрес: ${escapeHtml(address)}\n` +
                    `🚪 Комнат: ${escapeHtml(rooms)}\n` +
                    `💰 Цена: ${escapeHtml(price)}\n\n`;


                /* -------------------------------------
                   ORIGINAL TELEGRAM LINK
                ------------------------------------- */

                const telegramLink =
                    post?.telegramLink;


                if (
                    telegramLink &&
                    typeof telegramLink === "string" &&
                    /^https:\/\/t\.me\//i.test(telegramLink)
                ) {

                    buttons.push([
                        {
                            text: `🔗 Оригинал объявления #${postId}`,
                            url: telegramLink
                        }
                    ]);

                }


            } catch (postError) {

                console.error(
                    `❌ Ошибка загрузки объявления ${postId}:`,
                    postError
                );


                /*
                   თუ კონკრეტული ბინა წაშლილია,
                   მაინც ვაჩვენებთ მის ID-ს
                */

                message +=
                    `<b>${index + 1}. 🏠 Объявление #${escapeHtml(postId)}</b>\n` +
                    `⚠️ Объявление недоступно.\n\n`;

            }

        }


        /* ---------------------------------------------
           SEND FAVORITES
        --------------------------------------------- */

        await bot.sendMessage(
            chatId,
            message,
            {
                parse_mode: "HTML",

                reply_markup:
                    buttons.length > 0
                        ? {
                            inline_keyboard: buttons
                        }
                        : undefined
            }
        );


    } catch (error) {

        console.error(
            "❌ Favorites error:",
            error
        );


        await bot.sendMessage(
            chatId,
            "❌ Не удалось загрузить избранное."
        );

    }

}


/* =====================================================
   CALLBACK BUTTONS
===================================================== */

bot.on(
    "callback_query",
    async (query) => {

        const chatId =
            query.message.chat.id;


        try {

            /* -----------------------------------------
               NEW POSTS
            ----------------------------------------- */

            if (
                query.data === "new_posts"
            ) {

                await bot.sendMessage(
                    chatId,

                    "🆕 Откройте каталог и используйте сортировку по новым объявлениям."
                );

            }


            /* -----------------------------------------
               FAVORITES
            ----------------------------------------- */

            else if (
                query.data === "favorites"
            ) {

                const userId =
                    String(query.from.id);


                console.log(
                    "❤️ Telegram user ID:",
                    userId
                );


                await showFavorites(
                    chatId,
                    userId
                );

            }


            /* -----------------------------------------
               CONTACT
            ----------------------------------------- */

            else if (
                query.data === "contact"
            ) {

                await bot.sendMessage(
                    chatId,

                    "📲 Telegram: @Orangerealestatetbilisi"
                );

            }


        } catch (error) {

            console.error(
                "Callback error:",
                error
            );

        }


        /* ---------------------------------------------
           REMOVE LOADING FROM BUTTON
        --------------------------------------------- */

        try {

            await bot.answerCallbackQuery(
                query.id
            );

        } catch (error) {

            console.error(
                "answerCallbackQuery error:",
                error
            );

        }

    }
);


/* =====================================================
   TEXT BUTTONS
===================================================== */

bot.on(
    "message",
    async (msg) => {

        if (!msg.text) return;


        /*
           /start უკვე დამუშავებულია ზემოთ
        */

        if (
            msg.text === "/start"
        ) {
            return;
        }


        /* -----------------------------------------
           NEW POSTS
        ----------------------------------------- */

        if (
            msg.text === "🆕 Новые объявления"
        ) {

            await bot.sendMessage(
                msg.chat.id,

                "🆕 Откройте каталог и используйте сортировку по новым объявлениям."
            );

            return;

        }


        /* -----------------------------------------
           FAVORITES
        ----------------------------------------- */

        if (
            msg.text === "❤️ Избранное"
        ) {

            const userId =
                String(msg.from.id);


            console.log(
                "❤️ TEXT FAVORITES USER:",
                userId
            );


            await showFavorites(
                msg.chat.id,
                userId
            );

            return;

        }


        /* -----------------------------------------
           CONTACT
        ----------------------------------------- */

        if (
            msg.text === "📞 Связаться с нами"
        ) {

            await bot.sendMessage(
                msg.chat.id,

                "📲 Telegram: @Orangerealestatetbilisi"
            );

            return;

        }

    }
);


console.log(
    "🤖 Orange Real Estate Bot is running..."
);