require("dotenv").config();
const { Client, IntentsBitField } = require('discord.js');

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ],
});

client.on("ready", (c) => {
    console.log(`${c.user.username} is now online!`);
});

client.on('messageCreate', (message) => {
    if (message.author.bot) {
        return;
    }

    if (message.content === "ping") {
        message.reply("pong!");
    }

});

client.login(process.env.TOKEN);