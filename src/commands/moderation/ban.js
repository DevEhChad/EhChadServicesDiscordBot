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
        type: ApplicationCommandOptionType.Mentionable,
        required: true,
        },
        {
        name: 'reason',
        description: 'The reason for the banning.',
        type: ApplicationCommandOptionType.String,
        required: true,
        },
    ],
    permissionsRequired: [PermissionFlagsBits.BanMembers],
    botPermissions: [PermissionFlagsBits.BanMembers],

    callback: (client, interaction) => {
        interaction.reply(`Ban..`)
    }
};