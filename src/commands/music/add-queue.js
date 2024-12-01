const { ApplicationCommandOptionType, Client, Interaction, PermissionFlagsBits } = require('discord.js');

module.exports = {
    callback: async (client, interaction) => {
        try {

        } catch (error) {

        }

    },
    deleted: true,
    devOnly: true,
    name: 'add-queue',
    description: 'Adds a song to the play queue',
    options: [
        {
            //deleted: true,
            name: 'song-url',
            type: ApplicationCommandOptionType.String,
            required: true,
            description: 'The song url'
        }
    ],
    permissionsRequired: [PermissionFlagsBits.Administrator],
    botPermissions: [PermissionFlagsBits.ManageMessages],
};