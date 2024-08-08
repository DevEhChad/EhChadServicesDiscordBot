require("dotenv").config();
const mongoose = require('mongoose');
const eventHandler = require('./handlers/eventHandler');
const axios = require("axios");

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
        IntentsBitField.Flags.MessageContent,
    ],
});

const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;
const TWITCH_USER_LOGIN = 'spoodah';
const DISCORD_CHANNEL_ID = '1212351809088258058';

let accessToken = '';
let currentLiveStreamId = '';

async function getTwitchAccessToken() {
  const response = await axios.post('https://id.twitch.tv/oauth2/token', null, {
    params: {
      client_id: TWITCH_CLIENT_ID,
      client_secret: TWITCH_CLIENT_SECRET,
      grant_type: 'client_credentials'
    }
  });

  accessToken = response.data.access_token;
}

async function checkTwitchLiveStatus() {
    if (!accessToken) {
      await getTwitchAccessToken();
    }
  
    try {
      const response = await axios.get(`https://api.twitch.tv/helix/streams`, {
        headers: {
          'Client-ID': TWITCH_CLIENT_ID,
          'Authorization': `Bearer ${accessToken}`
        },
        params: {
          user_login: TWITCH_USER_LOGIN
        }
      });
  
      if (response.data.data.length > 0) {
        const stream = response.data.data[0];
        if (stream.type === 'live') {
          if (stream.id !== currentLiveStreamId) {
            currentLiveStreamId = stream.id;
            const channel = await client.channels.fetch(DISCORD_CHANNEL_ID);
            channel.send(`${TWITCH_USER_LOGIN} is live on Twitch! Watch here: https://twitch.tv/${TWITCH_USER_LOGIN}`);
          }
        }
      } else {
        currentLiveStreamId = ''; // Reset when the stream is offline
      }
    } catch (error) {
      console.error('Error checking Twitch live status:', error);
      if (error.response && error.response.status === 401) {
        await getTwitchAccessToken(); // Refresh token if expired
      }
    }
  }

(async () => {
    try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Successfully Connected to EhChadServices DB. ✅');

    eventHandler(client);
    checkTwitchLiveStatus();
  setInterval(checkTwitchLiveStatus, 5000);

    client.login(process.env.TOKEN);
    } catch (error) {
        console.log(`Error: ${error}`);
    }
})();