const { Schema, model } = require('mongoose');

const welcomeChannelSchema = new Schema(
    {
    guildId: {
        type: String,
        required: true,
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

// Ensure uniqueness per guild + channel combination
welcomeChannelSchema.index({ guildId: 1, channelId: 1 }, { unique: true });

module.exports = model('WelcomeChannel', welcomeChannelSchema);