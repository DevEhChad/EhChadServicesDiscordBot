require("dotenv").config();
const mongoose = require('mongoose');
const eventHandler = require('./handlers/eventHandler');
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

async function NowLiveTest() {
    try {
const Twitch = require("./schemas/TwitchUser");
const NowLiveSchema = require("./schemas/NowLiveChannel");

const guildId = "865614728398372914";
const TwitchUserID = Twitch.findOne({ guildId: guildId }).exec();
const NowLiveChannelID = NowLiveSchema.findOne({ guildId: guildId }).exec();

if (TwitchUserID) {
    const { twitchId } = TwitchUserID;

    console.log(`Guild ID: ${guildId}`);
    console.log(`Twitch ID: ${twitchId}`);
} else
{
    console.log(`Can't find ${guildId}`);
}
if (NowLiveChannelID) {
    const { channelId } = NowLiveChannelID;

    console.log(`Channel ID: ${channelId}`);
}

    } catch (error) {
        console.log(`Error, `, error);
    }
}

(async () => {
    try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Successfully Connected to EhChadServices DB. ✅');
    
    eventHandler(client);

    client.login(process.env.TOKEN);
    } catch (error) {
        console.log(`Error: ${error}`);
    }

    NowLiveTest();

})();