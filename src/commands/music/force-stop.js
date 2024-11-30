const { ApplicationCommandOptionType, Client, Interaction, PermissionFlagsBits } = require('discord.js');
module.exports = {
    callback: async (client, interaction) => {

    },
    deleted: true,
    devOnly: true,
    name: 'force-stop',
    description: 'Completely stop the queue and leaves voice channel.',
    permissionsRequired: [PermissionFlagsBits.Administrator],
    botPermissions: [PermissionFlagsBits.ManageMessages], 
};