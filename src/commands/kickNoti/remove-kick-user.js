const { ApplicationCommandOptionType, Client, Interaction, PermissionFlagsBits } = require('discord.js');
const KickUserSchema = require('../../schemas/KickUser');

module.exports = {
  /**
   * @param {Client} client
   * @param {Interaction} interaction
   */
  callback: async (client, interaction) => {
    try {
      const kickUsername = interaction.options.getString('kick-user').toLowerCase();

      await interaction.deferReply({ ephemeral: true });

      const result = await KickUserSchema.deleteOne({
        guildId: interaction.guildId,
        kickUsername: kickUsername,
      });

      if (result.deletedCount === 0) {
        interaction.followUp({
          content: `User "${kickUsername}" was not found in the notification list.`,
          ephemeral: true,
        });
        return;
      }

      interaction.followUp({
        content: `Successfully removed "${kickUsername}" from the Kick notification list.`,
        ephemeral: true,
      });
    } catch (error) {
      console.log(`Error in ${__filename}:\n`, error);
      interaction.followUp({ content: 'An error occurred. Please try again.', ephemeral: true });
    }
  },

  name: 'remove-kick-user',
  description: 'Remove a Kick User from the live notifications list.',
  options: [
    {
      name: 'kick-user',
      description: 'The username of the Kick streamer to remove.',
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
  permissionsRequired: [PermissionFlagsBits.Administrator],
  botPermissions: [PermissionFlagsBits.ManageRoles],
};