const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const KickUserSchema = require('../../schemas/KickUser');
const NowLiveSchema = require('../../schemas/NowLiveChannel');
const { Collection } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

module.exports = async (client) => {
  try {
    console.log('🟢 Kick Live Notifier service started.');
    const { gotScraping } = await import('got-scraping');
    const notifiedStreams = new Set(); // Tracks live streams that have been notified: 'kickUsername'

    const getStreamData = async (kickUsername) => {
      try {
        // The gotScraping function is now available here
        const response = await gotScraping({
          url: `https://kick.com/api/v2/channels/${kickUsername}`,
          responseType: 'json',
          // Add a timeout to ensure requests don't hang indefinitely
          timeout: {
            request: 15000 // 15 seconds
          }
        });
        // console.log(`[Kick] Response body for ${kickUsername}:`, JSON.stringify(response.body, null, 2)); // Uncomment for full response body
        return response.body; // gotScraping returns body in response.body
      } catch (error) {
        console.error(`[Kick] Error fetching Kick stream data for ${kickUsername}:`, error.message);
        if (error.response?.body) {
          console.error(`[Kick] Kick API Error Response Body for ${kickUsername}:`, error.response.body.toString());
        }
        return null;
      }
    };

    const sendNotification = async (streamData, nowLiveChannels) => {
      const kickUsername = streamData.user.username;
      const kickUrl = `https://kick.com/${kickUsername}`;

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel('Watch Stream').setURL(kickUrl).setStyle(ButtonStyle.Link)
      );

      const embed = new EmbedBuilder()
        .setColor('#53FC18') // Kick green
        .setAuthor({
          name: `${kickUsername} is now LIVE on Kick!`,
          iconURL: streamData.user.profile_pic,
          url: kickUrl,
        })
        .setTitle(streamData.livestream?.session_title || streamData.session_title || 'No title provided.')
        .setURL(kickUrl)
        .setThumbnail(streamData.user.profile_pic)
        .setDescription(streamData.user.bio || 'No description provided.')
        .addFields(
          { name: 'Category', value: streamData.livestream?.categories[0]?.name || 'N/A', inline: true },
          { name: 'Viewers', value: (streamData.livestream?.viewer_count ?? 0).toString(), inline: true }
        );
      
      // The stream start time is in the 'livestream' object for Kick
      if (streamData.livestream?.created_at) {
        embed.setTimestamp(new Date(streamData.livestream.created_at));
      }

      embed.setImage(streamData.livestream?.thumbnail?.url || streamData.thumbnail?.url);
      embed.setFooter({ text: 'ehchadservices.com' });

      for (const config of nowLiveChannels) {
        try {
          const channel = await client.channels.fetch(config.channelId);
          if (channel) {
            await channel.send({
              content: config.customMessage?.replace('{user}', kickUsername) || `**${kickUsername}** is now live!`,
              embeds: [embed],
              components: [row],
            });
          }
        } catch (error) {
          if (error.code === 10003) { // Unknown Channel
            await NowLiveSchema.deleteOne({ channelId: config.channelId });
          } else {
            console.error(`[Kick] Error sending Kick notification to channel ${config.channelId}:`, error);
          }
        }
      }
    };

    const checkKickStreams = async () => {
      // console.log('Checking Kick streams...'); // Uncomment for very verbose logging
      const allKickUsers = await KickUserSchema.find();
      if (allKickUsers.length === 0) {
        // console.log('No Kick users to check.'); // Uncomment for very verbose logging
        return;
      }

      const allNowLiveChannels = await NowLiveSchema.find();
      if (allNowLiveChannels.length === 0) {
        return;
      }

      // Group notification channels by guildId for efficient lookup
      const channelsByGuild = new Collection();
      for (const channelConfig of allNowLiveChannels) {
        if (!channelsByGuild.has(channelConfig.guildId)) {
          channelsByGuild.set(channelConfig.guildId, []);
        }
        channelsByGuild.get(channelConfig.guildId).push(channelConfig);
      }

      const liveStreamsFound = new Set();
      // Use a Set to avoid checking the same user multiple times if they are in multiple guilds
      const uniqueUsernames = [...new Set(allKickUsers.map(u => u.kickUsername))];

      for (const username of uniqueUsernames) {
        // Add a small, random delay to make requests less robotic.
        const delay = Math.floor(Math.random() * (1000 - 200 + 1)) + 200; // Random delay between 200ms and 1000ms
        await new Promise(resolve => setTimeout(resolve, delay));

        const streamData = await getStreamData(username);
        if (streamData) {
        }

        if (streamData && streamData.livestream) {
          const kickUsername = streamData.user.username;
          liveStreamsFound.add(kickUsername);

          if (!notifiedStreams.has(kickUsername)) {
            // Find all DB entries for this user to get the guild IDs
            const relevantUserEntries = allKickUsers.filter(u => u.kickUsername === kickUsername.toLowerCase());
            // For each guild that tracks the user, send a notification
            for (const userEntry of relevantUserEntries) {
              const channelsToNotify = channelsByGuild.get(userEntry.guildId) || [];
              if (channelsToNotify.length > 0) {
                await sendNotification(streamData, channelsToNotify);
              }
            }
            notifiedStreams.add(kickUsername);
          }
        }
      }

      // Clean up users who are no longer live
      for (const kickUsername of notifiedStreams) {
        if (!liveStreamsFound.has(kickUsername)) {
          notifiedStreams.delete(kickUsername);
        }
      }
    };

    // Initial check on startup
    await checkKickStreams();

    // Run check every 30 seconds.
    // This is higher than Twitch because we have to check users one by one.
    setInterval(checkKickStreams, 30 * 1000);
  } catch (error) {
    console.error('[Kick] An unexpected error occurred in the Kick now-live handler:', error);
  }
};