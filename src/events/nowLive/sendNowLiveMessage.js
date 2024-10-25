const { Client, GuildMember, IntentsBitField } = require('discord.js');
const TwitchUserSchema = require("../../schemas/TwitchUser");
const NowLiveSchema = require("../../schemas/NowLiveChannel");
const axios = require("axios");
require("dotenv").config();
const twitchClientID = process.env.TWITCH_CLIENT_ID;
const twitchSecretID = process.env.TWITCH_CLIENT_SECRET;

module.exports = async (client) => {
  try {
    let twitchAccessToken = null;
    const notifiedMap = new Map(); // Track notified status per user for the current stream session

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
      // Query all NowLiveSchema entries for live notification channels in the guild
      const nowLiveChannels = await NowLiveSchema.find();
      if (!nowLiveChannels || nowLiveChannels.length === 0) {
        return;
      }

      // Query all Twitch users associated with the guild
      const twitchUsers = await TwitchUserSchema.find();

      for (const user of twitchUsers) {
        const { twitchId } = user; // Using `twitchId` as the username here
        const isLive = await isStreamLive(twitchId);

        // Notify only if the user is live and a notification hasn't been sent yet
        if (isLive && !notifiedMap.get(twitchId)) {
          // Send a notification to each NowLiveChannel entry
          for (const nowLiveChannel of nowLiveChannels) {
            const channel = await client.channels.fetch(nowLiveChannel.channelId);
            if (channel) {
              // Use customMessage if available, otherwise use the default message
              const message = nowLiveChannel.customMessage
                ? `${nowLiveChannel.customMessage} | **${twitchId}**: https://www.twitch.tv/${twitchId}`
                :  `**${twitchId}** is now live on Twitch! Check the stream out at https://www.twitch.tv/${twitchId}`;

              channel.send(message);
            }
          }
          // Mark this user as notified
          notifiedMap.set(twitchId, true);
        } 
        // Reset notification status if user is offline
        else if (!isLive) {
          notifiedMap.set(twitchId, false);
        }
      }
    }

    // Initial check when bot starts
    await checkStreamsAndNotify();

    // Set an interval to check all streams every 5 minutes
    setInterval(checkStreamsAndNotify, 1 * 60 * 1000); // 5 minutes = 5 * 60 * 1000 ms
  } catch (error) {
    console.log(`Error: `, error);
  }
}