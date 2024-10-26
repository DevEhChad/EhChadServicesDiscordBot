require("dotenv").config();
const mongoose = require('mongoose');
const eventHandler = require('./handlers/eventHandler');
const sendNowLiveMessage = require("./events/nowLive/sendNowLiveMessage");
const axios = require('axios');

const {
    REST,
    Routes,
    Client,
    IntentsBitField,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    ComponentType,
} = require('discord.js');

//client
const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.GuildPresences,
        IntentsBitField.Flags.GuildModeration,
        IntentsBitField.Flags.GuildInvites,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.DirectMessages,
        IntentsBitField.Flags.GuildEmojisAndStickers,
        IntentsBitField.Flags.GuildVoiceStates,
        IntentsBitField.Flags.GuildWebhooks,
    ],
});

(async () => {
    try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Successfully Connected to EhChadServices DB. ✅');
    
    eventHandler(client);
    sendNowLiveMessage(client);

    client.login(process.env.TOKEN);
    } catch (error) {
        console.log(`Error: ${error}`);
    }
})();