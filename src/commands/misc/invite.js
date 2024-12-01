const {
    Client,
    Interaction,
    ApplicationCommandOptionType,
    PermissionFlagsBits,
} = require('discord.js');
/**
 * @param {Client} client
 * @param {Interaction} interaction
 */

module.exports = {
    callback: async (client, interaction) => {
        try {
            const inviteDuration = interaction.options.getString('duration');
            const maxUses = interaction.options.getInteger('uses') || 0; // 0 for infinite uses

            const guild = interaction.guild;

            // Calculate maxAge based on inviteDuration
            let maxAge;
            switch (inviteDuration) {
                case 'permanent':
                    maxAge = 0;
                    break;
                case '30minutes':
                    maxAge = 60 * 30; // 30 minutes in seconds
                    break;
                case '1hour':
                    maxAge = 60 * 60 * 1; // 1 hour in seconds
                    break;
                case '6hours':
                    maxAge = 60 * 60 * 6; //6 hours in seconds
                    break;
                case '12hours':
                    maxAge = 60 * 60 * 12; // 12 hours in seconds
                    break;
                case '1day':
                    maxAge = 60 * 60 * 24; // 24 hours in seconds
                    break;
                case '7days':
                    maxAge = 60 * 60 * 24 * 7; // 7 days in seconds
                    break;
                default:
                    maxAge = 60 * 60 * 24; // Default to 24 hours
            }

            const invite = await guild.invites.create(interaction.channel, {
                maxAge: maxAge,
                maxUses: maxUses,
            });

            let usesText = maxUses === 0 ? "Infinite" : maxUses;
            await interaction.reply(`Here's your invite link: ${invite.url} **Duration: ${inviteDuration}, Uses: ${usesText}**`);

        } catch (error) {
            console.log('Error creating invite:', error);
            await interaction.reply('There was an error creating the invite link.');
        }
    },

    //deleted: true,
    name: 'invite',
    description: 'Will send a custimizable discord invite to your server.',
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
                    name: '30 Minutes',
                    value: '30minutes'
                },
                {
                    name: '1 Hour',
                    value: '1hour'
                },
                {
                    name: '6 Hours',
                    value: '6hours'
                },
                {
                    name: '12 Hours',
                    value: '12hours'
                },
                {
                    name: '1 Day',
                    value: '1day'
                },
                {
                    name: '7 Days',
                    value: '7days'
                },
            ]
        },
        {
            name: 'uses',
            type: ApplicationCommandOptionType.Integer,
            required: true,
            description: 'Maximum number of uses (do 0 for infinite)'
        }
    ],
    botPermissions: [PermissionFlagsBits.CreateInstantInvite],
};