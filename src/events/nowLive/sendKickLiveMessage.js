const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');
const KickUserSchema = require('../../schemas/KickUser');
const NowLiveSchema = require('../../schemas/NowLiveChannel');
const { Collection } = require('discord.js');
const axios = require('axios');
require('dotenv').config();
const { disableKickNotifier } = require('../../../config.json');

module.exports = async (client) => {
  // Allow disabling the Kick notifier via config.json (preferred) or environment variable (fallback)
  const disabledByConfig = !!disableKickNotifier;
  const disabledByEnv = (process.env.DISABLE_KICK_NOTIFIER === 'true' || process.env.DISABLE_KICK === 'true');
  if (disabledByConfig || disabledByEnv) {
    console.log('[Kick] Notifier disabled by configuration. Skipping initialization.');
    return;
  }

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

      // Mirror Twitch embed layout but use Kick green color and attach the stream thumbnail so Discord displays it reliably.
      const embed = new EmbedBuilder()
        .setColor('#53FC18') // Kick green
        .setAuthor({ name: `${kickUsername} is now LIVE on Kick!`, iconURL: streamData.user.profile_pic, url: kickUrl })
        .setTitle(streamData.livestream?.session_title || streamData.session_title || 'No title provided.')
        .setURL(kickUrl)
        .setThumbnail(streamData.user.profile_pic)
        .setDescription(streamData.user.bio || 'No description provided.')
        .addFields(
          { name: 'Category', value: streamData.livestream?.categories[0]?.name || 'N/A', inline: true },
          { name: 'Viewers', value: (streamData.livestream?.viewer_count ?? 0).toString(), inline: true }
        )
        // We'll set the image below after attempting to fetch and attach the current thumbnail.
        .setTimestamp(streamData.livestream?.created_at ? new Date(streamData.livestream.created_at) : new Date())
        .setFooter({ text: 'ehchadservices.com' });

      // Resolve a usable image URL from the Kick response (replace placeholders if present)
      const rawThumbnail = streamData.livestream?.thumbnail?.url || streamData.thumbnail?.url || null;
      let imageUrl = null;
      if (rawThumbnail) {
        imageUrl = rawThumbnail
          .replace('{width}', '1280')
          .replace('{height}', '720')
          .replace('{w}', '1280')
          .replace('{h}', '720')
          .replace('{size}', '1280x720');
      }

  // resolved imageUrl is available if not null

  // Attempt to fetch the image and attach it so Discord displays it reliably.
      let files = [];
      if (imageUrl) {
  try {
          // Use got-scraping (same lib used above) to retrieve the image with browser-like headers.
          const imgRes = await gotScraping({
            url: imageUrl,
            responseType: 'buffer',
            timeout: { request: 10000 },
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
              Referer: 'https://kick.com/',
            },
          });

          const buffer = Buffer.from(imgRes.body);

          // Try to infer an extension from content-type header
          const contentType = (imgRes.headers && (imgRes.headers['content-type'] || imgRes.headers['Content-Type'])) || '';
          let ext = 'jpg';
          if (contentType.includes('png')) ext = 'png';
          else if (contentType.includes('webp')) ext = 'webp';
          else if (contentType.includes('gif')) ext = 'gif';

          const fileName = `${kickUsername}-thumb.${ext}`;
          // If the image is too large for Discord (8MB limit for attachments on many bots), fall back to URL
          const maxSize = 8 * 1024 * 1024;
          if (buffer.length > maxSize) {
            embed.setImage(imageUrl);
          } else {
            const attachment = new AttachmentBuilder(buffer, { name: fileName });
            // Set the embed image to reference the attachment directly so Discord uses the attachment inside the embed
            // This prevents the duplicate top-level file preview + embed image that occurs when editing after-send.
            embed.setImage(`attachment://${fileName}`);
            files.push(attachment);
          }
        } catch (err) {
          // If fetching the image fails, fall back to embedding the remote URL (Discord will try to fetch it).
          if (imageUrl) embed.setImage(imageUrl);
        }
      }

      for (const config of nowLiveChannels) {
        try {
          const channel = await client.channels.fetch(config.channelId);
            if (channel) {
              const sendOptions = {
                content: config.customMessage?.replace('{user}', kickUsername) || `**${kickUsername}** is now live!`,
                embeds: [embed],
                components: [row],
              };
              if (files.length > 0) sendOptions.files = files;

              const sent = await channel.send(sendOptions);

              // No post-send edit required because embed references the attachment via attachment://filename
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
            // Only use in-memory state to deduplicate during a single bot run.
            // This allows the bot to notify again on restart but prevents repeated sends while running.
            if (notifiedStreams.get(kickUsername.toLowerCase()) !== streamId) {
              const channelsToNotify = channelsByGuild.get(userEntry.guildId) || [];
              if (channelsToNotify.length > 0) {
                await sendNotification(streamData, channelsToNotify);
                // Update the database record for informational purposes and recovery, but do not rely on it to block sends.
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

  // Perform the first check on startup. We intentionally DO NOT pre-populate the in-memory
  // map from the DB so the bot will repost currently live streams when it (re)starts.
  // The in-memory `notifiedStreams` map will prevent duplicate sends while the process is running.
  checkKickStreams();


    // Run check every 30 seconds.
    // This is higher than Twitch because we have to check users one by one.
    setInterval(checkKickStreams, 15 * 1000);
  } catch (error) {
    console.error('[Kick] An unexpected error occurred in the Kick now-live handler:', error);
  }
};