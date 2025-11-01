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

      const query = {
        guildId: interaction.guildId,
        kickUsername: kickUsername,
      };

      const kickUserExists = await KickUserSchema.findOne(query);

      if (kickUserExists) {
        interaction.followUp({
          content: `User "${kickUsername}" has already been added for this server.`,
          ephemeral: true,
        });
        return;
      }

      const newKickUser = new KickUserSchema(query);
      await newKickUser.save();

      interaction.followUp({
        content: `Successfully added "${kickUsername}" to the Kick notification list.`,
        ephemeral: true,
      });
    } catch (error) {
      console.log(`Error in ${__filename}:\n`, error);
      interaction.followUp({
        content: 'An error occurred. Please try again.',
        ephemeral: true,
      });
    }
  },
    deleted: true,
    name: 'add-kick-user',
    description: 'Add a Kick User to get live notifications from.',
    options: [
        {
            name: 'kick-user',
            description: 'The username of the Kick streamer (e.g., "xqc").',
            type: ApplicationCommandOptionType.String,
            required: true
        }
    ],
    permissionsRequired: [PermissionFlagsBits.Administrator],
    botPermissions: [PermissionFlagsBits.ManageRoles],

};