const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const Toggle = require('../../schemas/Toggle');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('toggle-kick-noti')
    .setDescription('Enable or disable Kick notifications for this server')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addBooleanOption(opt =>
      opt.setName('enabled')
        .setDescription('Enable Kick notifications?')
        .setRequired(true)),

  async execute(interaction) {
    try {
      const enabled = interaction.options.getBoolean('enabled');
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      await Toggle.findOneAndUpdate(
        { key: `kick-noti`, type: 'service', guildId: interaction.guildId },
        { key: `kick-noti`, type: 'service', guildId: interaction.guildId, enabled, devOnly: false },
        { upsert: true }
      );
      interaction.followUp({
        content: `Kick notifications have been ${enabled ? 'enabled' : 'disabled'} for this server.`,
        flags: MessageFlags.Ephemeral
      });
    } catch (error) {
      console.log(`Error in ${__filename}:\n`, error);
      interaction.followUp({ content: 'An error occurred. Please try again.', flags: MessageFlags.Ephemeral });
    }
  },

  permissionsRequired: [PermissionFlagsBits.Administrator],
  botPermissions: [PermissionFlagsBits.ManageChannels],
};
