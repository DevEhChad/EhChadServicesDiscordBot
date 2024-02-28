require("dotenv").config();
const { Client, IntentsBitField } = require('discord.js');
const mongoose = require('mongoose');
const eventHandler = require('./handlers/eventHandler');

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ],
});
<<<<<<< HEAD
 
=======

>>>>>>> b409564e0caf7706f24d416082cfa457272910d6
(async () => {
    try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conneted to EhChadServices DB.');

    eventHandler(client);

    client.login(process.env.TOKEN);
    } catch (error) {
        console.log(`Error: ${error}`);
    }
})();