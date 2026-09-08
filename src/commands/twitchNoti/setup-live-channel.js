const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const NowLiveSchema = require('../../schemas/NowLiveChannel');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-live-channel')
    .setDescription('Setup a channel to send the live messages to.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addChannelOption(opt =>
      opt.setName('target-channel')
        .setDescription('The channel to get live messages in.')
        .setRequired(true))
    .addStringOption(opt =>
      opt.setName('custom-message')
        .setDescription('A custom notification message.')
        .setRequired(false)),

  async execute(interaction) {
    try {
      const targetChannel = interaction.options.getChannel('target-channel');
      const customMessage = interaction.options.getString('custom-message');

      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      const query = {
        guildId: interaction.guildId,
        channelId: targetChannel.id,
      };

      const channelExistInDb = await NowLiveSchema.findOne(query);

      if (channelExistInDb) {
        interaction.followUp({ content: 'This channel has already been configured for live messages.', flags: MessageFlags.Ephemeral });
        return;
      }

      const newNowLiveChannel = new NowLiveSchema({
        ...query,
        customMessage,
      });

      await newNowLiveChannel.save();

      if (customMessage) {
        interaction.followUp({
          content: `Configured ${targetChannel} to receive live messages with a custom message: "**${customMessage}**"`,
          flags: MessageFlags.Ephemeral
        });
      } else {
        interaction.followUp({
          content: `Configured ${targetChannel} to receive live messages with the default message.`,
          flags: MessageFlags.Ephemeral
        });
      }
    } catch (error) {
      console.log(`Error in ${__filename}:\n`, error);
      interaction.followUp({ content: 'An error occurred. Please try again.', flags: MessageFlags.Ephemeral });
    }
  },

  permissionsRequired: [PermissionFlagsBits.ManageChannels],
  botPermissions: [PermissionFlagsBits.ManageChannels],
};
