const { ApplicationCommandOptionType, Client, Interaction, PermissionFlagsBits } = require('discord.js');

module.exports = {
    callback: async (client, interaction) => {

},
    deleted: true,
    devOnly: true,
    name: 'play',
    description: 'Joins channel plays current song will add new songs to queue. ',
    permissionsRequired: [PermissionFlagsBits.Administrator],
    botPermissions: [PermissionFlagsBits.ManageMessages], 
};