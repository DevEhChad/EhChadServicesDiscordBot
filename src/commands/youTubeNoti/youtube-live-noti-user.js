const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const YouTubeLiveNoti = require('../../schemas/YouTubeLiveNoti');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('youtube-live-noti-user')
    .setDescription('Add, remove, or toggle a YouTube channel for live stream notifications.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addSubcommand(sub =>
      sub.setName('add')
        .setDescription('Add a YouTube channel to monitor for live streams')
        .addStringOption(opt =>
          opt.setName('youtube-channel-id')
            .setDescription('The YouTube Channel ID (e.g. UCxxxxxxxxxxxxxxxxxxxxxx)')
            .setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('remove')
        .setDescription('Stop monitoring a YouTube channel for live streams')
        .addStringOption(opt =>
          opt.setName('youtube-channel-id')
            .setDescription('The YouTube Channel ID to remove')
            .setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('toggle')
        .setDescription('Enable or disable live notifications for a specific YouTube channel')
        .addStringOption(opt =>
          opt.setName('youtube-channel-id')
            .setDescription('The YouTube Channel ID')
            .setRequired(true))
        .addBooleanOption(opt =>
          opt.setName('enabled')
            .setDescription('Enable or disable live notifications for this channel')
            .setRequired(true))),

  async execute(interaction) {
    if (!interaction.guild) return interaction.reply({ content: 'This command must be run in a guild.', flags: MessageFlags.Ephemeral });

    const guildId = interaction.guild.id;
    const sub = interaction.options.getSubcommand();
    const youtubeId = interaction.options.getString('youtube-channel-id');

    let doc = await YouTubeLiveNoti.findOne({ guildId });
    if (!doc) {
      doc = new YouTubeLiveNoti({ guildId, users: [] });
    }

    if (sub === 'add') {
      if (doc.users.some(u => u.youtubeId === youtubeId)) {
        return interaction.reply({ content: `\`${youtubeId}\` is already being monitored for live streams in this server.`, flags: MessageFlags.Ephemeral });
      }
      doc.users.push({ youtubeId, enabled: true });
      await doc.save();
      return interaction.reply({
        content: `✅ Added \`${youtubeId}\` to YouTube live stream notifications.\nMake sure you've set a notification channel with \`/bind-youtube-live-channel\`.`,
        flags: MessageFlags.Ephemeral,
      });

    } else if (sub === 'remove') {
      if (!doc.users.some(u => u.youtubeId === youtubeId)) {
        return interaction.reply({ content: `\`${youtubeId}\` is not in the monitored list.`, flags: MessageFlags.Ephemeral });
      }
      doc.users = doc.users.filter(u => u.youtubeId !== youtubeId);
      await doc.save();
      return interaction.reply({ content: `✅ Removed \`${youtubeId}\` from YouTube live stream notifications.`, flags: MessageFlags.Ephemeral });

    } else if (sub === 'toggle') {
      const enabled = interaction.options.getBoolean('enabled');
      const user = doc.users.find(u => u.youtubeId === youtubeId);
      if (!user) {
        return interaction.reply({ content: `\`${youtubeId}\` was not found. Add it first with \`/youtube-live-noti-user add\`.`, flags: MessageFlags.Ephemeral });
      }
      user.enabled = enabled;
      await doc.save();
      return interaction.reply({
        content: `✅ Live notifications for \`${youtubeId}\` are now **${enabled ? 'enabled' : 'disabled'}**.`,
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
