const { Schema, model } = require('mongoose');

const NowLiveSchema = new Schema(
    {
    guildId: {
        type: String,
        required: true,
    },   
    channelId: {
        type: String,
        required: true,
        unique: true,
    },
    customMessage: {
        type: String,
        default: null,
    },
    twitchUser: {
        type: String,
        required: true,
    },
}, 
{ timestamps: true}
);

module.exports = model('NowLiveSchema', NowLiveSchema);