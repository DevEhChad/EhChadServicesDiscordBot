const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('send-live-message')
    .setDescription('Will send the live message.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    try {
      // This command is problematic as it re-initializes the interval loop.
      // The check runs automatically every 15 seconds.
      // A manual trigger isn't necessary and can cause issues.
      interaction.reply({ content: `The live-check runs automatically every 15 seconds. A manual trigger is no longer needed.`, flags: MessageFlags.Ephemeral });
    } catch (error) {
      console.log(error);
    }
  },
  //deleted: true,
  devOnly: true,
  permissionsRequired: [PermissionFlagsBits.ManageChannels],
  botPermissions: [PermissionFlagsBits.ManageChannels],
};
