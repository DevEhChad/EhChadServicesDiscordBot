const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const YouTubeLiveNoti = require('../../schemas/YouTubeLiveNoti');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unbind-youtube-live-channel')
    .setDescription('Remove the YouTube live notifications channel binding for this server')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    if (!interaction.guild) return interaction.reply({ content: 'This command must be run in a guild.', flags: MessageFlags.Ephemeral });

    const doc = await YouTubeLiveNoti.findOne({ guildId: interaction.guild.id });
    if (!doc || !doc.channelId) {
      return interaction.reply({ content: 'No YouTube live notification channel is currently set for this server.', flags: MessageFlags.Ephemeral });
    }

    doc.channelId = null;
    await doc.save();
    return interaction.reply({ content: '✅ Removed the YouTube live notification channel. Use `/bind-youtube-live-channel` to set a new one.', flags: MessageFlags.Ephemeral });
  },
};
