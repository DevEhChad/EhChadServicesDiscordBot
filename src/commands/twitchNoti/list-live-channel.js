const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } = require('discord.js');
const NowLiveSchema = require('../../schemas/NowLiveChannel');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('list-live-channel')
    .setDescription('Lists all channels configured to receive live notifications.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const liveChannels = await NowLiveSchema.find({ guildId: interaction.guildId });

    if (liveChannels.length === 0) {
      await interaction.followUp({ content: 'There are no channels configured for live notifications in this server.', flags: MessageFlags.Ephemeral });
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

    await interaction.followUp({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },

  permissionsRequired: [PermissionFlagsBits.Administrator],
  botPermissions: [],
};
