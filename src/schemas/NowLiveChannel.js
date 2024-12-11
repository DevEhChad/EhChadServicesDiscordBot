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
},
{ timestamps: true }
);

module.exports = model('NowLiveChannel', NowLiveSchema);