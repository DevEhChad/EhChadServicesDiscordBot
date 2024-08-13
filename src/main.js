require("dotenv").config();
const mongoose = require('mongoose');
const eventHandler = require('./handlers/eventHandler');

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
const axios = require('axios');

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

/*const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
  const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;
  const TWITCH_USERNAME = 'lacy';
  const DISCORD_CHANNEL_ID = '1272735832771657779';
  
  let twitchAccessToken = null;
  
  // Function to get Twitch Access Token
  async function getTwitchAccessToken() {
      const response = await axios.post('https://id.twitch.tv/oauth2/token', null, {
          params: {
              client_id: TWITCH_CLIENT_ID,
              client_secret: TWITCH_CLIENT_SECRET,
              grant_type: 'client_credentials',
          },
      });
      twitchAccessToken = response.data.access_token;
  }
  
  // Function to check if the stream is live
  async function isStreamLive() {
      if (!twitchAccessToken) await getTwitchAccessToken();
      
      const response = await axios.get(`https://api.twitch.tv/helix/streams`, {
          params: {
              user_login: TWITCH_USERNAME,
          },
          headers: {
              'Client-ID': TWITCH_CLIENT_ID,
              'Authorization': `Bearer ${twitchAccessToken}`,
          },
      });
  
      return response.data.data.length > 0;
  }
  
  // Function to post a message on Discord if the stream is live
  async function checkStreamAndNotify() {
      const isLive = await isStreamLive();
      if (isLive) {
          const channel = await client.channels.fetch(DISCORD_CHANNEL_ID);
          channel.send(`${TWITCH_USERNAME} is now live on Twitch! Check it out at https://www.twitch.tv/${TWITCH_USERNAME}`);
      }
  }
  
  // Set an interval to check if the stream is live every 5 minutes
  setInterval(checkStreamAndNotify, 2000);
  */


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