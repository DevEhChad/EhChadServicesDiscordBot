const { Client, Interaction, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const NowLiveSchema = require('../../schemas/NowLiveChannel');

module.exports = {
  /**
   * @param {Client} client
   * @param {Interaction} interaction
   */
  callback: async (client, interaction) => {
    await interaction.deferReply({ ephemeral: true });

    const liveChannels = await NowLiveSchema.find({ guildId: interaction.guildId });

    if (liveChannels.length === 0) {
      await interaction.followUp({ content: 'There are no channels configured for live notifications in this server.', ephemeral: true });
      return;
    }

    const description = liveChannels
      .map((config) => {
        const messageInfo = config.customMessage
          ? `> Custom Message: \`${config.customMessage}\``
          : `> Using default message.`;
        return `• <#${config.channelId}>\n${messageInfo}`;
      })
      .join('\n\n');

    const embed = new EmbedBuilder()
      .setTitle('Live Notification Channels')
      .setDescription(description)
      .setColor('#6441A5') // Twitch purple for consistency
      .setTimestamp();

    await interaction.followUp({ embeds: [embed], ephemeral: true });
  },

  name: 'list-live-channel',
  description: 'Lists all channels configured to receive live notifications.',
  options: [],
  permissionsRequired: [PermissionFlagsBits.Administrator],
  botPermissions: [],
};