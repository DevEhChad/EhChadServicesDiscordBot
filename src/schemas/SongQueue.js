const { Schema, model } = require('mongoose');

const songQueueSchema = new Schema({
    guildId: {
        type: String,
        required: true,
    },
    queue: {
        type: [String], // Array of strings to hold song URLs
        required: true,
        default: [], // Initialize with an empty array
    },
    currentIndex: { 
        type: Number,
        default: 0, // Start at the beginning of the queue
    }
});

module.exports = model('SongQueue', songQueueSchema);