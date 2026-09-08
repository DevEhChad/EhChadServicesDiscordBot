const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const KickNowLiveChannel = require('../../schemas/KickNowLiveChannel');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup-kick-channel')
    .setDescription('Bind the current channel as the Kick notifications channel for this server')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(opt =>
      opt.setName('message')
        .setDescription('Optional custom message (use {user} for streamer).')
        .setRequired(false)),

  async execute(interaction) {
    try {
      const targetChannel = interaction.channelId;
      const customMessage = interaction.options.getString('message') || null;
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      await KickNowLiveChannel.findOneAndUpdate(
        { guildId: interaction.guildId },
        { guildId: interaction.guildId, channelId: targetChannel, customMessage },
        { upsert: true, new: true }
      );

      if (customMessage) {
        interaction.followUp({
          content: `✅ Configured <#${targetChannel}> to receive Kick notifications with a custom message: "**${customMessage}**"`,
          flags: MessageFlags.Ephemeral
        });
      } else {
        interaction.followUp({
          content: `✅ Configured <#${targetChannel}> to receive Kick notifications with the default message.`,
          flags: MessageFlags.Ephemeral
        });
      }
    } catch (error) {
      console.log(`Error in ${__filename}:\n`, error);
      interaction.followUp({ content: 'An error occurred. Please try again.', flags: MessageFlags.Ephemeral });
    }
  },

  permissionsRequired: [PermissionFlagsBits.Administrator],
  botPermissions: [PermissionFlagsBits.ManageChannels],
};
