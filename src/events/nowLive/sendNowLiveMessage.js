const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const TwitchUserSchema = require("../../schemas/TwitchUser");
const NowLiveSchema = require("../../schemas/NowLiveChannel");
const { Collection } = require('discord.js');
const axios = require("axios");
require("dotenv").config();

const twitchClientID = process.env.TWITCH_CLIENT_ID;
const twitchSecretID = process.env.TWITCH_CLIENT_SECRET;

const TWITCH_API_LIMIT = 100; // Twitch API allows up to 100 users per request

module.exports = async (client) => {
  try {
    let twitchAccessToken = null;
    const notifiedStreams = new Set(); // Tracks live streams that have been notified: 'twitchId'
    const liveMessages = new Map();   // key: `${twitchId}:${guildId}:${channelId}` -> { msg, lastUpdatedAt }
    const VIEWER_UPDATE_INTERVAL = 5 * 60 * 1000; // Update viewer count every 5 minutes
    const twitchUserCache = new Map(); // Caches Twitch user data: 'twitchId' -> { id, profile_image_url }

    const getTwitchAccessToken = async () => {
      try {
        const response = await axios.post('https://id.twitch.tv/oauth2/token', null, {
          params: {
            client_id: twitchClientID,
            client_secret: twitchSecretID,
            grant_type: 'client_credentials',
          },
        });
        twitchAccessToken = response.data.access_token;
      } catch (error) {
        console.error("Error getting Twitch access token:", error.response?.data || error.message);
        twitchAccessToken = null;
      }
    };

    const getTwitchUsersData = async (userLogins) => {
      if (!twitchAccessToken) await getTwitchAccessToken();
      if (!twitchAccessToken) return;

      const usersToFetch = userLogins.filter(login => !twitchUserCache.has(login));
      if (usersToFetch.length === 0) return;

      try {
        const response = await axios.get('https://api.twitch.tv/helix/users', {
          params: { login: usersToFetch },
          headers: {
            'Client-ID': twitchClientID,
            'Authorization': `Bearer ${twitchAccessToken}`,
          },
        });

        for (const user of response.data.data) {
          twitchUserCache.set(user.login, { id: user.id, profile_image_url: user.profile_image_url, description: user.description });
        }
      } catch (error) {
        console.error("Error fetching Twitch user data:", error.response?.data || error.message);
        if (error.response?.status === 401) await getTwitchAccessToken(); // Token might be invalid
      }
    };

    const getLiveStreams = async (userLogins) => {
      if (!twitchAccessToken) await getTwitchAccessToken();
      if (!twitchAccessToken || userLogins.length === 0) return [];

      try {
        const response = await axios.get('https://api.twitch.tv/helix/streams', {
          params: { user_login: userLogins, first: userLogins.length },
          headers: {
            'Client-ID': twitchClientID,
            'Authorization': `Bearer ${twitchAccessToken}`,
          },
        });
        return response.data.data;
      } catch (error) {
        console.error("Error fetching Twitch streams:", error.response?.data || error.message);
        if (error.response?.status === 401) await getTwitchAccessToken(); // Token might be invalid
        return [];
      }
    };

    const buildTwitchEmbed = (streamData, userData) => {
      const twitchId = streamData.user_login;
      const twitchUrl = `https://www.twitch.tv/${twitchId}`;
      const cacheBuster = Date.now();
      const imageUrl = streamData.thumbnail_url
        .replace('{width}', '1280')
        .replace('{height}', '720') + `?v=${cacheBuster}`;

      return new EmbedBuilder()
        .setColor('#6441A5')
        .setAuthor({ name: `${twitchId} is now LIVE on Twitch!`, iconURL: userData?.profile_image_url, url: twitchUrl })
        .setTitle(streamData.title || 'No title provided.')
        .setURL(twitchUrl)
        .setThumbnail(userData?.profile_image_url)
        .setDescription(userData?.description || 'No description provided.')
        .addFields(
          { name: 'Game', value: streamData.game_name || 'N/A', inline: true },
          { name: 'Viewers', value: streamData.viewer_count.toLocaleString(), inline: true }
        )
        .setImage(imageUrl)
        .setTimestamp(new Date(streamData.started_at))
        .setFooter({ text: 'ehchadservices.com' });
    };

    const sendNotification = async (streamData, nowLiveChannels) => {
  const twitchId = streamData.user_login;
  const twitchUrl = `https://www.twitch.tv/${twitchId}`;
  const userData = twitchUserCache.get(twitchId);

  const embed = buildTwitchEmbed(streamData, userData);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel('Watch Stream')
      .setURL(twitchUrl)
      .setStyle(ButtonStyle.Link)
  );

      for (const config of nowLiveChannels) {
        try {
          const channel = await client.channels.fetch(config.channelId);
          if (channel) {
            const msg = await channel.send({
              content: config.customMessage?.replace('{user}', twitchId) || `**${twitchId}** is now live!`,
              embeds: [embed],
              components: [row],
            });
            liveMessages.set(`${twitchId}:${config.guildId}:${config.channelId}`, { msg, lastUpdatedAt: Date.now() });
          }
        } catch (error) {
          if (error.code === 10003) { // Unknown Channel
            console.log(`Channel ${config.channelId} not found, removing from DB.`);
            await NowLiveSchema.deleteOne({ channelId: config.channelId });
          } else {
            console.error(`Error sending message to channel ${config.channelId}:`, error);
          }
        }
      }
    };
    const checkStreamsAndNotify = async () => {
      const allDbUsers = await TwitchUserSchema.find();
      if (allDbUsers.length === 0) return;

      const allUserLogins = allDbUsers.map(u => u.twitchId);
      await getTwitchUsersData(allUserLogins);

      const nowLiveChannels = await NowLiveSchema.find();
      if (nowLiveChannels.length === 0) return;

      // Group notification channels by guildId for efficient lookup
      const channelsByGuild = new Collection();
      for (const channel of nowLiveChannels) {
        if (!channelsByGuild.has(channel.guildId)) {
          channelsByGuild.set(channel.guildId, []);
        }
        channelsByGuild.get(channel.guildId).push(channel);
      }

      const liveStreamsFound = new Set();
      // Use a Set to avoid checking the same user multiple times if they are in multiple guilds
      const uniqueUserLogins = [...new Set(allUserLogins)];

      // Process users in batches
      for (let i = 0; i < uniqueUserLogins.length; i += TWITCH_API_LIMIT) {
        const userBatch = uniqueUserLogins.slice(i, i + TWITCH_API_LIMIT);
        const liveStreams = await getLiveStreams(userBatch);

        for (const stream of liveStreams) {
          const twitchId = stream.user_login;
          liveStreamsFound.add(twitchId);

          if (!notifiedStreams.has(twitchId)) {
            // First time going live — send notification
            const relevantUserEntries = allDbUsers.filter(u => u.twitchId === twitchId);
            for (const userEntry of relevantUserEntries) {
              const channelsToNotify = channelsByGuild.get(userEntry.guildId) || [];
              if (channelsToNotify.length > 0) {
                await sendNotification(stream, channelsToNotify);
              }
            }
            notifiedStreams.add(twitchId);
          } else {
            // Already notified — update viewer count in existing message(s)
            const relevantUserEntries = allDbUsers.filter(u => u.twitchId === twitchId);
            const userData = twitchUserCache.get(twitchId);
            const updatedEmbed = buildTwitchEmbed(stream, userData);
            for (const userEntry of relevantUserEntries) {
              const channelsToNotify = channelsByGuild.get(userEntry.guildId) || [];
              for (const config of channelsToNotify) {
                const msgKey = `${twitchId}:${config.guildId}:${config.channelId}`;
                const entry = liveMessages.get(msgKey);
                if (entry && Date.now() - entry.lastUpdatedAt >= VIEWER_UPDATE_INTERVAL) {
                  try { await entry.msg.edit({ embeds: [updatedEmbed] }); entry.lastUpdatedAt = Date.now(); } catch { liveMessages.delete(msgKey); }
                }
              }
            }
          }
        }
      }

      // Clean up users who are no longer live
      for (const twitchId of notifiedStreams) {
        if (!liveStreamsFound.has(twitchId)) {
          notifiedStreams.delete(twitchId);
          // Clean up stored messages for this streamer
          for (const [key] of liveMessages) {
            if (key.startsWith(`${twitchId}:`)) liveMessages.delete(key);
          }
        }
      }
    };

    await checkStreamsAndNotify();

    // With batching, we can safely lower the interval. 15 seconds is a safe start.
    // 5 seconds might still be too fast if you have > 100 users, as it would require multiple API calls per check.
    setInterval(checkStreamsAndNotify, 15 * 1000);
  } catch (error) {
    console.error("An unexpected error occurred in the now-live message handler:", error);
  }
};