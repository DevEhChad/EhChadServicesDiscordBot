const { Schema, model } = require('mongoose');

const YouTubeUserSchema = new Schema(
    {
        guildId: {
            type: String,
            required: true,
            default: null,
        },
        youTubeId: {
            type: String,
            required: true,
            unique: true,
            default: null,
        },
        youTubeLink: {
            type: String,
            required: true,
            unique: true,
            default: null,
        }
    },
    { timestamps: true }
);

module.exports = model('YouTubeUser', YouTubeUserSchema);