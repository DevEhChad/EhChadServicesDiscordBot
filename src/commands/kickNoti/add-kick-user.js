const { ApplicationCommandOptionType, Client, Interaction, PermissionFlagsBits } = require('discord.js');
const KickUserSchema = require('../../schemas/KickUser');

module.exports = {
  /**
   * @param {Client} client
   * @param {Interaction} interaction
   */
  callback: async (client, interaction) => {

    try {
      const kickUsername = interaction.options.getString('kick-username').toLowerCase();

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
        content: 'A database error occurred. Please try again.',
        ephemeral: true,
      });

    } 
  },
    name: 'add-kick-user',
    description: 'Add Kick User to get live notifications from.',
    options: [
        {
            name: 'kick-username',
            description: 'Add a Kick User by username. **Not a link**',
            type: ApplicationCommandOptionType.String,
            required: true
        }
    ],
    permissionsRequired: [PermissionFlagsBits.Administrator],
    botPermissions: [PermissionFlagsBits.ManageRoles],   
  };

