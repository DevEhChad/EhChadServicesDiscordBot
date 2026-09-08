const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const NowLiveRoleSchema = require('../../schemas/NowLiveRole');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('show-live-role')
    .setDescription('Tells you the current now live role.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const liveRole = await NowLiveRoleSchema.findOne({ guildId: interaction.guildId });

    if (!liveRole) {
      await interaction.followUp({ content: 'No Now Live role has been configured for this server.', flags: MessageFlags.Ephemeral });
      return;
    }

    await interaction.followUp({ content: `**Now Live Role:** <@&${liveRole.nowLiveRoleId}>`, flags: MessageFlags.Ephemeral });
  },
  permissionsRequired: [PermissionFlagsBits.ManageChannels],
  botPermissions: [PermissionFlagsBits.ManageChannels],
};
