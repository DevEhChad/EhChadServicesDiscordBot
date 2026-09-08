const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const YouTubeNoti = require('../../schemas/YouTubeNoti');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bind-youtube-channel')
    .setDescription('Set the channel to receive YouTube upload notifications')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addChannelOption(opt =>
      opt.setName('channel')
        .setDescription('The channel to post YouTube upload notifications in')
        .setRequired(true))
    .addStringOption(opt =>
      opt.setName('custom-message')
        .setDescription('Custom notification message. Use {user} to include the YouTube channel name.')
        .setRequired(false)),

  async execute(interaction) {
    if (!interaction.guild) return interaction.reply({ content: 'This command must be run in a guild.', flags: MessageFlags.Ephemeral });

    const channel = interaction.options.getChannel('channel');
    const customMessage = interaction.options.getString('custom-message');
    const guildId = interaction.guild.id;

    let doc = await YouTubeNoti.findOne({ guildId });
    if (!doc) {
      doc = new YouTubeNoti({ guildId, channelId: channel.id, users: [], enabled: true });
    } else {
      doc.channelId = channel.id;
    }

    if (customMessage !== null) {
      doc.customMessage = customMessage;
    }

    await doc.save();

    const messageNote = customMessage
      ? `\nCustom message set to: **"${customMessage}"**\nTip: Use \`{user}\` in your message to include the YouTube channel name.`
      : '\nUsing the default notification message.';

    return interaction.reply({
      content: `✅ YouTube upload notifications will be sent to ${channel}.${messageNote}`,
      flags: MessageFlags.Ephemeral,
    });
  },
};