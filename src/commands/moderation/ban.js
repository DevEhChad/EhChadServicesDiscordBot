const { ApplicationCommandOptionType, PermissionFlagsBits } = require('discord.js');

module.exports = {
    //deleted: true,
    name: 'ban',
    description: 'Bans a discord member from this server!',
    //devOnly: Boolean,
    //testOnly: Boolen,
    options: [
        {
        name: 'target-user',
        description: 'The user you are banning.',
        required: true,
        type: ApplicationCommandOptionType.Mentionable,
        },
        {
        name: 'reason',
        description: 'The reason for the banning.',
        required: true,
        type: ApplicationCommandOptionType.String,
        },
    ],
    permissionsRequired: [PermissionFlagsBits.Administrator],
    botPermissions: [PermissionFlagsBits.Administrator],

    callback: (client, interaction) => {
        interaction.reply(`Ban..`)
    }
};