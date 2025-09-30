const { Schema, model } = require('mongoose');

const TwitchUserSchema = new Schema(
    {
    guildId: {
        type: String,
        required: true,
    },
    twitchId: {
        type: String,
        required: true,
    },
},
{ timestamps: true }
);

// Create a compound index to ensure twitchId is unique per guildId
TwitchUserSchema.index({ guildId: 1, twitchId: 1 }, { unique: true });

module.exports = model('TwitchUser', TwitchUserSchema);