const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');
const KickUserSchema = require('../../schemas/KickUser');
const KickNowLiveChannel = require('../../schemas/KickNowLiveChannel');
const { Collection } = require('discord.js');
const axios = require('axios');
require('dotenv').config();
const { disableKickNotifier } = require('../../../config.json');
const NotifiedStream = require('../../schemas/NotifiedStream');

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
      const broadcasterIdForSend = streamData.user.id ? streamData.user.id.toString() : kickUsername.toLowerCase();
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

          let buffer = Buffer.from(imgRes.body || []);

          // If gotScraping returned an empty buffer for some hosts, fall back to axios to try again
          if (!buffer || buffer.length === 0) {
            try {
              console.warn(`[Kick] gotScraping returned empty image buffer for ${imageUrl}, falling back to axios.`);
              const axiosRes = await axios.get(imageUrl, {
                responseType: 'arraybuffer',
                timeout: 10000,
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
                  Referer: 'https://kick.com/',
                },
              });
              buffer = Buffer.from(axiosRes.data || []);
            } catch (axErr) {
              console.warn(`[Kick] axios fallback failed to fetch image ${imageUrl}:`, axErr?.message || axErr);
              buffer = Buffer.alloc(0);
            }

            // If still empty and screenshot fallback is requested, try a quick headless screenshot of the stream page
            if ((!buffer || buffer.length === 0) && process.env.KICK_USE_SCREENSHOT === 'true') {
              try {
                const playwright = await import('playwright');
                const browser = await playwright.chromium.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'], headless: true });
                const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
                await page.goto(kickUrl, { waitUntil: 'networkidle', timeout: 15000 });
                // slight delay to allow dynamic thumbnails to render
                await page.waitForTimeout(1000);
                const screenshotBuffer = await page.screenshot({ type: 'png', fullPage: false });
                await browser.close();
                if (screenshotBuffer && screenshotBuffer.length > 0) {
                  buffer = Buffer.from(screenshotBuffer);
                }
              } catch (sErr) {
                console.warn(`[Kick] Screenshot fallback failed for ${kickUrl}:`, sErr?.message || sErr);
              }
            }
          }

          // Try to infer an extension from content-type header
          const contentType = (imgRes.headers && (imgRes.headers['content-type'] || imgRes.headers['Content-Type'])) || '';
          let ext = 'jpg';
          if (contentType.includes('png')) ext = 'png';
          else if (contentType.includes('webp')) ext = 'webp';
          else if (contentType.includes('gif')) ext = 'gif';

          const fileName = `${kickUsername}-thumb.${ext}`;
          // If the image is too large for Discord (8MB limit for attachments on many bots), fall back to URL
          const maxSize = 8 * 1024 * 1024;
          if (!buffer || buffer.length === 0) {
            // No usable buffer; embed the remote URL as a fallback
            if (imageUrl) embed.setImage(imageUrl);
          } else if (buffer.length > maxSize) {
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
        let channel = null;
        try {
          channel = await client.channels.fetch(config.channelId);
          if (!channel) {
            // channel could not be fetched; continue
            continue;
          }
          // Log permissions for bot in channel
          try {
            const perms = channel.permissionsFor ? channel.permissionsFor(client.user) : null;
            if (perms) {
              // permissions checked
            }
          } catch (permErr) {
            // permission check failed
          }
            if (channel) {
              const sendOptions = {
                content: config.customMessage?.replace('{user}', kickUsername) || `**${kickUsername}** is now live!`,
                embeds: [embed],
                components: [row],
              };
              if (files.length > 0) sendOptions.files = files;

              const sent = await channel.send(sendOptions);
            }
        } catch (error) {
          if (error.code === 10003) { // Unknown Channel
            await KickNowLiveChannel.deleteOne({ channelId: config.channelId });
            // Remove any NotifiedStream records for this guild+broadcaster because the target channel is gone
            try {
              await NotifiedStream.deleteMany({ guildId: config.guildId, broadcasterId: broadcasterIdForSend });
            } catch (delErr) {
              console.error(`[Kick] Failed to delete NotifiedStream for guild ${config.guildId} and ${broadcasterIdForSend}:`, delErr);
            }
          } else {
            console.error(`[Kick] Error sending Kick notification to channel ${config.channelId}:`, error);
            // Try a plain-text fallback send so guilds without embed/attach perms still get notified
            if (channel) {
              try {
                await channel.send(`**${kickUsername}** is now live! ${kickUrl}`);
              } catch (fallbackErr) {
                console.error(`[Kick] Fallback send also failed for ${config.channelId}:`, fallbackErr);
              }
            }
          }
        }
      }
    };

    // On startup, re-send persisted NotifiedStream notifications so channels are aware when the bot was offline
    const resendPersistedNotifications = async () => {
      try {
      const persisted = await NotifiedStream.find();
        if (!persisted || persisted.length === 0) return;

  const allNowLiveChannels = await KickNowLiveChannel.find();
        const channelsByGuildStartup = new Collection();
        for (const channelConfig of allNowLiveChannels) {
          if (!channelsByGuildStartup.has(channelConfig.guildId)) channelsByGuildStartup.set(channelConfig.guildId, []);
          channelsByGuildStartup.get(channelConfig.guildId).push(channelConfig);
        }

        for (const entry of persisted) {
          const channels = channelsByGuildStartup.get(entry.guildId) || [];
          if (channels.length === 0) {
            // No channels currently configured in this guild — remove stale entry
            await NotifiedStream.deleteOne({ _id: entry._id });
            continue;
          }

          // Fetch current stream data for the broadcaster name
          const username = entry.broadcasterName;
          if (!username) {
            await NotifiedStream.deleteOne({ _id: entry._id });
            continue;
          }

          const streamData = await getStreamData(username);
          if (streamData && streamData.livestream) {
            const currentStreamId = streamData.livestream.id.toString();
            if (currentStreamId === entry.streamId) {
              // Still the same stream — re-send notification to configured channels and update lastSeenAt
              try {
                await sendNotification(streamData, channels);
                entry.lastSeenAt = new Date();
                await entry.save();
              } catch (err) {
                console.error(`[Kick] Failed to resend persisted notification for ${username} in guild ${entry.guildId}:`, err);
              }
            } else {
              // Stream has changed while bot was offline — update entry and send new notification
              try {
                entry.streamId = currentStreamId;
                entry.startedAt = streamData.livestream?.created_at ? new Date(streamData.livestream.created_at) : new Date();
                entry.lastSeenAt = new Date();
                entry.broadcasterName = streamData.user.username;
                entry.notified = true;
                await entry.save();
                await sendNotification(streamData, channels);
                await KickUserSchema.updateMany({ guildId: entry.guildId }, { $set: { lastStreamId: currentStreamId } });
              } catch (err) {
                console.error(`[Kick] Failed to update/send new persisted notification for ${username} in guild ${entry.guildId}:`, err);
              }
            }
          } else {
            // Broadcaster appears offline — remove persisted entry
            try {
              await NotifiedStream.deleteOne({ _id: entry._id });
            } catch (err) {
              console.error(`[Kick] Failed to delete stale NotifiedStream entry for ${entry._id}:`, err);
            }
          }
        }
      } catch (err) {
        console.error('[Kick] Error during resendPersistedNotifications:', err);
      }
    };

    const checkKickStreams = async () => {
      const allTrackedUsers = await KickUserSchema.find();
      if (allTrackedUsers.length === 0) {
        return;
      }

      const allNowLiveChannels = await KickNowLiveChannel.find();
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
          const streamId = String(streamData.livestream.id); // Ensure it's a string
          const broadcasterId = streamData.user?.id ? String(streamData.user.id) : kickUsername.toLowerCase();
          const broadcasterName = kickUsername;

          // In-memory dedupe: if we've already notified for this streamId in this process, skip entirely
          const usernameKey = kickUsername.toLowerCase();
          if (notifiedStreams.get(usernameKey) === streamId) {
            // already handled in this process
            continue;
          }

          // Use per-guild NotifiedStream entries to avoid posting the same stream multiple times per guild.
          const guildIds = [...new Set(userEntries.map(u => u.guildId))];
          for (const guildId of guildIds) {
            const channelsToNotify = channelsByGuild.get(guildId) || [];
            if (channelsToNotify.length === 0) continue;

            // Check per-guild toggle
            try {
              const Toggle = require('../../schemas/Toggle');
              const t = await Toggle.findOne({ key: 'kick-noti', type: 'service', guildId });
              if (t && t.enabled === false) {
                // Kick notifications disabled for this guild
                continue;
              }
            } catch (err) {
              // ignore toggle errors, proceed with notify
            }

            try {
              // Consolidate any duplicate NotifiedStream docs for this guild + broadcaster
              let existingDocs = await NotifiedStream.find({ guildId, $or: [{ broadcasterId }, { broadcasterName }] });
              let existing = existingDocs && existingDocs.length ? existingDocs[0] : null;
              if (existingDocs && existingDocs.length > 1) {
                // Keep the most recently updated/seen document and remove the rest
                existingDocs.sort((a, b) => (b.lastSeenAt?.getTime() || 0) - (a.lastSeenAt?.getTime() || 0));
                existing = existingDocs[0];
                const idsToRemove = existingDocs.slice(1).map(d => d._id);
                try {
                  await NotifiedStream.deleteMany({ _id: { $in: idsToRemove } });
                } catch (delErr) {
                  console.warn(`[Kick] Failed to remove duplicate NotifiedStream docs for guild ${guildId}:`, delErr);
                }
              }

              if (existing) {
                if (existing.streamId === streamId) {
                  // Already notified for this guild + broadcaster; update lastSeen and skip
                  existing.lastSeenAt = new Date();
                  await existing.save();
                  // Ensure in-memory dedupe is set to prevent any in-process duplicates
                  notifiedStreams.set(kickUsername.toLowerCase(), streamId);
                  continue;
                }

                // Different stream: update entry and notify
                existing.streamId = streamId;
                existing.startedAt = streamData.livestream?.created_at ? new Date(streamData.livestream.created_at) : new Date();
                existing.lastSeenAt = new Date();
                existing.broadcasterName = streamData.user.username;
                // Prefer to keep the first configured channelId but update to the first in this list
                existing.channelId = channelsToNotify[0].channelId;
                existing.notified = true;
                await existing.save();

                await sendNotification(streamData, channelsToNotify);
                // Update per-user lastStreamId for recovery/analytics
                await KickUserSchema.updateMany({ guildId }, { $set: { lastStreamId: streamId } });
                // keep in-memory dedupe as well
                notifiedStreams.set(kickUsername.toLowerCase(), streamId);
                continue;
              }

              // No existing entry: upsert and notify. Use findOneAndUpdate with upsert to avoid duplicate-key race conditions.
              try {
                const created = await NotifiedStream.findOneAndUpdate(
                  { guildId, $or: [{ broadcasterId }, { broadcasterName }] },
                  {
                    $set: {
                      guildId,
                      channelId: channelsToNotify[0].channelId,
                      broadcasterId,
                      broadcasterName: broadcasterName,
                      streamId,
                      startedAt: streamData.livestream?.created_at ? new Date(streamData.livestream.created_at) : new Date(),
                      lastSeenAt: new Date(),
                      notified: true,
                    },
                  },
                  { upsert: true, new: true }
                );

                await sendNotification(streamData, channelsToNotify);
                await KickUserSchema.updateMany({ guildId }, { $set: { lastStreamId: streamId } });
                notifiedStreams.set(usernameKey, streamId);
              } catch (upsertErr) {
                // Handle duplicate-key or plan executor errors by falling back to find + update.
                if (upsertErr && (upsertErr.code === 11000 || upsertErr.codeName === 'DuplicateKey')) {
                  try {
                    // Try to find an existing record by broadcasterId/name or by guildId as a last resort
                    let fallback = await NotifiedStream.findOne({ guildId, $or: [{ broadcasterId }, { broadcasterName }] });
                    if (!fallback) {
                      fallback = await NotifiedStream.findOne({ guildId });
                    }

                    if (fallback) {
                      // update fields and save
                      fallback.channelId = channelsToNotify[0].channelId;
                      fallback.broadcasterId = broadcasterId;
                      fallback.broadcasterName = broadcasterName;
                      fallback.streamId = streamId;
                      fallback.startedAt = streamData.livestream?.created_at ? new Date(streamData.livestream.created_at) : new Date();
                      fallback.lastSeenAt = new Date();
                      fallback.notified = true;
                      await fallback.save();

                      await sendNotification(streamData, channelsToNotify);
                      await KickUserSchema.updateMany({ guildId }, { $set: { lastStreamId: streamId } });
                      notifiedStreams.set(usernameKey, streamId);
                    } else {
                      console.error(`[Kick] Upsert failed and no fallback NotifiedStream found for guild ${guildId}.`, upsertErr);
                    }
                  } catch (fallbackErr) {
                    console.error(`[Kick] Fallback update also failed for guild ${guildId}:`, fallbackErr);
                  }
                } else {
                  // Unexpected error — rethrow to be caught by outer handler
                  throw upsertErr;
                }
              }
            } catch (err) {
              console.error(`[Kick] Error handling notified stream for guild ${guildId} and ${kickUsername}:`, err);
            }
          }
        } else {
          // --- Streamer is OFFLINE ---
          // This block now correctly handles both API failures (streamData is null)
          // and cases where the streamer is simply not live (streamData.livestream is null).
          notifiedStreams.delete(username.toLowerCase()); // Remove from in-memory state
          // Remove NotifiedStream entry for this broadcaster (they went offline) by broadcasterId or broadcasterName
          try {
            await NotifiedStream.deleteMany({ $or: [{ broadcasterId: username.toLowerCase() }, { broadcasterName: username }] });
          } catch (err) {
            console.error(`[Kick] Failed to delete NotifiedStream entries for ${username}:`, err);
          }

          // Clear in-memory dedupe and reset lastStreamId for tracked KickUser entries
          notifiedStreams.delete(username.toLowerCase());
          for (const userEntry of userEntries) {
            if (userEntry.lastStreamId) {
              await KickUserSchema.updateOne({ _id: userEntry._id }, { lastStreamId: null });
            }
          }
        }
      }
    };

  // Perform the first check on startup. We intentionally DO NOT pre-populate the in-memory
  // map from the DB so the bot will repost currently live streams when it (re)starts.
  // The in-memory `notifiedStreams` map will prevent duplicate sends while the process is running.
  // First, resend persisted notifications for streams that were recorded while the bot was offline.
  await resendPersistedNotifications();
  // Then run the regular check loop.
  checkKickStreams();


    // Run check every 30 seconds.
    // This is higher than Twitch because we have to check users one by one.
    setInterval(checkKickStreams, 15 * 1000);
  } catch (error) {
    console.error('[Kick] An unexpected error occurred in the Kick now-live handler:', error);
  }
};