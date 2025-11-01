const { SlashCommandBuilder } = require('discord.js');
const YouTubeNoti = require('../../schemas/YouTubeNoti');

module.exports = {
  deleted: true,
  data: new SlashCommandBuilder()
    .setName('youtube-noti-user')
    .setDescription('Add, remove, or toggle a YouTube user for upload notifications.')
    .addSubcommand(sub =>
      sub.setName('add')
        .setDescription('Add a YouTube user for notifications')
        .addStringOption(opt =>
          opt.setName('youtubeid').setDescription('YouTube Channel ID').setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('remove')
        .setDescription('Remove a YouTube user from notifications')
        .addStringOption(opt =>
          opt.setName('youtubeid').setDescription('YouTube Channel ID').setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('toggle')
        .setDescription('Enable or disable notifications for a YouTube user')
        .addStringOption(opt =>
          opt.setName('youtubeid').setDescription('YouTube Channel ID').setRequired(true))
        .addBooleanOption(opt =>
          opt.setName('enabled').setDescription('Enable or disable notifications').setRequired(true))),
  async execute(interaction) {
    const guildId = interaction.guild.id;
    const sub = interaction.options.getSubcommand();
    const youtubeId = interaction.options.getString('youtubeid');
    const enabled = interaction.options.getBoolean('enabled');
    let doc = await YouTubeNoti.findOne({ guildId });
    if (!doc) {
      doc = new YouTubeNoti({ guildId, users: [] });
    }
    if (sub === 'add') {
      if (doc.users.some(u => u.youtubeId === youtubeId)) {
        return interaction.reply({ content: 'User already exists.', ephemeral: true });
      }
      doc.users.push({ youtubeId, enabled: true });
      await doc.save();
      return interaction.reply({ content: 'YouTube user added for notifications.', ephemeral: true });
    } else if (sub === 'remove') {
      doc.users = doc.users.filter(u => u.youtubeId !== youtubeId);
      await doc.save();
      return interaction.reply({ content: 'YouTube user removed from notifications.', ephemeral: true });
    } else if (sub === 'toggle') {
      const user = doc.users.find(u => u.youtubeId === youtubeId);
      if (!user) {
        return interaction.reply({ content: 'User not found.', ephemeral: true });
      }
      user.enabled = enabled;
      await doc.save();
      return interaction.reply({ content: `YouTube user notifications ${enabled ? 'enabled' : 'disabled'}.`, ephemeral: true });
    }
  },
};
