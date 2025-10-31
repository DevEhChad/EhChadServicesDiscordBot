const { SlashCommandBuilder } = require('discord.js');
const YouTubeNoti = require('../../schemas/YouTubeNoti');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bind-youtube-channel')
    .setDescription('Bind this server to a channel to receive YouTube upload notifications')
    .addChannelOption(opt => opt.setName('channel').setDescription('Channel to post notifications').setRequired(true)),
  async execute(interaction) {
    if (!interaction.guild) return interaction.reply({ content: 'This command must be run in a guild.', ephemeral: true });
    const channel = interaction.options.getChannel('channel');
    const guildId = interaction.guild.id;

    let doc = await YouTubeNoti.findOne({ guildId });
    if (!doc) {
      doc = new YouTubeNoti({ guildId, channelId: channel.id, users: [], enabled: true });
    } else {
      doc.channelId = channel.id;
    }

    await doc.save();
    return interaction.reply({ content: `Bound YouTube notifications to ${channel}.`, ephemeral: true });
  }
};