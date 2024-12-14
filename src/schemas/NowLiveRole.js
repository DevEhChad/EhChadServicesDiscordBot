const { Schema, model } = require('mongoose');

const NowLiveRoleSchema = new Schema(
    {
    guildId: {
        type: String,
        required: true,
        unique: true,
    },
    NowLiveRoleId: {
        type: String,
        required: true,
        unique: true,
    },
},
{ timestamps: true }
);

module.exports = model('NowLiveRole', NowLiveRoleSchema);