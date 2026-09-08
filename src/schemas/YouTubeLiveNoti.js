const mongoose = require('mongoose');

const YouTubeLiveUserSchema = new mongoose.Schema({
  youtubeId: { type: String, required: true },
  enabled: { type: Boolean, default: true },
  lastLiveVideoId: { type: String, default: null },
});

const YouTubeLiveNotiSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  channelId: { type: String, default: null },
  customMessage: { type: String, default: null },
  users: [YouTubeLiveUserSchema],
  enabled: { type: Boolean, default: true },
});

module.exports = mongoose.model('YouTubeLiveNoti', YouTubeLiveNotiSchema);
