const { SlashCommandBuilder } = require('discord.js');
const YouTubeNoti = require('../../schemas/YouTubeNoti');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unbind-youtube-channel')
    .setDescription('Unbind the YouTube notifications channel for this server.'),
  async execute(interaction) {
    if (!interaction.guild) return interaction.reply({ content: 'This command must be run in a guild.', ephemeral: true });
    const guildId = interaction.guild.id;

    const doc = await YouTubeNoti.findOne({ guildId });
    if (!doc || !doc.channelId) return interaction.reply({ content: 'No YouTube notification channel bound for this server.', ephemeral: true });

    doc.channelId = null;
    await doc.save();
    return interaction.reply({ content: 'Unbound the YouTube notification channel for this server.', ephemeral: true });
  }
};