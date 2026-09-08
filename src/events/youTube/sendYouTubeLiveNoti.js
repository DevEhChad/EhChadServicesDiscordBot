const axios = require('axios');
const YouTubeLiveNoti = require('../../schemas/YouTubeLiveNoti');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
require('dotenv').config();

const YT_API_KEY = process.env.YOUTUBE_API_KEY;
if (!YT_API_KEY) console.warn('YOUTUBE_API_KEY not set - YouTube live notifier will not function without it.');

// Poll every 2 minutes — YouTube search.list costs 100 quota units per call
const POLL_INTERVAL = 2 * 60 * 1000;

module.exports = async (client) => {
  if (!YT_API_KEY) return;

  try {
    console.log('YouTube live notifier started.');

    // key: `${guildId}:${youtubeId}` -> active live videoId
    const notifiedLiveStreams = new Map();
    // key: `${guildId}:${youtubeId}` -> Discord Message (for editing viewer count)
    const liveMessages = new Map();
    // Cache resolved Channel IDs: username/handle -> UC... id
    const channelIdCache = new Map();

    // Resolve a username, @handle, or Channel ID to a proper UC... Channel ID.
    // Fetches snippet so we also get the channel profile pic and description (cached per username).
    const resolveChannelId = async (idOrHandle) => {
      if (channelIdCache.has(idOrHandle)) return channelIdCache.get(idOrHandle);

      const isChannelId = /^UC[\w-]{22}$/.test(idOrHandle);
      const handle = idOrHandle.startsWith('@') ? idOrHandle.slice(1) : idOrHandle;

      const tryFetch = async (params) => {
        try {
          const res = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
            params: { key: YT_API_KEY, part: 'snippet', ...params },
          });
          return res.data.items?.[0] || null;
        } catch { return null; }
      };

      const item = isChannelId
        ? await tryFetch({ id: idOrHandle })
        : (await tryFetch({ forHandle: handle })) || (await tryFetch({ forUsername: handle }));

      if (!item) {
        console.warn(`[YT Live] Could not resolve "${idOrHandle}" to a Channel ID. Use the UC... ID from the channel URL for guaranteed results.`);
        channelIdCache.set(idOrHandle, null);
        return null;
      }

      const channelInfo = {
        id: item.id,
        profilePic: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || null,
        description: item.snippet?.description || null,
      };
      channelIdCache.set(idOrHandle, channelInfo);
      return channelInfo;
    };

    const checkIfLive = async (youtubeId) => {
      const channelInfo = await resolveChannelId(youtubeId);
      if (!channelInfo) return null;
      try {
        const res = await axios.get('https://www.googleapis.com/youtube/v3/search', {
          params: {
            key: YT_API_KEY,
            channelId: channelInfo.id,
            part: 'snippet',
            eventType: 'live',
            type: 'video',
            maxResults: 1,
          },
        });
        const items = res.data.items || [];
        return items.length > 0 ? items[0] : null;
      } catch (error) {
        console.error('[YT Live] API error for channel', youtubeId, error.response?.data || error.message);
        return null;
      }
    };

    // Fetch concurrent viewer count cheaply â€” costs 1 quota unit (vs 100 for search.list)
    const getViewerCount = async (videoId) => {
      try {
        const res = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
          params: { key: YT_API_KEY, id: videoId, part: 'liveStreamingDetails' },
        });
        const viewers = res.data.items?.[0]?.liveStreamingDetails?.concurrentViewers;
        return viewers ? parseInt(viewers, 10) : null;
      } catch {
        return null;
      }
    };

    const buildYouTubeLiveEmbed = (videoItem, viewerCount, channelInfo) => {
      const snippet = videoItem.snippet;
      const videoId = videoItem.id.videoId;
      const videoUrl = `https://youtu.be/${videoId}`;
      const channelTitle = snippet.channelTitle;
      const channelUrl = `https://www.youtube.com/channel/${snippet.channelId}`;
      const thumbnailUrl = snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || null;
      const profilePic = channelInfo?.profilePic || null;

      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setAuthor({ name: `${channelTitle} is now LIVE on YouTube!`, iconURL: profilePic || undefined, url: channelUrl })
        .setTitle(snippet.title || 'No title provided.')
        .setURL(videoUrl)
        .setThumbnail(profilePic)
        .setDescription(snippet.description || channelInfo?.description || 'No description provided.')
        .addFields(
          { name: 'Viewers', value: viewerCount != null ? viewerCount.toLocaleString() : 'Loadingâ€¦', inline: true },
        )
        .setTimestamp(snippet.publishedAt ? new Date(snippet.publishedAt) : new Date())
        .setFooter({ text: 'ehchadservices.com' });

      if (thumbnailUrl) embed.setImage(`${thumbnailUrl}?v=${Date.now()}`);
      return embed;
    };

    const sendNotification = async (guildId, config, userEntry, videoItem, viewerCount, channelInfo) => {
      if (!config.channelId) return null;

      let guild;
      try {
        guild = await client.guilds.fetch(guildId);
      } catch {
        await YouTubeLiveNoti.deleteOne({ guildId });
        return null;
      }

      let channel;
      try {
        channel = await guild.channels.fetch(config.channelId);
        if (!channel) throw new Error('Channel not found');
      } catch {
        await YouTubeLiveNoti.updateOne({ guildId }, { $set: { channelId: null } });
        return null;
      }

      const channelTitle = videoItem.snippet.channelTitle || userEntry.youtubeId;
      const videoId = videoItem.id.videoId;
      const videoUrl = `https://youtu.be/${videoId}`;
      const embed = buildYouTubeLiveEmbed(videoItem, viewerCount, channelInfo);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel('Watch Live').setURL(videoUrl).setStyle(ButtonStyle.Link)
      );

      let msg = null;
      try {
        msg = await channel.send({
          content: config.customMessage?.replace('{user}', channelTitle) || `ðŸ”´ **${channelTitle}** is now live on YouTube!`,
          embeds: [embed],
          components: [row],
        });
      } catch (err) {
        console.error('[YT Live] Failed to send notification to channel', config.channelId, err);
        return null;
      }

      await YouTubeLiveNoti.updateOne(
        { guildId, 'users.youtubeId': userEntry.youtubeId },
        { $set: { 'users.$.lastLiveVideoId': videoId } }
      );
      notifiedLiveStreams.set(`${guildId}:${userEntry.youtubeId}`, videoId);
      return msg;
    };

    const checkLiveStreams = async () => {
      const guildConfigs = await YouTubeLiveNoti.find();
      if (guildConfigs.length === 0) return;

      // Build a map of unique youtubeIds to check across all guilds
      const youtubeIds = new Set();
      const userMap = new Map(); // youtubeId -> [{ guildId, config, userEntry }]

      for (const cfg of guildConfigs) {
        if (!cfg.enabled) continue;
        for (const user of cfg.users || []) {
          if (!user.enabled) continue;
          youtubeIds.add(user.youtubeId);
          if (!userMap.has(user.youtubeId)) userMap.set(user.youtubeId, []);
          userMap.get(user.youtubeId).push({ guildId: cfg.guildId, config: cfg, userEntry: user });
        }
      }

      for (const youtubeId of youtubeIds) {
        const video = await checkIfLive(youtubeId);
        const channelInfo = channelIdCache.get(youtubeId); // populated by checkIfLive → resolveChannelId

        if (video) {
          const videoId = video.id.videoId;
          // Fetch viewer count once per channel (1 quota unit)
          const viewerCount = await getViewerCount(videoId);

          for (const { guildId, config, userEntry } of (userMap.get(youtubeId) || [])) {
            const key = `${guildId}:${youtubeId}`;
            const lastVideoId = notifiedLiveStreams.get(key); // in-memory only — always notify on fresh startup

            if (lastVideoId === videoId) {
              // Same stream still live â€” update the embed with fresh viewer count
              const msg = liveMessages.get(key);
              if (msg) {
                const updatedEmbed = buildYouTubeLiveEmbed(video, viewerCount, channelInfo);
                try { await msg.edit({ embeds: [updatedEmbed] }); } catch { liveMessages.delete(key); }
              }
            } else {
              // New stream detected â€” send notification
              const msg = await sendNotification(guildId, config, userEntry, video, viewerCount, channelInfo);
              if (msg) liveMessages.set(key, msg);
            }
          }
        } else {
          // Channel is not live â€” clear state so next stream triggers a fresh notification
          for (const { guildId, userEntry } of (userMap.get(youtubeId) || [])) {
            const key = `${guildId}:${youtubeId}`;
            if (notifiedLiveStreams.has(key) || userEntry.lastLiveVideoId) {
              notifiedLiveStreams.delete(key);
              liveMessages.delete(key);
              await YouTubeLiveNoti.updateOne(
                { guildId, 'users.youtubeId': userEntry.youtubeId },
                { $set: { 'users.$.lastLiveVideoId': null } }
              );
            }
          }
        }
      }
    };

    // Run immediately on startup, then poll on the interval
    await checkLiveStreams();
    setInterval(checkLiveStreams, POLL_INTERVAL);
  } catch (error) {
    console.error('[YT Live] Unexpected error in YouTube live notifier:', error);
  }
};
