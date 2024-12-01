const { ApplicationCommandOptionType, Client, Interaction, PermissionFlagsBits } = require('discord.js');

module.exports = {
    callback: async (client, interaction) => {
        try {

        } catch (error) {

        }

    },
    deleted: true,
    devOnly: true,
    name: 'pause',
    description: 'Pauses the current song.',
    permissionsRequired: [PermissionFlagsBits.Administrator],
    botPermissions: [PermissionFlagsBits.ManageMessages],
};