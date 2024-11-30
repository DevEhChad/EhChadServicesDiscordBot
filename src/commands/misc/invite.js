const {
    Client,
    Interaction,
    ApplicationCommandOptionType,
    PermissionFlagsBits,
} = require('discord.js');

module.exports = {
    callback: async (client, interaction) => {
        try {
            const inviteDuration = interaction.options.getString('duration');
            const maxUses = interaction.options.getInteger('uses') || 0; // 0 for infinite uses

            const guild = interaction.guild;

            const invite = await guild.invites.create(interaction.channel, {
                maxAge: inviteDuration === 'permanent' ? 0 : 60 * 60 * 24,
                maxUses: maxUses,
            });

            let usesText = maxUses === 0 ? "Infinite" : maxUses;
            await interaction.reply(`Here's your invite link: ${invite.url} **Duration: ${inviteDuration}, Uses: ${usesText}**`);

        } catch (error) {
            console.log('Error creating invite:', error);
            await interaction.reply('There was an error creating the invite link.');
        }
    },

    name: 'invite',
    description: 'Will send a discord invite.',
    options: [
        {
            name: 'duration',
            type: ApplicationCommandOptionType.String,
            required: true,
            description: 'Duration of the invite',
            choices: [
                {
                    name: 'Permanent',
                    value: 'permanent'
                },
                {
                    name: '24 Hours',
                    value: '24hours'
                }
            ]
        },
        {
            name: 'uses',
            type: ApplicationCommandOptionType.Integer,
            required: false,
            description: 'Maximum number of uses (leave blank for infinite)'
        }
    ],
    botPermissions: [PermissionFlagsBits.CreateInstantInvite],
};