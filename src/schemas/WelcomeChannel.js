const { Schema, model } = require('mongoose');

const welcomeChannelSchema = new Schema(
    {
    guildId: {
        type: String,
        required: true,
        //unique: true, //Makes it only unique to one welcome channel to each server.
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
{ timestamps: true}
);

module.exports = model('WelcomeChannel', welcomeChannelSchema);
