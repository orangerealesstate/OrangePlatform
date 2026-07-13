const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const input = require("input");
require("dotenv").config();

const apiId = Number(process.env.API_ID);
const apiHash = process.env.API_HASH;

(async () => {
    const client = new TelegramClient(
        new StringSession(""),
        apiId,
        apiHash,
        {
            connectionRetries: 5,
        }
    );

    await client.start({
        phoneNumber: async () => await input.text("Phone: "),
        password: async () => await input.text("2FA Password (თუ არ გაქვს, Enter): "),
        phoneCode: async () => await input.text("Code: "),
        onError: (err) => console.log(err),
    });

    console.log("\n==============================");
    console.log("STRING_SESSION:");
    console.log(client.session.save());
    console.log("==============================\n");

    process.exit(0);
})();
