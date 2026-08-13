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
bot.getMe().then(me => {
    console.log(me);
});

bot.on("polling_error", console.error);
bot.on("error", console.error);

const WEBAPP = "https://orangeplatform.onrender.com/";
const API_URL = "https://orangeplatform.onrender.com";
console.log("Bot started successfully");
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(
        msg.chat.id,
        "🍊 Добро пожаловать в Orange Real Estate!\n\nВыберите действие:",
        {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "🏠 Открыть каталог",
                            web_app: {
                                url: WEBAPP
                            }
                        }
                    ],
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
});
bot.on("callback_query", async (query) => {
    const chatId = query.message.chat.id;

    if (query.data === "new_posts") {
        bot.sendMessage(
            chatId,
            "Откройте каталог и используйте сортировку по новым объявлениям."
        );
    }

    if (query.data === "favorites") {

    try {

        const userId = String(query.from.id);

        const response = await fetch(
            `${API_URL}/api/favorites/${userId}?t=${Date.now()}`
        );

        if (!response.ok) {
            throw new Error("Failed to load favorites");
        }

        const favorites = await response.json();

        if (
            !Array.isArray(favorites) ||
            favorites.length === 0
        ) {

            await bot.sendMessage(
                chatId,
                "❤️ Ваше избранное пока пусто."
            );

            return;
        }

        let message =
            "❤️ <b>Ваше избранное:</b>\n\n";

        favorites.forEach((postId, index) => {

            message +=
                `${index + 1}. 🏠 Объявление #${postId}\n`;

        });

        await bot.sendMessage(
            chatId,
            message,
            {
                parse_mode: "HTML"
            }
        );

    } catch (error) {

        console.error(
            "Favorites bot error:",
            error
        );

        await bot.sendMessage(
            chatId,
            "❌ Не удалось загрузить избранное."
        );
    }
    }

    if (query.data === "contact") {
        bot.sendMessage(
            chatId,
            "📲 Telegram: @Orangerealestatetbilisi"
        );
    }

    bot.answerCallbackQuery(query.id);
});

bot.on("message", (msg) => {

    if (msg.text === "🆕 Новые объявления") {
        bot.sendMessage(
            msg.chat.id,
            "Откройте каталог и используйте сортировку по новым объявлениям."
        );
    }

    if (msg.text === "❤️ Избранное") {
        bot.sendMessage(
            msg.chat.id,
            "❤️ Ваше избранное пока пусто."
        );
    }

    if (msg.text === "📞 Связаться с нами") {
        bot.sendMessage(
            msg.chat.id,
            "📲 Telegram: @Orangerealestatetbilisi"
        );
    }

});

console.log("🤖 Bot started...");