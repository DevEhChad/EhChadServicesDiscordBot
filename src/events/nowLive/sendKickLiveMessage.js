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
    const notifiedStreams = new Map(); // Tracks notified streams: 'kickUsername' -> 'streamId'

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
      const allTrackedUsers = await KickUserSchema.find();
      if (allTrackedUsers.length === 0) {
        return;
      }

      const allNowLiveChannels = await NowLiveSchema.find();
      if (allNowLiveChannels.length === 0) {
        return;
      }

      const channelsByGuild = new Collection();
      for (const channelConfig of allNowLiveChannels) {
        if (!channelsByGuild.has(channelConfig.guildId)) {
          channelsByGuild.set(channelConfig.guildId, []);
        }
        channelsByGuild.get(channelConfig.guildId).push(channelConfig);
      }

      // Group users by username to make one API call per streamer
      const usersByUsername = new Collection();
      for (const user of allTrackedUsers) {
        const username = user.kickUsername.toLowerCase();
        if (!usersByUsername.has(username)) {
          usersByUsername.set(username, []);
        }
        usersByUsername.get(username).push(user);
      }

      for (const [username, userEntries] of usersByUsername) {
        const delay = Math.floor(Math.random() * (1000 - 200 + 1)) + 200; // Random delay between 200ms and 1000ms
        await new Promise(resolve => setTimeout(resolve, delay));

        const streamData = await getStreamData(username);

        if (streamData && streamData.livestream) {
          // --- Streamer is LIVE ---
          const kickUsername = streamData.user.username;
          const streamId = streamData.livestream.id.toString(); // Ensure it's a string

          for (const userEntry of userEntries) {
            // Check in-memory state first, then the database record.
            if (notifiedStreams.get(kickUsername.toLowerCase()) !== streamId && userEntry.lastStreamId !== streamId) {
              const channelsToNotify = channelsByGuild.get(userEntry.guildId) || [];
              if (channelsToNotify.length > 0) {
                //console.log(`[Kick] ${kickUsername} is newly live for guild ${userEntry.guildId}. Sending notification.`);
                await sendNotification(streamData, channelsToNotify);
                // Update the database immediately for this specific guild entry
                await KickUserSchema.updateOne({ _id: userEntry._id }, { lastStreamId: streamId });
                notifiedStreams.set(kickUsername.toLowerCase(), streamId); // Update in-memory state
              }
            }
          }
        } else {
          // --- Streamer is OFFLINE ---
          // This block now correctly handles both API failures (streamData is null)
          // and cases where the streamer is simply not live (streamData.livestream is null).
          notifiedStreams.delete(username.toLowerCase()); // Remove from in-memory state
          for (const userEntry of userEntries) {
            if (userEntry.lastStreamId) {
             // console.log(`[Kick] ${username} is now offline for guild ${userEntry.guildId}. Clearing lastStreamId.`);
              // Reset the stream ID in the database
              await KickUserSchema.updateOne({ _id: userEntry._id }, { lastStreamId: null });
            }
          }
        }
      }
    };

    // Initial check on startup
    const initialUsers = await KickUserSchema.find();
    for (const user of initialUsers) {
        if (user.lastStreamId) {
            // Pre-populate the in-memory map with data from the DB on startup.
            // This ensures that if the bot restarts while a stream is live, it won't re-notify.
            notifiedStreams.set(user.kickUsername.toLowerCase(), user.lastStreamId);
        }
    }
    // Perform the first check after populating the cache.
    checkKickStreams();


    // Run check every 30 seconds.
    // This is higher than Twitch because we have to check users one by one.
    setInterval(checkKickStreams, 15 * 1000);
  } catch (error) {
    console.error('[Kick] An unexpected error occurred in the Kick now-live handler:', error);
  }
};