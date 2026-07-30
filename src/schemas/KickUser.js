const { Schema, model } = require('mongoose');

const kickUserSchema = new Schema({
    guildId: {
      type: String,
      required: true,
    },
    kickUsername: {
      type: String,
      required: true,
    },
    discordUserId: {
      type: String,
      default: null,
    },
  },
  { 
    timestamps: true,
  });

// Create a compound index to ensure kickUsername is unique per guildId
kickUserSchema.index({ guildId: 1, kickUsername: 1 }, { unique: true });

module.exports = model('KickUser', kickUserSchema);