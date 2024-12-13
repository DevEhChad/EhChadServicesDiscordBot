const { ApplicationCommandOptionType, Client, Interaction, PermissionFlagsBits } = require('discord.js');
const SongQueueSchema = require('../../schemas/SongQueue');

module.exports = {
    callback: async (client, interaction) => {
        try {
            

        } catch (error) {
            console.error('Error adding to queue:', error);
           
        }

    },
    deleted: true,
    devOnly: true,
    name: 'add-queue',
    description: 'Adds a song to the play queue',
    options: [
        {
            name: 'song-url',
            type: ApplicationCommandOptionType.String,
            required: true,
            description: 'The song url'
        }
    ],
    permissionsRequired: [PermissionFlagsBits.Administrator],
    botPermissions: [PermissionFlagsBits.ManageMessages],
};