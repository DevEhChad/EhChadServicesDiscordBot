const axios = require('axios');
const YouTubeNoti = require('../../schemas/YouTubeNoti');
const YouTubeUser = require('../../schemas/YouTubeUser');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Collection } = require('discord.js');
require('dotenv').config();

const YT_API_KEY = process.env.YOUTUBE_API_KEY;
if (!YT_API_KEY) console.warn('YOUTUBE_API_KEY not set - YouTube upload notifier will not function without it.');

// Poll interval in milliseconds
const POLL_INTERVAL = 60 * 1000; // 1 minute

module.exports = async (client) => {
  try {
    console.log('YouTube upload notifier started.');

    const notifiedUploads = new Map(); // key: `${guildId}:${youtubeId}` -> videoId
    // Cache resolved Channel IDs: username/handle -> UC... id
    const channelIdCache = new Map();

    // Resolve a username, @handle, or Channel ID to a proper UC... Channel ID.
    const resolveChannelId = async (idOrHandle) => {
      if (/^UC[\w-]{22}$/.test(idOrHandle)) return idOrHandle;
      if (channelIdCache.has(idOrHandle)) return channelIdCache.get(idOrHandle);

      const handle = idOrHandle.startsWith('@') ? idOrHandle.slice(1) : idOrHandle;

      try {
        const res = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
          params: { key: YT_API_KEY, part: 'id', forHandle: handle },
        });
        const id = res.data.items?.[0]?.id;
        if (id) { channelIdCache.set(idOrHandle, id); return id; }
      } catch {}

      try {
        const res = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
          params: { key: YT_API_KEY, part: 'id', forUsername: handle },
        });
        const id = res.data.items?.[0]?.id;
        if (id) { channelIdCache.set(idOrHandle, id); return id; }
      } catch {}

      console.warn(`[YT Upload] Could not resolve "${idOrHandle}" to a Channel ID. Use the UC... ID from the channel URL for guaranteed results.`);
      return null;
    };

    const fetchUploadsForChannel = async (youtubeId) => {
      const channelId = await resolveChannelId(youtubeId);
      if (!channelId) return null;
      try {
        const res = await axios.get('https://www.googleapis.com/youtube/v3/search', {
          params: {
            key: YT_API_KEY,
            channelId,
            part: 'snippet',
            order: 'date',
            type: 'video',
            maxResults: 1,
          },
        });
        const items = res.data.items || [];
        if (items.length === 0) return null;
        return items[0];
      } catch (error) {
        console.error('YouTube API error for channel', youtubeId, error.response?.data || error.message);
        return null;
      }
    };

    const sendNotification = async (guildId, config, userEntry, videoItem) => {
      if (!config.channelId) return;

      // Resolve guild and channel
      let guild;
      try {
        guild = await client.guilds.fetch(guildId);
      } catch (err) {
        // guild unavailable; remove config
        await YouTubeNoti.deleteOne({ guildId });
        return;
      }

      let channel;
      try {
        channel = await guild.channels.fetch(config.channelId);
        if (!channel) throw new Error('Channel not found');
      } catch (err) {
        // Channel deleted or inaccessible - remove binding so they can rebind
        await YouTubeNoti.updateOne({ guildId }, { $set: { channelId: null } });
        return;
      }

      const snippet = videoItem.snippet;
      const videoId = videoItem.id.videoId;
      const videoUrl = `https://youtu.be/${videoId}`;

      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setAuthor({ name: `${snippet.channelTitle} uploaded a new video`, url: `https://www.youtube.com/channel/${snippet.channelId}` })
        .setTitle(snippet.title)
        .setURL(videoUrl)
        .setDescription(snippet.description?.slice(0, 2048) || '')
        .setThumbnail(snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url)
        .setTimestamp(new Date(snippet.publishedAt))
        .setFooter({ text: 'YouTube' });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel('Watch').setURL(videoUrl).setStyle(ButtonStyle.Link)
      );

      const channelTitle = snippet.channelTitle || userEntry.youtubeId;
      try {
        await channel.send({ content: config.customMessage?.replace('{user}', channelTitle) || `**${channelTitle}** uploaded a new video!`, embeds: [embed], components: [row] });
      } catch (err) {
        console.error('Failed to send YouTube upload notification to channel', config.channelId, err);
        // If send fails (permissions), we won't delete the binding automatically.
      }

      // Update DB record for this guild/user to store lastVideoId
      await YouTubeNoti.updateOne({ guildId, 'users.youtubeId': userEntry.youtubeId }, { $set: { 'users.$.lastVideoId': videoId } });
      notifiedUploads.set(`${guildId}:${userEntry.youtubeId}`, videoId);
    };

    const checkUploads = async () => {
      // Fetch all guild configs
      const guildConfigs = await YouTubeNoti.find();
      if (guildConfigs.length === 0) return;

      // Build a set of unique youtubeIds to check
      const youtubeIds = new Set();
      const userMap = new Map(); // youtubeId -> array of { guildId, userEntry, config }

      for (const cfg of guildConfigs) {
        if (!cfg.enabled) continue; // global toggle disabled
        for (const user of cfg.users || []) {
          if (!user.enabled) continue; // per-user disabled
          youtubeIds.add(user.youtubeId);
          const key = user.youtubeId;
          if (!userMap.has(key)) userMap.set(key, []);
          userMap.get(key).push({ guildId: cfg.guildId, config: cfg, userEntry: user });
        }
      }

      // For each youtubeId, fetch latest upload and notify all guilds that track it
      for (const youtubeId of youtubeIds) {
        const video = await fetchUploadsForChannel(youtubeId);
        if (!video) continue;
        const videoId = video.id.videoId;

        const targetEntries = userMap.get(youtubeId) || [];
        for (const { guildId, config, userEntry } of targetEntries) {
          const key = `${guildId}:${youtubeId}`;

          // Check last known video id in memory
          const lastVideoId = notifiedUploads.get(key) || userEntry.lastVideoId;
          if (lastVideoId === videoId) continue; // already notified

          // Send notification and update
          await sendNotification(guildId, config, userEntry, video);
        }
      }
    };

    // Initial population from DB to avoid duplicates on restart
    const allConfigs = await YouTubeNoti.find();
    for (const cfg of allConfigs) {
      for (const u of cfg.users || []) {
        if (u.lastVideoId) notifiedUploads.set(`${cfg.guildId}:${u.youtubeId}`, u.lastVideoId);
      }
    }

    // Start loop
    await checkUploads();
    setInterval(checkUploads, POLL_INTERVAL);
  } catch (error) {
    console.error('YouTube notifier encountered an unexpected error:', error);
  }
};