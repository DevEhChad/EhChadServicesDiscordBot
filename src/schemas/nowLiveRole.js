const { Schema, model } = require('mongoose');

const NowLiveRoleSchema = new Schema(
    {
    guildId: {
        type: String,
        required: true,
        unique: true,
    },
    nowLiveRoleId: {
        type: String,
        required: true,
        unique: true,
        default: null,
    },
},
{ timestamps: true }
);

module.exports = model('NowLiveRole', NowLiveRoleSchema);