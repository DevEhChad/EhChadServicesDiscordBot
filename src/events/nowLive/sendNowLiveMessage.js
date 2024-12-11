const { Client, GuildMember, IntentsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ButtonInteraction, ButtonComponent, channelLink } = require('discord.js');
const TwitchUserSchema = require("../../schemas/TwitchUser");
const NowLiveSchema = require("../../schemas/NowLiveChannel");
const axios = require("axios");
require("dotenv").config();
const twitchClientID = process.env.TWITCH_CLIENT_ID;
const twitchSecretID = process.env.TWITCH_CLIENT_SECRET;

module.exports = async (client) => {
  try {
    let twitchAccessToken = null;
    const notifiedMap = new Map();

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

    function getRandomColor() {
      const letters = '0123456789ABCDEF';
      let color = '#';
      for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
      }
      return color;
    }

    async function isStreamLive(twitchUsername) {
      try {

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
      } catch (error) {
        console.log(`Error: `, error);
      }
    }

    async function getStreamData(twitchUsername) {
      try {
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

        return response.data.data[0]; // Return the stream data directly
      } catch (error) {
        console.log(`Error: `, error)
      }
    }

    async function checkStreamsAndNotify() {
      const nowLiveChannels = await NowLiveSchema.find();
      if (!nowLiveChannels || nowLiveChannels.length === 0) {
        return;
      }

      const twitchUsers = await TwitchUserSchema.find();

      for (const user of twitchUsers) {
        const { twitchId } = user;
        const isLive = await isStreamLive(twitchId);

        if (isLive && !notifiedMap.get(twitchId)) {
          for (const nowLiveChannel of nowLiveChannels) {
            const channel = await client.channels.fetch(nowLiveChannel.channelId);
            if (channel) {
              // Fetch stream data for title and URL
              const streamData = await getStreamData(twitchId);
              const streamTitle = streamData?.title || `${twitchId}'s Stream`;
              const twitchUrl = `https://www.twitch.tv/${twitchId}`;
              const gameName = streamData?.game_name || "Unknown Game";
              const startedAt = streamData?.started_at;
              const viewerCount = streamData?.viewer_count || 0;
              const thumbnailUrl = streamData?.thumbnail_url || null;

              // Create button
              const row = new ActionRowBuilder()
                .addComponents(
                  new ButtonBuilder()
                    .setLabel('Watch Stream')
                    .setURL(twitchUrl)
                    .setStyle(ButtonStyle.Link)
                );

              const embed = new EmbedBuilder()
                .setColor(getRandomColor())
                .setTitle(streamTitle)
                .setURL(twitchUrl)
                .setDescription('🔴 Live now! 🔴')
                .addFields(
                  { name: 'Streamer', value: twitchId, inline: false },
                  { name: 'Game', value: gameName, inline: true },
                  { name: 'Viewers', value: viewerCount.toString(), inline: true },
                  { name: 'Twitch Link', value: twitchUrl, inline: false },)
                .setFooter({ text: `ehchadservices.com • Stream Started at: ${new Date(startedAt).toLocaleString()}` });

              if (thumbnailUrl) {
                embed.setImage(thumbnailUrl.replace('{width}', '1280').replace('{height}', '720'));
              }

              // Send custom message above the embed
              channel.send(nowLiveChannel.customMessage || `**${twitchId}** is now live!`);

              // Send embed with button
              channel.send({ embeds: [embed], components: [row] });
            }
          }
          notifiedMap.set(twitchId, true);
        } else if (!isLive) {
          notifiedMap.set(twitchId, false);
        }
      }
    }

    await checkStreamsAndNotify();

    setInterval(checkStreamsAndNotify, 2 * 60 * 1000); //sets from seconds. 5 * 60 * 1000 is for minutes
  } catch (error) {
    console.log(`Error: `, error);
  }
}