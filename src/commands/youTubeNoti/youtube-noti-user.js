const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const YouTubeNoti = require('../../schemas/YouTubeNoti');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('youtube-noti-user')
    .setDescription('Add, remove, or toggle a YouTube channel for upload notifications.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addSubcommand(sub =>
      sub.setName('add')
        .setDescription('Add a YouTube channel to monitor for new uploads')
        .addStringOption(opt =>
          opt.setName('youtube-channel-id')
            .setDescription('The YouTube Channel ID (e.g. UCxxxxxxxxxxxxxxxxxxxxxx)')
            .setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('remove')
        .setDescription('Stop monitoring a YouTube channel for uploads')
        .addStringOption(opt =>
          opt.setName('youtube-channel-id')
            .setDescription('The YouTube Channel ID to remove')
            .setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('toggle')
        .setDescription('Enable or disable notifications for a specific YouTube channel')
        .addStringOption(opt =>
          opt.setName('youtube-channel-id')
            .setDescription('The YouTube Channel ID')
            .setRequired(true))
        .addBooleanOption(opt =>
          opt.setName('enabled')
            .setDescription('Enable or disable notifications for this channel')
            .setRequired(true))),

  async execute(interaction) {
    if (!interaction.guild) return interaction.reply({ content: 'This command must be run in a guild.', flags: MessageFlags.Ephemeral });

    const guildId = interaction.guild.id;
    const sub = interaction.options.getSubcommand();
    const youtubeId = interaction.options.getString('youtube-channel-id');

    let doc = await YouTubeNoti.findOne({ guildId });
    if (!doc) {
      doc = new YouTubeNoti({ guildId, users: [] });
    }

    if (sub === 'add') {
      if (doc.users.some(u => u.youtubeId === youtubeId)) {
        return interaction.reply({ content: `\`${youtubeId}\` is already being monitored for this server.`, flags: MessageFlags.Ephemeral });
      }
      doc.users.push({ youtubeId, enabled: true });
      await doc.save();
      return interaction.reply({
        content: `✅ Added \`${youtubeId}\` to YouTube upload notifications.\nMake sure you've set a notification channel with \`/bind-youtube-channel\`.`,
        flags: MessageFlags.Ephemeral,
      });

    } else if (sub === 'remove') {
      const exists = doc.users.some(u => u.youtubeId === youtubeId);
      if (!exists) {
        return interaction.reply({ content: `\`${youtubeId}\` is not in the monitored list.`, flags: MessageFlags.Ephemeral });
      }
      doc.users = doc.users.filter(u => u.youtubeId !== youtubeId);
      await doc.save();
      return interaction.reply({ content: `✅ Removed \`${youtubeId}\` from YouTube upload notifications.`, flags: MessageFlags.Ephemeral });

    } else if (sub === 'toggle') {
      const enabled = interaction.options.getBoolean('enabled');
      const user = doc.users.find(u => u.youtubeId === youtubeId);
      if (!user) {
        return interaction.reply({ content: `\`${youtubeId}\` was not found. Add it first with \`/youtube-noti-user add\`.`, flags: MessageFlags.Ephemeral });
      }
      user.enabled = enabled;
      await doc.save();
      return interaction.reply({
        content: `✅ Notifications for \`${youtubeId}\` are now **${enabled ? 'enabled' : 'disabled'}**.`,
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
