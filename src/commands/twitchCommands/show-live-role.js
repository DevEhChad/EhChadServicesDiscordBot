const { ApplicationCommandOptionType, Client, Interaction, PermissionFlagsBits } = require('discord.js');
const NowLiveRoleSchema = require('../../schemas/NowLiveRole');

module.exports = {

    /** 
      * 
      * @param {Client} client
      * @param {Interaction} interaction
    */

    callback: async (client, interaction) => {
        await interaction.deferReply({ ephemeral: true });

        const liveRole = await NowLiveRoleSchema.findOne({ guildId: interaction.guildId });

        if (!liveRole) {
            await interaction.followUp({ content: 'No Now Live role has been configured for this server.', ephemeral: true });
            return;
        }

        await interaction.followUp({ content: `**Now Live Role:** <@&${liveRole.nowLiveRoleId}>`, ephemeral: true });
    },
    name: 'show-live-role',
    description: 'Tells you the current now live role.',
    options: [],
    permissionsRequired: [PermissionFlagsBits.ManageChannels],
    botPermissions: [PermissionFlagsBits.ManageChannels],
};
