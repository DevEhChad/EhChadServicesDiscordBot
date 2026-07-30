const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const YouTubeLiveNoti = require('../../schemas/YouTubeLiveNoti');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('toggle-youtube-live-noti')
    .setDescription('Enable or disable YouTube live stream notifications for this server')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addBooleanOption(opt =>
      opt.setName('enabled')
        .setDescription('Enable or disable')
        .setRequired(true)),

  async execute(interaction) {
    if (!interaction.guild) return interaction.reply({ content: 'This command must be run in a guild.', ephemeral: true });

    const enabled = interaction.options.getBoolean('enabled');
    const guildId = interaction.guild.id;

    let doc = await YouTubeLiveNoti.findOne({ guildId });
    if (!doc) {
      doc = new YouTubeLiveNoti({ guildId, users: [], enabled });
    } else {
      doc.enabled = enabled;
    }

    await doc.save();
    return interaction.reply({
      content: `✅ YouTube live stream notifications are now **${enabled ? 'enabled' : 'disabled'}** for this server.`,
      ephemeral: true,
    });
  },
};
