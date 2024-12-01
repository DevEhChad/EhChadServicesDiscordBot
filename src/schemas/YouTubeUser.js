const { Schema, model } = require('mongoose');

const YouTubeUserSchema = new Schema(
    {
        guildId: {
            type: String,
            required: true,
            default: null,
        },
        youtubeId: {
            type: String,
            required: true,
            unique: true,
            default: null,
        },
    },
    { timestamps: true }
);

module.exports = model('YouTubeUser', YouTubeUserSchema);