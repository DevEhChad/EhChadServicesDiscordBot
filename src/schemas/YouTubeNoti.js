const mongoose = require('mongoose');

const YouTubeUserSchema = new mongoose.Schema({
  youtubeId: { type: String, required: true },
  enabled: { type: Boolean, default: true },
  lastVideoId: { type: String, default: null },
});

const YouTubeNotiSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  channelId: { type: String, default: null },
  users: [YouTubeUserSchema],
  enabled: { type: Boolean, default: true },
});

module.exports = mongoose.model('YouTubeNoti', YouTubeNotiSchema);