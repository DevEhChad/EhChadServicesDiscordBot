const { Schema, model } = require('mongoose');

const NotifiedStreamSchema = new Schema(
    {
    guildId: {
        type: String,
        required: true,
        unique: true
    },   
    channelId: {
        type: String,
        required: true,
    },
    notified: { 
        type: Boolean, 
        default: false 
    }  
},
{ timestamps: true }
);

module.exports = model('NotifiedStream', NotifiedStreamSchema);