const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const input = require("input");
require("dotenv").config();

const apiId = Number(process.env.API_ID);
const apiHash = process.env.API_HASH;

const client = new TelegramClient(
    new StringSession(""),
    apiId,
    apiHash,
    {
        connectionRetries: 5,
    }
);

(async () => {
    await client.start({
        phoneNumber: async () => await input.text("Phone number: "),
        password: async () => await input.text("2FA password (if any): "),
        phoneCode: async () => await input.text("Code: "),
        onError: (err) => console.log(err),
    });

    console.log("\n===== STRING SESSION =====\n");
    console.log(client.session.save());
    console.log("\n==========================\n");

    process.exit(0);
})();