require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");

const token = process.env.BOT_TOKEN;
console.log("Token starts with:", token.substring(0, 10));

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
console.log("Bot started successfully");
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(
        msg.chat.id,
        "🍊 Добро пожаловать в Orange Real Estate!\n\nВыберите действие:",
        {
            reply_markup: {
                keyboard: [
                    [
                        {
                            text: "🏠 Открыть каталог",
                            web_app: {
                                url: WEBAPP
                            }
                        }
                    ],
                    ["🆕 Новые объявления"],
                    ["📞 Связаться с нами"]
                ],
                resize_keyboard: true
            }
        }
    );
});

bot.on("message", (msg) => {

    if (msg.text === "🆕 Новые объявления") {
        bot.sendMessage(
            msg.chat.id,
            "Откройте каталог и используйте сортировку по новым объявлениям."
        );
    }

    if (msg.text === "📞 Связаться с нами") {
        bot.sendMessage(
            msg.chat.id,
            "📞 +995...\n📲 Telegram: @OrangeRealEstate"
        );
    }

});

console.log("🤖 Bot started...");