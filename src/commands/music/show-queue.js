const { ApplicationCommandOptionType, Client, Interaction, PermissionFlagsBits } = require('discord.js');
module.exports = {
    callback: async (client, interaction) => {
        try {

        } catch (error) {

        }
    },
    deleted: true,
    devOnly: true,
    name: 'show-queue',
    description: 'Shows the current queue',
    permissionsRequired: [PermissionFlagsBits.Administrator],
    botPermissions: [PermissionFlagsBits.ManageMessages],
};