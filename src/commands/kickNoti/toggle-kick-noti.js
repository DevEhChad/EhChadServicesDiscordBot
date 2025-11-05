const { SlashCommandBuilder } = require('@discordjs/builders');
const Toggle = require('../../schemas/Toggle');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('toggle-kick-noti')
    .setDescription('Enable or disable Kick notifications for this server')
    .addBooleanOption(opt => opt.setName('enabled').setDescription('Enable Kick notifications?').setRequired(true)),
  async execute(interaction) {
    if (!interaction.guild) return interaction.reply({ content: 'This command must be run in a server.', ephemeral: true });

    const enabled = interaction.options.getBoolean('enabled');
    try {
      await Toggle.findOneAndUpdate(
        { key: `kick-noti`, type: 'service', guildId: interaction.guild.id },
        { key: `kick-noti`, type: 'service', guildId: interaction.guild.id, enabled, devOnly: false },
        { upsert: true }
      );
      return interaction.reply({ content: `Kick notifications have been ${enabled ? 'enabled' : 'disabled'} for this server.`, ephemeral: true });
    } catch (err) {
      console.error('[Kick] Failed to toggle Kick noti:', err);
      return interaction.reply({ content: 'Failed to save configuration. Check bot logs.', ephemeral: true });
    }
  }
};
