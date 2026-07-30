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
      const discordUser = interaction.options.getUser('discord-user');

      await interaction.deferReply({ ephemeral: true });

      const query = {
        guildId: interaction.guildId,
        kickUsername: kickUsername,
      };

      const existingUser = await KickUserSchema.findOne(query);

      if (existingUser) {
        if (discordUser) {
          existingUser.discordUserId = discordUser.id;
          await existingUser.save();
          interaction.followUp({
            content: `Updated "${kickUsername}" — linked to ${discordUser} for live role assignment.`,
            ephemeral: true,
          });
        } else {
          interaction.followUp({
            content: `User "${kickUsername}" has already been added for this server.`,
            ephemeral: true,
          });
        }
        return;
      }

      const newKickUser = new KickUserSchema({
        ...query,
        discordUserId: discordUser?.id ?? null,
      });
      await newKickUser.save();

      const linked = discordUser ? ` and linked to ${discordUser} for live role assignment` : '';
      interaction.followUp({
        content: `Successfully added "${kickUsername}" to the Kick notification list${linked}.`,
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
        },
        {
            name: 'discord-user',
            description: 'Link a Discord member to this Kick user so they get the Now Live role.',
            type: ApplicationCommandOptionType.User,
            required: false
        }
    ],
    permissionsRequired: [PermissionFlagsBits.Administrator],
    botPermissions: [PermissionFlagsBits.ManageRoles],   
  };

