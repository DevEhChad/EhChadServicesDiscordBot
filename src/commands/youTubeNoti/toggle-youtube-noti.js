const { SlashCommandBuilder } = require('discord.js');
const YouTubeNoti = require('../../schemas/YouTubeNoti');

module.exports = {
  deleted: true,
  data: new SlashCommandBuilder()
    .setName('toggle-youtube-noti')
    .setDescription('Enable or disable YouTube upload notifications for this server')
    .addBooleanOption(opt => opt.setName('enabled').setDescription('Enable or disable').setRequired(true)),
  async execute(interaction) {
    if (!interaction.guild) return interaction.reply({ content: 'This command must be run in a guild.', ephemeral: true });
    const enabled = interaction.options.getBoolean('enabled');
    const guildId = interaction.guild.id;

    let doc = await YouTubeNoti.findOne({ guildId });
    if (!doc) {
      doc = new YouTubeNoti({ guildId, users: [], enabled });
    } else {
      doc.enabled = enabled;
    }

    await doc.save();
    return interaction.reply({ content: `YouTube notifications are now ${enabled ? 'enabled' : 'disabled'} for this server.`, ephemeral: true });
  }
};