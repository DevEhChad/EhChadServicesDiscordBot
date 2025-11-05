const { SlashCommandBuilder } = require('@discordjs/builders');
const KickNowLiveChannel = require('../../schemas/KickNowLiveChannel');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remove-kick-channel')
    .setDescription('Remove the Kick notifications channel binding for this server'),
  async execute(interaction) {
    if (!interaction.guild) return interaction.reply({ content: 'This command must be run in a server.', ephemeral: true });

    try {
      const res = await KickNowLiveChannel.deleteOne({ guildId: interaction.guild.id });
      if (res.deletedCount && res.deletedCount > 0) {
        return interaction.reply({ content: 'Kick notifications channel unbound for this server.', ephemeral: true });
      }
      return interaction.reply({ content: 'No Kick notifications channel was configured for this server.', ephemeral: true });
    } catch (err) {
      console.error('[Kick] Failed to remove Kick channel:', err);
      return interaction.reply({ content: 'Failed to remove configuration. Check bot logs.', ephemeral: true });
    }
  }
};
