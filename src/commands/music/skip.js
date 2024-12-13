const { ApplicationCommandOptionType, Client, Interaction, PermissionFlagsBits } = require('discord.js');
module.exports = {
    callback: async (client, interaction) => {
        try {

        } catch (error) {

        }
    },
    deleted: true,
    devOnly: true,
    name: 'skip',
    description: 'Skips the current song',
    permissionsRequired: [PermissionFlagsBits.Administrator],
    botPermissions: [PermissionFlagsBits.ManageMessages],
};