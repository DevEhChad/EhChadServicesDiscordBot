const { Schema, model } = require('mongoose');

const NotifiedStreamSchema = new Schema(
    {
        guildId: {
            type: String,
            required: true,
        },
        channelId: {
            type: String,
            required: true,
        },
        broadcasterId: {
            type: String,
            required: true,
        },
        broadcasterName: {
            type: String,
            required: true,
        },
        streamId: {
            type: String,
            required: true,
        },
        startedAt: {
            type: Date,
            required: false,
        },
        lastSeenAt: {
            type: Date,
            default: Date.now,
        },
        notified: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

// Unique per guild + broadcaster to ensure one active notified stream record per broadcaster per guild
NotifiedStreamSchema.index({ guildId: 1, broadcasterId: 1 }, { unique: true });

module.exports = model('NotifiedStream', NotifiedStreamSchema);