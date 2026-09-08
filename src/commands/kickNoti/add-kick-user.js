const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const KickUserSchema = require('../../schemas/KickUser');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('add-kick-user')
    .setDescription('Add Kick User to get live notifications from.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(opt =>
      opt.setName('kick-username')
        .setDescription('Add a Kick User by username. **Not a link**')
        .setRequired(true))
    .addUserOption(opt =>
      opt.setName('discord-user')
        .setDescription('Link a Discord member to this Kick user so they get the Now Live role.')
        .setRequired(false)),

  async execute(interaction) {
    try {
      const kickUsername = interaction.options.getString('kick-username').toLowerCase();
      const discordUser = interaction.options.getUser('discord-user');

      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

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
            flags: MessageFlags.Ephemeral,
          });
        } else {
          interaction.followUp({
            content: `User "${kickUsername}" has already been added for this server.`,
            flags: MessageFlags.Ephemeral,
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
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      console.log(`Error in ${__filename}:\n`, error);
      interaction.followUp({
        content: 'A database error occurred. Please try again.',
        flags: MessageFlags.Ephemeral,
      });

    }
  },

  permissionsRequired: [PermissionFlagsBits.Administrator],
  botPermissions: [PermissionFlagsBits.ManageRoles],
};
