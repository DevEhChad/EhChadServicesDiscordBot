const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const YouTubeNoti = require('../../schemas/YouTubeNoti');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unbind-youtube-channel')
    .setDescription('Remove the YouTube notifications channel binding for this server')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  async execute(interaction) {
    if (!interaction.guild) return interaction.reply({ content: 'This command must be run in a guild.', flags: MessageFlags.Ephemeral });
    const guildId = interaction.guild.id;

    const doc = await YouTubeNoti.findOne({ guildId });
    if (!doc || !doc.channelId) return interaction.reply({ content: 'No YouTube notification channel is currently set for this server.', flags: MessageFlags.Ephemeral });

    doc.channelId = null;
    await doc.save();
    return interaction.reply({ content: '✅ Removed the YouTube notification channel. Use `/bind-youtube-channel` to set a new one.', flags: MessageFlags.Ephemeral });
  }
};