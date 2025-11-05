const { Schema, model } = require('mongoose');

const KickNowLiveSchema = new Schema(
  {
    guildId: {
      type: String,
      required: true,
      unique: true, // one kick-notify channel per guild
    },
    channelId: {
      type: String,
      required: true,
    },
    customMessage: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = model('KickNowLiveChannel', KickNowLiveSchema);
