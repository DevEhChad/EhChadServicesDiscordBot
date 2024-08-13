const { Client, GuildMember, IntentsBitField} = require('discord.js');
const TwitchUserSchema = require("../../schemas/TwitchUser");
const NowLiveSchema = require("../../schemas/NowLiveChannel");
const axios = require("axios");
require("dotenv").config();
const twitchClientID = process.env.TWITCH_CLIENT_ID;
const twitchSecretID = process.env.TWITCH_CLIENT_SECRET;

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

module.exports = async (client, message) => {
  try {
  
    const twitchUsername = TwitchUserSchema.twitchId;
  
  let twitchAccessToken = null;
  
  // Function to get Twitch Access Token
  async function getTwitchAccessToken() {
      const response = await axios.post('https://id.twitch.tv/oauth2/token', null, {
          params: {
              client_id: twitchClientID,
              client_secret: twitchSecretID,
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
              user_login: twitchUsername,
          },
          headers: {
              'Client-ID': twitchClientID,
              'Authorization': `Bearer ${twitchAccessToken}`,
          },
      });
  
      return response.data.data.length > 0;
  }
  
  // Function to post a message on Discord if the stream is live
  async function checkStreamAndNotify() {
      const isLive = await isStreamLive();
      if (isLive) {
        const liveChanelId = NowLiveSchema.guildId + NowLiveSchema.channelId;
          const channel = await client.channels.fetch(liveChanelId);
          channel.send(`${twitchUsername} is now live on Twitch! Check it out at https://www.twitch.tv/${TWITCH_USERNAME}`);
      }
  }
  
  // Set an interval to check if the stream is live every 5 minutes
  setInterval(checkStreamAndNotify, 1000);
}  
catch (error) {
  console.log(`Error, `, error);
}
}