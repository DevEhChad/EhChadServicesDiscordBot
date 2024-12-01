const { Schema, model } = require('mongoose');

const songQueueSchema = new Schema(
    {
        guildId: {
            type: String,
            required: true,
        },
        songURL: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

module.exports = model('SongQueue', songQueueSchema);
