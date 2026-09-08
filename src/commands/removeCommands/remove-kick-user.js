const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const KickUserSchema = require('../../schemas/KickUser');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remove-kick-user')
    .setDescription('Removes a Kick user from the Kick user list.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((option) =>
      option
        .setName('kick-username')
        .setDescription('The Kick user to remove.')
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    try {
      const kickUsername = interaction.options.getString('kick-username').toLowerCase();
      const result = await KickUserSchema.deleteOne({
        guildId: interaction.guildId,
        kickUsername: kickUsername,
      });
      if (result.deletedCount === 0) {
        interaction.followUp({
          content: `User "${kickUsername}" was not found in the notification list.`,
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      interaction.followUp({
        content: `Successfully removed "${kickUsername}" from the Kick notification list.`,
        flags: MessageFlags.Ephemeral,
      });
    }
    catch (error) {
      console.log(`Error in ${__filename}:\n`, error);
      interaction.followUp({ content: 'An error occurred. Please try again.', flags: MessageFlags.Ephemeral });
    }
  },
  permissionsRequired: [PermissionFlagsBits.Administrator],
  botPermissions: [PermissionFlagsBits.ManageChannels],
};
