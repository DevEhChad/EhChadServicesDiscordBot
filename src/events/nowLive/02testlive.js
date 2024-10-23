const { Client, GuildMember, IntentsBitField} = require('discord.js');
const TwitchUserSchema = require("../../schemas/TwitchUser");
const NowLiveSchema = require("../../schemas/NowLiveChannel");
const axios = require("axios");
require("dotenv").config();
const twitchClientID = process.env.TWITCH_CLIENT_ID;
const twitchSecretID = process.env.TWITCH_CLIENT_SECRET;

module.exports = async (client) => {
  try {
    let twitchAccessToken = null;
    const wasLiveMap = new Map(); // To store live status per user (keyed by twitchId)

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

    // Function to check if the stream is live for a specific Twitch user
    async function isStreamLive(twitchUsername) {
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

    // Function to check all Twitch users in the guild and notify if live
    async function checkStreamsAndNotify() {
      // Query NowLiveSchema to find the channel for live notifications
      const nowLiveChannel = await NowLiveSchema.findOne({ guildId: guildId });
      if (!nowLiveChannel) {
        console.log("No live channel found for this guild.");
        return;
      }

      // Query all Twitch users associated with the guild
      const twitchUsers = await TwitchUserSchema.find({ guildId: guildId });

      for (const user of twitchUsers) {
        const { twitchId } = user; // Using `twitchId` as the username here, since it stores the username
        const isLive = await isStreamLive(twitchId); // Use twitchId (username) to check if the stream is live
        const wasLive = wasLiveMap.get(twitchId) || false;

        // Notify only if the stream just went live (was previously offline)
        if (isLive && !wasLive) {
          const channel = await client.channels.fetch(nowLiveChannel.channelId);
          if (channel) {
            channel.send(`${twitchId} is now live on Twitch! Check it out at https://www.twitch.tv/${twitchId}`);
          }
        }

        // Update live status in memory
        wasLiveMap.set(twitchId, isLive);
      }
    }

    // Set an interval to check all streams every 5 minutes
    setInterval(checkStreamsAndNotify, 1000); // 5 minutes = 5 * 60 * 1000 ms
  } catch (error) {
    console.log(`Error: `, error);
  }
}
