const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const YouTubeLiveNoti = require('../../schemas/YouTubeLiveNoti');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bind-youtube-live-channel')
    .setDescription('Set the channel to receive YouTube live stream notifications')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addChannelOption(opt =>
      opt.setName('channel')
        .setDescription('The channel to post YouTube live notifications in')
        .setRequired(true))
    .addStringOption(opt =>
      opt.setName('custom-message')
        .setDescription('Custom message when someone goes live. Use {user} for the channel name.')
        .setRequired(false)),

  async execute(interaction) {
    if (!interaction.guild) return interaction.reply({ content: 'This command must be run in a guild.', flags: MessageFlags.Ephemeral });

    const channel = interaction.options.getChannel('channel');
    const customMessage = interaction.options.getString('custom-message');
    const guildId = interaction.guild.id;

    let doc = await YouTubeLiveNoti.findOne({ guildId });
    if (!doc) {
      doc = new YouTubeLiveNoti({ guildId, channelId: channel.id, users: [], enabled: true });
    } else {
      doc.channelId = channel.id;
    }

    if (customMessage !== null) doc.customMessage = customMessage;

    await doc.save();

    const messageNote = customMessage
      ? `\nCustom message set to: **"${customMessage}"**\nTip: Use \`{user}\` to include the YouTube channel name.`
      : '\nUsing the default notification message.';

    return interaction.reply({
      content: `✅ YouTube live notifications will be sent to ${channel}.${messageNote}`,
      flags: MessageFlags.Ephemeral,
    });
  },
};
