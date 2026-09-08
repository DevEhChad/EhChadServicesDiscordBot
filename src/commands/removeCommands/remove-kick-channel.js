const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const KickNowLiveChannel = require('../../schemas/KickNowLiveChannel');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remove-kick-channel')
    .setDescription('Remove the Kick notifications channel binding for this server')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const result = await KickNowLiveChannel.deleteOne({
        guildId: interaction.guildId,
      });
      if (result.deletedCount === 0) {
        interaction.followUp({
          content: 'No Kick notifications channel was configured for this server.',
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      interaction.followUp({
        content: 'Kick notifications channel unbound for this server.',
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      console.log(`Error in ${__filename}:\n`, error);
      interaction.followUp({ content: 'An error occurred. Please try again.', flags: MessageFlags.Ephemeral });
    }
  },
  permissionsRequired: [PermissionFlagsBits.Administrator],
  botPermissions: [PermissionFlagsBits.ManageChannels],
};
