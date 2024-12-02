require("dotenv").config();
const mongoose = require('mongoose');
const eventHandler = require('./handlers/eventHandler');
const sendNowLiveMessage = require("./events/nowLive/sendNowLiveMessage");
const axios = require('axios');
const app = require('express');

const {
    REST,
    Routes,
    Client,
    Intents,
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

const prefix = '!'; // Choose your desired prefix

client.on('messageCreate', (message) => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(/ /);
    const command = args.shift().toLowerCase();

    if (command === 'ping') {
        message.reply('Pong!');
    }
    // ... add   
    //more test commands
});



(async () => {
    try {

        mongoose.set('strictQuery', false);
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Successfully Connected to EhChadServices DB. ✅');

        eventHandler(client);

        client.login(process.env.TOKEN);

        sendNowLiveMessage(client);

    } catch (error) {
        console.log(`Error: ${error}`);
    }
})();