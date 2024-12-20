const { ApplicationCommandOptionType, Client, Interaction, PermissionFlagsBits } = require('discord.js');
const NowLiveRoleSchema = require('../../schemas/NowLiveRole');

module.exports = {

    /** 
      * 
      * @param {Client} client
      * @param {Interaction} interaction
    */

    callback: async (client, interaction) => {
        // Query all Twitch users associated with the guild
        const liveRole = await NowLiveRoleSchema.find();

        await interaction.deferReply({ ephemeral: true });

        if (liveRole.length === 0) {
            await interaction.followUp({ content: "Live Role Currently Disabled", ephermal: true });
            return;
        }

        // Collect all URLs with usernames and join them with newlines
        const liveRoleInfo = liveRole.map(role => `\`${NowLiveRoleSchema.nowLiveRoleId} :\` <@${NowLiveRoleSchema.nowLiveRoleId}>`).join('\n\n');
        const roleID = liveRole.nowLiveRoleId;

        await interaction.followUp({ content: `**Now Live Role Is:**\n\n${liveRoleInfo}`, ephermal: true });
    },
    deleted: true,
    devOnly: true,
    name: 'show-live-role',
    description: 'Tells you the current now live role.',
    options: [],
    permissionsRequired: [PermissionFlagsBits.ManageChannels],
    botPermissions: [PermissionFlagsBits.ManageChannels],
};
