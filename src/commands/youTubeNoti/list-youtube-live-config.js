const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } = require('discord.js');
const YouTubeLiveNoti = require('../../schemas/YouTubeLiveNoti');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('list-youtube-live-config')
    .setDescription('Shows the current YouTube live stream notification configuration for this server.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  permissionsRequired: [PermissionFlagsBits.ManageChannels],
  botPermissions: [],

  async execute(interaction) {
    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      const config = await YouTubeLiveNoti.findOne({ guildId: interaction.guildId });

      if (!config) {
        return interaction.followUp({
          content: 'No YouTube live notification configuration found for this server.\nGet started with `/bind-youtube-live-channel` and `/youtube-live-noti-user add`.',
          flags: MessageFlags.Ephemeral,
        });
      }

      const notifChannel = config.channelId ? `<#${config.channelId}>` : '`Not set`';
      const status = config.enabled ? '✅ Enabled' : '❌ Disabled';
      const customMessage = config.customMessage
        ? `\`${config.customMessage}\``
        : '`Default — 🔴 **{user}** is now live on YouTube!`';

      const userList = config.users.length > 0
        ? config.users.map(u => `• \`${u.youtubeId}\` — ${u.enabled ? '✅ Active' : '❌ Paused'}`).join('\n')
        : '`None added` — use `/youtube-live-noti-user add` to add a YouTube channel.';

      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('YouTube Live Notification Config')
        .addFields(
          { name: 'Status', value: status, inline: true },
          { name: 'Notification Channel', value: notifChannel, inline: true },
          { name: '​', value: '​', inline: true },
          { name: 'Custom Message', value: customMessage, inline: false },
          { name: `Monitored Channels (${config.users.length})`, value: userList, inline: false },
        )
        .setFooter({ text: 'Tip: Use {user} in your custom message to include the YouTube channel name. Polls every 5 minutes.' });

      return interaction.followUp({ embeds: [embed], flags: MessageFlags.Ephemeral });

    } catch (error) {
      console.log(`Error in ${__filename}:\n`, error);
      return interaction.followUp({ content: 'An error occurred. Please try again.', flags: MessageFlags.Ephemeral });
    }
  },
};
