const { Schema, model } = require('mongoose');

const TwitchUserSchema = new Schema(
    {
    guildId: {
        type: String,
        required: true,
        default: null,
    },
    twitchId: {
        type: String,
        required: true,
        unique: true,
        default: null,
    },
},
{ timestamps: true }
);

module.exports = model('TwitchUser', TwitchUserSchema);