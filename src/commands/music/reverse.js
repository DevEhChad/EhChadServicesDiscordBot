const { ApplicationCommandOptionType, Client, Interaction, PermissionFlagsBits } = require('discord.js');
module.exports = {
    callback: async (client, interaction) => {

    },
    deleted: true,
    devOnly: true,
    name: 'reverse',
    description: 'Goes back a song in the queue.',
    permissionsRequired: [PermissionFlagsBits.Administrator],
    botPermissions: [PermissionFlagsBits.ManageMessages], 
};